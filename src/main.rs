use crate::{
    commands::{play::play, queue::queue, skip::skip},
    player::Player,
};
use poise::serenity_prelude as serenity;
use reqwest::Client as HttpClient;
use songbird::SerenityInit;
use std::{env, error, sync::Arc};

mod commands;
mod handler;
mod player;
mod queue;
mod util;

struct Data {
    player: Player,
    http_client: HttpClient,
}

type Error = Box<dyn error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Arc<Data>, Error>;

#[tokio::main]
async fn main() {
    let _ = dotenv::dotenv();
    env_logger::init();

    let token = env::var("TOKEN").unwrap();
    let intents =
        serenity::GatewayIntents::non_privileged() | serenity::GatewayIntents::GUILD_VOICE_STATES;

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: vec![play(), skip(), queue()],
            ..Default::default()
        })
        .setup(|ctx, _ready, framework| {
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                let http_client = HttpClient::new();
                Ok(Arc::new(Data {
                    player: Player::new(songbird::get(ctx).await.unwrap(), http_client.clone()),
                    http_client,
                }))
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
