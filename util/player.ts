import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceBasedChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "../deps.ts";
import { log } from "../deps.ts";
import { createStream, type Video } from "./video.ts";

export class Player {
  private _currentlyPlaying: Video | undefined;
  private _queue: Array<Video> = [];
  private connection?: VoiceConnection;

  constructor(
    private readonly channel: VoiceBasedChannel,
    private readonly onExited: () => void,
  ) {}

  private update() {
    if (this._currentlyPlaying) {
      log.debug("Bot is currenty playing, nothing to do");
      return;
    }

    if (this._queue.length === 0) {
      log.debug("Queue empty, disconnecting");
      this.connection?.destroy();
      this.onExited();
      return;
    }

    this._currentlyPlaying = this._queue[0];
    this._queue = this._queue.splice(1);

    const stream = createStream(this._currentlyPlaying);
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
        this.onExited();
      });
    }

    log.debug(`Starting to play ${this._currentlyPlaying.url}`);
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

  play(entry: Video) {
    this._queue.push(entry);
    this.update();
  }

  skip() {
    this._currentlyPlaying = undefined;
    this.update();
  }

  jump(to: number) {
    if (!this._currentlyPlaying) return;

    const video = { ...this._currentlyPlaying };
    video.start = to;
    this._queue = [video].concat(this._queue);
    this.skip();
  }

  get currentlyPlaying(): Readonly<Video | undefined> {
    return this._currentlyPlaying;
  }

  get queue(): ReadonlyArray<Video> {
    return this._queue;
  }
}
