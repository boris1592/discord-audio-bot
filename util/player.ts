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
  private isPlaying: boolean = false;
  private queue: Array<PlayerQueueEntry> = [];
  private connection?: VoiceConnection;

  constructor(
    private readonly channel: VoiceBasedChannel,
    private readonly onStopped: () => void,
  ) {}

  update() {
    if (this.isPlaying) {
      log.debug("Bot is currenty playing, nothing to do");
      return;
    }

    if (this.queue.length === 0) {
      log.debug("Queue empty, disconnecting");
      this.connection?.destroy();
      this.onStopped();
      return;
    }

    const { url } = this.queue[0];
    this.queue = this.queue.splice(1);

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
    this.isPlaying = true;

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
    this.queue.push(entry);
    this.update();
  }

  skip() {
    this.isPlaying = false;
    this.update();
  }

  getQueue() {
    return this.queue;
  }
}
