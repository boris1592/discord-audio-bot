import { SlashCommandBuilder } from "discord.js";

export const info = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Ping!");

/**
 * @param {{reply: (message: string) => Promise<void>}}
 */
export async function execute({ reply }) {
  await reply("Pong!");
}
