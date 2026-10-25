# Pathmates

Pathmates is a hackathon website for finding patient stories and sharing one of your own. The Java server serves the teammate's three-file frontend in `server/websiteFiles`.

## Run locally

Install JDK 21. From `server`, compile and run:

```sh
mkdir -p build/classes
javac -d build/classes src/*.java src/org/json/*.java
java -cp build/classes WebServer
```

Visit `http://localhost:8080`. Set `PORT` to change the listener. Set a randomly generated `ADMIN_PASSCODE` of at least 24 characters before starting the server to enable review at `/admin`. Admin and submission requests have basic rate limits.

The flow asks shared triage questions, then branches into **Find a story** or **Share my story**. A browser session receives a token from `POST /api/submitSurvey`. The browser sends that token with transcription, categorization, story, and review requests. `POST /api/transcript` accepts `{ "session-token": "...", "transcript": "..." }` and returns `categories`. Those categories suggest matches and aid review; the patient's triage choices and edited story remain the source of truth.

`MODEL_API_KEY` enables Meta transcription. `OPENAI_API_KEY` enables categorization and optional AI drafting. Without them, patients can still type, edit, submit, and find stories. See `.env.example` for configuration.

Submitted stories stay pending until a team reviewer approves them. Approved stories appear in Find a story; fictional examples are labeled **Sample story**. The author can indicate an interest in helping others later, but this version has no contact, email, or messaging feature. The queue and approvals live in memory and disappear when the server restarts. Pending stories expire after 24 hours; the queue holds up to 100 pending stories and retains the 200 most recently approved stories.

## Deploy

The root `Dockerfile` builds the Java service and includes ffmpeg for recordings. It can be deployed as a free Render web service using the Docker runtime. Configure `ADMIN_PASSCODE` and any provider keys as service environment variables. A free service may restart, clearing submissions and approvals; bundled sample stories remain.

## Verify

Run the server API tests from the repository root with Python 3 and JDK 21:

```sh
PATHMATES_JAVA_HOME=/path/to/jdk-21 python3 server/tests/test_story_api.py -v
node --test server/tests/test_frontend.mjs
mkdir -p server/build/classes
javac -d server/build/classes server/src/*.java server/src/org/json/*.java server/tests/StoryStoreCapacityTest.java
java -cp server/build/classes StoryStoreCapacityTest
```

The API tests start a local server on port 18183. The frontend tests use Node's built-in test runner and do not require a JavaScript build step.
