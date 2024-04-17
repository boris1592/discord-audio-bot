import { PlayerService } from "../player";
import { DiscordCommand } from "./command";
import { PingCommand } from "./ping";
import { PlayCommand } from "./play";
import { SkipCommand } from "./skip";

export function makeCommands(player: PlayerService): Array<DiscordCommand> {
  return [new PingCommand(), new PlayCommand(player), new SkipCommand(player)];
}
