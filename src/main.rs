use crate::{
    commands::{play::play, queue::queue, skip::skip},
    player::Player,
};
use poise::serenity_prelude as serenity;
use reqwest::Client as HttpClient;
use songbird::SerenityInit;
use std::{collections::HashMap, env, error, sync::Arc};
use tokio::sync::Mutex;

mod commands;
mod handler;
mod player;
mod queue;
mod util;

struct Data {
    http_client: HttpClient,
    players: Mutex<HashMap<serenity::GuildId, Arc<Player>>>,
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
                Ok(Arc::new(Data {
                    http_client: HttpClient::new(),
                    players: Mutex::default(),
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
