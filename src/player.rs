use crate::{
    handlers::{DisconnectHandler, TrackEndHandler},
    Data,
};
use poise::serenity_prelude as serenity;
use reqwest::Client as HttpClient;
use songbird::{
    input::{AuxMetadataError, Compose, YoutubeDl},
    tracks::TrackHandle,
    CoreEvent, Event, Songbird, TrackEvent,
};
use std::{collections::VecDeque, sync::Arc};
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct QueueEntry {
    pub url: Box<str>,
    pub name: Box<str>,
}

impl QueueEntry {
    pub async fn new(url: Box<str>, client: HttpClient) -> Result<Self, AuxMetadataError> {
        let mut ytdl = YoutubeDl::new(client, url.clone().into());
        let name = ytdl.aux_metadata().await?.title.unwrap().into();
        Ok(Self { url, name })
    }

    pub fn format(&self) -> String {
        format!("[{}]({})", self.name, self.url)
    }
}

#[derive(Default)]
struct Queue {
    current: Option<(QueueEntry, TrackHandle)>,
    queue: VecDeque<QueueEntry>,
}

pub struct Player {
    guild_id: serenity::GuildId,
    channel_id: serenity::ChannelId,

    manager: Arc<Songbird>,
    bot_data: Arc<Data>,
    queue: Mutex<Queue>,
}

impl Player {
    pub fn new(
        guild_id: serenity::GuildId,
        channel_id: serenity::ChannelId,
        manager: Arc<Songbird>,
        bot_data: Arc<Data>,
    ) -> Self {
        Self {
            guild_id,
            channel_id,
            manager,
            bot_data,
            queue: Mutex::default(),
        }
    }

    pub async fn play(self: Arc<Self>, entry: QueueEntry) {
        self.queue.lock().await.queue.push_back(entry);
        self.update().await;
    }

    pub async fn skip(&self) {
        if let Some(track) = self.queue.lock().await.current.as_ref() {
            track.1.stop().unwrap();
        }
    }

    pub async fn get_queue(&self) -> (Option<QueueEntry>, Vec<QueueEntry>) {
        let queue = self.queue.lock().await;
        let entry = queue.current.clone().map(|(entry, _)| entry);
        let queue = queue.queue.clone().into();
        (entry, queue)
    }

    pub async fn remove_current(self: Arc<Self>) {
        let _ = self.queue.lock().await.current.take();
        self.update().await;
    }

    pub async fn clear(&self) {
        let mut queue = self.queue.lock().await;
        let _ = queue.current.take();
        queue.queue.clear();
        self.remove().await;
    }

    async fn update(self: Arc<Self>) {
        let mut queue = self.queue.lock().await;

        if queue.current.is_some() {
            return;
        }

        let next = match queue.queue.pop_front() {
            Some(next) => next,
            None => {
                self.remove().await;
                return;
            }
        };
        let source = YoutubeDl::new(self.bot_data.http_client.clone(), next.url.clone().into());

        let call = self.manager.get(self.guild_id);
        let call = match call {
            Some(call) => call,
            None => {
                let call = self
                    .manager
                    .join(self.guild_id, self.channel_id)
                    .await
                    .unwrap();

                call.lock().await.add_global_event(
                    Event::Core(CoreEvent::DriverDisconnect),
                    DisconnectHandler::new(self.clone()),
                );

                call
            }
        };

        let mut call = call.lock().await;
        let track = call.play_input(source.into());

        track
            .add_event(
                Event::Track(TrackEvent::End),
                TrackEndHandler::new(self.clone()),
            )
            .unwrap();

        track
            .add_event(
                Event::Track(TrackEvent::Error),
                TrackEndHandler::new(self.clone()),
            )
            .unwrap();

        let _ = queue.current.replace((next, track));
    }

    async fn remove(&self) {
        let mut players = self.bot_data.players.lock().await;
        let _ = self.manager.remove(self.guild_id).await;
        players.remove(&self.guild_id);
    }
}
