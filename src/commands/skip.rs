use crate::util::{extract_guild_and_channel, reply_error, reply_ok};
use crate::{Context, Error};

#[poise::command(slash_command)]
pub async fn skip(ctx: Context<'_>) -> Result<(), Error> {
    let (guild_id, _) = match extract_guild_and_channel(&ctx).await? {
        Some(tuple) => tuple,
        None => return Ok(()),
    };
    let players = ctx.data().players.lock().await;

    match players.get(&guild_id) {
        Some(player) => {
            if let None = player.get_queue().await.0 {
                reply_error(&ctx, "Not playing").await?;
                return Ok(());
            }

            player.skip().await;
            reply_ok(&ctx, "Skipped.").await?;
            return Ok(());
        }
        None => {
            reply_error(&ctx, "Not playing.").await?;
            return Ok(());
        }
    };
}
