import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnection,
} from "@discordjs/voice";
import { exec } from "youtube-dl-exec";
import { Logger } from "pino";
import { VoiceBasedChannel } from "discord.js";
import { Readable } from "node:stream";

export class Player {
  private readonly players: Record<
    string,
    {
      isPlaying: boolean;
      queue: Array<string>;
      channel: VoiceBasedChannel;
      connection?: VoiceConnection;
    }
  >;

  constructor(private readonly logger: Logger) {
    this.players = {};
  }

  private update(guildId: string) {
    const player = this.players[guildId];
    const logger = this.logger.child({ guildId });

    if (!player) {
      logger.error("No player found, nothing to do");
      return;
    }

    if (player.isPlaying) {
      logger.debug("Bot is currenty playing, nothing to do");
      return;
    }

    if (player.queue.length === 0) {
      logger.debug("Queue empty, disconnecting");
      player.connection?.destroy();
      delete this.players[guildId];
      return;
    }

    const url = player.queue[0];
    player.queue = player.queue.splice(1);

    const process = exec(url, { extractAudio: true, output: "-" });
    const resource = createAudioResource(process.stdout as Readable);
    const audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    if (!player.connection) {
      player.connection = joinVoiceChannel({
        channelId: player.channel.id,
        guildId: guildId,
        adapterCreator: player.channel.guild.voiceAdapterCreator,
      });
    }

    logger.debug(`Starting to play ${url}`);
    player.isPlaying = true;

    player.connection.subscribe(audioPlayer);
    audioPlayer.play(resource);

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
      player.isPlaying = false;
      this.update(guildId);
    });

    audioPlayer.on("error", (err) => {
      logger.error(err);
      logger.debug(`Skipping because an error occured`);
      player.isPlaying = false;
      this.update(guildId);
    });
  }

  play(url: string, channel: VoiceBasedChannel, guildId: string) {
    if (!this.players[guildId]) {
      this.players[guildId] = {
        isPlaying: false,
        queue: [],
        channel,
      };
    }

    this.players[guildId].queue.push(url);
    this.update(guildId);
  }

  skip(guildId: string) {
    if (!this.players[guildId]) return;

    this.players[guildId].isPlaying = false;
    this.update(guildId);
  }
}
