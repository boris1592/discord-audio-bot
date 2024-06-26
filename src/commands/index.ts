import { Logger } from "pino";
import { Player } from "../player";
import { DiscordCommand } from "./command";
import { PlayCommand } from "./play";
import { SkipCommand } from "./skip";

export function makeCommands(
  players: Record<string, Player>,
  logger: Logger,
): Array<DiscordCommand> {
  return [new PlayCommand(players, logger), new SkipCommand(players)];
}
