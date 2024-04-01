import { PingCommand } from "./ping.js";
import { PlayCommand } from "./play.js";

export const commands = [() => new PingCommand(), () => new PlayCommand()];
