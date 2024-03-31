const { EmbedBuilder } = require("discord.js");

/**
 * @param {import('discord.js').Interaction} interaction
 * @returns {(message: string) => Promise<void>}
 */
function fancyReply(interaction) {
  return async (message) => {
    const options = {
      embeds: [new EmbedBuilder().setColor("#2ecc71").setDescription(message)],
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(options);
    } else {
      await interaction.reply(options);
    }
  };
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @returns {(message: string) => Promise<void>}
 */
function fancyError(interaction) {
  return async (message) => {
    const options = {
      embeds: [new EmbedBuilder().setColor("#e74c3c").setDescription(message)],
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(options);
    } else {
      await interaction.reply(options);
    }
  };
}

module.exports = {
  fancyReply,
  fancyError,
};
