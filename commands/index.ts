import { DiscordCommand } from "./command.ts";
import { PlayCommand } from "./play.ts";
import { SkipCommand } from "./skip.ts";
import { QueueCommand } from "./queue.ts";
import { JumpCommand } from "./jump.ts";

export function makeCommands(): Array<DiscordCommand> {
  const players = {};

  return [
    new PlayCommand(players),
    new SkipCommand(players),
    new QueueCommand(players),
    new JumpCommand(players),
  ];
}
