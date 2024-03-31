const { EmbedBuilder } = require("discord.js");

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {string | import('discord.js').MessagePayload | import('discord.js').InteractionReplyOptions} options
 */
async function replyOrFollowup(interaction, options) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(options);
  } else {
    await interaction.reply(options);
  }
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @returns {(message: string) => Promise<void>}
 */
function fancyReply(interaction) {
  return async (message) => {
    await replyOrFollowup(interaction, {
      embeds: [new EmbedBuilder().setColor("#2ecc71").setDescription(message)],
    });
  };
}

/**
 * @param {import('discord.js').Interaction} interaction
 * @returns {(message: string) => Promise<void>}
 */
function fancyError(interaction) {
  return async (message) => {
    await replyOrFollowup(interaction, {
      embeds: [new EmbedBuilder().setColor("#e74c3c").setDescription(message)],
      ephemeral: true,
    });
  };
}

module.exports = {
  fancyReply,
  fancyError,
};
