import { SlashCommandBuilder } from "discord.js";

export class PingCommand {
  constructor() {
    this.info = new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Ping!");
  }

  /**
   * @param {{reply: (message: string) => Promise<void>}}
   */
  async execute({ reply }) {
    await reply("Pong!");
  }
}
