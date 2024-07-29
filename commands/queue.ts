import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "../deps.ts";
import { DiscordCommand } from "./command.ts";
import { Player } from "../util/player.ts";
import { ReplyFunc } from "../util/discord.ts";

export class QueueCommand implements DiscordCommand {
  info = new SlashCommandBuilder().setName("queue").setDescription("Get queue");

  constructor(private readonly players: Record<string, Player>) {}

  execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    reply: ReplyFunc,
  ): Promise<void> {
    const player = this.players[interaction.guildId as string];

    if (!player) return reply("Not playing.");

    const { currentlyPlaying, queue } = player;

    const currentMessage = currentlyPlaying
      ? `Currently playing: [${currentlyPlaying.title}](${currentlyPlaying.url})\n\n`
      : "Nothing is being played.\n\n";
    const queueMessage =
      queue.length > 0
        ? "Queue:\n" +
          queue
            .map(
              ({ url, title }, index) => `${index + 1}. [${title}](${url})\n`,
            )
            .reduce((prev, curr) => prev + curr)
        : "Queue is empty.";

    const message = currentMessage + queueMessage;

    return reply(message);
  }
}
