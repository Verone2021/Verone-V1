#!/bin/bash
# Parse Supabase migrations to extract database objects
# Usage: ./parse-migrations.sh

MIGRATIONS_DIR="/Users/romeodossantos/verone-back-office-V1/supabase/migrations"

echo "=== DATABASE INVENTORY FROM MIGRATIONS ==="
echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

echo "=== TABLES (excluding backups and audits) ==="
grep -hE "CREATE TABLE( IF NOT EXISTS)?" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
  grep -v "^--" | \
  sed 's/CREATE TABLE IF NOT EXISTS //I' | \
  sed 's/CREATE TABLE //I' | \
  sed 's/public\.//g' | \
  sed 's/ .*$//' | \
  sed 's/(.*$//' | \
  grep -v "^_backup_" | \
  grep -v "^_stock_audit_" | \
  sort -u | \
  nl
echo ""

echo "=== FUNCTIONS ==="
grep -hE "CREATE( OR REPLACE)? FUNCTION" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
  grep -v "^--" | \
  sed 's/CREATE OR REPLACE FUNCTION //I' | \
  sed 's/CREATE FUNCTION //I' | \
  sed 's/public\.//g' | \
  sed 's/(.*$//' | \
  sort -u | \
  nl
echo ""

echo "=== VIEWS ==="
grep -hE "CREATE( OR REPLACE)? VIEW" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
  grep -v "^--" | \
  sed 's/CREATE OR REPLACE VIEW //I' | \
  sed 's/CREATE VIEW //I' | \
  sed 's/public\.//g' | \
  sed 's/ AS.*$//' | \
  sort -u | \
  nl
echo ""

echo "=== TRIGGERS ==="
grep -hE "CREATE TRIGGER" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
  grep -v "^--" | \
  sed 's/CREATE TRIGGER //I' | \
  sed 's/ BEFORE.*$//' | \
  sed 's/ AFTER.*$//' | \
  sed 's/ INSTEAD OF.*$//' | \
  sort -u | \
  nl
echo ""

echo "=== INDEXES ==="
grep -hE "CREATE( UNIQUE)? INDEX" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
  grep -v "^--" | \
  sed 's/CREATE UNIQUE INDEX //I' | \
  sed 's/CREATE INDEX //I' | \
  sed 's/ ON.*$//' | \
  sort -u | \
  nl
echo ""

echo "=== RLS ENABLED TABLES ==="
grep -hE "ENABLE ROW LEVEL SECURITY" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
  grep -v "^--" | \
  sed 's/ALTER TABLE //I' | \
  sed 's/ ENABLE ROW LEVEL SECURITY.*$//' | \
  sed 's/public\.//g' | \
  sort -u | \
  nl
echo ""

echo "=== POLICIES ==="
grep -hE "CREATE POLICY" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | \
  grep -v "^--" | \
  sed 's/CREATE POLICY //I' | \
  sed 's/ ON.*$//' | \
  sort -u | \
  nl
echo ""

echo "=== SUMMARY ==="
TABLES=$(grep -hE "CREATE TABLE( IF NOT EXISTS)?" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "^--" | grep -v "_backup_" | grep -v "_stock_audit_" | wc -l | tr -d ' ')
FUNCTIONS=$(grep -hE "CREATE( OR REPLACE)? FUNCTION" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "^--" | wc -l | tr -d ' ')
VIEWS=$(grep -hE "CREATE( OR REPLACE)? VIEW" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "^--" | wc -l | tr -d ' ')
TRIGGERS=$(grep -hE "CREATE TRIGGER" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "^--" | wc -l | tr -d ' ')
INDEXES=$(grep -hE "CREATE( UNIQUE)? INDEX" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "^--" | wc -l | tr -d ' ')
POLICIES=$(grep -hE "CREATE POLICY" "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "^--" | wc -l | tr -d ' ')

echo "Tables (non-backup): $TABLES"
echo "Functions: $FUNCTIONS"
echo "Views: $VIEWS"
echo "Triggers: $TRIGGERS"
echo "Indexes: $INDEXES"
echo "Policies: $POLICIES"
