use crate::player::Player;
use poise::serenity_prelude as serenity;
use songbird::{Event, EventContext, EventHandler};
use std::sync::Arc;

#[derive(Clone)]
pub struct TrackEndHandler {
    player: Arc<Player>,
}

impl TrackEndHandler {
    pub fn new(player: Arc<Player>) -> Self {
        Self { player }
    }
}

#[serenity::async_trait]
impl EventHandler for TrackEndHandler {
    async fn act(&self, _: &EventContext<'_>) -> Option<Event> {
        self.player.clone().remove_current().await;
        None
    }
}

pub struct DisconnectHandler {
    player: Arc<Player>,
}

impl DisconnectHandler {
    pub fn new(player: Arc<Player>) -> Self {
        Self { player }
    }
}

#[serenity::async_trait]
impl EventHandler for DisconnectHandler {
    async fn act(&self, _: &EventContext<'_>) -> Option<Event> {
        self.player.clone().clear().await;
        None
    }
}
