import { Client, Events, GatewayIntentBits, REST, Routes } from "./deps.ts";
import { log } from "./deps.ts";
import { fancyError, fancyReply } from "./util/discord.ts";
import { makeCommands } from "./commands/index.ts";

(async () => {
  log.setup({
    handlers: {
      default: new log.ConsoleHandler("DEBUG", {
        formatter: log.formatters.jsonFormatter,
        useColors: false,
      }),
    },
  });

  const commands = makeCommands();
  const rest = new REST().setToken(Deno.env.get("TOKEN") as string);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  try {
    log.info(`Started refreshing ${commands.length} (/) commands`);

    const { length } = (await rest.put(
      Routes.applicationCommands(Deno.env.get("CLIENT_ID") as string),
      { body: commands.map(({ info }) => info.toJSON()) },
    )) as { length: number };

    log.info(`Successfully reloaded ${length} (/) commands`);
  } catch (error) {
    log.error(error);
    return;
  }

  client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(
      ({ info }) => info.name === interaction.commandName,
    );
    const reply = fancyReply(interaction);
    const error = fancyError(interaction);

    if (!command) {
      log.error(`No command named ${interaction.commandName} was found.`);
      return error("This command could not be found for some reason.");
    }

    try {
      return command.execute(interaction, reply, error);
    } catch (err) {
      log.error(err);
      return error("An unknown error occured while processing this command.");
    }
  });

  client.once(Events.ClientReady, (readyClient) => {
    log.info(`Logged in as ${readyClient.user.tag}`);
  });

  client.login(Deno.env.get("TOKEN"));
})();
