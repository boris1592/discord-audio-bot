use crate::{
    player::{Player, QueueEntry},
    util::extract_guild_and_channel,
};
use crate::{Context, Error};
use std::sync::Arc;

#[poise::command(slash_command)]
pub async fn play(ctx: Context<'_>, #[description = "link"] link: String) -> Result<(), Error> {
    // TODO: Just return Ok(()) so logs aren't polluted
    let (guild_id, channel_id) =
        extract_guild_and_channel(&ctx).ok_or("unable to get guild id or channel id")?;

    let manager = songbird::get(ctx.serenity_context())
        .await
        .ok_or("unable to get songbird")?;

    let mut players = ctx.data().players.lock().await;
    let player = match players.get(&guild_id) {
        Some(player) => player.clone(),
        None => {
            let player = Arc::new(Player::new(
                manager,
                guild_id,
                channel_id,
                ctx.data().http_client.clone(),
            ));
            players.insert(guild_id, player.clone());
            player
        }
    };

    ctx.defer().await?;
    // TODO: Properly handle possible errors
    let entry = QueueEntry::new(link.into(), ctx.data().http_client.clone()).await?;
    player.play(entry).await;

    ctx.say("starting to play").await?;
    Ok(())
}
