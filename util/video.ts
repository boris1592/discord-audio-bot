import { Readable } from "../deps.ts";

export type Video = {
  url: string;
  title: string;
  start: number | null;
};

export function format(video: Video): string {
  return `[${video.title}](${video.url})`;
}

export function createStream(
  video: Video,
): { stream: Readable; stop: () => void } {
  const args = [video.url]
    .concat(video.start ? ["--download-sections", `*${video.start}-inf`] : [])
    .concat(["-x", "--audio-format", "opus", "-o", "-"]);

  const command = new Deno.Command("./yt-dlp", {
    args,
    stdout: "piped",
  });
  const process = command.spawn();

  // This is horrible, but Deno.ChildProcess doesn't have a property that can be read at any moment
  let exited = false;
  process.status.then(() => exited = true);

  return {
    // deno-lint-ignore no-explicit-any -- node's Readable doesn't work properly with generics
    stream: Readable.fromWeb(process.stdout as any),
    stop: () => {
      if (!exited) process.kill();
    },
  };
}

export async function loadTitle(url: string): Promise<string | undefined> {
  const command = new Deno.Command("./yt-dlp", {
    args: [url, "--dump-json"],
  });
  const { code, stdout } = await command.output();

  if (code !== 0) return undefined;

  return JSON.parse(new TextDecoder().decode(stdout)).title;
}
