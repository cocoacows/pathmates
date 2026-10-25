# Pathmates

Pathmates is a hackathon website for finding patient stories and sharing one of your own. The Java server serves the static frontend in `server/websiteFiles` and provides survey, transcription, categorization, and story APIs.

## Run locally

Install JDK 21. From `server`, compile the Java sources and start the server:

```sh
mkdir -p build/classes
javac -d build/classes src/*.java
java -cp build/classes WebServer
```

Visit `http://localhost:8080`. Set `ADMIN_PASSCODE` before starting the server to enable the review page at `/admin`. The story queue lives in memory and resets on restart.

The recording and AI endpoints need provider credentials. See `.env.example` for environment variable names.

## Frontend

Edit `server/websiteFiles/index.html`, `style.css`, and `script.js`. These are the three files from the teammate's ZIP and are the only frontend source. No JavaScript build step is needed.
