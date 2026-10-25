import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getStarters, HEAR_OPTIONS, type Hear } from "@/lib/prompts";
import { rankStories } from "@/lib/stories";
import { startRecorder, transcribe, type Recorder } from "@/lib/recorder";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pathmates — Find a story that feels like yours" },
      { name: "description", content: "A gentle, private way to find stories from people who have navigated cancer." },
      { property: "og:title", content: "Find a story that feels like yours" },
      { property: "og:description", content: "A gentle, private way to find stories from people who have navigated cancer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

const CANCER = ["Breast", "Lung", "Prostate", "Colorectal", "Blood (leukemia, lymphoma, myeloma)", "Skin", "Ovarian or cervical", "Other", "I'm not sure yet"];
const STAGE = ["Newly diagnosed", "Considering treatment", "In treatment", "After treatment", "Facing a recurrence"];
const TOPICS = ["Treatment", "Side effects", "Family", "Work", "Relationships", "Uncertainty", "Something else"];

const AGES = ["18–29", "30–39", "40–49", "50–59", "60–69", "70 or older"];

type Answers = { cancer?: string; age?: string; stage?: string; topic?: string; hear?: Hear; story: string };

function Choice({ label, selected, onClick, wide }: { label: string; selected: boolean; onClick: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-2xl border px-6 py-5 text-center text-lg leading-snug transition-all ${
        wide ? "sm:col-span-2" : ""
      } ${
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"
      }`}
    >
      {label}
    </button>
  );
}

function buildSummary(a: Answers) {
  const t = a.story.toLowerCase();
  const stageMap: Record<string, string> = {
    "Newly diagnosed": "Newly diagnosed",
    "Considering treatment": "Weighing treatment options",
    "In treatment": "In treatment",
    "After treatment": "Life after treatment",
    "Facing a recurrence": "Facing a recurrence",
  };
  let stage = a.stage ? stageMap[a.stage] : "";
  if (/start(ing)? treatment|begin(ning)? (chemo|treatment)/.test(t)) stage = "Starting treatment";
  const themes: string[] = [];
  if (/kid|child|son|daughter|parent/.test(t)) themes.push("parenting");
  if (/job|work|boss|career/.test(t)) themes.push("work");
  if (/partner|husband|wife|spouse|dating/.test(t)) themes.push("relationships");
  if (/nause|tired|fatigue|hair|pain|side effect/.test(t)) themes.push("side effects");
  if (/scared|afraid|worr|anx|unknown/.test(t) && themes.length === 0) themes.push("living with uncertainty");
  if (themes.length === 0 && a.topic && a.topic !== "Something else") themes.push(a.topic.toLowerCase());
  const when = stage && stage !== "In treatment" ? (stage.startsWith("Starting") || stage === "In treatment" ? " during treatment" : "") : stage === "In treatment" ? " during treatment" : "";
  const about = themes.length ? `${themes.join(" and ")}${when}` : "people who've been where I am";
  const parts = [stage, `looking for stories about ${about}`].filter(Boolean);
  const s = parts.join("; ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

function Onboarding() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({ story: "" });
  const [mode, setMode] = useState<"choose" | "type" | "record">("choose");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState("");
  const [summary, setSummary] = useState("");
  const [done, setDone] = useState(false);
  const recRef = useRef<Recorder | null>(null);
  const baseRef = useRef("");

  const total = 7;
  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const pick = (k: keyof Answers, v: string) => {
    setA((p) => ({ ...p, [k]: v }));
    setTimeout(next, 140); // long enough to see the selection land, short enough to feel direct
  };

  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!recording) return;
    setSecs(0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  useEffect(() => () => recRef.current?.cancel(), []);

  // Record, then send the audio to /api/transcribe (Meta Muse Voice Transcribe) when the patient stops.
  const startRecording = async () => {
    setMicError("");
    try {
      recRef.current = await startRecorder(() => void stopRecording());
      setRecording(true);
      setMode("record");
    } catch {
      setMicError("We couldn’t use your microphone. You can type your story instead.");
      setMode("type");
    }
  };
  const stopRecording = async () => {
    const rec = recRef.current;
    if (!rec) return;
    recRef.current = null;
    setRecording(false);
    setTranscribing(true);
    try {
      const wav = await rec.stop();
      const text = (await transcribe(wav)).trim();
      if (text) setA((p) => ({ ...p, story: p.story.trim() ? `${p.story.trim()} ${text}` : text }));
      else setMicError("We didn’t catch anything. Try again, or type instead.");
    } catch (err) {
      setMicError(err instanceof Error ? err.message : "Couldn’t transcribe that recording.");
    } finally {
      setTranscribing(false);
    }
  };

  const { prompts } = getStarters(a.stage, a.topic);
  const promptIntro =
    a.topic && a.topic !== "Something else"
      ? `You said ${a.topic.toLowerCase()} is on your mind. Try starting with:`
      : "Try starting with:";

  const addPrompt = (p: string) => {
    const nextText = a.story.trim() ? `${a.story.trim()} ${p}` : p;
    baseRef.current = nextText + " ";
    setA((prev) => ({ ...prev, story: nextText }));
  };

  const goReview = () => { setSummary(buildSummary(a)); next(); };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-lg italic"><img src="/pebble.svg" alt="" className="h-8 w-8" />Pathmates</span>
        {step > 0 && !done && (
          <div className="flex items-center gap-3" role="img" aria-label={`Step ${step} of ${total - 1}`}>
            <span className="text-xs tabular-nums text-muted-foreground">{step} of {total - 1}</span>
            <div className="flex gap-1.5">
              {Array.from({ length: total - 1 }).map((_, i) => (
                <span key={i} className={`progress-dot h-1.5 w-6 rounded-full ${i < step ? "bg-primary" : "bg-border"}`} />
              ))}
            </div>
          </div>
        )}
      </header>

      <section key={done ? "done" : step} className="animate-rise flex-1">
        {done ? (
          <Results
            summary={summary}
            answers={a}
            onHear={(h) => setA((p) => ({ ...p, hear: h }))}
            onEdit={() => setDone(false)}
          />
        ) : step === 0 ? (
          <div className="pt-12">
            <img src="/pebble.svg" alt="Pebble, a friendly stone character, waving hello" className="mb-6 h-40 w-auto" />
            <h1 className="text-4xl leading-tight">Let’s find a story that feels relevant to you.</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Share only what you’re comfortable with. Your answers stay private unless you later choose to share your story.
            </p>
            <button onClick={next} className="mt-10 rounded-full bg-primary px-8 py-3.5 font-medium text-primary-foreground transition hover:opacity-90">
              Begin
            </button>
          </div>
        ) : step === 1 ? (
          <Question title="What type of cancer are you navigating?" cols={2}>
            {CANCER.map((c) => <Choice key={c} label={c} selected={a.cancer === c} onClick={() => pick("cancer", c)} wide={c === CANCER[CANCER.length - 1]} />)}
          </Question>
        ) : step === 2 ? (
          <Question title="How old are you?" cols={2}>
            {AGES.map((c) => <Choice key={c} label={c} selected={a.age === c} onClick={() => pick("age", c)} />)}
          </Question>
        ) : step === 3 ? (
          <Question title="Where are you right now?">
            {STAGE.map((c) => <Choice key={c} label={c} selected={a.stage === c} onClick={() => pick("stage", c)} />)}
          </Question>
        ) : step === 4 ? (
          <Question title="What’s most on your mind today?">
            {TOPICS.map((c) => <Choice key={c} label={c} selected={a.topic === c} onClick={() => pick("topic", c)} />)}
          </Question>
        ) : step === 5 ? (
          <div>
            <h1 className="text-3xl leading-snug">Tell us what’s happening and what you’d like to hear from someone who has been there.</h1>
            <p className="mt-8 text-sm font-medium text-muted-foreground">{promptIntro}</p>
            <div className="mt-3 grid gap-2.5">
              {prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { addPrompt(p); if (mode === "choose") setMode("type"); }}
                  className="press rounded-2xl border border-border bg-card px-5 py-3.5 text-left text-base leading-snug hover:border-primary/50 hover:bg-accent/40"
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
                aria-label={recording ? "Stop recording" : "Start recording"}
                className={`mic press ${recording ? "mic-live" : ""}`}
              >
                {recording ? <span className="mic-stop" aria-hidden="true" /> : <MicIcon />}
              </button>
              <p className="min-h-6 text-sm text-muted-foreground" role="status" aria-live="polite">
                {recording ? <>Listening <span className="tabular-nums">{clock}</span> · tap to finish</>
                  : transcribing ? "Writing down what you said…"
                  : mode === "choose" ? "Tap to speak"
                  : "Tap to add more"}
              </p>
              {mode === "choose" && (
                <button type="button" onClick={() => setMode("type")} className="press text-sm underline underline-offset-4 hover:text-foreground">
                  I’d rather type
                </button>
              )}
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              If you record, your audio is sent to Meta for transcription. You can review and edit the text before continuing.
            </p>
            {micError && <p className="mt-3 text-center text-sm text-destructive" role="alert">{micError}</p>}

            {mode !== "choose" && (
              <>
                <textarea
                  autoFocus={mode === "type"}
                  value={a.story}
                  onChange={(e) => setA((p) => ({ ...p, story: e.target.value }))}
                  placeholder="I start treatment next week, and I’m worried about caring for my kids."
                  rows={6}
                  className="mt-6 w-full resize-none rounded-2xl border border-input bg-card p-4 text-base leading-relaxed outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={goReview}
                  disabled={!a.story.trim() || recording || transcribing}
                  className="mt-6 rounded-full bg-primary px-8 py-3.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-3xl">Here’s what we understood.</h1>
            <p className="mt-3 text-muted-foreground">Edit anything that doesn’t feel right.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {([["cancer", 1], ["age", 2], ["stage", 3], ["topic", 4]] as const).map(([k, s]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStep(s)}
                  className="press rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:border-primary/50"
                >
                  {a[k] ?? "Skipped"} <span className="ml-1 text-muted-foreground">Change</span>
                </button>
              ))}
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="mt-6 w-full resize-none rounded-2xl border border-input bg-accent/40 p-5 font-display text-xl leading-relaxed outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => setDone(true)} disabled={!summary.trim()} className="mt-8 w-full rounded-full bg-primary py-4 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40">
              Find stories
            </button>
          </div>
        )}
      </section>

      {step > 0 && !done && (
        <footer className="sticky-bar -mx-6 mt-10 flex items-center justify-between px-6 py-4 text-sm">
          <button onClick={back} className="press -ml-3 rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">← Back</button>
          {step >= 1 && step <= 4 && <button onClick={next} className="press -mr-3 rounded-full px-3 py-2 text-muted-foreground hover:text-foreground">Skip</button>}
        </footer>
      )}
    </main>
  );
}

function MicIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </svg>
  );
}

function Results({ summary, answers, onHear, onEdit }: { summary: string; answers: Answers; onHear: (h: Hear) => void; onEdit: () => void }) {
  const matches = rankStories({ ...answers, text: answers.story }, 3);
  return (
    <div>
      <div className="flex items-start gap-4">
        <img src="/pebble.svg" alt="" className="h-14 w-auto shrink-0" />
        <div>
          <h1 className="text-3xl leading-snug">Stories that may speak to you</h1>
          <p className="mt-2 text-muted-foreground">
            Based on: <span className="font-display italic text-foreground">{summary}</span>{" "}
            <button type="button" onClick={onEdit} className="press ml-1 text-sm underline underline-offset-4 hover:text-foreground">Edit</button>
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-2" role="group" aria-label="What kind of story">
        <span className="mr-1 text-sm text-muted-foreground">Show me</span>
        {HEAR_OPTIONS.map((h) => (
          <button
            key={h.key}
            type="button"
            aria-pressed={answers.hear === h.key}
            onClick={() => onHear(h.key)}
            className={`press chip rounded-full border px-4 py-2 text-sm ${
              answers.hear === h.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-4">
        {matches.map(({ story, reasons }, i) => (
          <li key={story.id} className="stagger" style={{ animationDelay: `${i * 60}ms` }}>
            <article className="story-card rounded-3xl border border-border bg-card p-6 sm:p-7">
              <p className="text-sm text-muted-foreground">
                {story.author} · {story.cancer} cancer · {story.stage.toLowerCase()}
              </p>
              <h2 className="mt-2 text-2xl leading-snug">{story.title}</h2>
              <p className="mt-3 leading-relaxed text-foreground/85">“{story.excerpt}”</p>

              <div className="mt-5 rounded-2xl bg-accent/50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-accent-foreground/80">Why this matched</p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-accent-foreground">
                  {reasons.length ? reasons.map((r) => <li key={r}>{r}</li>) : <li>A story from someone further along the path</li>}
                </ul>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{story.minutes} min read · Sample story</span>
                <button type="button" className="press rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Read story
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        These are shared experiences, not medical advice. Your answers stay private.
      </p>
    </div>
  );
}

function Question({ title, hint, children, cols = 1 }: { title: string; hint?: string; children: React.ReactNode; cols?: number }) {
  return (
    <div>
      <h1 className="text-3xl leading-snug">{title}</h1>
      {hint && <p className="mt-3 text-muted-foreground">{hint}</p>}
      <div className={`mt-8 grid gap-3 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>{children}</div>
    </div>
  );
}
