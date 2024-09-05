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

    match ctx.data().player.skip(guild_id).await {
        Ok(_) => reply_ok(&ctx, "Skipped.").await,
        Err(_) => reply_error(&ctx, "Not playing.").await,
    }
}
