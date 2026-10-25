import json
import os
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

SERVER = Path(__file__).resolve().parents[1]
JAVA_HOME = Path(os.environ.get('PATHMATES_JAVA_HOME', '/private/tmp/pathmates-jdk21/jdk-21.0.13+9/Contents/Home'))
PORT = 18183

class StoryApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.classes = tempfile.TemporaryDirectory()
        sources = [str(p) for p in (SERVER / 'src').rglob('*.java')]
        subprocess.run([str(JAVA_HOME / 'bin/javac'), '-d', cls.classes.name, *sources], check=True)
        env = dict(os.environ, PORT=str(PORT), ADMIN_PASSCODE='local-test-passcode-2026-very-long', OPENAI_API_KEY='', MODEL_API_KEY='')
        cls.server = subprocess.Popen([str(JAVA_HOME / 'bin/java'), '-cp', cls.classes.name, 'WebServer'], cwd=SERVER, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        for _ in range(60):
            try:
                urlopen(f'http://127.0.0.1:{PORT}/', timeout=0.2).close()
                return
            except Exception:
                if cls.server.poll() is not None:
                    raise RuntimeError(cls.server.stderr.read().decode())
                time.sleep(0.1)
        raise RuntimeError('server did not start')

    @classmethod
    def tearDownClass(cls):
        cls.server.terminate()
        cls.server.wait(timeout=5)
        cls.classes.cleanup()

    def post(self, path, data):
        req = Request(f'http://127.0.0.1:{PORT}{path}', json.dumps(data).encode(), {'Content-Type':'application/json'}, method='POST')
        try:
            with urlopen(req, timeout=5) as res:
                return res.status, json.load(res)
        except HTTPError as e:
            return e.code, json.load(e)

    def test_token_queue_and_visibility(self):
        code, survey = self.post('/api/submitSurvey', {'cancer-type':'Breast', 'cancer-stage':'In treatment', 'mind-state':'Family'})
        self.assertEqual(code, 200)
        token = survey['session-token']
        self.assertGreaterEqual(len(token), 32)
        story = {'session-token':token, 'title':'My path', 'author':'Alex', 'text':'A story about <script>alert(1)</script> and finding support.', 'open-to-help':True,
                 'categories':{'cancer_type':'invented', 'story_topics':['invented']}}
        code, denied = self.post('/api/stories/submit', dict(story, **{'session-token':'wrong'}))
        self.assertEqual(code, 401)
        code, submitted = self.post('/api/stories/submit', story)
        self.assertEqual(code, 200)
        story_id = submitted['id']
        code, public = self.post('/api/stories/list', {'session-token':token})
        self.assertEqual(code, 200)
        self.assertNotIn(story_id, [s['id'] for s in public['stories']])
        code, bad_admin = self.post('/api/admin/stories', {'session-token':token, 'passcode':'wrong'})
        self.assertEqual(code, 403)
        code, pending = self.post('/api/admin/stories', {'session-token':token, 'passcode':'local-test-passcode-2026-very-long'})
        self.assertEqual(code, 200)
        self.assertIn(story_id, [s['id'] for s in pending['stories']])
        code, review = self.post('/api/admin/review', {'session-token':token, 'passcode':'local-test-passcode-2026-very-long', 'id':story_id, 'decision':'approve'})
        self.assertEqual(code, 200)
        code, public = self.post('/api/stories/list', {'session-token':token})
        self.assertEqual(code, 200)
        shown = next(s for s in public['stories'] if s['id'] == story_id)
        self.assertEqual(shown['text'], story['text'])
        self.assertEqual(shown['cancer'], 'Breast')
        self.assertNotIn('session-token', shown)
        self.assertNotIn('open-to-help', shown)
        self.assertEqual(shown['categories'], {})

    def test_reject_does_not_publish(self):
        _, survey = self.post('/api/submitSurvey', {})
        token = survey['session-token']
        _, submitted = self.post('/api/stories/submit', {'session-token':token, 'title':'Reject me', 'author':'Test', 'text':'Enough text to review.'})
        story_id = submitted['id']
        code, _ = self.post('/api/admin/review', {'session-token':token, 'passcode':'local-test-passcode-2026-very-long', 'id':story_id, 'decision':'reject'})
        self.assertEqual(code, 200)
        _, public = self.post('/api/stories/list', {'session-token':token})
        self.assertNotIn(story_id, [s['id'] for s in public['stories']])

    def test_ai_contract_and_unconfigured_fallback(self):
        _, survey = self.post('/api/submitSurvey', {})
        token = survey['session-token']
        code, _ = self.post('/api/transcript', {'session-token':'wrong', 'transcript':'A story'})
        self.assertEqual(code, 404)
        code, categories = self.post('/api/transcript', {'session-token':token, 'transcript':'A story'})
        self.assertEqual(code, 503)
        self.assertFalse(categories['successful'])
        code, weave = self.post('/api/weave', {'session-token':token, 'answers':'My answer'})
        self.assertEqual(code, 503)
        self.assertFalse(weave['successful'])

if __name__ == '__main__':
    unittest.main()
