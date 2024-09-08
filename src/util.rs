use crate::{Context, Error};
use poise::serenity_prelude as serenity;
use poise::CreateReply;

pub async fn try_get_guild_id(ctx: &Context<'_>) -> Result<Option<serenity::GuildId>, Error> {
    if let Some(guild) = ctx.guild() {
        return Ok(Some(guild.id));
    }

    reply_error(ctx, "You must be in a guild to use this command.").await?;
    Ok(None)
}

pub async fn try_get_guild_id_and_channel(
    ctx: &Context<'_>,
) -> Result<Option<(serenity::GuildId, serenity::ChannelId)>, Error> {
    let guild_id = match try_get_guild_id(ctx).await? {
        Some(guild_id) => guild_id,
        None => return Ok(None),
    };

    if let Some(channel_id) = ctx
        .guild()
        .unwrap()
        .voice_states
        .get(&ctx.author().id)
        .and_then(|state| state.channel_id)
    {
        return Ok(Some((guild_id, channel_id)));
    }

    reply_error(ctx, "You must be in a voice channel to use this command.").await?;
    Ok(None)
}

pub async fn reply_error(ctx: &Context<'_>, message: impl Into<String>) -> Result<(), Error> {
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

pub async fn reply_ok(ctx: &Context<'_>, message: impl Into<String>) -> Result<(), Error> {
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
