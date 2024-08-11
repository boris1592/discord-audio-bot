use crate::util::extract_guild_and_channel;
use crate::{Context, Error};

#[poise::command(slash_command)]
pub async fn skip(ctx: Context<'_>) -> Result<(), Error> {
    // TODO: Return Ok(()) so logs aren't polluted
    let (guild_id, channel_id) =
        extract_guild_and_channel(&ctx).ok_or("unable to guild id or channel id")?;
    let players = ctx.data().players.lock().await;
    // TODO: Handle properly
    let player = players.get(&guild_id).ok_or("not playing")?;

    player.skip().await;
    ctx.say("skipped").await?;

    Ok(())
}
