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
        log::debug!("asdf");
        self.player.clone().remove_and_update().await;
        None
    }
}
