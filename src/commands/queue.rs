use crate::{
    util::{reply_ok, try_get_guild_id},
    Context, Error,
};

#[poise::command(slash_command)]
pub async fn queue(ctx: Context<'_>) -> Result<(), Error> {
    let guild_id = match try_get_guild_id(&ctx).await? {
        Some(guild_id) => guild_id,
        None => return Ok(()),
    };
    let player = {
        let players = ctx.data().players.lock().await;
        players.get(&guild_id).map(|player| player.clone())
    };

    let (current, queue) = match player {
        Some(player) => player.get_queue().await,
        None => (None, vec![]),
    };

    let current_msg = match current {
        Some(entry) => format!("Currently playing: {}", entry.format()),
        None => "Nothing is being played.".into(),
    };
    let queue_msg = match queue.len() {
        0 => "Queue is empty.".into(),
        _ => format!(
            "Queue:\n{}",
            queue
                .iter()
                .enumerate()
                .map(|(index, entry)| format!("{}. {}", index + 1, entry.format()))
                .collect::<Vec<String>>()
                .join("\n")
        ),
    };
    let message = current_msg + "\n\n" + &queue_msg;

    reply_ok(&ctx, message).await?;
    Ok(())
}
