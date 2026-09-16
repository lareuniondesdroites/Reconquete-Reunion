#!/usr/bin/env python3
"""Met à jour l'archive vidéo publique du site.

- Sans clé API: lit les flux RSS des chaînes officielles configurées.
- Avec YOUTUBE_API_KEY: recherche aussi les nouvelles vidéos chez les médias de confiance.
- Ne conserve que les contenus identifiables comme interview, discours ou meeting.
- Déduplique par identifiant YouTube et écrit auto-media-data.js.
"""
from __future__ import annotations
import datetime as dt
import json
import os
import re
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "automation" / "config.json").read_text(encoding="utf-8"))
OUT = ROOT / "auto-media-data.js"

INTERVIEW_PATTERNS = [
    "interview", "entretien", "face a face", "face-à-face", "grande interview",
    "bfm politique", "grand jury", "invite", "invité", "questions politiques",
    "24h pujadas", "heure des pros", "l'heure des pros"
]
SPEECH_PATTERNS = [
    "meeting", "discours", "universite d'ete", "université d'été", "rentree politique",
    "rentrée politique", "congres", "congrès", "allocution", "prise de parole"
]
THEME_RULES = {
    "Immigration": ["immigration", "migratoire", "migrant", "frontiere", "frontière"],
    "Sécurité & justice": ["securite", "sécurité", "justice", "police", "prison", "delinquance", "délinquance"],
    "Économie": ["budget", "dette", "economie", "économie", "fiscal", "impot", "impôt", "pouvoir d'achat", "carburant"],
    "Europe": ["europe", "union europeenne", "union européenne", "bruxelles"],
    "International": ["ukraine", "russie", "israel", "israël", "iran", "gaza", "algerie", "algérie", "international"],
    "Élections": ["election", "élection", "presidentielle", "présidentielle", "europeennes", "européennes", "municipale"],
    "École": ["ecole", "école", "education", "éducation", "enseignant"],
    "Agriculture": ["agriculture", "agriculteur", "mercosur"],
    "Numérique": ["numerique", "numérique", "ia", "intelligence artificielle", "crypto"],
    "Institutions": ["dissolution", "assemblee", "assemblée", "gouvernement", "referendum", "référendum", "etat", "état"]
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", s.lower()).strip()


def classify(title: str) -> str | None:
    n = norm(title)
    if any(norm(p) in n for p in SPEECH_PATTERNS):
        return "meeting" if "meeting" in n else "discours"
    if any(norm(p) in n for p in INTERVIEW_PATTERNS):
        return "interview"
    return None


def detect_person(title: str, fallback: str | None = None):
    n = norm(title)
    if "eric zemmour" in n or "zemmour" in n:
        return "eric", "Éric Zemmour"
    if "sarah knafo" in n or "knafo" in n:
        return "sarah", "Sarah Knafo"
    if fallback == "eric":
        return "eric", "Éric Zemmour"
    if fallback == "sarah":
        return "sarah", "Sarah Knafo"
    return None, "Reconquête"


def detect_themes(title: str) -> list[str]:
    n = norm(title)
    themes = []
    for theme, words in THEME_RULES.items():
        if any(norm(w) in n for w in words):
            themes.append(theme)
    return themes[:4] or ["Actualité"]


def existing_video_ids() -> set[str]:
    ids = set()
    for name in ["interviews-data.js", "discours-data.js", "auto-media-data.js"]:
        p = ROOT / name
        if p.exists():
            ids.update(re.findall(r'"video"\s*:\s*"([A-Za-z0-9_-]{6,})"', p.read_text(encoding="utf-8")))
    return ids


def fetch_xml(url: str) -> ET.Element:
    req = urllib.request.Request(url, headers={"User-Agent": "Reconquete-Reunion-Archive/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return ET.fromstring(r.read())


def from_official_feeds() -> list[dict]:
    out = []
    ns = {"atom": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=max(CONFIG.get("lookback_days", 5), 14))
    for src in CONFIG["official_channels"]:
        url = f"https://www.youtube.com/feeds/videos.xml?channel_id={src['channel_id']}"
        try:
            root = fetch_xml(url)
        except Exception as e:
            print(f"RSS impossible pour {src['label']}: {e}")
            continue
        for entry in root.findall("atom:entry", ns):
            title = (entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
            kind = classify(title)
            if not kind:
                continue
            published = entry.findtext("atom:published", default="", namespaces=ns)
            try:
                when = dt.datetime.fromisoformat(published.replace("Z", "+00:00"))
                if when < cutoff:
                    continue
            except Exception:
                pass
            vid = entry.findtext("yt:videoId", default="", namespaces=ns)
            if not vid:
                continue
            person, label = detect_person(title, src.get("person"))
            out.append({
                "date": published[:10] if published else dt.date.today().isoformat(),
                "type": kind,
                "person": person or "reconquete",
                "personLabel": label if person else src.get("personLabel", "Reconquête"),
                "media": src["label"],
                "title": title,
                "themes": detect_themes(title),
                "url": f"https://www.youtube.com/watch?v={vid}",
                "video": vid,
                "sourceKind": "Chaîne officielle",
                "auto": True
            })
    return out


def api_get(endpoint: str, params: dict) -> dict:
    params["key"] = os.environ["YOUTUBE_API_KEY"]
    url = "https://www.googleapis.com/youtube/v3/" + endpoint + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "Reconquete-Reunion-Archive/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def trusted_media(title: str) -> bool:
    nt = norm(title)
    return any(norm(x) == nt or norm(x) in nt for x in CONFIG.get("trusted_media_names", []))


def from_youtube_search() -> list[dict]:
    if not os.environ.get("YOUTUBE_API_KEY"):
        print("YOUTUBE_API_KEY absent: recherche médias désactivée (les flux officiels restent actifs).")
        return []
    after = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=CONFIG.get("lookback_days", 5))).isoformat().replace("+00:00", "Z")
    out = []
    for person_name in CONFIG.get("search_people", []):
        data = api_get("search", {
            "part": "snippet", "type": "video", "order": "date", "q": person_name,
            "publishedAfter": after, "maxResults": CONFIG.get("max_results_per_query", 20),
            "relevanceLanguage": "fr"
        })
        for item in data.get("items", []):
            sn = item.get("snippet", {})
            channel = sn.get("channelTitle", "")
            if not trusted_media(channel):
                continue
            title = sn.get("title", "")
            kind = classify(title)
            if not kind:
                continue
            vid = item.get("id", {}).get("videoId")
            if not vid:
                continue
            person, label = detect_person(title)
            if not person:
                person, label = detect_person(person_name)
            published = sn.get("publishedAt", "")
            out.append({
                "date": published[:10] if published else dt.date.today().isoformat(),
                "type": kind,
                "person": person or "reconquete",
                "personLabel": label,
                "media": channel,
                "title": re.sub(r"&amp;", "&", title),
                "themes": detect_themes(title),
                "url": f"https://www.youtube.com/watch?v={vid}",
                "video": vid,
                "sourceKind": "Média public",
                "auto": True
            })
    return out


def load_current_auto() -> list[dict]:
    if not OUT.exists():
        return []
    text = OUT.read_text(encoding="utf-8")
    m = re.search(r"window\.AUTO_MEDIA_ARCHIVE\s*=\s*(\[.*\])\s*;?", text, re.S)
    if not m:
        return []
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return []


def main():
    previous = load_current_auto()
    known = existing_video_ids()
    merged = {x.get("video"): x for x in previous if x.get("video")}
    for item in from_official_feeds() + from_youtube_search():
        vid = item.get("video")
        if not vid or vid in known and vid not in merged:
            continue
        merged[vid] = item
    items = sorted(merged.values(), key=lambda x: x.get("date", ""), reverse=True)
    payload = "// Mis à jour automatiquement par .github/workflows/update-media.yml\nwindow.AUTO_MEDIA_ARCHIVE = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n"
    OUT.write_text(payload, encoding="utf-8")
    print(f"Archive automatique: {len(items)} élément(s).")

if __name__ == "__main__":
    main()
