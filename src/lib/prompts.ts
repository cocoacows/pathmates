export const STAGES = [
  "Newly diagnosed",
  "Considering treatment",
  "In treatment",
  "After treatment",
  "Facing a recurrence",
] as const;

export const TOPIC_KEYS = ["Treatment", "Side effects", "Family", "Work", "Relationships", "Uncertainty"] as const;

export type Stage = (typeof STAGES)[number];
export type TopicKey = (typeof TOPIC_KEYS)[number];
export type Hear = "reassurance" | "practical" | "candid";

// Two starters per stage x topic: [situation, worry or moment].
const BY_STAGE_TOPIC: Record<Stage, Record<TopicKey, [string, string]>> = {
  "Newly diagnosed": {
    Treatment: [
      "I was just diagnosed, and what I don’t understand about treatment yet is…",
      "The question I keep coming back to is…",
    ],
    "Side effects": [
      "I was just diagnosed, and what scares me most about side effects is…",
      "What I wish someone would tell me about what it’s actually like is…",
    ],
    Family: [
      "I was just diagnosed, and telling my family has been…",
      "The person I’m most worried about telling is…",
    ],
    Work: [
      "I was just diagnosed, and at work I’m trying to figure out…",
      "What I don’t know how to tell my employer is…",
    ],
    Relationships: [
      "I was just diagnosed, and with the people closest to me, things feel…",
      "What I’m afraid will change between us is…",
    ],
    Uncertainty: [
      "I was just diagnosed, and the hardest part of not knowing is…",
      "The thought that keeps me up at night is…",
    ],
  },
  "Considering treatment": {
    Treatment: [
      "I’m deciding about treatment, and the choice I’m stuck on is…",
      "What I wish I could hear from someone who made this choice is…",
    ],
    "Side effects": [
      "I’m weighing my options, and the side effect I worry about most is…",
      "What would help me decide is knowing how it affected someone’s daily life…",
    ],
    Family: [
      "I’m deciding about treatment, and my family’s opinion is…",
      "What I’m weighing for the people who depend on me is…",
    ],
    Work: [
      "I’m deciding about treatment, and what it could mean for my work is…",
      "The scheduling question I can’t answer yet is…",
    ],
    Relationships: [
      "I’m deciding about treatment, and talking it through with the people close to me has been…",
      "What I’m afraid to ask them is…",
    ],
    Uncertainty: [
      "I’m deciding about treatment, and what I can’t stop second-guessing is…",
      "I’d like to hear how someone lived with a hard decision…",
    ],
  },
  "In treatment": {
    Treatment: [
      "I’m in the middle of treatment, and right now it feels like…",
      "What’s getting me through each round is…",
    ],
    "Side effects": [
      "I’m in treatment, and the side effect that’s hardest right now is…",
      "What I’ve tried so far is…",
    ],
    Family: [
      "I’m in treatment, and what’s hardest with my family is…",
      "What I haven’t known how to say to them is…",
    ],
    Work: [
      "I’m in treatment, and what I’m juggling with work is…",
      "What I wish my workplace understood is…",
    ],
    Relationships: [
      "I’m in treatment, and between me and the people close to me…",
      "What I wish they knew about how this feels is…",
    ],
    Uncertainty: [
      "I’m in treatment, and the waiting I find hardest is…",
      "On the bad days, what I do to get through is…",
    ],
  },
  "After treatment": {
    Treatment: [
      "My treatment is over, and what I’m still thinking about from it is…",
      "What I didn’t expect once it ended was…",
    ],
    "Side effects": [
      "My treatment is over, and what’s lingering in my body is…",
      "What I’m trying to get back to is…",
    ],
    Family: [
      "I’m finished with treatment, and at home things are…",
      "What my family and I are still working through is…",
    ],
    Work: [
      "I’m finished with treatment, and going back to work feels…",
      "What I wish people understood about coming back is…",
    ],
    Relationships: [
      "I’m finished with treatment, and my relationships feel…",
      "What changed between me and the people close to me is…",
    ],
    Uncertainty: [
      "I’m finished with treatment, and what scares me now is…",
      "The way I handle the days before a check-up is…",
    ],
  },
  "Facing a recurrence": {
    Treatment: [
      "My cancer has come back, and what I’m facing with treatment now is…",
      "What feels different this time is…",
    ],
    "Side effects": [
      "My cancer has come back, and what I dread about side effects is…",
      "What I remember from last time is…",
    ],
    Family: [
      "My cancer has come back, and telling my family again is…",
      "What I’m most worried about for the people who love me is…",
    ],
    Work: [
      "My cancer has come back, and what I’m figuring out at work this time is…",
      "What I wish I didn’t have to explain again is…",
    ],
    Relationships: [
      "My cancer has come back, and between me and the people close to me…",
      "What I need from them now that I didn’t before is…",
    ],
    Uncertainty: [
      "My cancer has come back, and the hardest part is…",
      "I’d like to hear how someone found steadiness the second time…",
    ],
  },
};

// Used when the stage was skipped but a topic was chosen.
const BY_TOPIC: Record<TopicKey, string[]> = {
  Treatment: ["The treatment I’m facing is…", "What I still want to understand is…"],
  "Side effects": ["The side effect that’s hardest right now is…", "What I’ve tried so far is…"],
  Family: ["The person I’m most worried about is…", "What I haven’t known how to say to my family is…"],
  Work: ["What I’m figuring out with work is…", "What I wish my employer understood is…"],
  Relationships: ["What’s changed between me and the people close to me is…", "What I’d like them to know is…"],
  Uncertainty: ["What I’m most unsure about is…", "On the hard days I cope by…"],
};

// Used for "Something else" or when the topic was skipped.
const FALLBACK = [
  "What I want to share is…",
  "What’s weighing on me most today is…",
  "What I’d like to hear from someone who’s been there is…",
];

export const HEAR_OPTIONS: { key: Hear; label: string; starter: string }[] = [
  { key: "reassurance", label: "Reassurance", starter: "I’d like to hear from someone who felt the way I do now, and…" },
  { key: "practical", label: "Practical experience", starter: "I’d like to know the small, practical things that helped, like…" },
  { key: "candid", label: "A candid account", starter: "I’d like an honest account, including the hard parts, of…" },
];

const isStage = (s?: string): s is Stage => !!s && (STAGES as readonly string[]).includes(s);
const isTopic = (t?: string): t is TopicKey => !!t && (TOPIC_KEYS as readonly string[]).includes(t);

/** Situation and worry starters for the free-recording step. */
export function getStarters(stage?: string, topic?: string): { prompts: string[]; showHear: boolean } {
  if (isTopic(topic)) {
    if (isStage(stage)) return { prompts: [...BY_STAGE_TOPIC[stage][topic]], showHear: true };
    return { prompts: BY_TOPIC[topic], showHear: true };
  }
  return { prompts: FALLBACK, showHear: false };
}
