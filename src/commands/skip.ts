import { ChatInputCommandInteraction, SlashCommandBuilder } from "../deps.ts";
import { DiscordCommand } from "./command.ts";
import { ReplyFunc } from "../util.ts";
import { Player } from "../player.ts";

export class SkipCommand implements DiscordCommand {
  info = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip to the next");

  constructor(private readonly players: Record<string, Player>) {}

  execute(interaction: ChatInputCommandInteraction, reply: ReplyFunc) {
    this.players[interaction.guildId as string]?.skip();
    return reply(`Skipping.`);
  }
}
