const {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} = require("discord.js");
const { commands } = require("./commands");
const { fancyReply, fancyError } = require("./util");
/** @type {import('pino').Logger} */
const logger = require("pino")();
require("dotenv").config();

async function main() {
  const commandsMap = Object.fromEntries(
    commands.map((command) => {
      const instance = command();
      return [instance.info.name, instance];
    })
  );

  const rest = new REST().setToken(process.env.TOKEN);

  try {
    logger.info(`Started refreshing ${commands.length} (/) commands`);
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: Object.values(commandsMap).map(({ info }) => info.toJSON()) }
    );
    logger.info(`Successfully reloaded ${data.length} (/) commands`);
  } catch (error) {
    logger.error(error);
    return;
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const subLogger = logger.child({ interaction: interaction.id });
    const command = commandsMap[interaction.commandName];
    const reply = fancyReply(interaction);
    const error = fancyError(interaction);

    if (!command) {
      subLogger.error(`No command named ${interaction.commandName} was found`);
      await error("This command could not be found for some reason");
      return;
    }

    try {
      await command.execute({
        reply,
        error,
        interaction,
      });
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

main();
