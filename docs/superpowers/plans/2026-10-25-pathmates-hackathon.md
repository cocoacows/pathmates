# Pathmates Hackathon Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans task by task, with test-first changes and a final whole-branch review.

**Goal:** Make the teammate's ZIP the sole frontend, then add guided story submission and a small approval queue on the Java server.

**Architecture:** The plain browser files live in `server/websiteFiles`. Java `HttpServer` serves those files and JSON APIs. Submitted stories are kept in memory, with public reads restricted to approved records and admin actions protected by a configured passcode.

**Tech Stack:** Plain HTML/CSS/JavaScript, Java 21, bundled `org.json` sources.

**Spec:** The approved plan in this conversation, revised to the teammate's current `/api/submitSurvey` and `/api/transcript` contract.

## Global Constraints

- No patient or admin accounts, email, contact action, or persistent story database.
- The public website must not call itself a demo; fictional bundled stories remain labeled **Sample story**.
- `session-token` comes from `/api/submitSurvey` and is sent with all subsequent API requests.
- `/api/transcript` consumes `session-token` and `transcript`, and returns `categories`.

## Tasks

### Task 1: Repository and static frontend

- [ ] Remove the old React/Lovable frontend and committed Java binaries while retaining Java source and existing API code.
- [ ] Copy the three ZIP files to a flat `server/websiteFiles` directory and update static routes.
- [ ] Compile the server, load the ZIP page locally, and commit the cleanup.

### Task 2: Backend story APIs

- [ ] Write failing Java integration tests for token issuance, private pending stories, admin approval, invalid passcode, and public approved listing.
- [ ] Add the in-memory store and API handlers; harden token generation, shared state, request limits, and server configuration.
- [ ] Write failing tests for optional weave and categorization calls, implement the server integration, and rerun the full Java suite.

### Task 3: Frontend patient and admin flows

- [ ] Write failing browser tests for separate paths, one prompt at a time, early finish, editing, token round trip, and admin review.
- [ ] Implement story creation, optional AI weave, categorization, submission, approved-story display, and the passcode dashboard.
- [ ] Adapt recording to the Java server's JSON audio format and rerun browser tests.

### Task 4: Release checks

- [ ] Verify end-to-end behavior, accessibility, escaping, and responsive layout.
- [ ] Update README with local run instructions, temporary-data behavior, and free hosting setup.
- [ ] Review the diff, run all tests and compilation, push the branch, and open a pull request.
