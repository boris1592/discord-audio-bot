import {
  EmbedBuilder,
  InteractionReplyOptions,
  MessagePayload,
  ChatInputCommandInteraction,
} from "discord.js";

async function replyOrFollowup(
  interaction: ChatInputCommandInteraction,
  options: string | MessagePayload | InteractionReplyOptions,
) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(options);
  } else {
    await interaction.reply(options);
  }
}

export function fancyReply(interaction: ChatInputCommandInteraction) {
  return async (message: string) => {
    await replyOrFollowup(interaction, {
      embeds: [new EmbedBuilder().setColor("#2ecc71").setDescription(message)],
    });
  };
}

export function fancyError(interaction: ChatInputCommandInteraction) {
  return async (message: string) => {
    await replyOrFollowup(interaction, {
      embeds: [new EmbedBuilder().setColor("#e74c3c").setDescription(message)],
      ephemeral: true,
    });
  };
}

export type ReplyFunc = (message: string) => Promise<void>;
