import { SlashCommandBuilder } from "discord.js";
import ytdl from "ytdl-core";
import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} from "@discordjs/voice";

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
 *   reply: (message: string) => Promise<void>,
 *   error: (message: string) => Promise<void>,
 *   interaction: import('discord.js').Interaction
 * }}
 */
export async function execute({ reply, error, interaction }) {
  const channel = interaction.member.voice?.channel;

  if (!channel) {
    await error("You should be in a voice channel to use this command");
    return;
  }

  const url = interaction.options.getString("url");
  const resource = createAudioResource(
    ytdl(url, { filter: "audioonly", dlChunkSize: 0 }),
  );

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: interaction.guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  connection.subscribe(player);

  await reply("Starting to play...");
  player.play(resource);

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });
}
