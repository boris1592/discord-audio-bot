import { ChatInputCommandInteraction, SlashCommandBuilder } from "../deps.ts";
import { DiscordCommand } from "./command.ts";
import { ReplyFunc } from "../util/discord.ts";
import { Player } from "../util/player.ts";

export class JumpCommand implements DiscordCommand {
  info = new SlashCommandBuilder()
    .setName("jump")
    .setDescription("Jump to any point of currently played video")
    .addNumberOption((option) =>
      option
        .setName("to")
        .setDescription("Time in seconds to jump to")
        .setRequired(true)
    ) as SlashCommandBuilder;

  constructor(private readonly players: Record<string, Player>) {}

  execute(interaction: ChatInputCommandInteraction, reply: ReplyFunc) {
    const player = this.players[interaction.guildId as string];

    if (!player) return reply("Not playing.");

    const to = interaction.options.getNumber("to") as number;
    player.jump(to);
    return reply("Jumped.");
  }
}
