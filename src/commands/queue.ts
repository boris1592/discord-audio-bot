import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { DiscordCommand } from "./command";
import { Player } from "../player";
import { ReplyFunc } from "../util";

export class QueueCommand implements DiscordCommand {
  info = new SlashCommandBuilder().setName("queue").setDescription("Get queue");

  constructor(private readonly players: Record<string, Player>) {}

  execute(
    interaction: ChatInputCommandInteraction<CacheType>,
    reply: ReplyFunc,
  ): Promise<void> {
    const queue = this.players[interaction.guildId as string]?.getQueue() ?? [];

    if (queue.length === 0) return reply("Queue empty.");

    const msg = queue
      .map((url, index) => `${index + 1}. ${url}\n`)
      .reduce((prev, curr) => prev + curr);

    return reply(msg);
  }
}
