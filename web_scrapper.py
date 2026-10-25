# Name: Monan Paul
# Date: 10/24/2026
# Purpose: This program scrapes the web for information and displays it in a readable format.

#!/usr/bin/env python3
"""
Cancer story collector - NO Reddit API key needed.

Pulls public posts from the Arctic Shift archive (https://arctic-shift.photon-reddit.com),
a free research archive of Reddit data, then filters for first-person stories.

Setup:
    pip install requests

Usage:
    python cancer_stories_no_key.py
    python cancer_stories_no_key.py --subreddits cancer breastcancer --after 2024-01-01 --max-per-sub 1000
    python cancer_stories_no_key.py --input-file my_dump.jsonl     # offline mode

Notes:
    - Authors are not saved (sensitive health content).
    - The archive can lag behind Reddit and may be slow or time out at times;
      the script retries and keeps whatever it already collected.
    - Check Arctic Shift's usage guidance and any ethics requirements for your project.
"""

import argparse
import csv
import json
import re
import sys
import time
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    sys.exit("Missing dependency. Run: pip install requests")

BASE_URL = "https://arctic-shift.photon-reddit.com/api/posts/search"

DEFAULT_SUBREDDITS = [
    "cancer",
    "CancerFamilySupport",
    "breastcancer",
    "leukemia",
    "lymphoma",
    "ProstateCancer",
    "ovariancancer",
    "lungcancer",
    "ColorectalCancer",
    "cancersurvivors",
]

STORY_HINTS = re.compile(
    r"\b(i was diagnosed|my diagnosis|my journey|my story|i found a lump|"
    r"i started chemo|i finished chemo|i had surgery|i'm in remission|"
    r"i am in remission|my (mom|dad|wife|husband|sister|brother|son|daughter|"
    r"friend) (was )?diagnosed|when i found out|cancer free)\b",
    re.IGNORECASE,
)

BAD_TEXT = {"", "[removed]", "[deleted]"}


def story_score(title, text):
    blob = f"{title}\n{text}"
    hints = len(STORY_HINTS.findall(blob))
    first_person = len(re.findall(r"\b(i|my|me|i'm|i've)\b", blob, re.IGNORECASE))
    words = max(len(blob.split()), 1)
    return hints * 3 + round(100 * first_person / words)


def iso(ts):
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")


def fetch_page(session, params, retries=4):
    for attempt in range(retries):
        try:
            r = session.get(BASE_URL, params=params, timeout=60)
            if r.status_code == 200:
                return r.json().get("data", [])
            if r.status_code in (429, 500, 502, 503, 504):
                wait = 5 * (attempt + 1)
                print(f"   HTTP {r.status_code}, retrying in {wait}s...")
                time.sleep(wait)
                continue
            print(f"   HTTP {r.status_code}: {r.text[:200]}")
            return []
        except requests.RequestException as e:
            wait = 5 * (attempt + 1)
            print(f"   network error ({e}); retrying in {wait}s...")
            time.sleep(wait)
    return []


def make_record(p):
    title = p.get("title", "") or ""
    text = (p.get("selftext") or "").strip()
    created = p.get("created_utc") or 0
    permalink = p.get("permalink") or f"/comments/{p.get('id')}"
    return {
        "id": p.get("id"),
        "subreddit": p.get("subreddit"),
        "title": title,
        "text": text,
        "word_count": len(text.split()),
        "score": p.get("score", 0),
        "num_comments": p.get("num_comments", 0),
        "created_utc": iso(int(created)) if created else "",
        "url": f"https://www.reddit.com{permalink}",
        "story_score": story_score(title, text),
    }


def keep(p, min_words, min_story_score):
    text = (p.get("selftext") or "").strip()
    if text in BAD_TEXT or len(text.split()) < min_words:
        return False
    return story_score(p.get("title", ""), text) >= min_story_score


def from_api(subreddits, after, before, max_per_sub, min_words, min_story_score, delay):
    session = requests.Session()
    session.headers["User-Agent"] = "cancer-story-research/0.1"
    seen, records = set(), []

    for name in subreddits:
        print(f"\n== r/{name} ==")
        cursor_before = before
        scanned, kept = 0, 0

        while scanned < max_per_sub:
            params = {
                "subreddit": name,
                "after": after,
                "limit": 100,
                "sort": "desc",
            }
            if cursor_before:
                params["before"] = cursor_before

            page = fetch_page(session, params)
            if not page:
                break

            for p in page:
                scanned += 1
                pid = p.get("id")
                if pid in seen:
                    continue
                seen.add(pid)
                if keep(p, min_words, min_story_score):
                    records.append(make_record(p))
                    kept += 1

            oldest = min(p.get("created_utc", 0) for p in page)
            if len(page) < 100 or not oldest:
                break
            cursor_before = iso(int(oldest))
            print(f"   scanned {scanned}, kept {kept}")
            time.sleep(delay)

        print(f"   done: scanned {scanned}, kept {kept}")

    return records


def from_file(path, min_words, min_story_score):
    records, seen = [], set()
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                p = json.loads(line)
            except json.JSONDecodeError:
                continue
            if p.get("id") in seen:
                continue
            seen.add(p.get("id"))
            if keep(p, min_words, min_story_score):
                records.append(make_record(p))
    return records


import os
from datetime import datetime

def save(records, prefix):
    records.sort(key=lambda r: (r["story_score"], r["score"]), reverse=True)

    folder = os.path.dirname(os.path.abspath(__file__))
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base = os.path.join(folder, f"{os.path.basename(prefix)}_{stamp}")

    try:
        with open(f"{base}.jsonl", "w", encoding="utf-8") as f:
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        if records:
            with open(f"{base}.csv", "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=list(records[0].keys()))
                w.writeheader()
                w.writerows(records)
    except PermissionError:
        # Last resort: write to the user's home folder
        base = os.path.join(os.path.expanduser("~"), f"cancer_stories_{stamp}")
        with open(f"{base}.jsonl", "w", encoding="utf-8") as f:
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print("Could not write next to the script; saved to your home folder instead.")

    print(f"\nSaved {len(records)} stories -> {base}.jsonl / .csv")

def main():
    ap = argparse.ArgumentParser(description="Collect cancer stories (no API key).")
    ap.add_argument("--subreddits", nargs="+", default=DEFAULT_SUBREDDITS)
    ap.add_argument("--after", default="2023-01-01",
                    help="Only posts on/after this date, YYYY-MM-DD (default 2023-01-01)")
    ap.add_argument("--before", default=None,
                    help="Only posts before this date, YYYY-MM-DD (default: now)")
    ap.add_argument("--max-per-sub", type=int, default=500,
                    help="Max posts to scan per subreddit (default 500)")
    ap.add_argument("--min-words", type=int, default=100)
    ap.add_argument("--min-story-score", type=int, default=3)
    ap.add_argument("--delay", type=float, default=1.0)
    ap.add_argument("--input-file", help="Process a local .jsonl dump instead of calling the API")
    ap.add_argument("--out", default="cancer_stories")
    args = ap.parse_args()

    if args.input_file:
        records = from_file(args.input_file, args.min_words, args.min_story_score)
    else:
        records = from_api(args.subreddits, args.after, args.before,
                           args.max_per_sub, args.min_words,
                           args.min_story_score, args.delay)
    save(records, args.out)


if __name__ == "__main__":
    main()