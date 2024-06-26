import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "dotenv";
import pino from "pino";
import { makeCommands } from "./commands/index";
import { fancyReply, fancyError } from "./util";

function buildDeps() {
  const logger = pino({ level: "debug" });
  const rest = new REST().setToken(process.env.TOKEN as string);
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
      Routes.applicationCommands(process.env.CLIENT_ID as string),
      { body: commands.map(({ info }) => info.toJSON()) },
    );
    logger.info(`Successfully reloaded ${(data as any).length} (/) commands`);
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

  client.login(process.env.TOKEN);
}

config();
startBot();
