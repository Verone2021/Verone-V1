#!/usr/bin/env python3
"""
[SITE-BLOG-002] Import des articles depuis docs/content/articles/*.md vers la table articles Supabase.

Parse le frontmatter YAML de chaque article et génère un fichier SQL prêt à exécuter.
Le body markdown (incluant les balises <!-- PRODUIT --> ) est conservé tel quel.

Usage:
    python3 scripts/import-articles.py
    → génère scripts/_generated/import-articles.sql

Les UPSERT permettent de relancer le script sans dupliquer.
"""

import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = REPO_ROOT / "docs" / "content" / "articles"
OUTPUT_SQL = REPO_ROOT / "scripts" / "_generated" / "import-articles.sql"


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse le frontmatter YAML en tête du markdown. Retourne (meta, body)."""
    if not content.startswith("---"):
        raise ValueError("Frontmatter manquant (doit commencer par ---)")
    end = content.find("\n---", 3)
    if end == -1:
        raise ValueError("Frontmatter non clos (---)")
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
        # Strip quotes
        if raw_val.startswith('"') and raw_val.endswith('"'):
            raw_val = raw_val[1:-1]
        # Bool
        if raw_val in ("true", "false"):
            meta[key] = raw_val == "true"
        # Number
        elif raw_val.isdigit():
            meta[key] = int(raw_val)
        # Array (simple : ["a", "b", "c"])
        elif raw_val.startswith("[") and raw_val.endswith("]"):
            items = re.findall(r'"([^"]*)"', raw_val)
            meta[key] = items
        else:
            meta[key] = raw_val
    return meta, body


def sql_escape(value) -> str:
    """Échappe une valeur pour SQL PostgreSQL."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, list):
        # Array text postgres : ARRAY['a', 'b']::text[]
        items = ", ".join(sql_escape(v) for v in value)
        return f"ARRAY[{items}]::text[]"
    # String : escape single quotes
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def build_insert(meta: dict, body: str) -> str:
    """Génère un UPSERT pour un article."""
    slug = meta["slug"]
    # Pour publication : tous en draft au départ (Roméo publie manuellement)
    return f"""
INSERT INTO articles (
  slug, title, subtitle, excerpt, body_markdown,
  cover_image_alt, category, tags,
  meta_title, meta_description,
  reading_time_minutes,
  status
) VALUES (
  {sql_escape(slug)},
  {sql_escape(meta.get("title"))},
  {sql_escape(meta.get("subtitle"))},
  {sql_escape(meta.get("excerpt"))},
  {sql_escape(body)},
  {sql_escape(meta.get("cover_image_alt"))},
  {sql_escape(meta.get("category"))},
  {sql_escape(meta.get("tags", []))},
  {sql_escape(meta.get("meta_title"))},
  {sql_escape(meta.get("meta_description"))},
  {sql_escape(meta.get("reading_time_minutes", 5))},
  'draft'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  excerpt = EXCLUDED.excerpt,
  body_markdown = EXCLUDED.body_markdown,
  cover_image_alt = EXCLUDED.cover_image_alt,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  reading_time_minutes = EXCLUDED.reading_time_minutes,
  updated_at = now();
""".strip()


def main():
    if not ARTICLES_DIR.exists():
        print(f"❌ Dossier introuvable : {ARTICLES_DIR}", file=sys.stderr)
        sys.exit(1)

    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    md_files = sorted(ARTICLES_DIR.glob("*.md"))
    md_files = [f for f in md_files if not f.name.startswith("README")]
    if not md_files:
        print(f"❌ Aucun article trouvé dans {ARTICLES_DIR}", file=sys.stderr)
        sys.exit(1)

    sql_parts = [
        "-- [SITE-BLOG-002] Import généré automatiquement depuis docs/content/articles/",
        "-- Statut : draft (Roméo publie manuellement après relecture)",
        "",
        "BEGIN;",
        "",
    ]
    for md_file in md_files:
        print(f"📝 {md_file.name}")
        content = md_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(content)
        sql_parts.append(f"-- {md_file.name} : {meta.get('title', '')}")
        sql_parts.append(build_insert(meta, body))
        sql_parts.append("")

    sql_parts.append("COMMIT;")
    OUTPUT_SQL.write_text("\n".join(sql_parts), encoding="utf-8")
    print(f"\n✅ SQL généré : {OUTPUT_SQL}")
    print(f"   → {len(md_files)} articles prêts à importer")


if __name__ == "__main__":
    main()
