// Records the microphone and returns a mono, 16-bit PCM WAV at 16 kHz,
// the format Meta's /v1/asr/transcribe endpoint accepts.

const TARGET_RATE = 16000;
export const MAX_RECORD_SECONDS = 5 * 60; // the API caps uploads at 10 minutes / 32 MB

export type Recorder = { stop: () => Promise<Blob>; cancel: () => void };

export async function startRecorder(onLimit?: () => void): Promise<Recorder> {
  const Ctx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) throw new Error("Audio recording is unavailable in this browser.");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  const ctx: AudioContext = new Ctx();
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  let samples = 0;
  let finished = false;

  const release = () => {
    processor.onaudioprocess = null;
    try {
      source.disconnect();
      processor.disconnect();
    } catch {
      /* already disconnected */
    }
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };

  processor.onaudioprocess = (e) => {
    if (finished) return;
    chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    samples += e.inputBuffer.length;
    if (samples / ctx.sampleRate >= MAX_RECORD_SECONDS) onLimit?.();
  };
  source.connect(processor);
  processor.connect(ctx.destination); // required for onaudioprocess to fire in some browsers

  return {
    cancel: () => {
      finished = true;
      release();
    },
    stop: async () => {
      finished = true;
      const inRate = ctx.sampleRate;
      release();
      const merged = new Float32Array(samples);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      return encodeWav(resample(merged, inRate, TARGET_RATE), TARGET_RATE);
    },
  };
}

export function resample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const first = input[i0] ?? 0;
    const second = input[i1] ?? first;
    out[i] = first + (second - first) * (pos - i0);
  }
  return out;
}

export function encodeWav(pcm: Float32Array, rate: number): Blob {
  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + pcm.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i] ?? 0));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

/** Sends a WAV to our server route, which calls Meta with the secret key. */
export async function transcribe(wav: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", wav, "story.wav");
  let res: Response;
  try {
    res = await fetch("/api/transcribe", { method: "POST", body: form });
  } catch {
    throw new Error("Couldn’t transcribe that recording. Please try again or type instead.");
  }
  const data: unknown = await res.json().catch(() => null);
  const parsed =
    data && typeof data === "object" ? (data as { error?: unknown; transcript?: unknown }) : {};
  if (!res.ok) {
    throw new Error(
      typeof parsed.error === "string"
        ? parsed.error
        : "Couldn’t transcribe that recording. Please try again or type instead.",
    );
  }
  if (typeof parsed.transcript !== "string") {
    throw new Error("Couldn’t transcribe that recording. Please try again or type instead.");
  }
  return parsed.transcript;
}
