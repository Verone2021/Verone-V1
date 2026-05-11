#!/usr/bin/env python3
"""
[SITE-BLOG-002] Push direct des articles vers Supabase via REST API.

Utilise le service_role_key (bypass RLS) pour UPSERT dans la table articles.

Usage:
    python3 scripts/push-articles.py
"""

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = REPO_ROOT / "docs" / "content" / "articles"
ENV_FILE = REPO_ROOT / "apps" / "back-office" / ".env.local"


def load_env() -> dict:
    """Charge les variables d'environnement depuis .env.local."""
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse le frontmatter YAML en tête du markdown."""
    if not content.startswith("---"):
        raise ValueError("Frontmatter manquant")
    end = content.find("\n---", 3)
    if end == -1:
        raise ValueError("Frontmatter non clos")
    raw_meta = content[3:end].strip()
    body = content[end + 4 :].strip()

    meta = {}
    for line in raw_meta.split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        match = re.match(r"^([a-z_]+):\s*(.*)$", line)
        if not match:
            continue
        key, raw_val = match.groups()
        raw_val = raw_val.strip()
        if raw_val.startswith('"') and raw_val.endswith('"'):
            raw_val = raw_val[1:-1]
        if raw_val in ("true", "false"):
            meta[key] = raw_val == "true"
        elif raw_val.isdigit():
            meta[key] = int(raw_val)
        elif raw_val.startswith("[") and raw_val.endswith("]"):
            items = re.findall(r'"([^"]*)"', raw_val)
            meta[key] = items
        else:
            meta[key] = raw_val
    return meta, body


# Fallback alt text pour les articles dont le frontmatter n'a pas cover_image_alt
ALT_FALLBACK = {
    "miroir-deco-salon-compositions-murales":
        "Composition murale de miroirs design organiques et soleil sur mur de salon contemporain",
    "lampe-table-design-comment-choisir":
        "Lampes de table design champignon disque et spirale sur table de chevet et bureau",
}


def push_article(meta: dict, body: str, env: dict) -> None:
    """POST/PATCH d'un article via REST API Supabase (upsert)."""
    supabase_url = env["NEXT_PUBLIC_SUPABASE_URL"]
    service_key = env["SUPABASE_SERVICE_ROLE_KEY"]

    slug = meta["slug"]
    payload = {
        "slug": slug,
        "title": meta.get("title"),
        "subtitle": meta.get("subtitle"),
        "excerpt": meta.get("excerpt"),
        "body_markdown": body,
        "cover_image_alt": meta.get("cover_image_alt") or ALT_FALLBACK.get(slug, ""),
        "category": meta.get("category"),
        "tags": meta.get("tags", []),
        "meta_title": meta.get("meta_title"),
        "meta_description": meta.get("meta_description"),
        "reading_time_minutes": meta.get("reading_time_minutes", 5),
        "status": "draft",
    }

    url = f"{supabase_url}/rest/v1/articles?on_conflict=slug"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            if data:
                print(f"  ✅ {slug} → id={data[0]['id']}, words={data[0]['word_count']}, reading={data[0]['reading_time_minutes']}min")
            else:
                print(f"  ✅ {slug} (upserted, no body returned)")
    except urllib.error.HTTPError as e:
        body_err = e.read().decode("utf-8")
        print(f"  ❌ {slug} HTTP {e.code} : {body_err[:300]}", file=sys.stderr)
        raise


def main() -> None:
    env = load_env()
    if "SUPABASE_SERVICE_ROLE_KEY" not in env:
        print("❌ SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local", file=sys.stderr)
        sys.exit(1)

    md_files = sorted(ARTICLES_DIR.glob("*.md"))
    md_files = [f for f in md_files if not f.name.startswith("README")]
    print(f"📚 Push de {len(md_files)} articles vers Supabase...\n")

    for md_file in md_files:
        print(f"📝 {md_file.name}")
        content = md_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(content)
        push_article(meta, body, env)

    print(f"\n✅ {len(md_files)} articles importés.")


if __name__ == "__main__":
    main()
