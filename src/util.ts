import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionReplyOptions,
  MessagePayload,
} from "./deps.ts";
import { Readable } from "./deps.ts";

export type ReplyFunc = (message: string) => Promise<void>;

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

export function fancyReply(
  interaction: ChatInputCommandInteraction,
): ReplyFunc {
  return async (message: string) => {
    await replyOrFollowup(interaction, {
      embeds: [new EmbedBuilder().setColor("#2ecc71").setDescription(message)],
    });
  };
}

export function fancyError(
  interaction: ChatInputCommandInteraction,
): ReplyFunc {
  return async (message: string) => {
    await replyOrFollowup(interaction, {
      embeds: [new EmbedBuilder().setColor("#e74c3c").setDescription(message)],
      ephemeral: true,
    });
  };
}

export function createStream(url: string): Readable {
  const command = new Deno.Command("./yt-dlp", {
    args: [url, "-x", "--audio-format", "opus", "-o", "-"],
    stdout: "piped",
  });

  // deno-lint-ignore no-explicit-any -- node's Readable doesn't work properly with generics
  return Readable.fromWeb(command.spawn().stdout as any);
}

export async function loadTitle(url: string): Promise<string | undefined> {
  const command = new Deno.Command("./yt-dlp", {
    args: [url, "--dump-json"],
  });
  const { code, stdout } = await command.output();

  if (code !== 0) return undefined;

  return JSON.parse(new TextDecoder().decode(stdout)).title;
}
