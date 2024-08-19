use poise::serenity_prelude as serenity;
use songbird::{Event, EventContext, EventHandler};
use std::future::Future;

#[derive(Clone)]
pub struct CustomEventHandler<A> {
    action: A,
}

impl<A> CustomEventHandler<A> {
    pub fn new(action: A) -> Self {
        Self { action }
    }
}

#[serenity::async_trait]
impl<R: Future<Output = ()> + Send, F: Fn() -> R + Send + Sync> EventHandler
    for CustomEventHandler<F>
{
    async fn act(&self, _: &EventContext<'_>) -> Option<Event> {
        (self.action)().await;
        None
    }
}
