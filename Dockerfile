FROM denoland/deno:1.45.4

RUN apt update && apt install -y ffmpeg yt-dlp

WORKDIR /bot

COPY src/deps.ts src/deps.ts
RUN deno cache src/deps.ts

COPY . .
RUN deno cache src/main.ts

CMD ["deno", "run", "--allow-env", "--allow-read", "--allow-ffi", "--allow-net", "--allow-run", "src/main.ts"]
