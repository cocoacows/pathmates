import type { Hear } from "@/lib/prompts";

// SAMPLE DATA: fictional placeholder stories for the prototype UI.
export type Story = {
  id: string;
  title: string;
  author: string;
  cancer: string;
  stage: string;
  themes: string[];
  style: Hear;
  excerpt: string;
  minutes: number;
};

export const STORIES: Story[] = [
  {
    id: "lunches",
    title: "Packing lunches between infusions",
    author: "Maya, 38",
    cancer: "Breast",
    stage: "In treatment",
    themes: ["parenting", "family", "side effects"],
    style: "practical",
    excerpt:
      "I thought I had to hide it from my kids. What actually helped was a Sunday routine, one honest sentence a day, and letting my sister take over the school run on the hard weeks.",
    minutes: 6,
  },
  {
    id: "first-scan",
    title: "The week before my first scan",
    author: "Daniel, 52",
    cancer: "Colorectal",
    stage: "Newly diagnosed",
    themes: ["uncertainty", "waiting"],
    style: "reassurance",
    excerpt:
      "Nobody tells you the waiting is its own kind of tired. I wrote my worries on index cards, read them out loud to my wife, and slept better that night than I had in a month.",
    minutes: 4,
  },
  {
    id: "back-to-work",
    title: "I went back to work too soon, and that's okay",
    author: "Priya, 44",
    cancer: "Blood",
    stage: "After treatment",
    themes: ["work", "uncertainty"],
    style: "candid",
    excerpt:
      "My first week back I cried in the supply closet. I'm not going to tell you it was easy. I'll tell you what I asked for in the second month, and what I stopped apologizing for.",
    minutes: 7,
  },
  {
    id: "telling-twice",
    title: "Telling my daughters, twice",
    author: "Lena, 47",
    cancer: "Ovarian",
    stage: "Facing a recurrence",
    themes: ["parenting", "family"],
    style: "candid",
    excerpt:
      "The first time I rehearsed. The second time I just sat on the edge of the bed and said it badly. They remember that more kindly than anything I'd practiced.",
    minutes: 5,
  },
  {
    id: "fatigue",
    title: "What I wish I'd known about fatigue",
    author: "Tom, 61",
    cancer: "Lung",
    stage: "In treatment",
    themes: ["side effects", "work"],
    style: "practical",
    excerpt:
      "It isn't tired like a long day. I started planning my week around one good hour, and I stopped treating rest as something I had to earn.",
    minutes: 5,
  },
  {
    id: "deciding-slowly",
    title: "Deciding slowly",
    author: "Rosa, 56",
    cancer: "Breast",
    stage: "Considering treatment",
    themes: ["treatment", "uncertainty", "relationships"],
    style: "reassurance",
    excerpt:
      "Everyone wanted me to decide fast. I took the time I was allowed, talked it through with my husband on long walks, and I've made peace with how I chose.",
    minutes: 6,
  },
];

export type Match = { story: Story; reasons: string[]; score: number };

const THEME_PATTERNS: [string, RegExp][] = [
  ["parenting", /kid|child|son\b|daughter|parent|mom|dad/],
  ["work", /job|work|boss|career|employer/],
  ["relationships", /partner|husband|wife|spouse|dating/],
  ["side effects", /nause|tired|fatigue|hair|pain|side effect/],
  ["uncertainty", /scared|afraid|worr|anx|unknown|not knowing|waiting/],
  ["treatment", /treatment|chemo|radiation|surgery/],
  ["family", /family|sister|brother|mother|father/],
];

export function detectThemes(topic: string | undefined, text: string): string[] {
  const t = text.toLowerCase();
  const found = THEME_PATTERNS.filter(([, re]) => re.test(t)).map(([k]) => k);
  if (topic && topic !== "Something else") found.push(topic.toLowerCase());
  return [...new Set(found)];
}

const STYLE_LABEL: Record<Hear, string> = {
  reassurance: "Reassuring, as you asked",
  practical: "Practical, as you asked",
  candid: "Candid, as you asked",
};

export function rankStories(input: { cancer?: string; stage?: string; topic?: string; hear?: Hear; text: string }, limit = 3): Match[] {
  const themes = detectThemes(input.topic, input.text);
  const cancerKey = input.cancer?.split(" ")[0];
  return STORIES.map((story) => {
    const reasons: string[] = [];
    let score = 0;
    if (input.stage && story.stage === input.stage) {
      score += 3;
      reasons.push(`Same stage: ${story.stage.toLowerCase()}`);
    }
    const shared = story.themes.filter((th) => themes.includes(th));
    shared.slice(0, 2).forEach((th) => reasons.push(`Shared concern: ${th}`));
    score += shared.length * 2;
    if (cancerKey && story.cancer.toLowerCase() === cancerKey.toLowerCase()) {
      score += 1;
      reasons.push(`${story.cancer} cancer`);
    }
    if (input.hear && story.style === input.hear) {
      score += 2;
      reasons.push(STYLE_LABEL[story.style]);
    }
    return { story, reasons, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
