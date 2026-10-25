// Converted from the original Pathmates React/TypeScript frontend.
// This is one self-contained browser script. It does not require React or a build step.
(() => {
  "use strict";

  const CANCER = ["Breast", "Lung", "Prostate", "Colorectal", "Blood (leukemia, lymphoma, myeloma)", "Skin", "Ovarian or cervical", "Other", "I'm not sure yet"];
  const AGES = ["18–29", "30–39", "40–49", "50–59", "60–69", "70 or older"];
  const STAGES = ["Newly diagnosed", "Considering treatment", "In treatment", "After treatment", "Facing a recurrence"];
  const TOPICS = ["Treatment", "Side effects", "Family", "Work", "Relationships", "Uncertainty", "Something else"];

  // Sample stories, custom writing prompts, and Pebble art are copied from the original project.
  const BY_STAGE_TOPIC = {
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

  const BY_TOPIC = {
    Treatment: ["The treatment I’m facing is…", "What I still want to understand is…"],
    "Side effects": ["The side effect that’s hardest right now is…", "What I’ve tried so far is…"],
    Family: ["The person I’m most worried about is…", "What I haven’t known how to say to my family is…"],
    Work: ["What I’m figuring out with work is…", "What I wish my employer understood is…"],
    Relationships: ["What’s changed between me and the people close to me is…", "What I’d like them to know is…"],
    Uncertainty: ["What I’m most unsure about is…", "On the hard days I cope by…"],
  };

  const FALLBACK = [
    "What I want to share is…",
    "What’s weighing on me most today is…",
    "What I’d like to hear from someone who’s been there is…",
  ];

  const HEAR_OPTIONS = [
    { key: "reassurance", label: "Reassurance", starter: "I’d like to hear from someone who felt the way I do now, and…" },
    { key: "practical", label: "Practical experience", starter: "I’d like to know the small, practical things that helped, like…" },
    { key: "candid", label: "A candid account", starter: "I’d like an honest account, including the hard parts, of…" },
  ];

  const STORIES = [
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

  const PEBBLE_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODAgMzYwIiB3aWR0aD0iMzgwIiBoZWlnaHQ9IjM2MCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsbGVkYnk9InQgZCI+Cjx0aXRsZSBpZD0idCI+UGViYmxlIHdhdmluZyBoZWxsbzwvdGl0bGU+CjxkZXNjIGlkPSJkIj5QZWJibGUsIGEgZnJpZW5kbHkgY2xheS1jb2xvcmVkIHN0b25lIHdpdGggYSBzcHJvdXQgb24gdG9wLCBob3BzLCB3YXZlcyBoZWxsbyBhbmQgYmxpbmtzLjwvZGVzYz4KPHN0eWxlPgo6cm9vdHstLWNsYXk6I0Q5QTU4QTstLWNsYXktZGFyazojQjk3RjY2Oy0tY2xheS1saWdodDojRUZDOEIyOy0taW5rOiMzQTI0MUM7LS1ibHVzaDojRTg4MzZGfQpzdmcgKnt0cmFuc2Zvcm0tYm94OmZpbGwtYm94fQouaG9we3RyYW5zZm9ybS1vcmlnaW46NTAlIDEwMCU7YW5pbWF0aW9uOmhvcCA2cyBlYXNlLWluLW91dCBpbmZpbml0ZX0KLnNoYWRvd3t0cmFuc2Zvcm0tb3JpZ2luOjUwJSA1MCU7YW5pbWF0aW9uOnNoYWRvdyA2cyBlYXNlLWluLW91dCBpbmZpbml0ZX0KLndhdmV7dHJhbnNmb3JtLW9yaWdpbjowJSA4NSU7YW5pbWF0aW9uOndhdmUgNnMgZWFzZS1pbi1vdXQgaW5maW5pdGV9Ci5udWJ7dHJhbnNmb3JtLW9yaWdpbjoxMDAlIDIwJTthbmltYXRpb246bnViIDEuNnMgZWFzZS1pbi1vdXQgaW5maW5pdGUgYWx0ZXJuYXRlfQouc3dheXt0cmFuc2Zvcm0tb3JpZ2luOjUwJSAxMDAlO2FuaW1hdGlvbjpzd2F5IDNzIGVhc2UtaW4tb3V0IGluZmluaXRlIGFsdGVybmF0ZX0KLmJsaW5re3RyYW5zZm9ybS1vcmlnaW46NTAlIDUwJTthbmltYXRpb246YmxpbmsgNC4ycyBpbmZpbml0ZX0KLnNwYXJre29wYWNpdHk6MDt0cmFuc2Zvcm0tb3JpZ2luOjUwJSA1MCU7YW5pbWF0aW9uOnNwYXJrIDZzIGVhc2UtaW4tb3V0IGluZmluaXRlfQouczJ7YW5pbWF0aW9uLWRlbGF5Oi4zNXN9CkBrZXlmcmFtZXMgaG9wezAlLDEwMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMCkgc2NhbGUoMSl9NSV7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMCkgc2NhbGUoMS4wNCwuOTMpfTEzJXt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtMThweCkgc2NhbGUoLjk3LDEuMDQpfTIxJXt0cmFuc2Zvcm06dHJhbnNsYXRlWSgwKSBzY2FsZSgxLjAzLC45Nil9Mjcle3RyYW5zZm9ybTp0cmFuc2xhdGVZKDApIHNjYWxlKDEpfX0KQGtleWZyYW1lcyBzaGFkb3d7MCUsMTAwJSwyNyV7dHJhbnNmb3JtOnNjYWxlKDEpO29wYWNpdHk6MX0xMyV7dHJhbnNmb3JtOnNjYWxlKC44OCk7b3BhY2l0eTouN319CkBrZXlmcmFtZXMgd2F2ZXswJSwyOCUsNjAlLDEwMCV7dHJhbnNmb3JtOnJvdGF0ZSgwKX0zMyV7dHJhbnNmb3JtOnJvdGF0ZSgtMTZkZWcpfTM5JXt0cmFuc2Zvcm06cm90YXRlKDE0ZGVnKX00NSV7dHJhbnNmb3JtOnJvdGF0ZSgtMTZkZWcpfTUxJXt0cmFuc2Zvcm06cm90YXRlKDE0ZGVnKX01NiV7dHJhbnNmb3JtOnJvdGF0ZSgtOGRlZyl9fQpAa2V5ZnJhbWVzIG51Yntmcm9te3RyYW5zZm9ybTpyb3RhdGUoLTdkZWcpfXRve3RyYW5zZm9ybTpyb3RhdGUoN2RlZyl9fQpAa2V5ZnJhbWVzIHN3YXl7ZnJvbXt0cmFuc2Zvcm06cm90YXRlKC02ZGVnKX10b3t0cmFuc2Zvcm06cm90YXRlKDZkZWcpfX0KQGtleWZyYW1lcyBibGlua3swJSw5MCUsMTAwJXt0cmFuc2Zvcm06c2NhbGVZKDEpfTk0JXt0cmFuc2Zvcm06c2NhbGVZKC4xKX19CkBrZXlmcmFtZXMgc3Bhcmt7MCUsMzAle29wYWNpdHk6MDt0cmFuc2Zvcm06c2NhbGUoLjQpIHJvdGF0ZSgwKX00MCV7b3BhY2l0eToxO3RyYW5zZm9ybTpzY2FsZSgxKSByb3RhdGUoMjBkZWcpfTUyJXtvcGFjaXR5OjA7dHJhbnNmb3JtOnNjYWxlKC41KSByb3RhdGUoNDBkZWcpfTEwMCV7b3BhY2l0eTowfX0KQG1lZGlhIChwcmVmZXJzLXJlZHVjZWQtbW90aW9uOnJlZHVjZSl7c3ZnICp7YW5pbWF0aW9uOm5vbmUhaW1wb3J0YW50fS5zcGFya3tvcGFjaXR5OjB9fQo8L3N0eWxlPgoKPGVsbGlwc2UgY2xhc3M9InNoYWRvdyIgY3g9IjE3MCIgY3k9IjMzOCIgcng9IjEyMCIgcnk9IjExIiBmaWxsPSIjRUJEM0JDIi8+Cgo8ZyBjbGFzcz0iaG9wIj4KPGVsbGlwc2UgY3g9IjEyNCIgY3k9IjMyNCIgcng9IjI2IiByeT0iMTIiIGZpbGw9InZhcigtLWNsYXktZGFyaykiLz4KPGVsbGlwc2UgY3g9IjIxMiIgY3k9IjMyNCIgcng9IjI2IiByeT0iMTIiIGZpbGw9InZhcigtLWNsYXktZGFyaykiLz4KPHBhdGggZD0iTTQ0IDI0NCBDNDAgMTY2IDExNCAxMTYgMTkwIDEyMCBDMjc2IDEyNCAzMTYgMTg2IDMwNCAyNTIgQzI5NiAzMDQgMjMyIDMyMiAxNjYgMzIyIEM5NiAzMjIgNDggMzA2IDQ0IDI0NCBaIiBmaWxsPSJ2YXIoLS1jbGF5KSIvPgo8cGF0aCBkPSJNNzggMTY4IEM5NiAxMzggMTMyIDEyNCAxNzAgMTI0IEMxMzggMTM4IDExMiAxNTQgOTggMTg4IFoiIGZpbGw9InZhcigtLWNsYXktbGlnaHQpIiBvcGFjaXR5PSIuODUiLz4KPGVsbGlwc2UgY3g9IjE3MCIgY3k9IjI4MiIgcng9Ijg2IiByeT0iMzgiIGZpbGw9InZhcigtLWNsYXktbGlnaHQpIiBvcGFjaXR5PSIuNyIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNzAiIHI9IjUiIGZpbGw9InZhcigtLWNsYXktZGFyaykiLz4KPGNpcmNsZSBjeD0iMjcwIiBjeT0iMTk4IiByPSIzLjUiIGZpbGw9InZhcigtLWNsYXktZGFyaykiLz4KPGNpcmNsZSBjeD0iODIiIGN5PSIyNjIiIHI9IjQiIGZpbGw9InZhcigtLWNsYXktZGFyaykiLz4KPGNpcmNsZSBjeD0iMjM2IiBjeT0iMTUwIiByPSIzIiBmaWxsPSJ2YXIoLS1jbGF5LWRhcmspIi8+Cgo8ZyBjbGFzcz0ic3dheSI+CjxwYXRoIGQ9Ik0xNzYgMTI0IEMxNzYgMTA2IDE3OCA5NCAxODIgODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzVFOEM2MSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTE4MiA4NCBDMTYyIDgyIDE0OCA2OCAxNDYgNTAgQzE2NiA1MCAxODAgNjIgMTgyIDg0IFoiIGZpbGw9IiM3REIwN0YiLz4KPHBhdGggZD0iTTE4MiA5MCBDMjAwIDg4IDIxNCA3NiAyMTggNTggQzE5OCA1NiAxODQgNjggMTgyIDkwIFoiIGZpbGw9IiM2QUEwNkQiLz4KPGNpcmNsZSBjeD0iMjI2IiBjeT0iNTIiIHI9IjkiIGZpbGw9InZhcigtLWJsdXNoKSIvPgo8Y2lyY2xlIGN4PSIyMjYiIGN5PSI1MiIgcj0iMy41IiBmaWxsPSIjRkJFRURGIi8+CjwvZz4KCjxnIGNsYXNzPSJibGluayI+CjxlbGxpcHNlIGN4PSIxMjQiIGN5PSIyMjgiIHJ4PSIxMSIgcnk9IjEzIiBmaWxsPSJ2YXIoLS1pbmspIi8+CjxlbGxpcHNlIGN4PSIyMTIiIGN5PSIyMjgiIHJ4PSIxMSIgcnk9IjEzIiBmaWxsPSJ2YXIoLS1pbmspIi8+CjxjaXJjbGUgY3g9IjEyOCIgY3k9IjIyMiIgcj0iNCIgZmlsbD0iI0ZGRjZFQyIvPgo8Y2lyY2xlIGN4PSIyMTYiIGN5PSIyMjIiIHI9IjQiIGZpbGw9IiNGRkY2RUMiLz4KPC9nPgo8Y2lyY2xlIGN4PSI5MiIgY3k9IjI2MCIgcj0iMTQiIGZpbGw9InZhcigtLWJsdXNoKSIgb3BhY2l0eT0iLjU1Ii8+CjxjaXJjbGUgY3g9IjI0NiIgY3k9IjI2MCIgcj0iMTQiIGZpbGw9InZhcigtLWJsdXNoKSIgb3BhY2l0eT0iLjU1Ii8+CjxwYXRoIGQ9Ik0xNDYgMjYwIFExNjggMjkyIDE5MCAyNjAgUTE2OCAyNjggMTQ2IDI2MCBaIiBmaWxsPSIjNkIzQTMzIiBzdHJva2U9IiM2QjNBMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTU3IDI3NiBRMTY4IDI4NiAxNzkgMjc2IFExNjggMjcyIDE1NyAyNzYgWiIgZmlsbD0iI0U4OEE3QiIvPgoKPGVsbGlwc2UgY2xhc3M9Im51YiIgY3g9IjQ2IiBjeT0iMjYyIiByeD0iMTQiIHJ5PSIxOSIgZmlsbD0idmFyKC0tY2xheSkiLz4KCjxnIGNsYXNzPSJ3YXZlIj4KPHBhdGggZD0iTTI5NiAyNjIgQzMxNiAyNTggMzI2IDI0NCAzMzQgMjMwIiBmaWxsPSJub25lIiBzdHJva2U9InZhcigtLWNsYXkpIiBzdHJva2Utd2lkdGg9IjIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPGNpcmNsZSBjeD0iMzM4IiBjeT0iMjIyIiByPSIxOSIgZmlsbD0idmFyKC0tY2xheSkiLz4KPHBhdGggZD0iTTMxNiAyMDQgQzMxMiAxOTQgMzE4IDE5MCAzMjQgMTk2IEMzMjggMjAwIDMyOCAyMDggMzI2IDIxNCBaIiBmaWxsPSJ2YXIoLS1jbGF5KSIvPgo8Y2lyY2xlIGN4PSIzNDQiIGN5PSIyMTIiIHI9IjYiIGZpbGw9InZhcigtLWNsYXktbGlnaHQpIiBvcGFjaXR5PSIuOCIvPgo8L2c+CjwvZz4KCjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM2MiwxNzYpIj48cGF0aCBjbGFzcz0ic3BhcmsiIGQ9Ik0wIC0xMCBMMyAtMyBMMTAgMCBMMyAzIEwwIDEwIEwtMyAzIEwtMTAgMCBMLTMgLTMgWiIgZmlsbD0iI0YyQjYzMiIvPjwvZz4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzUwLDE1MCkiPjxwYXRoIGNsYXNzPSJzcGFyayBzMiIgZD0iTTAgLTcgTDIgLTIgTDcgMCBMMiAyIEwwIDcgTC0yIDIgTC03IDAgTC0yIC0yIFoiIGZpbGw9IiNFODgzNkYiLz48L2c+Cjwvc3ZnPgo=";

  const state = {
    step: 0,
    answers: { story: "" },
    mode: "choose",
    recording: false,
    transcribing: false,
    recorder: null,
    seconds: 0,
    clockInterval: null,
    advanceTimeout: null,
    micError: "",
    summary: "",
    done: false,
  };

  const page = document.getElementById("page");
  const progress = document.getElementById("progress");
  const footer = document.getElementById("footer");
  document.getElementById("brand-pebble").src = PEBBLE_IMAGE;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function starters(stage, topic) {
    if (topic && BY_TOPIC[topic]) {
      if (stage && BY_STAGE_TOPIC[stage]) return BY_STAGE_TOPIC[stage][topic];
      return BY_TOPIC[topic];
    }
    return FALLBACK;
  }

  function buildSummary(a) {
    const t = a.story.toLowerCase();
    const stageMap = {
      "Newly diagnosed": "Newly diagnosed",
      "Considering treatment": "Weighing treatment options",
      "In treatment": "In treatment",
      "After treatment": "Life after treatment",
      "Facing a recurrence": "Facing a recurrence",
    };
    let stage = a.stage ? stageMap[a.stage] : "";
    if (/start(ing)? treatment|begin(ning)? (chemo|treatment)/.test(t)) stage = "Starting treatment";
    const themes = [];
    if (/kid|child|son|daughter|parent/.test(t)) themes.push("parenting");
    if (/job|work|boss|career/.test(t)) themes.push("work");
    if (/partner|husband|wife|spouse|dating/.test(t)) themes.push("relationships");
    if (/nause|tired|fatigue|hair|pain|side effect/.test(t)) themes.push("side effects");
    if (/scared|afraid|worr|anx|unknown/.test(t) && themes.length === 0) themes.push("living with uncertainty");
    if (themes.length === 0 && a.topic && a.topic !== "Something else") themes.push(a.topic.toLowerCase());
    const when = stage && stage !== "In treatment"
      ? (stage.startsWith("Starting") || stage === "In treatment" ? " during treatment" : "")
      : stage === "In treatment" ? " during treatment" : "";
    const about = themes.length ? `${themes.join(" and ")}${when}` : "people who've been where I am";
    const parts = [stage, `looking for stories about ${about}`].filter(Boolean);
    const s = parts.join("; ");
    return s.charAt(0).toUpperCase() + s.slice(1) + ".";
  }

  const THEME_PATTERNS = [
    ["parenting", /kid|child|son\b|daughter|parent|mom|dad/],
    ["work", /job|work|boss|career|employer/],
    ["relationships", /partner|husband|wife|spouse|dating/],
    ["side effects", /nause|tired|fatigue|hair|pain|side effect/],
    ["uncertainty", /scared|afraid|worr|anx|unknown|not knowing|waiting/],
    ["treatment", /treatment|chemo|radiation|surgery/],
    ["family", /family|sister|brother|mother|father/],
  ];
  const STYLE_LABEL = {
    reassurance: "Reassuring, as you asked",
    practical: "Practical, as you asked",
    candid: "Candid, as you asked",
  };

  function detectThemes(topic, text) {
    const t = text.toLowerCase();
    const found = THEME_PATTERNS.filter(([, re]) => re.test(t)).map(([key]) => key);
    if (topic && topic !== "Something else") found.push(topic.toLowerCase());
    return [...new Set(found)];
  }

  function rankStories(input, limit = 3) {
    const themes = detectThemes(input.topic, input.story);
    const cancerKey = input.cancer?.split(" ")[0];
    return STORIES.map((story) => {
      const reasons = [];
      let score = 0;
      if (input.stage && story.stage === input.stage) {
        score += 3;
        reasons.push(`Same stage: ${story.stage.toLowerCase()}`);
      }
      const shared = story.themes.filter((theme) => themes.includes(theme));
      shared.slice(0, 2).forEach((theme) => reasons.push(`Shared concern: ${theme}`));
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
    }).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  function choiceHtml(options, field, twoColumns) {
    return `<div class="question-grid ${twoColumns ? "two-columns" : ""}">${options.map((value, i) => `
      <button type="button" class="choice ${twoColumns && i === options.length - 1 && field === "cancer" ? "wide" : ""}"
        data-action="pick" data-field="${field}" data-index="${i}" aria-pressed="${state.answers[field] === value}">${escapeHtml(value)}</button>`).join("")}</div>`;
  }

  function questionHtml(title, options, field, twoColumns = false) {
    return `<div><h1 class="page-title">${escapeHtml(title)}</h1>${choiceHtml(options, field, twoColumns)}</div>`;
  }

  function storyInputHtml() {
    const intro = state.answers.topic && state.answers.topic !== "Something else"
      ? `You said ${state.answers.topic.toLowerCase()} is on your mind. Try starting with:`
      : "Try starting with:";
    const promptList = starters(state.answers.stage, state.answers.topic);
    const textArea = state.mode !== "choose" ? `
      <textarea class="story-textarea" id="story-textarea" rows="6" placeholder="I start treatment next week, and I’m worried about caring for my kids.">${escapeHtml(state.answers.story)}</textarea>
      <button class="primary-button continue-button" type="button" data-action="review" ${!state.answers.story.trim() || state.recording || state.transcribing ? "disabled" : ""}>Continue</button>` : "";
    return `<div>
      <h1 class="page-title">Tell us what’s happening and what you’d like to hear from someone who has been there.</h1>
      <p class="small-intro">${escapeHtml(intro)}</p>
      <div class="prompt-list">${promptList.map((text, index) => `<button type="button" class="press prompt-button" data-action="prompt" data-index="${index}">${escapeHtml(text)}</button>`).join("")}</div>
      <div class="record-panel">
        <button type="button" class="mic press ${state.recording ? "mic-live" : ""}" data-action="record" aria-label="${state.recording ? "Stop recording" : "Start recording"}" ${state.transcribing ? "disabled" : ""}>
          ${state.recording ? `<span class="mic-stop" aria-hidden="true"></span>` : `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></svg>`}
        </button>
        <p class="record-status" id="record-status" role="status" aria-live="polite">${recordStatusHtml()}</p>
        ${state.mode === "choose" ? `<button type="button" class="press text-toggle" data-action="type">I’d rather type</button>` : ""}
      </div>
      <p class="record-disclosure">If you record, your audio is sent to Meta for transcription. You can review and edit the text before continuing.</p>
      ${state.micError ? `<p class="error-text" role="alert">${escapeHtml(state.micError)}</p>` : ""}
      ${textArea}
    </div>`;
  }

  function recordStatusHtml() {
    if (state.recording) return `Listening <span>${Math.floor(state.seconds / 60)}:${String(state.seconds % 60).padStart(2, "0")}</span> · tap to finish`;
    if (state.transcribing) return "Writing down what you said…";
    return state.mode === "choose" ? "Tap to speak" : "Tap to add more";
  }

  function reviewHtml() {
    const fields = [["cancer", 1], ["age", 2], ["stage", 3], ["topic", 4]];
    return `<div>
      <h1 class="page-title">Here’s what we understood.</h1>
      <p class="review-subtitle">Edit anything that doesn’t feel right.</p>
      <div class="review-tags">${fields.map(([key, step]) => `<button type="button" class="press review-tag" data-action="edit-field" data-step="${step}">${escapeHtml(state.answers[key] ?? "Skipped")} <span class="tag-change">Change</span></button>`).join("")}</div>
      <textarea id="summary-textarea" class="summary-textarea" rows="3">${escapeHtml(state.summary)}</textarea>
      <button type="button" class="primary-button find-button" data-action="find" ${state.summary.trim() ? "" : "disabled"}>Find stories</button>
    </div>`;
  }

  function resultsHtml() {
    const matches = rankStories(state.answers, 3);
    return `<div>
      <div class="results-heading">
        <img src="${PEBBLE_IMAGE}" alt="" />
        <div><h1>Stories that may speak to you</h1>
          <p>Based on: <span class="summary-inline">${escapeHtml(state.summary)}</span>
            <button type="button" class="press text-toggle edit-button" data-action="edit-results">Edit</button></p>
        </div>
      </div>
      <div class="filter-bar" role="group" aria-label="What kind of story">
        <span class="filter-label">Show me</span>
        ${HEAR_OPTIONS.map((h) => `<button type="button" class="press chip" data-action="hear" data-hear="${h.key}" aria-pressed="${state.answers.hear === h.key}">${escapeHtml(h.label)}</button>`).join("")}
      </div>
      <ul class="stories">${matches.map(({ story, reasons }, index) => `
        <li class="stagger" style="animation-delay:${index * 60}ms"><article class="story-card">
          <p class="story-meta">${escapeHtml(story.author)} · ${escapeHtml(story.cancer)} cancer · ${escapeHtml(story.stage.toLowerCase())}</p>
          <h2>${escapeHtml(story.title)}</h2>
          <p class="story-excerpt">“${escapeHtml(story.excerpt)}”</p>
          <div class="match-reasons"><p class="reason-title">Why this matched</p>
            <ul class="reason-list">${(reasons.length ? reasons : ["A story from someone further along the path"]).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
          </div>
          <div class="story-bottom"><span>${story.minutes} min read · Sample story</span>
            <button type="button" class="press primary-button read-button" data-action="read-story">Read story</button>
          </div>
        </article></li>`).join("")}</ul>
      <p class="results-disclaimer">These are shared experiences, not medical advice. Your answers stay private.</p>
    </div>`;
  }

  function render() {
    if (state.done || state.step === 0) {
      progress.hidden = true;
      progress.innerHTML = "";
    } else {
      progress.hidden = false;
      progress.setAttribute("role", "img");
      progress.setAttribute("aria-label", `Step ${state.step} of 6`);
      progress.innerHTML = `<span class="progress-label">${state.step} of 6</span><div class="progress-track">${Array.from({ length: 6 }, (_, index) => `<span class="progress-dot ${index < state.step ? "active" : ""}"></span>`).join("")}</div>`;
    }

    let html;
    if (state.done) html = resultsHtml();
    else switch (state.step) {
      case 0:
        html = `<div class="welcome"><img class="welcome-pebble" src="${PEBBLE_IMAGE}" alt="Pebble, a friendly stone character, waving hello" />
          <h1>Let’s find a story that feels relevant to you.</h1>
          <p>Share only what you’re comfortable with. Your answers stay private unless you later choose to share your story.</p>
          <button class="primary-button" data-action="begin" type="button">Begin</button></div>`;
        break;
      case 1: html = questionHtml("What type of cancer are you navigating?", CANCER, "cancer", true); break;
      case 2: html = questionHtml("How old are you?", AGES, "age", true); break;
      case 3: html = questionHtml("Where are you right now?", STAGES, "stage"); break;
      case 4: html = questionHtml("What’s most on your mind today?", TOPICS, "topic"); break;
      case 5: html = storyInputHtml(); break;
      case 6: html = reviewHtml(); break;
      default: html = "";
    }
    page.innerHTML = `<div class="animate-rise">${html}</div>`;
    footer.hidden = state.done || state.step === 0;
    footer.innerHTML = footer.hidden ? "" : `<button class="press nav-button" type="button" data-action="back">← Back</button>
      ${state.step >= 1 && state.step <= 4 ? `<button class="press nav-button" type="button" data-action="skip">Skip</button>` : `<span></span>`}`;

    if (state.step === 5 && state.mode === "type" && !state.done) {
      // Autofocus when switching from microphone choice to typing; not on every redraw.
      document.getElementById("story-textarea")?.focus({ preventScroll: true });
    }
  }

  function clearAdvance() {
    if (state.advanceTimeout) clearTimeout(state.advanceTimeout);
    state.advanceTimeout = null;
  }

  function leaveStoryStep() {
    if (state.recorder) {
      state.recorder.cancel();
      state.recorder = null;
    }
    state.recording = false;
    if (state.clockInterval) clearInterval(state.clockInterval);
    state.clockInterval = null;
  }

  function goToStep(nextStep) {
    clearAdvance();
    if (state.step === 5 && nextStep !== 5) leaveStoryStep();
    state.step = Math.max(0, Math.min(6, nextStep));
    state.done = false;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function goReview() {
    if (!state.answers.story.trim() || state.recording || state.transcribing) return;
    state.summary = buildSummary(state.answers);
    goToStep(6);
  }

  // Audio recording is preserved. The POST endpoint remains a SERVER dependency.
  const TARGET_RATE = 16000;
  const MAX_RECORD_SECONDS = 5 * 60;
  const TRANSCRIBE_ENDPOINT = "/api/transcribe";

  function resample(input, from, to) {
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

  function encodeWav(pcm, rate) {
    const buffer = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buffer);
    const writeText = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeText(0, "RIFF");
    view.setUint32(4, 36 + pcm.length * 2, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) {
      const sample = Math.max(-1, Math.min(1, pcm[i] ?? 0));
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  async function createRecorder(onLimit) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Audio recording is unavailable in this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    const context = new Context();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const chunks = [];
    let count = 0;
    let finished = false;
    const release = () => {
      processor.onaudioprocess = null;
      try { source.disconnect(); processor.disconnect(); } catch { /* Already disconnected */ }
      stream.getTracks().forEach((track) => track.stop());
      void context.close();
    };
    processor.onaudioprocess = (event) => {
      if (finished) return;
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      count += event.inputBuffer.length;
      if (count / context.sampleRate >= MAX_RECORD_SECONDS) onLimit?.();
    };
    source.connect(processor);
    processor.connect(context.destination);
    return {
      cancel() { finished = true; release(); },
      async stop() {
        finished = true;
        const rate = context.sampleRate;
        release();
        const merged = new Float32Array(count);
        let index = 0;
        for (const chunk of chunks) { merged.set(chunk, index); index += chunk.length; }
        return encodeWav(resample(merged, rate, TARGET_RATE), TARGET_RATE);
      },
    };
  }

  async function transcribe(wav) {
    const form = new FormData();
    form.append("audio", wav, "story.wav");
    let res;
    try { res = await fetch(TRANSCRIBE_ENDPOINT, { method: "POST", body: form }); }
    catch { throw new Error("Couldn’t transcribe that recording. Please try again or type instead."); }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Couldn’t transcribe that recording. Please try again or type instead.");
    }
    if (typeof data?.transcript !== "string") {
      throw new Error("Couldn’t transcribe that recording. Please try again or type instead.");
    }
    return data.transcript;
  }

  async function startRecording() {
    state.micError = "";
    try {
      state.recorder = await createRecorder(() => void stopRecording());
      if (state.step !== 5 || state.done) { state.recorder.cancel(); state.recorder = null; return; }
      state.recording = true;
      state.mode = "record";
      state.seconds = 0;
      state.clockInterval = setInterval(() => {
        state.seconds += 1;
        const el = document.getElementById("record-status");
        if (el) el.innerHTML = recordStatusHtml();
      }, 1000);
    } catch {
      state.micError = "We couldn’t use your microphone. You can type your story instead.";
      state.mode = "type";
    }
    render();
  }

  async function stopRecording() {
    const recorder = state.recorder;
    if (!recorder) return;
    state.recorder = null;
    state.recording = false;
    state.transcribing = true;
    if (state.clockInterval) clearInterval(state.clockInterval);
    state.clockInterval = null;
    render();
    try {
      const wav = await recorder.stop();
      const transcript = (await transcribe(wav)).trim();
      if (transcript) {
        state.answers.story = state.answers.story.trim() ? `${state.answers.story.trim()} ${transcript}` : transcript;
      } else {
        state.micError = "We didn’t catch anything. Try again, or type instead.";
      }
    } catch (error) {
      state.micError = error instanceof Error ? error.message : "Couldn’t transcribe that recording.";
    } finally {
      state.transcribing = false;
      render();
    }
  }

  page.addEventListener("input", (event) => {
    if (event.target.id === "story-textarea") {
      state.answers.story = event.target.value;
      const button = page.querySelector('[data-action="review"]');
      if (button) button.disabled = !state.answers.story.trim() || state.recording || state.transcribing;
    }
    if (event.target.id === "summary-textarea") {
      state.summary = event.target.value;
      const button = page.querySelector('[data-action="find"]');
      if (button) button.disabled = !state.summary.trim();
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    switch (action) {
      case "begin": goToStep(1); break;
      case "pick": {
        const field = button.dataset.field;
        const options = { cancer: CANCER, age: AGES, stage: STAGES, topic: TOPICS }[field];
        if (!options) return;
        state.answers[field] = options[Number(button.dataset.index)];
        page.querySelectorAll('[data-action="pick"]').forEach((choice) => {
          choice.setAttribute("aria-pressed", String(choice === button));
        });
        clearAdvance();
        state.advanceTimeout = setTimeout(() => goToStep(state.step + 1), 140);
        break;
      }
      case "skip": goToStep(state.step + 1); break;
      case "back": goToStep(state.step - 1); break;
      case "type": state.mode = "type"; render(); break;
      case "prompt": {
        const prompt = starters(state.answers.stage, state.answers.topic)[Number(button.dataset.index)];
        if (!prompt) return;
        state.answers.story = state.answers.story.trim() ? `${state.answers.story.trim()} ${prompt}` : prompt;
        if (state.mode === "choose") state.mode = "type";
        render();
        break;
      }
      case "record": if (state.recording) void stopRecording(); else void startRecording(); break;
      case "review": goReview(); break;
      case "edit-field": goToStep(Number(button.dataset.step)); break;
      case "find": if (state.summary.trim()) { state.done = true; render(); window.scrollTo(0, 0); } break;
      case "edit-results": state.done = false; render(); break;
      case "hear": state.answers.hear = button.dataset.hear; render(); break;
      case "read-story":
        // The source prototype contains sample cards but does not have full-story pages.
        window.alert("This is a sample story. The original project does not include full story pages yet.");
        break;
    }
  });

  window.addEventListener("pagehide", () => {
    clearAdvance();
    leaveStoryStep();
  });
  render();
})();
