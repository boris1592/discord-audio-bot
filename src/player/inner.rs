use crate::{handler::CustomEventHandler, queue::Queue};
use poise::serenity_prelude as serenity;
use reqwest::Client as HttpClient;
use songbird::{input::YoutubeDl, CoreEvent, Event, Songbird, TrackEvent};
use std::{collections::HashMap, future::Future, ops::DerefMut, sync::Arc};
use tokio::sync::Mutex;

pub struct ChannelPlayer {
    pub guild_id: serenity::GuildId,
    pub channel_id: serenity::ChannelId,
    pub queue: Queue,
}

pub struct PlayerInner {
    pub manager: Arc<Songbird>,
    pub http_client: HttpClient,
    pub players: Mutex<HashMap<serenity::GuildId, Arc<Mutex<ChannelPlayer>>>>,
}

impl PlayerInner {
    pub async fn update(self: &Arc<Self>, player: &mut ChannelPlayer) {
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

                let clone = self.clone();
                let guild_id = player.guild_id;
                let disconnect_handler = CustomEventHandler::new(move || {
                    let player = clone.clone();

                    async move {
                        let _ = player.manager.remove(guild_id).await;
                        player.players.lock().await.remove(&guild_id);
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

        // This closure needs to outlive 'static because of the method requirements
        // therefore we cannot just borrow self here since it's not 'static. That's why
        // we need a pointer here.
        //
        // Not only that, but we need a weak pointer, because of a possible loop:
        // self -> players -> current -> track -> end_handler -> closure -> self
        let clone = Arc::downgrade(self);
        let guild_id = player.guild_id;
        let end_handler = CustomEventHandler::new(move || {
            let player = clone.clone();

            async move {
                let player = match player.upgrade() {
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
