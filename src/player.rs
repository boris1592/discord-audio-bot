use crate::handlers::{DisconnectHandler, TrackEndHandler};
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

pub struct Player {
    guild_id: serenity::GuildId,
    channel_id: serenity::ChannelId,
    manager: Arc<Songbird>,
    http_client: HttpClient,

    current: Mutex<Option<(QueueEntry, TrackHandle)>>,
    queue: Mutex<VecDeque<QueueEntry>>,
}

impl Player {
    pub fn new(
        manager: Arc<Songbird>,
        guild_id: serenity::GuildId,
        channel_id: serenity::ChannelId,
        http_client: HttpClient,
    ) -> Self {
        Self {
            guild_id,
            channel_id,
            manager,
            http_client,
            current: Mutex::new(None),
            queue: Mutex::default(),
        }
    }

    async fn update(self: Arc<Self>) {
        let mut current = self.current.lock().await;
        let mut queue = self.queue.lock().await;

        if current.is_some() {
            return;
        }

        let next = match queue.pop_front() {
            Some(next) => next,
            None => {
                self.manager.remove(self.guild_id).await.unwrap();
                return;
            }
        };
        let source = YoutubeDl::new(self.http_client.clone(), next.url.clone().into());

        let call = self.manager.get(self.guild_id);
        let call = match call {
            Some(call) => call,
            None => {
                let call = self
                    .manager
                    .join(self.guild_id, self.channel_id)
                    .await
                    .unwrap();

                let handler = DisconnectHandler::new(self.clone());
                call.lock()
                    .await
                    .add_global_event(Event::Core(CoreEvent::DriverDisconnect), handler);

                call
            }
        };

        let mut call = call.lock().await;
        let track = call.play_input(source.into());

        let handler = TrackEndHandler::new(self.clone());
        track
            .add_event(Event::Track(TrackEvent::End), handler.clone())
            .unwrap();
        track
            .add_event(Event::Track(TrackEvent::Error), handler)
            .unwrap();

        let _ = current.replace((next, track));
    }

    pub async fn play(self: Arc<Self>, entry: QueueEntry) {
        self.queue.lock().await.push_back(entry);
        self.update().await;
    }

    pub async fn skip(&self) {
        if let Some(track) = self.current.lock().await.as_ref() {
            track.1.stop().unwrap();
        }
    }

    pub async fn get_queue(&self) -> (Option<QueueEntry>, Vec<QueueEntry>) {
        let entry = self.current.lock().await.clone().map(|(entry, _)| entry);
        let queue = self.queue.lock().await.clone().into();
        (entry, queue)
    }

    pub async fn remove_current(self: Arc<Self>) {
        let _ = self.current.lock().await.take();
        self.update().await;
    }

    pub async fn clear(self: Arc<Self>) {
        let mut current = self.current.lock().await;
        let mut queue = self.queue.lock().await;

        self.manager.remove(self.guild_id).await.unwrap();
        let _ = current.take();
        queue.clear();
    }
}
