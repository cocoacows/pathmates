import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../websiteFiles/script.js', import.meta.url), 'utf8');

function browser(responses = {}, pathname = '/') {
  const events = {};
  const requests = [];
  const storage = new Map();
  const element = () => ({
    innerHTML: '', hidden: false, addEventListener(type, handler) { events[type] = handler; },
    querySelectorAll() { return []; }, querySelector() { return null; },
    setAttribute() {}, focus() {},
  });
  const page = element();
  const progress = element();
  const footer = element();
  const brand = element();
  const fields = new Map();
  const document = {
    getElementById(id) {
      const fixed = ({ page, progress, footer, 'brand-pebble': brand })[id];
      if (fixed) return fixed;
      if (!fields.has(id)) fields.set(id, element());
      return fields.get(id);
    },
    addEventListener(type, handler) { events[type] = handler; },
  };
  const context = {
    document, Blob, Uint8Array, Float32Array, ArrayBuffer, DataView, btoa,
    navigator: { mediaDevices: { async getUserMedia() { return { getTracks: () => [{ stop() {} }] }; } } },
    sessionStorage: { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); } },
    window: { location: { pathname }, scrollTo() {}, addEventListener() {} },
    fetch: async (path, options) => {
      const body = JSON.parse(options.body);
      requests.push({ path, body });
      const configured = typeof responses[path] === 'function' ? responses[path](body) : responses[path];
      const result = configured || (path === '/api/submitSurvey' ? { 'session-token': 'test-session-token' } : {});
      const status = typeof result.status === 'number' ? result.status : 200;
      return { ok: status < 400, status, json: async () => result.body || result };
    },
    setTimeout(callback) { callback(); return 1; }, clearTimeout() {},
    setInterval() { return 1; }, clearInterval() {},
  };
  runInNewContext(script, context);
  return {
    page, requests, context,
    field(id, value) { document.getElementById(id).value = value; },
    click(action, data = {}) {
      const button = { disabled: false, dataset: { action, ...data }, setAttribute() {} };
      events.click({ target: { closest: () => button } });
    },
    input(id, value, checked = false) { events.input({ target: { id, value, checked } }); },
  };
}

function toShare(b) {
  b.click('begin-share');
  b.click('pick', { field: 'cancer', index: '0' });
  b.click('skip');
  b.click('pick', { field: 'stage', index: '2' });
  b.click('pick', { field: 'topic', index: '2' });
}

const flush = async () => { for (let i = 0; i < 3; i++) await new Promise(setImmediate); };

test('triage selects prompts, with next, back, and early finish', () => {
  const b = browser();
  toShare(b);
  assert.match(b.page.innerHTML, /what’s hardest with my family/);
  b.input('prompt-answer', 'Fictional answer about family support.');
  b.click('next-prompt');
  assert.match(b.page.innerHTML, /prompt 2 of 3/);
  b.click('back');
  assert.match(b.page.innerHTML, /Fictional answer about family support/);
  b.click('finish-prompts');
  assert.match(b.page.innerHTML, /final-story/);
  assert.match(b.page.innerHTML, /Fictional answer about family support/);
});

test('suggestions leave edited text alone until accepted', async () => {
  const b = browser({ '/api/weave': { draft: 'Suggested AI wording.' } });
  toShare(b);
  b.input('prompt-answer', 'Original prompt response.');
  b.click('finish-prompts');
  b.input('final-story', 'My carefully edited story.');
  b.click('assemble');
  assert.match(b.page.innerHTML, /Suggested draft/);
  assert.match(b.page.innerHTML, /My carefully edited story/);
  b.click('discard-suggestion');
  b.click('weave');
  await flush();
  assert.match(b.page.innerHTML, /Suggested AI wording/);
  assert.match(b.page.innerHTML, /My carefully edited story/);
  b.click('accept-suggestion');
  assert.match(b.page.innerHTML, /id="final-story"[^>]*>Suggested AI wording/);
});

test('submission sends the final edit and session token to categorization and queue', async () => {
  const b = browser({ '/api/transcript': { categories: { story_topics: ['relationships_and_family'] } }, '/api/stories/submit': { id: 'story-1', status: 'pending' } });
  toShare(b);
  b.input('prompt-answer', 'Early answer.');
  b.click('finish-prompts');
  b.input('story-title', 'Test title');
  b.input('story-author', 'Test author');
  b.input('final-story', 'This is the final patient-edited text.');
  b.click('submit-story');
  await flush();
  assert.match(b.page.innerHTML, /pending review/);
  assert.deepEqual(b.requests.map(({ path }) => path), ['/api/submitSurvey', '/api/transcript', '/api/stories/submit']);
  assert.equal(b.requests[1].body.transcript, 'This is the final patient-edited text.');
  assert.equal(b.requests[1].body['session-token'], 'test-session-token');
  assert.equal(b.requests[2].body['session-token'], 'test-session-token');
});

test('approved story markup is rendered as text', async () => {
  const b = browser({ '/api/stories/list': { stories: [{ id: 'approved-1', title: '<script>bad</script>', author: 'Test', text: 'Literal <img src=x onerror=alert(1)> text.', stage: 'In treatment', cancer: 'Breast', categories: {} }] } });
  b.click('begin-find');
  b.click('pick', { field: 'cancer', index: '0' });
  b.click('skip');
  b.click('pick', { field: 'stage', index: '2' });
  b.click('pick', { field: 'topic', index: '2' });
  b.click('type');
  b.input('story-textarea', 'Looking for family stories.');
  b.click('review');
  b.click('find');
  await flush();
  assert.match(b.page.innerHTML, /&lt;script&gt;bad&lt;\/script&gt;/);
  assert.match(b.page.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(b.page.innerHTML, /<script>bad<\/script>/);
});

test('recording sends base64 WAV with the session token', async () => {
  const b = browser({ '/api/transcribe': { transcript: 'Transcribed fictional words.' } });
  const connection = () => ({ connect() {}, disconnect() {} });
  b.context.window.AudioContext = class {
    sampleRate = 16000;
    destination = {};
    createMediaStreamSource() { return connection(); }
    createScriptProcessor() { return connection(); }
    async close() {}
  };
  b.click('begin-find');
  b.click('skip'); b.click('skip'); b.click('skip'); b.click('skip');
  b.click('record');
  await flush();
  b.click('record');
  await flush();
  const request = b.requests.find(({ path }) => path === '/api/transcribe');
  assert.ok(request);
  assert.equal(request.body['session-token'], 'test-session-token');
  assert.match(request.body.audio, /^UklGR/);
  assert.match(b.page.innerHTML, /Transcribed fictional words/);
});

test('admin page rejects a bad passcode and approves a pending story', async () => {
  let approved = false;
  const b = browser({
    '/api/admin/stories': (body) => body.passcode !== 'right-passcode'
      ? { status: 403, body: { 'response-text': 'Incorrect admin passcode.' } }
      : { stories: approved ? [] : [{ id: 'story-1', title: 'Fictional story', author: 'Test', text: 'A fictional story for review.', cancer: 'Breast', stage: 'In treatment', categories: {} }] },
    '/api/admin/review': () => { approved = true; return { successful: true }; },
  }, '/admin');
  b.field('admin-passcode', 'wrong');
  b.click('admin-unlock');
  await flush();
  assert.match(b.page.innerHTML, /Incorrect admin passcode/);
  b.field('admin-passcode', 'right-passcode');
  b.click('admin-unlock');
  await flush();
  assert.match(b.page.innerHTML, /Fictional story/);
  b.click('admin-approve', { id: 'story-1' });
  await flush();
  assert.match(b.page.innerHTML, /0 awaiting review/);
  assert.equal(b.requests.find(({ path }) => path === '/api/admin/review').body.decision, 'approve');
});

test('an expired browser token is renewed and the request retried', async () => {
  let listCalls = 0;
  const b = browser({ '/api/stories/list': () => ++listCalls === 1
    ? { status: 401, body: { 'response-text': 'Invalid session token.' } }
    : { stories: [] } });
  b.click('begin-find');
  b.click('skip'); b.click('skip'); b.click('skip'); b.click('skip');
  b.click('type');
  b.input('story-textarea', 'A fictional search sentence.');
  b.click('review');
  b.click('find');
  await flush();
  assert.equal(b.requests.filter(({ path }) => path === '/api/submitSurvey').length, 2);
  assert.equal(b.requests.filter(({ path }) => path === '/api/stories/list').length, 2);
  assert.match(b.page.innerHTML, /Stories that may speak to you/);
});
