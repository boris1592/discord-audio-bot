export {
  type InteractionReplyOptions,
  MessagePayload,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
  type CacheType,
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  type VoiceBasedChannel,
  EmbedBuilder,
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
import "npm:sodium-native@^3.3.0";
import "npm:opusscript@^0.0.7";
export { pino, type Logger } from "npm:pino@^9.3.2";
export { Readable } from "node:stream";
import "jsr:@std/dotenv/load";
