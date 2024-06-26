import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { DiscordCommand } from "./command";
import { ReplyFunc } from "../util";
import { Player } from "../player";

export class SkipCommand implements DiscordCommand {
  info = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip to the next");

  constructor(private readonly players: Record<string, Player>) {}

  async execute(
    interaction: ChatInputCommandInteraction,
    reply: ReplyFunc,
    _error: ReplyFunc,
  ) {
    this.players[interaction.guildId as string]?.skip();
    await reply(`Skipping...`);
  }
}
