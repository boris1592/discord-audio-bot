import { Readable } from "../deps.ts";

export type Video = {
  url: string;
  title: string;
};

export function format(video: Video): string {
  return `[${video.title}](${video.url})`;
}

export function createStream(url: string): Readable {
  const command = new Deno.Command("./yt-dlp", {
    args: [url, "-x", "--audio-format", "opus", "-o", "-"],
    stdout: "piped",
  });

  // deno-lint-ignore no-explicit-any -- node's Readable doesn't work properly with generics
  return Readable.fromWeb(command.spawn().stdout as any);
}

export async function loadTitle(url: string): Promise<string | undefined> {
  const command = new Deno.Command("./yt-dlp", {
    args: [url, "--dump-json"],
  });
  const { code, stdout } = await command.output();

  if (code !== 0) return undefined;

  return JSON.parse(new TextDecoder().decode(stdout)).title;
}
