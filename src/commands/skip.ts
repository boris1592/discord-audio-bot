import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { DiscordCommand } from "./command";
import { ReplyFunc } from "../util";
import { Player } from "../player";

export class SkipCommand implements DiscordCommand {
  info = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip to the next");

  constructor(private readonly players: Record<string, Player>) {}

  execute(interaction: ChatInputCommandInteraction, reply: ReplyFunc) {
    this.players[interaction.guildId as string]?.skip();
    return reply(`Skipping...`);
  }
}
