import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
  VoiceBasedChannel,
} from "../deps.ts";
import { log } from "../deps.ts";
import { createStream } from "./yt-dlp.ts";

export type PlayerQueueEntry = {
  url: string;
  title: string;
};

export class Player {
  private _currentlyPlaying: PlayerQueueEntry | undefined;
  private _queue: Array<PlayerQueueEntry> = [];
  private connection?: VoiceConnection;

  constructor(
    private readonly channel: VoiceBasedChannel,
    private readonly onStopped: () => void,
  ) {}

  update() {
    if (this._currentlyPlaying) {
      log.debug("Bot is currenty playing, nothing to do");
      return;
    }

    if (this._queue.length === 0) {
      log.debug("Queue empty, disconnecting");
      this.connection?.destroy();
      this.onStopped();
      return;
    }

    this._currentlyPlaying = this._queue[0];
    this._queue = this._queue.splice(1);

    const { url } = this._currentlyPlaying;
    const stream = createStream(url);
    const resource = createAudioResource(stream);
    const audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    if (!this.connection) {
      this.connection = joinVoiceChannel({
        channelId: this.channel.id,
        guildId: this.channel.guildId,
        adapterCreator: this.channel.guild.voiceAdapterCreator,
      });

      this.connection.on(VoiceConnectionStatus.Disconnected, () => {
        log.info("Disconnected from the channel");
        this.onStopped();
      });
    }

    log.debug(`Starting to play ${url}`);
    this.connection.subscribe(audioPlayer);
    audioPlayer.play(resource);

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.skip();
    });

    audioPlayer.on("error", (err) => {
      log.error(err);
      log.debug("Skipping because an error occured");
      this.skip();
    });
  }

  play(entry: PlayerQueueEntry) {
    this._queue.push(entry);
    this.update();
  }

  skip() {
    this._currentlyPlaying = undefined;
    this.update();
  }

  get currentlyPlaying(): Readonly<PlayerQueueEntry | undefined> {
    return this._currentlyPlaying;
  }

  get queue(): ReadonlyArray<PlayerQueueEntry> {
    return this._queue;
  }
}
