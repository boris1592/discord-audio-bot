import { ChatInputCommandInteraction, SlashCommandBuilder } from "../deps.ts";
import { ReplyFunc } from "../util.ts";

export interface DiscordCommand {
  readonly info: SlashCommandBuilder;

  execute(
    interaction: ChatInputCommandInteraction,
    reply: ReplyFunc,
    error: ReplyFunc,
  ): Promise<void>;
}
