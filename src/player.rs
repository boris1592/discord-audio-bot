use crate::{
    handler::CustomEventHandler,
    queue::{Queue, QueueEntry},
};
use poise::serenity_prelude as serenity;
use reqwest::Client as HttpClient;
use songbird::{input::YoutubeDl, CoreEvent, Event, Songbird, TrackEvent};
use std::{collections::HashMap, future::Future, ops::DerefMut, sync::Arc};
use tokio::sync::Mutex;

struct ChannelPlayer {
    guild_id: serenity::GuildId,
    channel_id: serenity::ChannelId,
    queue: Queue,
}

pub struct Player {
    manager: Arc<Songbird>,
    http_client: HttpClient,
    players: Mutex<HashMap<serenity::GuildId, Arc<Mutex<ChannelPlayer>>>>,
}

impl Player {
    pub fn new(manager: Arc<Songbird>, http_client: HttpClient) -> Self {
        Self {
            manager,
            http_client,
            players: Mutex::default(),
        }
    }

    pub async fn play(
        self: &Arc<Self>,
        guild_id: serenity::GuildId,
        channel_id: serenity::ChannelId,
        entry: QueueEntry,
    ) {
        let player = {
            let mut players = self.players.lock().await;

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
        self.update(player.deref_mut()).await;
    }

    pub async fn skip(self: &Arc<Self>, guild_id: serenity::GuildId) -> Result<(), ()> {
        let player = match self.players.lock().await.get(&guild_id) {
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

    pub async fn get_queue(self: &Arc<Self>, guild_id: serenity::GuildId) -> Option<Queue> {
        match self.players.lock().await.get(&guild_id) {
            Some(player) => Some(player.lock().await.queue.clone()),
            None => None,
        }
    }

    async fn update(self: &Arc<Self>, player: &mut ChannelPlayer) {
        if player.queue.current.is_some() {
            return;
        }

        let next = match player.queue.queue.pop_front() {
            Some(next) => next,
            None => {
                let _ = self.manager.remove(player.guild_id).await;
                self.players.lock().await.remove(&player.guild_id);
                return;
            }
        };
        let source = YoutubeDl::new(self.http_client.clone(), next.url.to_string());

        let call = self.manager.get(player.guild_id);
        let call = match call {
            Some(call) => call,
            None => {
                let call = self
                    .manager
                    .join(player.guild_id, player.channel_id)
                    .await
                    .unwrap();

                // Since add_global_event needs the handler to be 'static  we
                // cannot just borrow self in the handler. This is the reason
                // this method receives &Arc<Self> instead of just &Self.
                let self_clone = self.clone();
                let guild_id = player.guild_id;
                let disconnect_handler = CustomEventHandler::new(move || {
                    let self_clone = self_clone.clone();

                    async move {
                        let _ = self_clone.manager.remove(guild_id).await;
                        self_clone.players.lock().await.remove(&guild_id);
                    }
                });

                call.lock()
                    .await
                    .add_global_event(Event::Core(CoreEvent::DriverDisconnect), disconnect_handler);

                call
            }
        };

        let mut call = call.lock().await;
        let track = call.play_input(source.into());

        // As described above we need an Arc here because of the 'static requirement.
        //
        // Not only that, but we need a weak pointer, because of a possible loop:
        // self -> players -> current -> track -> end_handler -> closure -> self
        let self_clone = Arc::downgrade(self);
        let guild_id = player.guild_id;
        let end_handler = CustomEventHandler::new(move || {
            let self_clone = self_clone.clone();

            async move {
                let player = match self_clone.upgrade() {
                    Some(player) => player,
                    None => return,
                };
                player.remove_current(guild_id).await;
            }
        });

        track
            .add_event(Event::Track(TrackEvent::End), end_handler.clone())
            .unwrap();

        track
            .add_event(Event::Track(TrackEvent::Error), end_handler)
            .unwrap();

        let _ = player.queue.current.replace((next, track));
    }

    // Normal async fn syntax leads to a Future cycle that the compiler isn't happy about
    fn remove_current(
        self: Arc<Self>,
        guild_id: serenity::GuildId,
    ) -> impl Future<Output = ()> + Send {
        async move {
            let chan_player = match self.players.lock().await.get(&guild_id) {
                Some(player) => player.clone(),
                None => return,
            };

            let mut chan_player = chan_player.lock().await;
            let _ = chan_player.queue.current.take();
            self.update(chan_player.deref_mut()).await;
        }
    }
}
