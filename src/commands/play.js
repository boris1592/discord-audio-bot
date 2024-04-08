import { SlashCommandBuilder } from "discord.js";

export const info = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play a video in a voice channel")
  .addStringOption((option) =>
    option
      .setName("url")
      .setDescription("YouTube video link")
      .setRequired(true),
  );

/**
 * @param {{
 *   reply: (message: string) => Promise<void>
 *   error: (message: string) => Promise<void>
 *   interaction: import('discord.js').Interaction
 *   player: import('../service/player').PlayerService
 * }}
 */
export async function execute({ reply, error, interaction, player }) {
  const channel = interaction.member.voice?.channel;

  if (!channel) {
    await error("You should be in a voice channel to use this command");
    return;
  }

  const url = interaction.options.getString("url");
  player.play(url, channel, interaction.guildId);
  await reply("Adding to the queue...");
}
