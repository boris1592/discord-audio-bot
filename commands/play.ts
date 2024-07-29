import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "../deps.ts";
import { DiscordCommand } from "./command.ts";
import { ReplyFunc } from "../util/discord.ts";
import { format, loadTitle } from "../util/video.ts";
import { Player } from "../util/player.ts";

export class PlayCommand implements DiscordCommand {
  info = new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a video in a voice channel")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("YouTube video link")
        .setRequired(true)
    ).addNumberOption((option) =>
      option.setName("start").setDescription("Number of seconds to skip")
    ) as SlashCommandBuilder;

  constructor(private readonly players: Record<string, Player>) {}

  async execute(
    interaction: ChatInputCommandInteraction,
    reply: ReplyFunc,
    error: ReplyFunc,
  ) {
    const channel = (interaction.member as GuildMember).voice?.channel;

    if (!channel) {
      return error("You should be in a voice channel to use this command.");
    }

    if (!this.players[channel.guildId]) {
      this.players[channel.guildId] = new Player(
        channel,
        () => delete this.players[channel.guildId],
      );
    }

    const url = interaction.options.getString("url") as string;
    const start = interaction.options.getNumber("start");

    await interaction.deferReply();
    const title = await loadTitle(url);

    if (!title) {
      return error("Failed to load the video.");
    }

    const video = { url, title, start };

    this.players[channel.guildId].play(video);
    return reply(`Added ${format(video)} to the queue.`);
  }
}
