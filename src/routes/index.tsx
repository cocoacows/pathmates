import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getStarters, HEAR_OPTIONS, type Hear } from "@/lib/prompts";
import { rankStories } from "@/lib/stories";

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

type Answers = { cancer?: string; stage?: string; topic?: string; hear?: Hear; story: string };

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
  const baseRef = useRef("");

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
    baseRef.current = a.story ? a.story + " " : "";
    r.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setA((p) => ({ ...p, story: baseRef.current + txt }));
    };
    r.onend = () => setRecording(false);
    recRef.current = r; r.start(); setRecording(true); setMode("record");
  };
  const stopRecording = () => { recRef.current?.stop(); setRecording(false); };

  const { prompts, showHear } = getStarters(a.stage, a.topic);
  const promptIntro =
    a.topic && a.topic !== "Something else"
      ? `You said ${a.topic.toLowerCase()} is on your mind. Try starting with:`
      : "Try starting with:";

  const addPrompt = (p: string, hear?: Hear) => {
    const nextText = a.story.trim() ? `${a.story.trim()} ${p}` : p;
    baseRef.current = nextText + " ";
    setA((prev) => ({ ...prev, story: nextText, ...(hear ? { hear } : {}) }));
  };

  const goReview = () => { setSummary(buildSummary(a)); next(); };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-lg italic"><img src="/pebble.svg" alt="" className="h-8 w-8" />Pathmates</span>
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
                  <div className="mt-6">
                    <div className="flex items-center gap-3">
                      {recording ? (
                        <button onClick={stopRecording} className="flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm text-destructive-foreground">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive-foreground" />Listening — tap to stop
                        </button>
                      ) : (
                        <button onClick={startRecording} className="rounded-full border border-border px-5 py-2.5 text-sm">Record more</button>
                      )}
                    </div>
                    <p className="mt-7 text-sm font-medium text-muted-foreground">{promptIntro}</p>
                    <div className="mt-3 grid gap-2.5">
                      {prompts.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => addPrompt(p)}
                          className="rounded-2xl border border-border bg-card px-5 py-3.5 text-left text-base leading-snug transition hover:border-primary/50 hover:bg-accent/40"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    {showHear && (
                      <>
                        <p className="mt-6 text-sm font-medium text-muted-foreground">And what would help most to hear?</p>
                        <div className="mt-3 flex flex-wrap gap-2.5">
                          {HEAR_OPTIONS.map((h) => (
                            <button
                              key={h.key}
                              type="button"
                              aria-pressed={a.hear === h.key}
                              onClick={() => addPrompt(h.starter, h.key)}
                              className={`rounded-full border px-5 py-2.5 text-base transition ${
                                a.hear === h.key
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"
                              }`}
                            >
                              {h.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
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

function Results({ summary, answers, onHear, onEdit }: { summary: string; answers: Answers; onHear: (h: Hear) => void; onEdit: () => void }) {
  const matches = rankStories({ cancer: answers.cancer, stage: answers.stage, topic: answers.topic, hear: answers.hear, text: answers.story }, 3);
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

function Question({ title, children, cols = 1 }: { title: string; children: React.ReactNode; cols?: number }) {
  return (
    <div>
      <h1 className="text-3xl leading-snug">{title}</h1>
      <div className={`mt-8 grid gap-3 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>{children}</div>
    </div>
  );
}
