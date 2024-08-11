use poise::serenity_prelude as serenity;
use reqwest::Client as HttpClient;
use songbird::{input::YoutubeDl, SerenityInit};
use std::env;

struct Data {
    http_client: HttpClient,
}

type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;

#[poise::command(slash_command)]
async fn play(ctx: Context<'_>, #[description = "link"] link: String) -> Result<(), Error> {
    let (guild_id, channel_id) = {
        let guild = ctx.guild().ok_or("can only be used in guilds")?;
        let channel_id = guild
            .voice_states
            .get(&ctx.author().id)
            .and_then(|voice_state| voice_state.channel_id)
            .ok_or("should be in a voice channel")?;

        (guild.id, channel_id)
    };

    let manager = songbird::get(ctx.serenity_context())
        .await
        .ok_or("manager couldn't be found")?;

    let handler = manager.join(guild_id, channel_id).await?;
    let mut handler = handler.lock().await;

    let src = YoutubeDl::new(ctx.data().http_client.clone(), link);
    let track = handler.play_input(src.into());

    ctx.say("starting to play").await?;

    Ok(())
}

#[tokio::main]
async fn main() {
    let _ = dotenv::dotenv();
    env_logger::init();

    let token = env::var("TOKEN").unwrap();
    let intents =
        serenity::GatewayIntents::non_privileged() | serenity::GatewayIntents::GUILD_VOICE_STATES;

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: vec![play()],
            ..Default::default()
        })
        .setup(|ctx, _ready, framework| {
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                Ok(Data {
                    http_client: HttpClient::new(),
                })
            })
        })
        .build();

    let mut client = serenity::ClientBuilder::new(token, intents)
        .framework(framework)
        .register_songbird()
        .await
        .unwrap();

    client.start().await.unwrap();
}
