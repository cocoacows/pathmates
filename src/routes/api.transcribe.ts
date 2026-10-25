import { createFileRoute } from "@tanstack/react-router";

// Server-side proxy to Meta's Muse Voice Transcribe (POST /v1/asr/transcribe).
// The API key stays on the server: set MODEL_API_KEY (and optionally ASR_MODEL) in the environment.
// Audio is forwarded and never stored or logged here.

const MAX_BYTES = 30 * 1024 * 1024;
const MAX_SECONDS = 10 * 60;

async function serverSecret(name: string): Promise<string | undefined> {
  // Cloudflare can supply project secrets as Worker bindings. Local development
  // and other hosts can still use process.env.
  let workerAccess: "unavailable" | "missing" = "unavailable";
  try {
    const moduleName = "cloudflare:workers";
    const { env } = (await import(/* @vite-ignore */ moduleName)) as {
      env?: Record<string, string>;
    };
    if (env) {
      workerAccess = "missing";
      if (env[name]) return env[name];
    }
  } catch {
    // The cloudflare:workers module is not available in local Node.js development.
  }
  const value = process.env[name];
  if (!value && name === "MODEL_API_KEY")
    console.warn("Transcription secret unavailable", { workerAccess });
  return value;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function isSupportedWav(audio: Blob): Promise<boolean> {
  if (audio.size < 44) return false;
  const bytes = await audio.slice(0, 44).arrayBuffer();
  const view = new DataView(bytes);
  const label = (start: number, length: number) =>
    String.fromCharCode(...new Uint8Array(bytes, start, length));
  const rate = view.getUint32(24, true);
  const dataBytes = view.getUint32(40, true);
  return (
    label(0, 4) === "RIFF" &&
    label(8, 4) === "WAVE" &&
    label(12, 4) === "fmt " &&
    label(36, 4) === "data" &&
    view.getUint16(20, true) === 1 &&
    view.getUint16(22, true) === 1 &&
    (rate === 16000 || rate === 24000) &&
    view.getUint16(34, true) === 16 &&
    dataBytes > 0 &&
    dataBytes <= audio.size - 44 &&
    dataBytes / (rate * 2) <= MAX_SECONDS
  );
}

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return json({ error: "This recording request isn’t allowed." }, 403);
        }
        const key = await serverSecret("MODEL_API_KEY");
        if (!key)
          return json(
            { error: "Voice transcription isn’t set up yet. You can type your story instead." },
            501,
          );

        const contentLength = Number(request.headers.get("content-length"));
        if (contentLength > MAX_BYTES + 1024) {
          return json({ error: "That recording is too long. Try a shorter one." }, 413);
        }

        let audio: FormDataEntryValue | null;
        try {
          audio = (await request.formData()).get("audio");
        } catch {
          return json({ error: "Couldn’t read that recording." }, 400);
        }
        if (!(audio instanceof Blob) || audio.size === 0)
          return json({ error: "No audio received." }, 400);
        if (audio.size > MAX_BYTES)
          return json({ error: "That recording is too long. Try a shorter one." }, 413);
        if (!(await isSupportedWav(audio)))
          return json(
            { error: "That recording format isn’t supported. Try again or type instead." },
            400,
          );

        const form = new FormData();
        form.append(
          "request",
          new Blob(
            [
              JSON.stringify({
                mode: "PUSH_TO_TALK",
                model: (await serverSecret("ASR_MODEL")) ?? "muse-voice-transcribe-1.0",
                audioEncoding: "WAV",
              }),
            ],
            { type: "application/json" },
          ),
        );
        form.append("audio", audio, "story.wav");

        let res: Response;
        try {
          res = await fetch("https://api.meta.ai/v1/asr/transcribe", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
            body: form,
          });
        } catch {
          return json(
            { error: "Couldn’t reach transcription. Please try again or type instead." },
            502,
          );
        }
        if (!res.ok) {
          console.error("transcribe failed", res.status);
          return json(
            {
              error:
                res.status === 429
                  ? "Lots of people are recording right now. Please try again in a moment."
                  : "Couldn’t transcribe that recording. You can type instead.",
            },
            res.status === 429 ? 429 : 502,
          );
        }
        try {
          const data = (await res.json()) as { transcript?: unknown };
          if (typeof data.transcript !== "string") throw new Error("Missing transcript");
          return json({ transcript: data.transcript });
        } catch {
          return json(
            { error: "Couldn’t read the transcript. Please try again or type instead." },
            502,
          );
        }
      },
    },
  },
});
