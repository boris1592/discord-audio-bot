import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ReplyFunc } from "../util";
import { DiscordCommand } from "./command";

export class PingCommand implements DiscordCommand {
  info = new SlashCommandBuilder().setName("ping").setDescription("Ping!");

  async execute(
    _interaction: ChatInputCommandInteraction,
    reply: ReplyFunc,
    _error: ReplyFunc,
  ) {
    await reply("Pong!");
  }
}
