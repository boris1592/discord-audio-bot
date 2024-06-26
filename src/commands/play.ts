import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { DiscordCommand } from "./command";
import { ReplyFunc } from "../util";
import { Player } from "../player";
import { Logger } from "pino";

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

  async execute(
    interaction: ChatInputCommandInteraction,
    reply: ReplyFunc,
    error: ReplyFunc,
  ) {
    if (!(interaction.member instanceof GuildMember)) {
      await error("Not a guild member");
      return;
    }

    const channel = interaction.member.voice?.channel;

    if (!channel) {
      await error("You should be in a voice channel to use this command");
      return;
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
    await reply("Adding to the queue...");
  }
}
