import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
} from "./deps.ts";
import { VoiceBasedChannel } from "./deps.ts";
import { log } from "./deps.ts";
import { execDlp } from "./util.ts";

export class Player {
  private isPlaying: boolean = false;
  private queue: Array<string> = [];
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

    const url = this.queue[0];
    this.queue = this.queue.splice(1);

    const stdout = execDlp(url);
    const resource = createAudioResource(stdout);
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
      this.isPlaying = false;
      this.update();
    });

    audioPlayer.on("error", (err) => {
      log.error(err);
      log.debug("Skipping because an error occured");
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
