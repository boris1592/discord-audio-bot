use crate::{
    queue::QueueEntry,
    util::{reply_error, reply_ok, try_get_guild_id_and_channel},
    {Context, Error},
};

#[poise::command(slash_command)]
pub async fn play(
    ctx: Context<'_>,
    #[description = "YouTube video link"] link: String,
) -> Result<(), Error> {
    let (guild_id, channel_id) = match try_get_guild_id_and_channel(&ctx).await? {
        Some(tuple) => tuple,
        None => return Ok(()),
    };

    ctx.defer().await?;

    let entry = match QueueEntry::new(link, ctx.data().http_client.clone()).await {
        Ok(entry) => entry,
        Err(_) => {
            reply_error(&ctx, "Unable to load the video.").await?;
            return Ok(());
        }
    };

    ctx.data()
        .player
        .play(guild_id, channel_id, entry.clone())
        .await;

    reply_ok(&ctx, &format!("Added {} to the queue.", entry.format())).await?;
    Ok(())
}
