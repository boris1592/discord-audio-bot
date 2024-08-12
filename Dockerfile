FROM rust:1.80 AS builder
RUN apt update && apt install -y libopus-dev
WORKDIR discord-bot
COPY . .
RUN cargo install --path .

FROM debian:12.6
RUN apt update && apt install -y ffmpeg yt-dlp
WORKDIR discord-bot
COPY --from=builder /usr/local/cargo/bin/discord-audio-bot ./
CMD ["./discord-audio-bot"]
