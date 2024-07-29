import { ChatInputCommandInteraction, SlashCommandBuilder } from "../deps.ts";
import { DiscordCommand } from "./command.ts";
import { ReplyFunc } from "../util/discord.ts";
import { Player } from "../util/player.ts";

export class SkipCommand implements DiscordCommand {
  info = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip to the next");

  constructor(private readonly players: Record<string, Player>) {}

  execute(interaction: ChatInputCommandInteraction, reply: ReplyFunc) {
    const player = this.players[interaction.guildId as string];

    if (!player) return reply("Not playing.");

    player.skip();
    return reply(`Skipped.`);
  }
}
