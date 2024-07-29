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
    const queue = this.players[interaction.guildId as string]?.getQueue() ?? [];

    if (queue.length === 0) return reply("Queue is empty.");

    const msg = queue
      .map(({ url, title }, index) => `${index + 1}. [${title}](${url})\n`)
      .reduce((prev, curr) => prev + curr);

    return reply(msg);
  }
}
