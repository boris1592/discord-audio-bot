import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ReplyFunc } from "../util";

export interface DiscordCommand {
  readonly info: SlashCommandBuilder;

  execute(
    interaction: ChatInputCommandInteraction,
    reply: ReplyFunc,
    error: ReplyFunc,
  ): Promise<void>;
}
