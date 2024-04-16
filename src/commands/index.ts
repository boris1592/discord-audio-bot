import { Player } from "../player";
import { DiscordCommand } from "./command";
import { PingCommand } from "./ping";
import { PlayCommand } from "./play";
import { SkipCommand } from "./skip";

export function makeCommands(player: Player): Array<DiscordCommand> {
  return [new PingCommand(), new PlayCommand(player), new SkipCommand(player)];
}
