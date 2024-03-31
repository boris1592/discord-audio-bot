const { SlashCommandBuilder } = require("discord.js");

class PingCommand {
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

module.exports = () => new PingCommand();
