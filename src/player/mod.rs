use crate::{
    player::inner::{ChannelPlayer, PlayerInner},
    queue::{Queue, QueueEntry},
};
use poise::serenity_prelude as serenity;
use reqwest::Client as HttpClient;
use songbird::Songbird;
use std::{ops::DerefMut, sync::Arc};
use tokio::sync::Mutex;

mod inner;

pub struct Player {
    inner: Arc<PlayerInner>,
}

impl Player {
    pub fn new(manager: Arc<Songbird>, http_client: HttpClient) -> Self {
        Self {
            inner: Arc::new(PlayerInner {
                manager,
                http_client,
                players: Mutex::default(),
            }),
        }
    }

    pub async fn play(
        &self,
        guild_id: serenity::GuildId,
        channel_id: serenity::ChannelId,
        entry: QueueEntry,
    ) {
        let player = {
            let mut players = self.inner.players.lock().await;

            match players.get(&guild_id) {
                Some(player) => player.clone(),
                None => {
                    let player = Arc::new(Mutex::new(ChannelPlayer {
                        guild_id,
                        channel_id,
                        queue: Queue::default(),
                    }));
                    players.insert(guild_id, player.clone());
                    player
                }
            }
        };
        let mut player = player.lock().await;

        player.queue.queue.push_back(entry);
        self.inner.update(player.deref_mut()).await;
    }

    pub async fn skip(&self, guild_id: serenity::GuildId) -> Result<(), ()> {
        let player = match self.inner.players.lock().await.get(&guild_id) {
            Some(player) => player.clone(),
            None => return Err(()),
        };
        let queue = player.lock().await.queue.clone();

        match queue.current.as_ref() {
            Some(track) => {
                track.1.stop().unwrap();
                Ok(())
            }
            None => Err(()),
        }
    }

    pub async fn get_queue(&self, guild_id: serenity::GuildId) -> Option<Queue> {
        match self.inner.players.lock().await.get(&guild_id) {
            Some(player) => Some(player.lock().await.queue.clone()),
            None => None,
        }
    }
}
