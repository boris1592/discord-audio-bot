import * as ping from "./ping.js";
import * as play from "./play.js";

export const commands = {
  [ping.info.name]: { info: ping.info, execute: ping.execute },
  [play.info.name]: { info: play.info, execute: play.execute },
};
