import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find a story that feels like yours" },
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

type Answers = { cancer?: string; stage?: string; topic?: string; story: string };

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
  const [summary, setSummary] = useState("");
  const [done, setDone] = useState(false);
  const recRef = useRef<any>(null);

  const total = 6;
  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const pick = (k: keyof Answers, v: string) => {
    setA((p) => ({ ...p, [k]: v }));
    setTimeout(next, 220);
  };

  useEffect(() => () => recRef.current?.stop?.(), []);

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setMode("type"); return; }
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = "en-US";
    const base = a.story ? a.story + " " : "";
    r.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setA((p) => ({ ...p, story: base + txt }));
    };
    r.onend = () => setRecording(false);
    recRef.current = r; r.start(); setRecording(true); setMode("record");
  };
  const stopRecording = () => { recRef.current?.stop(); setRecording(false); };

  const goReview = () => { setSummary(buildSummary(a)); next(); };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <span className="font-display text-lg italic">Been There</span>
        {step > 0 && !done && (
          <div className="flex gap-1.5" aria-label={`Step ${step} of ${total - 1}`}>
            {Array.from({ length: total - 1 }).map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i < step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        )}
      </header>

      <section key={done ? "done" : step} className="animate-rise flex-1">
        {done ? (
          <div className="pt-10 text-center">
            <h1 className="text-3xl">Finding stories for you…</h1>
            <p className="mt-4 text-muted-foreground">“{summary}”</p>
          </div>
        ) : step === 0 ? (
          <div className="pt-12">
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
            {CANCER.map((c) => <Choice key={c} label={c} selected={a.cancer === c} onClick={() => pick("cancer", c)} wide={c === "I’m not sure yet"} />)}
          </Question>
        ) : step === 2 ? (
          <Question title="Where are you right now?">
            {STAGE.map((c) => <Choice key={c} label={c} selected={a.stage === c} onClick={() => pick("stage", c)} />)}
          </Question>
        ) : step === 3 ? (
          <Question title="What’s most on your mind today?">
            {TOPICS.map((c) => <Choice key={c} label={c} selected={a.topic === c} onClick={() => pick("topic", c)} />)}
          </Question>
        ) : step === 4 ? (
          <div>
            <h1 className="text-3xl leading-snug">Tell us what’s happening and what you’d like to hear from someone who has been there.</h1>
            {mode === "choose" ? (
              <>
                <p className="mt-4 text-muted-foreground italic">For example: “I start treatment next week, and I’m worried about caring for my kids.”</p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <button onClick={startRecording} className="rounded-2xl bg-primary p-6 text-primary-foreground transition hover:opacity-90">
                    <div className="mx-auto mb-2 h-3 w-3 rounded-full bg-primary-foreground" />Record
                  </button>
                  <button onClick={() => setMode("type")} className="rounded-2xl border border-border bg-card p-6 transition hover:bg-accent/40">
                    Type instead
                  </button>
                </div>
              </>
            ) : (
              <>
                {mode === "record" && (
                  <div className="mt-6 flex items-center gap-3">
                    {recording ? (
                      <button onClick={stopRecording} className="flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm text-destructive-foreground">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-destructive-foreground" />Listening — tap to stop
                      </button>
                    ) : (
                      <button onClick={startRecording} className="rounded-full border border-border px-5 py-2.5 text-sm">Record more</button>
                    )}
                  </div>
                )}
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
                  disabled={!a.story.trim() || recording}
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
        <footer className="mt-10 flex justify-between text-sm text-muted-foreground">
          <button onClick={back} className="hover:text-foreground">← Back</button>
          {step >= 1 && step <= 3 && <button onClick={next} className="hover:text-foreground">Skip</button>}
        </footer>
      )}
    </main>
  );
}

function Question({ title, children, cols = 1 }: { title: string; children: React.ReactNode; cols?: number }) {
  return (
    <div>
      <h1 className="text-3xl leading-snug">{title}</h1>
      <div className={`mt-8 grid gap-3 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>{children}</div>
    </div>
  );
}
