export {
  REST,
  Client,
  Events,
  GatewayIntentBits,
  Routes,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessagePayload,
  SlashCommandBuilder,
  GuildMember,
  type CacheType,
  type InteractionReplyOptions,
  type VoiceBasedChannel,
} from "npm:discord.js@^14.15.3";
export {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from "npm:@discordjs/voice@^0.17.0";
export { Readable } from "node:stream";
export * as log from "jsr:@std/log";
import "npm:sodium-native@^3.3.0";
import "npm:opusscript@^0.0.7";
import "jsr:@std/dotenv/load";
