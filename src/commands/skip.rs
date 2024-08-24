use crate::{
    util::{reply_error, reply_ok, try_get_guild_id},
    {Context, Error},
};

#[poise::command(slash_command)]
pub async fn skip(ctx: Context<'_>) -> Result<(), Error> {
    let guild_id = match try_get_guild_id(&ctx).await? {
        Some(guild_id) => guild_id,
        None => return Ok(()),
    };
    let player = {
        let players = ctx.data().players.lock().await;
        players.get(&guild_id).map(|player| player.clone())
    };
    let player = match player {
        Some(player) => player,
        None => {
            reply_error(&ctx, "Not playing.").await?;
            return Ok(());
        }
    };

    if let None = player.get_queue().await.current {
        reply_error(&ctx, "Not playing").await?;
        return Ok(());
    }

    player.skip().await;

    reply_ok(&ctx, "Skipped.").await?;
    return Ok(());
}
