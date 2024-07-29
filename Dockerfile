FROM denoland/deno:1.45.2

RUN apt-get update && apt-get install -y ffmpeg curl

WORKDIR /bot

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./yt-dlp
RUN chmod a+rx ./yt-dlp

COPY deps.ts .
RUN deno cache deps.ts

COPY . .
RUN deno cache main.ts

CMD ["deno", "run", "--allow-env", "--allow-read", "--allow-ffi", "--allow-net", "--allow-run", "main.ts"]
