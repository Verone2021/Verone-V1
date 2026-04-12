#!/usr/bin/env python3
"""
Verone Unified Documentation Generator

Usage:
  python3 scripts/generate-docs.py --db          # DB schema docs
  python3 scripts/generate-docs.py --app-bo      # Back-office app docs
  python3 scripts/generate-docs.py --app-lm      # LinkMe app docs
  python3 scripts/generate-docs.py --app-si      # Site-internet app docs
  python3 scripts/generate-docs.py --components   # Component/hook index
  python3 scripts/generate-docs.py --deps         # Package dependency map
  python3 scripts/generate-docs.py --index        # .claude/INDEX.md maintenance
  python3 scripts/generate-docs.py --auto         # Detect staged files, run what's needed
  python3 scripts/generate-docs.py --all          # Everything

Re-executable: safe to run multiple times, always overwrites output files.
"""

import argparse
import glob as globmod
import json
import os
import re
import subprocess
import sys
from collections import defaultdict
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GENERATED_AT = datetime.now().strftime("%Y-%m-%d %H:%M")


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    print(f"  Written: {path}")


def git_staged_files():
    try:
        out = subprocess.check_output(
            ["git", "diff", "--staged", "--name-only"], cwd=ROOT, text=True
        )
        return [l.strip() for l in out.strip().split("\n") if l.strip()]
    except Exception:
        return []


# ═══════════════════════════════════════════════════════════════════════════════
# --db : Database Schema Documentation
# ═══════════════════════════════════════════════════════════════════════════════

DB_OUTPUT = os.path.join(ROOT, "docs", "current", "database", "schema")

DOMAIN_PATTERNS = {
    "organisations": [
        "organisations", "contacts", "enseignes", "addresses",
        "customer_addresses", "individual_customers", "organisation_families",
        "counterparty_bank_accounts",
    ],
    "produits": [
        "products", "product_images", "product_colors", "product_groups",
        "product_group_members", "product_packages", "product_purchase_history",
        "product_reviews", "product_commission_history", "categories",
        "subcategories", "families", "variant_groups", "collections",
        "collection_images", "collection_products", "collection_shares",
    ],
    "commandes": [
        "sales_orders", "sales_order_items", "sales_order_events",
        "sales_order_shipments", "sales_order_linkme_details",
        "purchase_orders", "purchase_order_items", "purchase_order_receptions",
        "order_discounts", "order_payments", "sample_orders", "sample_order_items",
        "shopping_carts", "client_consultations", "consultation_emails",
        "consultation_images", "consultation_products",
    ],
    "stock": [
        "stock_movements", "stock_alert_tracking", "stock_reservations",
        "storage_allocations", "storage_billing_events", "storage_pricing_tiers",
        "affiliate_storage_allocations", "affiliate_storage_requests",
        "affiliate_archive_requests",
    ],
    "finance": [
        "financial_documents", "financial_document_items", "bank_transactions",
        "bank_transactions_enrichment_audit", "transaction_document_links",
        "fixed_assets", "fixed_asset_depreciations", "fiscal_obligations_done",
        "finance_settings", "pcg_categories", "matching_rules",
        "mcp_resolution_queue", "mcp_resolution_strategies",
    ],
    "linkme": [
        "linkme_affiliates", "linkme_channel_suppliers", "linkme_commissions",
        "linkme_info_requests", "linkme_onboarding_progress",
        "linkme_page_configurations", "linkme_payment_request_items",
        "linkme_payment_requests", "linkme_selection_items", "linkme_selections",
    ],
    "notifications": [
        "notifications", "user_notification_preferences", "email_templates",
        "newsletter_subscribers", "form_submissions", "form_submission_messages",
        "form_types", "site_contact_messages", "site_content",
    ],
    "utilisateurs": [
        "user_app_roles", "user_profiles", "user_sessions",
        "user_activity_logs", "audit_logs", "app_settings",
        "webhook_configs", "webhook_logs",
    ],
}

DOMAIN_LABELS = {
    "organisations": "Organisations & Contacts",
    "produits": "Produits & Catalogue",
    "commandes": "Commandes & Consultations",
    "stock": "Stock & Stockage",
    "finance": "Finance & Comptabilite",
    "linkme": "LinkMe & Affiliation",
    "notifications": "Notifications & Formulaires",
    "utilisateurs": "Utilisateurs & Securite",
    "autres": "Autres",
}

DOMAIN_FILES = {
    "organisations": "01-organisations.md",
    "produits": "02-produits.md",
    "commandes": "03-commandes.md",
    "stock": "04-stock.md",
    "finance": "05-finance.md",
    "linkme": "06-linkme.md",
    "notifications": "07-notifications.md",
    "utilisateurs": "08-utilisateurs.md",
    "autres": "09-autres.md",
}


def assign_domain(table_name):
    for domain, tables in DOMAIN_PATTERNS.items():
        if table_name in tables:
            return domain
    return "autres"


def fmt_type(col):
    t = col["data_type"]
    udt = col["udt_name"]
    if t == "USER-DEFINED":
        return f"enum:{udt}"
    if t == "ARRAY":
        return f"{udt.lstrip('_')}[]"
    if t == "character varying":
        return "varchar"
    if t == "timestamp with time zone":
        return "timestamptz"
    if t == "timestamp without time zone":
        return "timestamp"
    return t


def render_table_section(table_name, columns, fk_map, rls_map, trigger_map):
    lines = [f"## {table_name}", "", "| Colonne | Type | Nullable | Default |",
             "|---------|------|----------|---------|"]
    for col in columns:
        t = fmt_type(col)
        d = (col.get("column_default") or "")[:40]
        n = "YES" if col["is_nullable"] == "YES" else "NO"
        lines.append(f"| {col['column_name']} | {t} | {n} | {d} |")

    fks = fk_map.get(table_name, [])
    if fks:
        lines += ["", "**Relations :**"]
        for fk in fks:
            lines.append(f"- `{fk['source_column']}` → `{fk['target_table']}.{fk['target_column']}`")

    policies = rls_map.get(table_name, [])
    if policies:
        lines += ["", f"**RLS :** {len(policies)} polic{'y' if len(policies)==1 else 'ies'}"]
        for p in policies:
            roles = p.get("roles", "{authenticated}").strip("{}")
            lines.append(f"- `{p['policyname']}` : {p['cmd']} — {roles}")

    triggers = trigger_map.get(table_name, [])
    if triggers:
        seen = set()
        trig_lines = []
        for tr in triggers:
            if tr["trigger_name"] not in seen:
                seen.add(tr["trigger_name"])
                trig_lines.append(f"- `{tr['trigger_name']}` : {tr['action_timing']} {tr['event_manipulation']}")
        lines += ["", f"**Triggers :** {len(seen)}"] + trig_lines

    lines += ["", "---", ""]
    return "\n".join(lines)


def load_db_data():
    columns_by_table = {}
    fk_map = defaultdict(list)
    rls_map = defaultdict(list)
    trigger_map = defaultdict(list)
    enums = defaultdict(list)

    db_url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if db_url:
        try:
            import psycopg2, psycopg2.extras
            conn = psycopg2.connect(db_url)
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            queries = {
                "columns": "SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position",
                "fks": "SELECT tc.table_name as source_table, kcu.column_name as source_column, ccu.table_name AS target_table, ccu.column_name AS target_column FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'",
                "rls": "SELECT tablename, policyname, permissive, roles::text, cmd, LEFT(qual,150) as qual FROM pg_policies WHERE schemaname='public' ORDER BY tablename,cmd",
                "triggers": "SELECT trigger_name, event_manipulation, event_object_table, action_timing FROM information_schema.triggers WHERE trigger_schema='public'",
                "enums": "SELECT t.typname as enum_name, e.enumlabel as enum_value FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder",
            }
            cur.execute(queries["columns"])
            for row in cur.fetchall():
                columns_by_table.setdefault(row["table_name"], []).append(dict(row))
            cur.execute(queries["fks"])
            for row in cur.fetchall():
                fk_map[row["source_table"]].append(dict(row))
            cur.execute(queries["rls"])
            for row in cur.fetchall():
                rls_map[row["tablename"]].append(dict(row))
            cur.execute(queries["triggers"])
            for row in cur.fetchall():
                trigger_map[row["event_object_table"]].append(dict(row))
            cur.execute(queries["enums"])
            for row in cur.fetchall():
                enums[row["enum_name"]].append(row["enum_value"])
            conn.close()
            print("Connected to live DB via psycopg2")
            return columns_by_table, fk_map, rls_map, trigger_map, enums
        except Exception as e:
            print(f"psycopg2 failed: {e}, falling back to snapshot...")

    snapshot_path = os.path.join(ROOT, "scripts", "db-schema-snapshot.json")
    if os.path.exists(snapshot_path):
        with open(snapshot_path) as f:
            snap = json.load(f)
        columns_by_table = snap.get("columns_by_table", {})
        for row in snap.get("fks", []):
            fk_map[row["source_table"]].append(row)
        for row in snap.get("rls", []):
            rls_map[row["tablename"]].append(row)
        for row in snap.get("triggers", []):
            trigger_map[row["event_object_table"]].append(row)
        for name, values in snap.get("enums", {}).items():
            enums[name] = values
        print(f"Loaded from snapshot: {snapshot_path}")
    else:
        print("No snapshot found. Run with DATABASE_URL or create db-schema-snapshot.json")
    return columns_by_table, fk_map, rls_map, trigger_map, enums


def run_db():
    print("\n[--db] Generating DB schema docs...")
    columns_by_table, fk_map, rls_map, trigger_map, enums = load_db_data()
    all_tables = sorted(set(columns_by_table.keys()))

    domain_tables = defaultdict(list)
    for t in all_tables:
        domain_tables[assign_domain(t)].append(t)

    for domain, label in DOMAIN_LABELS.items():
        tbls = sorted(domain_tables.get(domain, []))
        lines = [f"# Domaine {label} — Schema Base de Donnees", "",
                 f"_Generated: {GENERATED_AT}_", "", f"**Tables : {len(tbls)}**", ""]
        if tbls:
            lines += ["| Table | Colonnes | FK | RLS | Triggers |", "|-------|----------|----|-----|----------|"]
            for t in tbls:
                cols = len(columns_by_table.get(t, []))
                fks = len(fk_map.get(t, []))
                rls = len(rls_map.get(t, []))
                trgs = len(set(tr["trigger_name"] for tr in trigger_map.get(t, [])))
                lines.append(f"| [{t}](#{t.replace('_', '-')}) | {cols} | {fks} | {rls} | {trgs} |")
            lines.append("")
        for t in tbls:
            lines.append(render_table_section(t, columns_by_table.get(t, []), fk_map, rls_map, trigger_map))
        write_file(os.path.join(DB_OUTPUT, DOMAIN_FILES[domain]), "\n".join(lines))

    # Summary
    total = len(all_tables)
    summary = [f"# Schema Base de Donnees Verone — Sommaire", "", f"_Generated: {GENERATED_AT}_", "",
               "| Metrique | Valeur |", "|----------|--------|",
               f"| Tables | {total} |",
               f"| Foreign Keys | {sum(len(v) for v in fk_map.values())} |",
               f"| RLS Policies | {sum(len(v) for v in rls_map.values())} |",
               f"| Triggers | {sum(len(v) for v in trigger_map.values())} |",
               f"| Enums | {len(enums)} |", "",
               "## Index des Domaines", "",
               "| # | Domaine | Tables | Fichier |", "|---|---------|--------|---------|"]
    for i, (d, lbl) in enumerate(DOMAIN_LABELS.items(), 1):
        fn = DOMAIN_FILES[d]
        summary.append(f"| {i:02d} | {lbl} | {len(domain_tables.get(d, []))} | [{fn}]({fn}) |")
    summary += ["", "## Enums", ""]
    for name in sorted(enums.keys()):
        summary.append(f"**`{name}`** : {' | '.join(f'`{v}`' for v in enums[name])}")
        summary.append("")
    write_file(os.path.join(DB_OUTPUT, "00-SUMMARY.md"), "\n".join(summary))

    # Complete index
    idx = [f"# Database Schema Complete — Index", "",
           f"_Generated: {GENERATED_AT} — {total} tables_", "",
           "| Table | Domaine | Colonnes |", "|-------|---------|----------|"]
    for t in all_tables:
        d = assign_domain(t)
        cols = len(columns_by_table.get(t, []))
        idx.append(f"| {t} | {DOMAIN_LABELS[d]} | {cols} |")
    write_file(os.path.join(DB_OUTPUT, "..", "DATABASE-SCHEMA-COMPLETE.md"), "\n".join(idx))
    print(f"  Done: {total} tables across {len(DOMAIN_LABELS)} domains.")


# ═══════════════════════════════════════════════════════════════════════════════
# --app-bo / --app-lm / --app-si : App Documentation
# ═══════════════════════════════════════════════════════════════════════════════

APP_MAP = {
    "bo": ("back-office", "Back-Office"),
    "lm": ("linkme", "LinkMe"),
    "si": ("site-internet", "Site-Internet"),
}


def scan_app_pages(app_dir):
    """Scan app/(protected|public)/**/page.tsx to extract routes."""
    pages = []
    for page_file in sorted(globmod.glob(os.path.join(app_dir, "src/app/**/page.tsx"), recursive=True)):
        rel = os.path.relpath(page_file, os.path.join(app_dir, "src/app"))
        route = "/" + os.path.dirname(rel).replace("(protected)/", "").replace("(public)/", "")
        route = re.sub(r"\(.*?\)/", "", route)
        if route.endswith("/."):
            route = "/"
        pages.append(route)
    return pages


def scan_app_api_routes(app_dir):
    """Scan app/api/**/route.ts to extract API endpoints."""
    routes = []
    for route_file in sorted(globmod.glob(os.path.join(app_dir, "src/app/api/**/route.ts"), recursive=True)):
        rel = os.path.relpath(route_file, os.path.join(app_dir, "src/app"))
        endpoint = "/" + os.path.dirname(rel)
        # Read file to detect HTTP methods
        with open(route_file) as f:
            content = f.read()
        methods = [m for m in ["GET", "POST", "PUT", "PATCH", "DELETE"] if f"export async function {m}" in content or f"export function {m}" in content]
        routes.append((endpoint, methods))
    return routes


def scan_app_components(app_dir):
    """Count components in the app's components/ directory."""
    components = []
    for tsx in sorted(globmod.glob(os.path.join(app_dir, "src/**/*.tsx"), recursive=True)):
        rel = os.path.relpath(tsx, app_dir)
        if "/components/" in rel or rel.startswith("src/components/"):
            name = os.path.splitext(os.path.basename(tsx))[0]
            if name[0].isupper():
                components.append(rel)
    return components


def run_app(key):
    app_slug, app_label = APP_MAP[key]
    app_dir = os.path.join(ROOT, "apps", app_slug)
    if not os.path.isdir(app_dir):
        print(f"  App directory not found: {app_dir}")
        return

    print(f"\n[--app-{key}] Generating {app_label} app docs...")
    pages = scan_app_pages(app_dir)
    api_routes = scan_app_api_routes(app_dir)
    components = scan_app_components(app_dir)

    lines = [f"# {app_label} — Documentation App", "",
             f"_Generated: {GENERATED_AT}_", "",
             f"## Pages ({len(pages)})", "",
             "| Route | Fichier |", "|-------|---------|"]
    for route in pages:
        lines.append(f"| `{route}` | page.tsx |")

    lines += ["", f"## API Routes ({len(api_routes)})", "",
              "| Endpoint | Methods |", "|----------|---------|"]
    for endpoint, methods in api_routes:
        lines.append(f"| `{endpoint}` | {', '.join(methods) or '?'} |")

    lines += ["", f"## Components in app ({len(components)})", "",
              "| Fichier |", "|---------|"]
    for c in components:
        lines.append(f"| `{c}` |")
    lines.append("")

    out_path = os.path.join(ROOT, "docs", "current", f"INDEX-{app_label.upper()}-APP.md")
    write_file(out_path, "\n".join(lines))


# ═══════════════════════════════════════════════════════════════════════════════
# --components : Component, Hook & Form Index
# ═══════════════════════════════════════════════════════════════════════════════

def run_components():
    print("\n[--components] Generating component index...")
    pkgs_dir = os.path.join(ROOT, "packages", "@verone")
    packages = sorted([d for d in os.listdir(pkgs_dir) if os.path.isdir(os.path.join(pkgs_dir, d))])

    lines = ["# Index Composants, Formulaires & Hooks — packages/@verone/", "",
             f"**Derniere mise a jour** : {GENERATED_AT.split(' ')[0]}",
             f"**{len(packages)} packages** dans `packages/@verone/`", "", "---", ""]

    total_components = 0
    total_hooks = 0

    for pkg in packages:
        src = os.path.join(pkgs_dir, pkg, "src")
        if not os.path.isdir(src):
            continue

        components = []
        hooks = []
        for tsx in sorted(globmod.glob(os.path.join(src, "**/*.tsx"), recursive=True)):
            name = os.path.splitext(os.path.basename(tsx))[0]
            rel = os.path.relpath(tsx, os.path.join(pkgs_dir, pkg))
            if name[0].isupper():
                kind = "Modal" if "Modal" in name else "Form" if "Form" in name else "Component"
                components.append((name, rel, kind))
        for ts in sorted(globmod.glob(os.path.join(src, "**/*.ts"), recursive=True)):
            name = os.path.splitext(os.path.basename(ts))[0]
            rel = os.path.relpath(ts, os.path.join(pkgs_dir, pkg))
            if name.startswith("use") and name[3:4].isupper():
                hooks.append((name, rel))

        if not components and not hooks:
            continue

        total_components += len(components)
        total_hooks += len(hooks)

        lines.append(f"## @verone/{pkg}")
        lines.append("")

        if components:
            lines += ["| Composant | Type | Fichier |", "|-----------|------|---------|"]
            for name, rel, kind in components:
                lines.append(f"| `{name}` | {kind} | `{rel}` |")
            lines.append("")

        if hooks:
            lines += ["| Hook | Fichier |", "|------|---------|"]
            for name, rel in hooks:
                lines.append(f"| `{name}` | `{rel}` |")
            lines.append("")

        lines.append("---")
        lines.append("")

    lines.insert(5, f"**{total_components} composants, {total_hooks} hooks**")

    out_path = os.path.join(ROOT, "docs", "current", "INDEX-COMPOSANTS-FORMULAIRES.md")
    write_file(out_path, "\n".join(lines))


# ═══════════════════════════════════════════════════════════════════════════════
# --deps : Package Dependency Map
# ═══════════════════════════════════════════════════════════════════════════════

def run_deps():
    print("\n[--deps] Generating dependency map...")
    pkgs_dir = os.path.join(ROOT, "packages", "@verone")
    apps_dir = os.path.join(ROOT, "apps")

    # Scan packages
    pkg_deps = {}
    for pkg in sorted(os.listdir(pkgs_dir)):
        pj = os.path.join(pkgs_dir, pkg, "package.json")
        if not os.path.isfile(pj):
            continue
        with open(pj) as f:
            data = json.load(f)
        deps = list(data.get("dependencies", {}).keys()) + list(data.get("devDependencies", {}).keys())
        verone_deps = sorted([d.replace("@verone/", "") for d in deps if d.startswith("@verone/")])
        pkg_deps[pkg] = verone_deps

    # Scan apps
    app_deps = {}
    for app in sorted(os.listdir(apps_dir)):
        pj = os.path.join(apps_dir, app, "package.json")
        if not os.path.isfile(pj):
            continue
        with open(pj) as f:
            data = json.load(f)
        deps = list(data.get("dependencies", {}).keys())
        verone_deps = sorted([d.replace("@verone/", "") for d in deps if d.startswith("@verone/")])
        app_deps[app] = verone_deps

    # Build reverse map
    used_by = defaultdict(list)
    for pkg, deps in pkg_deps.items():
        for d in deps:
            used_by[d].append(f"@verone/{pkg}")
    for app, deps in app_deps.items():
        for d in deps:
            used_by[d].append(f"apps/{app}")

    lines = ["# Carte des Dependances — packages/@verone/", "",
             f"**Genere le {GENERATED_AT.split(' ')[0]}** — Scanner `package.json` de chaque package", "", "---", "",
             "## Dependances par package", ""]

    for pkg in sorted(pkg_deps.keys()):
        deps = pkg_deps[pkg]
        lines.append(f"### @verone/{pkg}")
        lines.append("")
        lines.append(f"**Depend de** : {', '.join(f'@verone/{d}' for d in deps) if deps else 'aucun package @verone/'}")
        lines.append(f"**Utilise par** : {', '.join(sorted(used_by.get(pkg, []))) or 'aucun'}")
        lines.append("")

    lines += ["---", "", "## Apps", ""]
    for app in sorted(app_deps.keys()):
        deps = app_deps[app]
        lines.append(f"### apps/{app}")
        lines.append("")
        lines.append(f"**Depend de** : {', '.join(f'@verone/{d}' for d in deps) if deps else 'aucun'}")
        lines.append("")

    out_path = os.path.join(ROOT, "docs", "current", "DEPENDANCES-PACKAGES.md")
    write_file(out_path, "\n".join(lines))


# ═══════════════════════════════════════════════════════════════════════════════
# --index : Maintain .claude/INDEX.md
# ═══════════════════════════════════════════════════════════════════════════════

INDEX_SKIP = {".claude/research/", ".claude/agent-memory/"}
INDEX_META = {"INDEX.md", "README.md", "MEMORY.md"}

# Mapping: directory prefix -> section title in INDEX.md
SECTION_MAP = {
    ".claude/work/": "Taches en cours",
    ".claude/commands/": "Commandes Slash",
    ".claude/agents/": "Agents Specialises",
    ".claude/skills/": "Skills",
    ".claude/rules/": "Regles",
    ".claude/guides/": "Guides",
    ".claude/patterns/": "Patterns",
    ".claude/templates/": "Templates",
    ".claude/audits/": "Audits",
}


def run_index():
    print("\n[--index] Maintaining .claude/INDEX.md...")
    claude_dir = os.path.join(ROOT, ".claude")
    index_path = os.path.join(claude_dir, "INDEX.md")

    # 1. Find all .md files on disk
    disk_files = set()
    for md in sorted(globmod.glob(os.path.join(claude_dir, "**/*.md"), recursive=True)):
        rel = os.path.relpath(md, ROOT)
        if any(rel.startswith(skip) for skip in INDEX_SKIP):
            continue
        if os.path.basename(md) in INDEX_META:
            continue
        disk_files.add(rel)

    # 2. Read INDEX.md and find all referenced files
    if not os.path.isfile(index_path):
        print("  INDEX.md not found, cannot maintain.")
        return

    with open(index_path) as f:
        index_content = f.read()

    # Extract all .claude/ paths from INDEX.md
    ref_pattern = re.compile(r"`(\.claude/[^`]+\.md)`")
    referenced = set(ref_pattern.findall(index_content))

    # 3. Detect orphans
    orphans = sorted(disk_files - referenced)

    # 4. Detect broken references
    broken = sorted(referenced - disk_files)

    if not orphans and not broken:
        print("  INDEX.md is up to date. No orphans, no broken refs.")
        return

    if broken:
        print(f"  Removing {len(broken)} broken references:")
        for b in broken:
            print(f"    - {b}")
            # Remove the line containing this broken ref
            index_content = "\n".join(
                line for line in index_content.split("\n")
                if f"`{b}`" not in line
            )

    if orphans:
        print(f"  Adding {len(orphans)} orphan files:")
        # Group orphans by section
        orphan_sections = defaultdict(list)
        for o in orphans:
            section = "Autres"
            for prefix, sec_name in SECTION_MAP.items():
                if o.startswith(prefix):
                    section = sec_name
                    break
            # Special cases
            if o == ".claude/test-credentials.md":
                section = "Credentials de test"
            orphan_sections[section].append(o)

        for section, files in sorted(orphan_sections.items()):
            # Check if section exists
            if f"## {section}" in index_content:
                # Find the section and append before next ---
                section_idx = index_content.index(f"## {section}")
                next_separator = index_content.find("\n---", section_idx + 1)
                if next_separator == -1:
                    next_separator = len(index_content)

                insert_lines = []
                for f_path in files:
                    name = os.path.splitext(os.path.basename(f_path))[0]
                    desc = name.replace("-", " ").replace("_", " ").title()
                    insert_lines.append(f"| `{f_path}` | {desc} |")
                    print(f"    + {f_path} -> {section}")

                insert_text = "\n".join(insert_lines) + "\n"
                index_content = index_content[:next_separator] + insert_text + index_content[next_separator:]
            else:
                # Create new section at the end (before MCP/Stack sections)
                new_section = f"\n## {section}\n\n| Fichier | Contenu |\n| ------- | ------- |\n"
                for f_path in files:
                    name = os.path.splitext(os.path.basename(f_path))[0]
                    desc = name.replace("-", " ").replace("_", " ").title()
                    new_section += f"| `{f_path}` | {desc} |\n"
                    print(f"    + {f_path} -> {section} (new section)")
                new_section += "\n---\n"

                # Insert before ## MCP or ## Stack or at end
                insert_pos = index_content.find("## MCP")
                if insert_pos == -1:
                    insert_pos = index_content.find("## Stack")
                if insert_pos == -1:
                    insert_pos = len(index_content)
                index_content = index_content[:insert_pos] + new_section + "\n" + index_content[insert_pos:]

    with open(index_path, "w") as f:
        f.write(index_content)
    print(f"  Updated: {index_path}")


# ═══════════════════════════════════════════════════════════════════════════════
# --auto : Detect staged files and run relevant generators
# ═══════════════════════════════════════════════════════════════════════════════

def run_auto():
    staged = git_staged_files()
    if not staged:
        print("[--auto] No staged files detected.")
        return

    print(f"[--auto] {len(staged)} staged files detected.")
    targets = set()

    for f in staged:
        if f.startswith("supabase/migrations/"):
            targets.add("db")
        if f.startswith("apps/back-office/"):
            targets.add("app-bo")
        if f.startswith("apps/linkme/"):
            targets.add("app-lm")
        if f.startswith("apps/site-internet/"):
            targets.add("app-si")
        if f.startswith("packages/@verone/") and f.endswith((".tsx", ".ts")):
            targets.add("components")
        if f.startswith("packages/@verone/") and f.endswith("package.json"):
            targets.add("deps")
        if f.startswith(".claude/"):
            targets.add("index")

    if not targets:
        print("  No relevant generators to run.")
        return

    print(f"  Running: {', '.join(sorted(targets))}")
    dispatch = {
        "db": run_db, "app-bo": lambda: run_app("bo"), "app-lm": lambda: run_app("lm"),
        "app-si": lambda: run_app("si"), "components": run_components,
        "deps": run_deps, "index": run_index,
    }
    for t in sorted(targets):
        dispatch[t]()


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Verone Unified Documentation Generator")
    parser.add_argument("--db", action="store_true", help="Generate DB schema docs")
    parser.add_argument("--app-bo", action="store_true", help="Generate Back-Office app docs")
    parser.add_argument("--app-lm", action="store_true", help="Generate LinkMe app docs")
    parser.add_argument("--app-si", action="store_true", help="Generate Site-Internet app docs")
    parser.add_argument("--components", action="store_true", help="Generate component/hook index")
    parser.add_argument("--deps", action="store_true", help="Generate dependency map")
    parser.add_argument("--index", action="store_true", help="Maintain .claude/INDEX.md")
    parser.add_argument("--auto", action="store_true", help="Detect staged files, run relevant generators")
    parser.add_argument("--all", action="store_true", help="Run all generators")

    args = parser.parse_args()

    # If no flag, show help
    if not any(vars(args).values()):
        parser.print_help()
        sys.exit(1)

    if args.all:
        run_db()
        for key in APP_MAP:
            run_app(key)
        run_components()
        run_deps()
        run_index()
        return

    if args.auto:
        run_auto()
        return

    if args.db:
        run_db()
    if args.app_bo:
        run_app("bo")
    if args.app_lm:
        run_app("lm")
    if args.app_si:
        run_app("si")
    if args.components:
        run_components()
    if args.deps:
        run_deps()
    if args.index:
        run_index()


if __name__ == "__main__":
    main()
