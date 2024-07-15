import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";
import { Logger } from "pino";
import { exec } from "youtube-dl-exec";
import { Readable } from "node:stream";

export class Player {
  private isPlaying: boolean = false;
  private queue: Array<string> = [];
  private connection?: VoiceConnection;

  constructor(
    private readonly channel: VoiceBasedChannel,
    private readonly logger: Logger,
    private readonly onStopped: () => void,
  ) {}

  update() {
    if (this.isPlaying) {
      this.logger.debug("Bot is currenty playing, nothing to do");
      return;
    }

    if (this.queue.length === 0) {
      this.logger.debug("Queue empty, disconnecting");
      this.connection?.destroy();
      this.onStopped();
      return;
    }

    const url = this.queue[0];
    this.queue = this.queue.splice(1);

    const process = exec(url, { extractAudio: true, output: "-" });

    (process as any).catch((err: any) => {
      this.logger.error(err);
    });

    const resource = createAudioResource(process.stdout as Readable);
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
        this.logger.info("Disconnected from the channel");
        this.onStopped();
      });
    }

    this.logger.debug(`Starting to play ${url}`);
    this.isPlaying = true;

    this.connection.subscribe(audioPlayer);
    audioPlayer.play(resource);

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.isPlaying = false;
      this.update();
    });

    audioPlayer.on("error", (err) => {
      this.logger.error(err);
      this.logger.debug("Skipping because an error occured");
      this.isPlaying = false;
      this.update();
    });
  }

  play(url: string) {
    this.queue.push(url);
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
