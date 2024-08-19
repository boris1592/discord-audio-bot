use crate::{
    player::{Player, QueueEntry},
    util::{reply_error, reply_ok, try_get_guild_id_and_channel},
    {Context, Error},
};
use std::sync::Arc;

#[poise::command(slash_command)]
pub async fn play(
    ctx: Context<'_>,
    #[description = "YouTube video link"] link: String,
) -> Result<(), Error> {
    let (guild_id, channel_id) = match try_get_guild_id_and_channel(&ctx).await? {
        Some(tuple) => tuple,
        None => return Ok(()),
    };

    let manager = songbird::get(ctx.serenity_context())
        .await
        .ok_or("unable to get songbird")?;

    let player = {
        let mut players = ctx.data().players.lock().await;

        match players.get(&guild_id) {
            Some(player) => player.clone(),
            None => {
                let player = Arc::new(Player::new(
                    guild_id,
                    channel_id,
                    manager,
                    ctx.data().clone(),
                ));
                players.insert(guild_id, player.clone());
                player
            }
        }
    };

    ctx.defer().await?;

    let entry = match QueueEntry::new(link.into(), ctx.data().http_client.clone()).await {
        Ok(entry) => entry,
        Err(_) => {
            reply_error(&ctx, "Unable to load the video.").await?;
            return Ok(());
        }
    };
    player.play(entry.clone()).await;

    reply_ok(&ctx, &format!("Added {} to the queue.", entry.format())).await?;
    Ok(())
}
