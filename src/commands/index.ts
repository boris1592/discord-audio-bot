import { Logger } from "../deps.ts";
import { DiscordCommand } from "./command.ts";
import { PlayCommand } from "./play.ts";
import { SkipCommand } from "./skip.ts";
import { QueueCommand } from "./queue.ts";

export function makeCommands(logger: Logger): Array<DiscordCommand> {
  const players = {};

  return [
    new PlayCommand(players, logger),
    new SkipCommand(players),
    new QueueCommand(players),
  ];
}
