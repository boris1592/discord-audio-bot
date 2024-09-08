# Discord Audio Bot
This bot can play YouTube videos in a Discord voice channel. It also supports basic queue functionality. Currently it's not hosted anywhere so to use it you need to host it yourself.

# Self-hosting
## Creating a bot and adding it to a server
This isn't a guide about creating your discord bot. If you don't know how to do that you can use [this guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html).

After you've created the bot add it to your server with slash command and voice channel permissions.

## Docker
As you might've guessed based on the languages used in this repo this bot can be deployed using docker.

### Building the image
Clone this repo and run this command from repo's directory to build the image:
```bash
docker build -t discord-audio-bot .
```

### Environment
Create `.env` file containing this line but with your actual token:
```bash
TOKEN=your-discord-bot-token
```

### Running the container
Run the container using this command:
```bash
docker run -d --env-file .env --name discord-audio-bot --restart always discord-audio-bot
```
