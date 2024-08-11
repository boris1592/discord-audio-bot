use crate::Context;
use poise::serenity_prelude as serenity;

pub fn extract_guild_and_channel(
    ctx: &Context<'_>,
) -> Option<(serenity::GuildId, serenity::ChannelId)> {
    // TODO: send an error message
    let guild = ctx.guild()?;
    let channel_id = guild
        .voice_states
        .get(&ctx.author().id)
        .and_then(|state| state.channel_id)?;

    Some((guild.id, channel_id))
}
