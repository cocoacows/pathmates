# Cancer Story Finder

I want to start an onboarding flow for a website: First onboarding flow

Set the expectation
“Let’s find a story that feels relevant to you. Share only what you’re comfortable with. Your answers stay private unless you later choose to share your story.”

Ask three short questions

“What type of cancer are you navigating?” Include “I’m not sure yet” and “Skip.”

“Where are you right now?” Options could include newly diagnosed, considering treatment, in treatment, after treatment, or facing a recurrence.

“What’s most on your mind today?” Let them choose a topic such as treatment, side effects, family, work, relationships, or uncertainty, with “Something else” available.

Invite their voice or text
“Tell us what’s happening and what you’d like to hear from someone who has been there.”
Give them Record and Type instead choices. A gentle example could be: “I start treatment next week, and I’m worried about caring for my kids.”

Let them check what the app understood
Show a short, editable version: “Starting treatment; looking for stories about parenting during treatment.” Then offer Find stories.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/63b4586f-d391-5a06-a24d-2f30fe1dcfd2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Voice transcription

The Record button sends a WAV recording to the app's server after the visitor stops speaking. The server sends it to [Meta Muse Voice Transcribe](https://dev.meta.ai/docs/speech-to-text) and returns editable text. Recordings are not saved by this app.

Create a Meta Model API key in the [Meta dashboard](https://dev.meta.ai/). Set it as the server-side secret `MODEL_API_KEY` in the environment hosting this app. For local development, put `MODEL_API_KEY=...` in an untracked `.env.local` file. The optional `ASR_MODEL` setting defaults to `muse-voice-transcribe-1.0`. Never use a `VITE_` prefix for the key.

Without the key, the recording route returns a setup message and visitors can still type their story.
