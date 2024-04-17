import { Logger } from "pino";
import { VoiceBasedChannel } from "discord.js";
import { Player } from "./player";

export class PlayerService {
  private readonly players: Record<string, Player> = {};

  constructor(private readonly logger: Logger) {}

  play(url: string, channel: VoiceBasedChannel) {
    if (!this.players[channel.guildId]) {
      this.players[channel.guildId] = new Player(
        channel,
        this.logger.child({ guildId: channel.guildId }),
        () => {
          delete this.players[channel.guildId];
        },
      );
    }

    this.players[channel.guildId].play(url);
  }

  skip(guildId: string) {
    this.players[guildId]?.skip();
  }
}
