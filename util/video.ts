import { Readable } from "../deps.ts";

export type Video = {
  url: string;
  title: string;
  start: number | null;
};

export function format(video: Video) {
  return `[${video.title}](${video.url})`;
}

export function createStream(video: Video): Readable {
  const args = [video.url]
    .concat(video.start ? ["--download-sections", `*${video.start}-inf`] : [])
    .concat(["-x", "--audio-format", "opus", "-o", "-"]);

  const command = new Deno.Command("./yt-dlp", {
    args,
    stdout: "piped",
  });

  // Let's just hope yt-dlp will exit on its own at some point.
  // yt-dlp hasn't yet merged a PR that would allow us to kill
  // ffmpeg spawned by yt-dlp manually. Therefore killing yt-dlp
  // is pointless since ffmpeg will still run.
  //
  // Issue I found: https://github.com/yt-dlp/yt-dlp/issues/7599
  // PR mentioned above and in the issue: https://github.com/yt-dlp/yt-dlp/pull/2475
  const process = command.spawn();

  // deno-lint-ignore no-explicit-any -- node's Readable doesn't work properly with generics
  return Readable.fromWeb(process.stdout as any);
}

export async function loadTitle(url: string): Promise<string | undefined> {
  const command = new Deno.Command("./yt-dlp", {
    args: [url, "--dump-json"],
  });
  const { code, stdout } = await command.output();

  if (code !== 0) return undefined;

  return JSON.parse(new TextDecoder().decode(stdout)).title;
}
