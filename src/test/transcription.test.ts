// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/api.transcribe";
import { encodeWav, resample, transcribe } from "@/lib/recorder";

const post = (
  Route.options.server?.handlers as { POST: (args: { request: Request }) => Promise<Response> }
).POST;

function wavFile(): Blob {
  return new Blob([encodeWav(new Float32Array([0, 0.5, -0.5]), 16000)], { type: "audio/wav" });
}

function upload(audio: Blob, origin = "http://localhost:3000"): Request {
  const body = new FormData();
  body.append("audio", audio, "story.wav");
  return new Request("http://localhost:3000/api/transcribe", {
    method: "POST",
    headers: { Origin: origin },
    body,
  });
}

describe("Meta transcription route", () => {
  beforeEach(() => {
    vi.stubEnv("MODEL_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends a valid WAV to Meta with server-side authorization and returns the transcript", async () => {
    const meta = vi.fn().mockResolvedValue(Response.json({ transcript: "My story" }));
    vi.stubGlobal("fetch", meta);

    const response = await post({ request: upload(wavFile()) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ transcript: "My story" });
    expect(meta).toHaveBeenCalledOnce();
    const [url, init] = meta.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.meta.ai/v1/asr/transcribe");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-key" });
    const sent = init.body as FormData;
    expect(JSON.parse(await (sent.get("request") as Blob).text())).toMatchObject({
      model: "muse-voice-transcribe-1.0",
      mode: "PUSH_TO_TALK",
      audioEncoding: "WAV",
    });
    expect((sent.get("audio") as Blob).size).toBeGreaterThan(44);
  });

  it("rejects a non-WAV recording before calling Meta", async () => {
    const meta = vi.fn();
    vi.stubGlobal("fetch", meta);

    const response = await post({
      request: upload(new Blob(["not a wav"], { type: "audio/wav" })),
    });

    expect(response.status).toBe(400);
    expect(meta).not.toHaveBeenCalled();
  });

  it("does not call Meta when the server key is missing", async () => {
    vi.stubEnv("MODEL_API_KEY", "");
    const meta = vi.fn();
    vi.stubGlobal("fetch", meta);

    const response = await post({ request: upload(wavFile()) });

    expect(response.status).toBe(501);
    expect(meta).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request before calling Meta", async () => {
    const meta = vi.fn();
    vi.stubGlobal("fetch", meta);

    const response = await post({ request: upload(wavFile(), "https://another-site.example") });

    expect(response.status).toBe(403);
    expect(meta).not.toHaveBeenCalled();
  });

  it("returns a friendly error when Meta cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const response = await post({ request: upload(wavFile()) });

    expect(response.status).toBe(502);
    expect((await response.json()).error).toMatch(/type instead/i);
  });
});

describe("WAV encoding", () => {
  it("writes mono 16-bit PCM at 16 kHz with the correct sample count", async () => {
    const wav = encodeWav(new Float32Array([-1, 0, 1]), 16000);
    const view = new DataView(await wav.arrayBuffer());
    expect(wav.size).toBe(50);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getInt16(44, true)).toBe(-32768);
    expect(view.getInt16(46, true)).toBe(0);
    expect(view.getInt16(48, true)).toBe(32767);
  });

  it("resamples 48 kHz to 16 kHz without changing duration", () => {
    const samples = new Float32Array(48000);
    expect(resample(samples, 48000, 16000)).toHaveLength(16000);
  });
});

describe("client transcription upload", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns a friendly error for an invalid success response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));

    await expect(transcribe(encodeWav(new Float32Array([0]), 16000))).rejects.toThrow(
      /couldn’t transcribe/i,
    );
  });

  it("returns a friendly error when the upload fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    await expect(transcribe(encodeWav(new Float32Array([0]), 16000))).rejects.toThrow(
      /couldn’t transcribe/i,
    );
  });
});
