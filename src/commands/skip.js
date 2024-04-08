import { SlashCommandBuilder } from "discord.js";

export const info = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip to the next");

/**
 * @param {{
 *   reply: (message: string) => Promise<void>
 *   error: (message: string) => Promise<void>
 *   interaction: import('discord.js').Interaction
 *   player: import('../service/player').PlayerService
 * }}
 */
export async function execute({ reply, interaction, player }) {
  player.skip(interaction.guildId);
  await reply(`Skipping...`);
}
