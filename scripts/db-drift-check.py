#!/usr/bin/env python3
"""
db-drift-check.py — détecte les divergences entre les FK déclarées dans les
migrations `supabase/migrations/*.sql` et les FK réellement présentes dans la
base Postgres.

Contexte : le 2026-04-24, on a découvert que la FK
`financial_documents.sales_order_id` était `ON DELETE RESTRICT` en DB alors
que la migration d'origine `20251222_012_create_financial_tables.sql` la
définit comme `ON DELETE SET NULL`. Aucune migration versionnée ne trace ce
changement → modification manuelle via le SQL Editor de Supabase. Résultat :
commande annulée impossible à supprimer (PR #743). Ce script empêche ce genre
de dérive silencieuse.

Usage :
  DATABASE_URL=postgresql://... python3 scripts/db-drift-check.py
  # ou en CI :
  SUPABASE_DB_URL=... python3 scripts/db-drift-check.py --ci

Exit codes :
  0 = aucun drift détecté
  1 = drift détecté (écrit un rapport sur stdout + retourne le code non-zéro)
  2 = erreur technique (DB inaccessible, migrations introuvables, etc.)

En mode `--ci`, génère aussi un fichier `drift-report.json` utilisable par
GitHub Actions pour commenter sur la PR.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = ROOT / "supabase" / "migrations"

# Mots-clés SQL à ignorer quand ils sont parsés par erreur comme un nom
# de table (ex. "FOR (selection_id)" où "FOR" n'est pas une table).
SQL_KEYWORDS_BLACKLIST = {
    "for", "from", "as", "on", "in", "by", "to",
    "select", "insert", "update", "delete", "where",
    "set", "null", "default", "values",
}


# ---------------------------------------------------------------------------
# Parse migrations → FK déclarée par (table, colonne) avec sa dernière règle.
# ---------------------------------------------------------------------------


# Exemples capturés :
#   FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE SET NULL
#   column_name UUID REFERENCES products(id) ON DELETE CASCADE,
#   CONSTRAINT fk_x FOREIGN KEY (col) REFERENCES t(id) ON DELETE RESTRICT,
FK_INLINE_PATTERN = re.compile(
    r"\b([a-z_][a-z0-9_]*)\s+[A-Z]+\s+(?:NOT\s+NULL\s+)?(?:UNIQUE\s+)?REFERENCES\s+([a-z_][a-z0-9_]*)\s*\(\s*([a-z_][a-z0-9_]*)\s*\)\s*(?:ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION|SET\s+DEFAULT))?",
    re.IGNORECASE,
)

FK_EXPLICIT_PATTERN = re.compile(
    r"FOREIGN\s+KEY\s*\(\s*([a-z_][a-z0-9_]*)\s*\)\s*REFERENCES\s+([a-z_][a-z0-9_]*)\s*\(\s*([a-z_][a-z0-9_]*)\s*\)\s*(?:ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION|SET\s+DEFAULT))?",
    re.IGNORECASE,
)

# Détecter la table en cours dans un bloc CREATE TABLE.
CREATE_TABLE_PATTERN = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)",
    re.IGNORECASE,
)

ALTER_TABLE_PATTERN = re.compile(
    r"ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?([a-z_][a-z0-9_]*)",
    re.IGNORECASE,
)

DROP_FK_PATTERN = re.compile(
    r"DROP\s+CONSTRAINT\s+(?:IF\s+EXISTS\s+)?([a-z_][a-z0-9_]*)",
    re.IGNORECASE,
)


def _normalize(rule: Optional[str]) -> str:
    if not rule:
        # PG default when not specified = NO ACTION
        return "NO ACTION"
    return rule.upper().strip().replace("  ", " ")


def parse_migrations() -> Dict[Tuple[str, str], Dict[str, str]]:
    """
    Retourne un dict {(table, column): {'target_table': str, 'on_delete': str, 'source_file': str}}
    en ne gardant que la DERNIÈRE déclaration trouvée (ordre chronologique des
    migrations par nom de fichier).
    """
    declared: Dict[Tuple[str, str], Dict[str, str]] = {}

    if not MIGRATIONS_DIR.exists():
        print(f"ERROR: migrations dir not found: {MIGRATIONS_DIR}", file=sys.stderr)
        sys.exit(2)

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

    for migration_file in migration_files:
        content = migration_file.read_text(encoding="utf-8", errors="replace")
        # Strip SQL line comments (-- ...) to éviter les faux matchs quand
        # un commentaire contient "ALTER TABLE ..." ou "FOREIGN KEY ...".
        content = re.sub(r"--[^\n]*", "", content)
        current_table: Optional[str] = None

        # On scanne ligne par ligne pour suivre le "current_table" contexte.
        # Limitation connue : les CREATE TABLE multi-lignes sont gérés ;
        # les ALTER TABLE avec ADD CONSTRAINT FOREIGN KEY aussi.
        # Les blocs DO $$ ne sont pas parsés (peu utilisés pour FK).
        for block in re.split(r";\s*\n", content):
            if not block.strip():
                continue

            # Détecter le contexte de table.
            m_create = CREATE_TABLE_PATTERN.search(block)
            m_alter = ALTER_TABLE_PATTERN.search(block)
            if m_create:
                current_table = m_create.group(1).lower()
            elif m_alter:
                current_table = m_alter.group(1).lower()

            if not current_table:
                continue

            # FK inline dans CREATE TABLE
            for m in FK_INLINE_PATTERN.finditer(block):
                col = m.group(1).lower()
                tgt_table = m.group(2).lower()
                on_delete = _normalize(m.group(4))
                declared[(current_table, col)] = {
                    "target_table": tgt_table,
                    "on_delete": on_delete,
                    "source_file": migration_file.name,
                }

            # FK explicite FOREIGN KEY (col) REFERENCES ...
            for m in FK_EXPLICIT_PATTERN.finditer(block):
                col = m.group(1).lower()
                tgt_table = m.group(2).lower()
                on_delete = _normalize(m.group(4))
                # Filtre faux positifs : le contexte `current_table` a été
                # résolu sur un mot-clé SQL (ex. "FOR") au lieu d'un nom de
                # table réel.
                if current_table in SQL_KEYWORDS_BLACKLIST:
                    continue
                declared[(current_table, col)] = {
                    "target_table": tgt_table,
                    "on_delete": on_delete,
                    "source_file": migration_file.name,
                }

            # DROP CONSTRAINT : on ne tracke pas finement, mais on log pour info
            # (la FK sera ré-ajoutée juste après avec la nouvelle règle).

    return declared


# ---------------------------------------------------------------------------
# Lire l'état actuel de la DB.
# ---------------------------------------------------------------------------


def fetch_live_fks() -> Tuple[
    Dict[Tuple[str, str], Dict[str, str]],
    Dict[str, set],
]:
    """
    Retourne (live_fks, live_columns) où :
      - live_fks : {(table, col): {target_table, on_delete}}
      - live_columns : {table: {col1, col2, ...}} pour savoir si une colonne
        existe physiquement en DB (distingue "FK absente" de "colonne
        jamais créée").
    """
    db_url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        print(
            "ERROR: DATABASE_URL ou SUPABASE_DB_URL non défini. "
            "Export une des deux (voir .env.local ou les secrets GitHub).",
            file=sys.stderr,
        )
        sys.exit(2)

    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        print("ERROR: pip install psycopg2-binary", file=sys.stderr)
        sys.exit(2)

    fk_query = """
    SELECT
      tc.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_name AS target_table,
      rc.delete_rule AS on_delete
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
     AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
    """

    # On ne prend que les BASE TABLE : une VIEW apparaît dans
    # information_schema.columns mais ne peut pas porter de FK, et l'ajout
    # d'une FK est impossible (ALTER TABLE ... ADD CONSTRAINT échoue sur
    # une VIEW). Les drifts sur les VIEWs seraient faux positifs.
    columns_query = """
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE';
    """

    live: Dict[Tuple[str, str], Dict[str, str]] = {}
    live_columns: Dict[str, set] = {}
    conn = psycopg2.connect(db_url)
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(fk_query)
        for row in cur.fetchall():
            key = (row["source_table"].lower(), row["source_column"].lower())
            live[key] = {
                "target_table": row["target_table"].lower(),
                "on_delete": _normalize(row["on_delete"]),
            }

        cur.execute(columns_query)
        for row in cur.fetchall():
            t = row["table_name"].lower()
            c = row["column_name"].lower()
            live_columns.setdefault(t, set()).add(c)
    finally:
        conn.close()

    return live, live_columns


# ---------------------------------------------------------------------------
# Diff.
# ---------------------------------------------------------------------------


def compute_diff(
    declared: Dict[Tuple[str, str], Dict[str, str]],
    live: Dict[Tuple[str, str], Dict[str, str]],
    live_columns: Dict[str, set],
) -> List[Dict[str, str]]:
    drifts: List[Dict[str, str]] = []

    for key, live_fk in live.items():
        declared_fk = declared.get(key)
        if declared_fk is None:
            drifts.append(
                {
                    "kind": "undeclared_in_migrations",
                    "table": key[0],
                    "column": key[1],
                    "live_on_delete": live_fk["on_delete"],
                    "live_target": live_fk["target_table"],
                    "declared_source": None,
                }
            )
            continue
        if declared_fk["on_delete"] != live_fk["on_delete"]:
            drifts.append(
                {
                    "kind": "on_delete_mismatch",
                    "table": key[0],
                    "column": key[1],
                    "declared_on_delete": declared_fk["on_delete"],
                    "live_on_delete": live_fk["on_delete"],
                    "declared_source": declared_fk["source_file"],
                }
            )

    # Déclarations manquantes en DB (la migration est là mais la FK a été
    # drop manuellement) : à signaler UNIQUEMENT si la table + la colonne
    # existent physiquement en DB. Si la table/colonne n'a jamais été
    # créée (migration rollbackée, table dropped dans une migration
    # ultérieure), ce n'est pas un drift — c'est une trace historique.
    for key, declared_fk in declared.items():
        if key in live:
            continue
        table_name, column_name = key
        table_cols = live_columns.get(table_name)
        if table_cols is None:
            # La table n'existe pas en DB → migration historique sans
            # objet vivant. Pas un drift.
            continue
        if column_name not in table_cols:
            # La colonne n'existe pas en DB → idem.
            continue
        # Vérifier aussi que la table cible existe — si la migration
        # référence une table qui n'existe pas (ex. `counterparties` jamais
        # créée), la FK ne peut physiquement pas être créée. Trace
        # historique, pas drift.
        tgt_table = declared_fk.get("target_table")
        if tgt_table and tgt_table not in live_columns:
            continue
        # Table + colonne + cible existent mais la FK a été dropped → vrai drift.
        drifts.append(
            {
                "kind": "missing_in_live_db",
                "table": table_name,
                "column": column_name,
                "declared_on_delete": declared_fk["on_delete"],
                "declared_source": declared_fk["source_file"],
            }
        )

    return drifts


# ---------------------------------------------------------------------------
# Main.
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description="DB FK drift checker.")
    parser.add_argument(
        "--ci",
        action="store_true",
        help="Mode CI : écrit drift-report.json même si tout est OK.",
    )
    parser.add_argument(
        "--allow-undeclared",
        action="store_true",
        help="Tolère les FK live qui n'existent dans aucune migration (legacy). À retirer une fois le backlog nettoyé.",
    )
    args = parser.parse_args()

    declared = parse_migrations()
    live, live_columns = fetch_live_fks()
    drifts = compute_diff(declared, live, live_columns)

    if args.allow_undeclared:
        drifts = [d for d in drifts if d["kind"] != "undeclared_in_migrations"]

    report = {
        "declared_count": len(declared),
        "live_count": len(live),
        "drift_count": len(drifts),
        "drifts": drifts,
    }

    if args.ci:
        out = ROOT / "drift-report.json"
        out.write_text(json.dumps(report, indent=2))
        print(f"Report written to {out}")

    if drifts:
        print(f"❌ {len(drifts)} FK drift(s) détecté(s) :\n")
        for d in drifts:
            kind = d["kind"]
            if kind == "on_delete_mismatch":
                print(
                    f"  [MISMATCH] {d['table']}.{d['column']} : "
                    f"migration={d['declared_on_delete']} "
                    f"(déclaré dans {d['declared_source']}), "
                    f"live={d['live_on_delete']}"
                )
            elif kind == "undeclared_in_migrations":
                print(
                    f"  [UNDECLARED] {d['table']}.{d['column']} → "
                    f"{d['live_target']} ON DELETE {d['live_on_delete']} "
                    f"existe en DB mais n'est dans AUCUNE migration."
                )
            elif kind == "missing_in_live_db":
                print(
                    f"  [MISSING] {d['table']}.{d['column']} déclaré dans "
                    f"{d['declared_source']} (ON DELETE {d['declared_on_delete']}) "
                    f"mais absent en DB."
                )
        print()
        print(
            "Une modification directe sur la DB (hors migration) est la cause "
            "la plus probable. Corriger en créant une migration dédiée ou en "
            "réalignant la DB sur la migration d'origine."
        )
        return 1

    print(
        f"✅ Aucun drift détecté. "
        f"{len(declared)} FK déclarées vs {len(live)} en DB."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
