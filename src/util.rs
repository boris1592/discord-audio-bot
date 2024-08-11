use crate::{Context, Error};
use poise::serenity_prelude as serenity;
use poise::CreateReply;

pub async fn extract_guild_and_channel(
    ctx: &Context<'_>,
) -> Result<Option<(serenity::GuildId, serenity::ChannelId)>, Error> {
    if let Some(guild) = ctx.guild() {
        if let Some(channel_id) = guild
            .voice_states
            .get(&ctx.author().id)
            .and_then(|state| state.channel_id)
        {
            return Ok(Some((guild.id, channel_id)));
        }
    }

    reply_error(
        &ctx,
        "You must be in a voice channel in order to use this command.",
    )
    .await?;
    Ok(None)
}

pub async fn reply_error(ctx: &Context<'_>, message: &str) -> Result<(), Error> {
    ctx.send(
        CreateReply::default().ephemeral(true).embed(
            serenity::CreateEmbed::new()
                .color(0xe74c3c)
                .description(message),
        ),
    )
    .await?;
    Ok(())
}

pub async fn reply_ok(ctx: &Context<'_>, message: &str) -> Result<(), Error> {
    ctx.send(
        CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .color(0x2ecc71)
                .description(message),
        ),
    )
    .await?;
    Ok(())
}
