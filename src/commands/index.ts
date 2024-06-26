import { Logger } from "pino";
import { DiscordCommand } from "./command";
import { PlayCommand } from "./play";
import { SkipCommand } from "./skip";
import { QueueCommand } from "./queue";

export function makeCommands(logger: Logger): Array<DiscordCommand> {
  const players = {};

  return [
    new PlayCommand(players, logger),
    new SkipCommand(players),
    new QueueCommand(players),
  ];
}
