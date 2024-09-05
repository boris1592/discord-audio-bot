use crate::{
    queue::Queue,
    util::{reply_ok, try_get_guild_id},
    Context, Error,
};

#[poise::command(slash_command)]
pub async fn queue(ctx: Context<'_>) -> Result<(), Error> {
    let guild_id = match try_get_guild_id(&ctx).await? {
        Some(guild_id) => guild_id,
        None => return Ok(()),
    };
    let queue = match ctx.data().player.get_queue(guild_id).await {
        Some(queue) => queue,
        None => Queue::default(),
    };

    let current_msg = match queue.current {
        Some(entry) => format!("Currently playing: {}", entry.0.format()),
        None => "Nothing is being played.".into(),
    };

    let queue_msg = match queue.queue.len() {
        0 => "Queue is empty.".into(),
        _ => format!(
            "Queue:\n{}",
            queue
                .queue
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
