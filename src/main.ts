import { Client, Events, GatewayIntentBits, REST, Routes } from "./deps.ts";
import { pino } from "./deps.ts";
import { makeCommands } from "./commands/index.ts";
import { fancyError, fancyReply } from "./util.ts";

function buildDeps() {
  const logger = pino({ level: "debug" });
  const rest = new REST().setToken(Deno.env.get("TOKEN") as string);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });
  const commands = makeCommands(logger);

  return { logger, rest, client, commands };
}

async function startBot() {
  const { logger, rest, client, commands } = buildDeps();

  try {
    logger.info(`Started refreshing ${commands.length} (/) commands`);

    const data = await rest.put(
      Routes.applicationCommands(Deno.env.get("CLIENT_ID") as string),
      { body: commands.map(({ info }) => info.toJSON()) },
    );

    logger.info(
      `Successfully reloaded ${
        (data as { length: number }).length
      } (/) commands`,
    );
  } catch (error) {
    logger.error(error);
    return;
  }

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const subLogger = logger.child({ interaction: interaction.id });
    const command = commands.find(
      ({ info }) => info.name === interaction.commandName,
    );
    const reply = fancyReply(interaction);
    const error = fancyError(interaction);

    if (!command) {
      subLogger.error(`No command named ${interaction.commandName} was found`);
      await error("This command could not be found for some reason");
      return;
    }

    try {
      await command.execute(interaction, reply, error);
    } catch (err) {
      subLogger.error(err);
      await error("An unknown error occured while processing this command");
    }
  });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info(`Logged in as ${readyClient.user.tag}`);
  });

  client.login(Deno.env.get("TOKEN"));
}

startBot();
