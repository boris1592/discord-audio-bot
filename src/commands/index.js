import * as ping from "./ping.js";
import * as play from "./play.js";
import * as skip from "./skip.js";

export const commands = {
  [ping.info.name]: ping,
  [play.info.name]: play,
  [skip.info.name]: skip,
};
