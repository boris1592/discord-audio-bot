import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "../deps.ts";
import { DiscordCommand } from "./command.ts";
import { Player } from "../player.ts";
import { ReplyFunc } from "../util.ts";

export class QueueCommand implements DiscordCommand {
  info = new SlashCommandBuilder().setName("queue").setDescription("Get queue");

  constructor(private readonly players: Record<string, Player>) {}

  execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    reply: ReplyFunc,
  ): Promise<void> {
    const queue = this.players[interaction.guildId as string]?.getQueue() ?? [];

    if (queue.length === 0) return reply("Queue empty.");

    // TODO: Get info about a video from its URL
    const msg = queue
      .map((url, index) => `${index + 1}. ${url}\n`)
      .reduce((prev, curr) => prev + curr);

    return reply(msg);
  }
}
