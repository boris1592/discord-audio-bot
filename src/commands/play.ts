import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "../deps.ts";
import { DiscordCommand } from "./command.ts";
import { ReplyFunc } from "../util.ts";
import { Player } from "../player.ts";
import { Logger } from "../deps.ts";

export class PlayCommand implements DiscordCommand {
  info = new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a video in a voice channel")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("YouTube video link")
        .setRequired(true),
    ) as SlashCommandBuilder;

  constructor(
    private readonly players: Record<string, Player>,
    private readonly logger: Logger,
  ) {}

  execute(
    interaction: ChatInputCommandInteraction,
    reply: ReplyFunc,
    error: ReplyFunc,
  ) {
    if (!(interaction.member instanceof GuildMember)) {
      return error("Not a guild member");
    }

    const channel = interaction.member.voice?.channel;

    if (!channel) {
      return error("You should be in a voice channel to use this command");
    }

    const url = interaction.options.getString("url") as string;

    if (!this.players[channel.guildId]) {
      this.players[channel.guildId] = new Player(
        channel,
        this.logger.child({ guildId: channel.guildId }),
        () => delete this.players[channel.guildId],
      );
    }

    this.players[channel.guildId].play(url);
    return reply("Adding to the queue...");
  }
}
