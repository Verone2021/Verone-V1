#!/usr/bin/env python3
"""
Verone DB Schema Documentation Generator
Usage: python3 scripts/generate-db-docs.py

Requires: psycopg2 (pip install psycopg2-binary)
Or set DATABASE_URL env var. Falls back to Supabase MCP if unavailable.

Re-executable: safe to run multiple times, always overwrites output files.
"""

import os
import json
import sys
from collections import defaultdict
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────────────

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "current", "database", "schema")

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

# ─── Helpers ──────────────────────────────────────────────────────────────────

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


def fmt_default(col):
    d = col.get("column_default") or ""
    if not d:
        return ""
    if len(d) > 40:
        d = d[:37] + "..."
    return d


def nullable_str(col):
    return "YES" if col["is_nullable"] == "YES" else "NO"


def render_table_section(table_name, columns, fk_map, rls_map, trigger_map):
    lines = []
    lines.append(f"## {table_name}")
    lines.append("")
    lines.append("| Colonne | Type | Nullable | Default |")
    lines.append("|---------|------|----------|---------|")
    for col in columns:
        t = fmt_type(col)
        d = fmt_default(col)
        n = nullable_str(col)
        lines.append(f"| {col['column_name']} | {t} | {n} | {d} |")

    # Relations
    fks = fk_map.get(table_name, [])
    if fks:
        lines.append("")
        lines.append("**Relations :**")
        for fk in fks:
            lines.append(f"- `{fk['source_column']}` → `{fk['target_table']}.{fk['target_column']}`")

    # RLS
    policies = rls_map.get(table_name, [])
    if policies:
        lines.append("")
        lines.append(f"**RLS :** {len(policies)} polic{'y' if len(policies)==1 else 'ies'}")
        for p in policies:
            roles = p.get("roles", "{authenticated}").strip("{}")
            lines.append(f"- `{p['policyname']}` : {p['cmd']} — {roles}")

    # Triggers
    triggers = trigger_map.get(table_name, [])
    if triggers:
        lines.append("")
        lines.append(f"**Triggers :** {len(triggers)}")
        seen = set()
        for t in triggers:
            key = t["trigger_name"]
            if key not in seen:
                seen.add(key)
                lines.append(f"- `{t['trigger_name']}` : {t['action_timing']} {t['event_manipulation']}")

    lines.append("")
    lines.append("---")
    lines.append("")
    return "\n".join(lines)


# ─── Data (embedded from MCP queries) ─────────────────────────────────────────
# This section contains the data collected via Supabase MCP.
# To regenerate from a live DB, connect via psycopg2 and run the queries.

def load_data():
    """Returns (tables, columns_by_table, fk_map, rls_map, trigger_map, enums)"""

    tables = [
        "addresses","affiliate_archive_requests","affiliate_storage_allocations",
        "affiliate_storage_requests","app_settings","audit_logs","bank_transactions",
        "bank_transactions_enrichment_audit","categories","channel_price_lists",
        "channel_pricing","channel_pricing_history","channel_product_metadata",
        "client_consultations","collection_images","collection_products",
        "collection_shares","collections","consultation_emails","consultation_images",
        "consultation_products","contacts","counterparty_bank_accounts",
        "customer_addresses","customer_groups","customer_pricing","email_templates",
        "enseignes","families","feed_configs","finance_settings",
        "financial_document_items","financial_documents","fiscal_obligations_done",
        "fixed_asset_depreciations","fixed_assets","form_submission_messages",
        "form_submissions","form_types","google_merchant_syncs","group_price_lists",
        "individual_customers","linkme_affiliates","linkme_channel_suppliers",
        "linkme_commissions","linkme_info_requests","linkme_onboarding_progress",
        "linkme_page_configurations","linkme_payment_request_items",
        "linkme_payment_requests","linkme_selection_items","linkme_selections",
        "matching_rules","mcp_resolution_queue","mcp_resolution_strategies",
        "meta_commerce_syncs","newsletter_subscribers","notifications",
        "order_discounts","order_payments","organisation_families","organisations",
        "pcg_categories","price_list_history","price_list_items","price_lists",
        "product_colors","product_commission_history","product_group_members",
        "product_groups","product_images","product_packages","product_purchase_history",
        "product_reviews","products","purchase_order_items","purchase_order_receptions",
        "purchase_orders","sales_channels","sales_order_events","sales_order_items",
        "sales_order_linkme_details","sales_order_shipments","sales_orders",
        "sample_order_items","sample_orders","shopping_carts","site_contact_messages",
        "site_content","stock_alert_tracking","stock_movements","stock_reservations",
        "storage_allocations","storage_billing_events","storage_pricing_tiers",
        "subcategories","sync_runs","transaction_document_links","user_activity_logs",
        "user_app_roles","user_notification_preferences","user_profiles",
        "user_sessions","variant_groups","webhook_configs","webhook_logs",
    ]

    # columns_by_table is loaded from the embedded JSON file if available
    # otherwise returns empty (caller handles gracefully)
    columns_by_table = {}
    fk_map = defaultdict(list)
    rls_map = defaultdict(list)
    trigger_map = defaultdict(list)
    enums = defaultdict(list)

    # Try to load from live DB via psycopg2
    db_url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if db_url:
        try:
            import psycopg2
            import psycopg2.extras
            conn = psycopg2.connect(db_url)
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Columns
            cur.execute("""
                SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position
            """)
            for row in cur.fetchall():
                t = row["table_name"]
                if t not in columns_by_table:
                    columns_by_table[t] = []
                columns_by_table[t].append(dict(row))

            # FKs
            cur.execute("""
                SELECT tc.table_name as source_table, kcu.column_name as source_column,
                       ccu.table_name AS target_table, ccu.column_name AS target_column
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
                ORDER BY tc.table_name, kcu.column_name
            """)
            for row in cur.fetchall():
                fk_map[row["source_table"]].append(dict(row))

            # RLS
            cur.execute("""
                SELECT tablename, policyname, permissive, roles::text, cmd, LEFT(qual,150) as qual
                FROM pg_policies WHERE schemaname = 'public'
                ORDER BY tablename, cmd
            """)
            for row in cur.fetchall():
                rls_map[row["tablename"]].append(dict(row))

            # Triggers
            cur.execute("""
                SELECT trigger_name, event_manipulation, event_object_table, action_timing
                FROM information_schema.triggers WHERE trigger_schema = 'public'
                ORDER BY event_object_table, trigger_name
            """)
            for row in cur.fetchall():
                trigger_map[row["event_object_table"]].append(dict(row))

            # Enums
            cur.execute("""
                SELECT t.typname as enum_name, e.enumlabel as enum_value
                FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
                WHERE n.nspname = 'public'
                ORDER BY t.typname, e.enumsortorder
            """)
            for row in cur.fetchall():
                enums[row["enum_name"]].append(row["enum_value"])

            conn.close()
            print("Connected to live DB via psycopg2")
            return tables, columns_by_table, fk_map, rls_map, trigger_map, enums

        except Exception as e:
            print(f"psycopg2 failed: {e}")
            print("Falling back to embedded snapshot data...")

    # Load embedded snapshot
    snapshot_path = os.path.join(os.path.dirname(__file__), "db-schema-snapshot.json")
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
        print("Documentation will be generated with table/column structure only (partial).")

    return tables, columns_by_table, fk_map, rls_map, trigger_map, enums


# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    tables, columns_by_table, fk_map, rls_map, trigger_map, enums = load_data()

    # Assign domains
    domain_tables = defaultdict(list)
    for t in sorted(tables):
        domain = assign_domain(t)
        domain_tables[domain].append(t)

    # Stats
    total_tables = len(tables)
    total_fks = sum(len(v) for v in fk_map.values())
    total_rls = sum(len(v) for v in rls_map.values())
    total_triggers = sum(len(v) for v in trigger_map.values())
    total_enums = len(enums)

    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    # ── Generate domain files ──
    for domain, label in DOMAIN_LABELS.items():
        filename = DOMAIN_FILES[domain]
        filepath = os.path.join(OUTPUT_DIR, filename)
        tbls = sorted(domain_tables.get(domain, []))

        lines = []
        lines.append(f"# Domaine {label} — Schema Base de Donnees")
        lines.append("")
        lines.append(f"_Generated: {generated_at}_")
        lines.append("")
        lines.append(f"**Tables : {len(tbls)}**")
        lines.append("")
        if tbls:
            lines.append("| Table | Colonnes | FK | RLS | Triggers |")
            lines.append("|-------|----------|----|-----|----------|")
            for t in tbls:
                cols = columns_by_table.get(t, [])
                fks = len(fk_map.get(t, []))
                rls = len(rls_map.get(t, []))
                trgs_set = set(tr["trigger_name"] for tr in trigger_map.get(t, []))
                lines.append(f"| [{t}](#{t.replace('_', '-')}) | {len(cols)} | {fks} | {rls} | {len(trgs_set)} |")
            lines.append("")

        for table_name in tbls:
            cols = columns_by_table.get(table_name, [])
            lines.append(render_table_section(table_name, cols, fk_map, rls_map, trigger_map))

        with open(filepath, "w") as f:
            f.write("\n".join(lines))
        print(f"  Written: {filepath}")

    # ── Generate 00-SUMMARY.md ──
    summary_path = os.path.join(OUTPUT_DIR, "00-SUMMARY.md")
    lines = []
    lines.append("# Schema Base de Donnees Verone — Sommaire")
    lines.append("")
    lines.append(f"_Generated: {generated_at}_")
    lines.append("")
    lines.append("## Stats Globales")
    lines.append("")
    lines.append("| Metrique | Valeur |")
    lines.append("|----------|--------|")
    lines.append(f"| Tables | {total_tables} |")
    lines.append(f"| Foreign Keys | {total_fks} |")
    lines.append(f"| RLS Policies | {total_rls} |")
    lines.append(f"| Triggers | {total_triggers} |")
    lines.append(f"| Enums | {total_enums} |")
    lines.append("")

    lines.append("## Index des Domaines")
    lines.append("")
    lines.append("| # | Domaine | Tables | Fichier |")
    lines.append("|---|---------|--------|---------|")
    for i, (domain, label) in enumerate(DOMAIN_LABELS.items(), 1):
        filename = DOMAIN_FILES[domain]
        count = len(domain_tables.get(domain, []))
        lines.append(f"| {i:02d} | {label} | {count} | [{filename}]({filename}) |")
    lines.append("")

    lines.append("## Enums")
    lines.append("")
    for enum_name in sorted(enums.keys()):
        values = enums[enum_name]
        lines.append(f"**`{enum_name}`** : {' | '.join(f'`{v}`' for v in values)}")
        lines.append("")

    lines.append("## Relations Inter-Domaines")
    lines.append("")
    lines.append("```")
    lines.append("Organisations ←── Contacts (contacts.organisation_id)")
    lines.append("Organisations ←── Enseignes (organisations.enseigne_id)")
    lines.append("Organisations ←── Produits (products.supplier_id)")
    lines.append("Produits ←── Commandes-SO (sales_order_items.product_id)")
    lines.append("Produits ←── Commandes-PO (purchase_order_items.product_id)")
    lines.append("Produits ←── Stock (stock_movements.product_id)")
    lines.append("Commandes-SO ←── Finance (financial_documents.sales_order_id)")
    lines.append("Commandes-PO ←── Finance (financial_documents.purchase_order_id)")
    lines.append("Finance ←── BankTx (transaction_document_links.document_id)")
    lines.append("LinkMe ←── Commandes-SO (sales_orders.linkme_selection_id)")
    lines.append("LinkMe ←── Finance (financial_documents.linkme_affiliate_id)")
    lines.append("LinkMe ←── Stock (affiliate_storage_allocations.product_id)")
    lines.append("Utilisateurs ←── Toutes tables (created_by, user_id)")
    lines.append("```")
    lines.append("")

    with open(summary_path, "w") as f:
        f.write("\n".join(lines))
    print(f"  Written: {summary_path}")

    # ── Generate DATABASE-SCHEMA-COMPLETE.md ──
    index_path = os.path.join(OUTPUT_DIR, "..", "DATABASE-SCHEMA-COMPLETE.md")
    lines = []
    lines.append("# Database Schema Complete — Index")
    lines.append("")
    lines.append(f"_Generated: {generated_at} — {total_tables} tables, {total_fks} FK, {total_rls} RLS, {total_triggers} triggers_")
    lines.append("")
    lines.append("## Domaines")
    lines.append("")
    lines.append("| Domaine | Tables | Fichier |")
    lines.append("|---------|--------|---------|")
    for domain, label in DOMAIN_LABELS.items():
        filename = DOMAIN_FILES[domain]
        count = len(domain_tables.get(domain, []))
        lines.append(f"| {label} | {count} | [schema/{filename}](schema/{filename}) |")
    lines.append("")
    lines.append("## Toutes les Tables (ordre alphabetique)")
    lines.append("")
    lines.append("| Table | Domaine | Colonnes | FK | RLS | Triggers |")
    lines.append("|-------|---------|----------|----|-----|----------|")
    for t in sorted(tables):
        domain = assign_domain(t)
        label = DOMAIN_LABELS[domain]
        cols = columns_by_table.get(t, [])
        fks = len(fk_map.get(t, []))
        rls = len(rls_map.get(t, []))
        trgs_set = set(tr["trigger_name"] for tr in trigger_map.get(t, []))
        filename = DOMAIN_FILES[domain]
        lines.append(f"| [{t}](schema/{filename}#{t.replace('_','-')}) | {label} | {len(cols)} | {fks} | {rls} | {len(trgs_set)} |")
    lines.append("")

    with open(index_path, "w") as f:
        f.write("\n".join(lines))
    print(f"  Written: {index_path}")

    print(f"\nDone. {total_tables} tables documented across {len(DOMAIN_LABELS)} domains.")


if __name__ == "__main__":
    main()
