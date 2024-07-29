import { REST, Client, GatewayIntentBits, Routes, Events } from "./deps.ts";
import { log } from "./deps.ts";
import { fancyError, fancyReply } from "./util/discord.ts";
import { makeCommands } from "./commands/index.ts";

function buildDeps() {
  const rest = new REST().setToken(Deno.env.get("TOKEN") as string);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });
  const commands = makeCommands();

  return { rest, client, commands };
}

async function startBot() {
  log.setup({
    handlers: {
      default: new log.ConsoleHandler("DEBUG", {
        formatter: log.formatters.jsonFormatter,
        useColors: false,
      }),
    },
  });

  const { rest, client, commands } = buildDeps();

  try {
    log.info(`Started refreshing ${commands.length} (/) commands`);

    const data = await rest.put(
      Routes.applicationCommands(Deno.env.get("CLIENT_ID") as string),
      { body: commands.map(({ info }) => info.toJSON()) },
    );

    log.info(
      `Successfully reloaded ${
        (data as { length: number }).length
      } (/) commands`,
    );
  } catch (error) {
    log.error(error);
    return;
  }

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find(
      ({ info }) => info.name === interaction.commandName,
    );
    const reply = fancyReply(interaction);
    const error = fancyError(interaction);

    if (!command) {
      log.error(`No command named ${interaction.commandName} was found.`);
      await error("This command could not be found for some reason.");
      return;
    }

    try {
      await command.execute(interaction, reply, error);
    } catch (err) {
      log.error(err);
      await error("An unknown error occured while processing this command.");
    }
  });

  client.once(Events.ClientReady, (readyClient) => {
    log.info(`Logged in as ${readyClient.user.tag}`);
  });

  client.login(Deno.env.get("TOKEN"));
}

startBot();
