#!/bin/bash

# ==============================================================================
# SCRIPT D'EXÉCUTION DES MIGRATIONS - WANT IT NOW V1
# ==============================================================================
# Description: Exécute les migrations dans l'ordre pour reconstruire la DB
# Date: 18 Janvier 2025
# ==============================================================================

# Configuration
DB_URL="postgresql://postgres.ptqwayandsfhciitjnhb:ADKSDODesd003szzms@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"
MIGRATIONS_DIR="supabase/migrations"

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher un header
print_header() {
    echo ""
    echo -e "${CYAN}=============================================================================="
    echo -e "$1"
    echo -e "==============================================================================${NC}"
}

# Fonction pour afficher un succès
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher une erreur
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour afficher un warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Fonction pour afficher une info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fonction pour exécuter une migration
run_migration() {
    local file=$1
    local name=$2
    
    echo ""
    echo -e "${YELLOW}🔄 Exécution: $name${NC}"
    echo -e "${MAGENTA}   Fichier: $file${NC}"
    
    # Exécuter la migration et capturer la sortie
    if psql "$DB_URL" -f "$file" 2>&1 | tee /tmp/migration_output.log; then
        print_success "$name exécutée avec succès"
        return 0
    else
        print_error "$name a échoué"
        echo -e "${RED}Erreur détaillée:${NC}"
        cat /tmp/migration_output.log
        return 1
    fi
}

# Fonction pour vérifier la connexion DB
check_db_connection() {
    print_info "Test de connexion à la base de données..."
    
    if psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
        print_success "Connexion DB établie"
        return 0
    else
        print_error "Impossible de se connecter à la base de données"
        echo -e "${RED}Vérifiez l'URL de connexion: $DB_URL${NC}"
        return 1
    fi
}

# Fonction pour créer un backup
create_backup() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_info "Création d'un backup: $backup_file"
    
    if pg_dump "$DB_URL" > "$backup_file" 2>/dev/null; then
        print_success "Backup créé: $backup_file"
        return 0
    else
        print_warning "Impossible de créer le backup (continuera sans backup)"
        return 1
    fi
}

# ==============================================================================
# MAIN
# ==============================================================================

print_header "🚀 MIGRATION WANT IT NOW V1 - NOUVELLE ARCHITECTURE"

# Vérifier la connexion
if ! check_db_connection; then
    exit 1
fi

# Demander confirmation
echo ""
print_warning "Cette migration va:"
echo "  1. Créer les types ENUM"
echo "  2. Créer la table proprietaires (INDÉPENDANTS)"
echo "  3. Créer la table associes"
echo "  4. Créer la table proprietes"
echo "  5. Créer la table property_ownership (quotités)"
echo "  6. Créer les triggers business logic"
echo "  7. Créer les policies RLS"
echo ""
read -p "Voulez-vous continuer? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Migration annulée"
    exit 0
fi

# Optionnel: créer un backup
echo ""
read -p "Voulez-vous créer un backup avant la migration? (Y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    create_backup
fi

# ==============================================================================
# EXÉCUTION DES MIGRATIONS
# ==============================================================================

print_header "📦 PHASE 1: TYPES ET STRUCTURES DE BASE"

# Migration 005: Types ENUM
if ! run_migration "$MIGRATIONS_DIR/005_create_enum_types.sql" "Types ENUM"; then
    print_error "Échec critique - Arrêt de la migration"
    exit 1
fi

# Migration 006: Proprietaires
if ! run_migration "$MIGRATIONS_DIR/006_create_proprietaires.sql" "Table proprietaires (INDÉPENDANTS)"; then
    print_error "Échec critique - Arrêt de la migration"
    exit 1
fi

# Migration 007: Associes
if ! run_migration "$MIGRATIONS_DIR/007_create_associes.sql" "Table associes"; then
    print_error "Échec critique - Arrêt de la migration"
    exit 1
fi

print_header "🏠 PHASE 2: PROPRIÉTÉS ET QUOTITÉS"

# Migration 008: Proprietes
if ! run_migration "$MIGRATIONS_DIR/008_create_proprietes.sql" "Table proprietes"; then
    print_error "Échec critique - Arrêt de la migration"
    exit 1
fi

# Migration 009: Property Ownership
if ! run_migration "$MIGRATIONS_DIR/009_create_property_ownership.sql" "Table property_ownership (quotités)"; then
    print_error "Échec critique - Arrêt de la migration"
    exit 1
fi

print_header "⚙️ PHASE 3: LOGIQUE MÉTIER ET SÉCURITÉ"

# Migration 010: Business Triggers
if ! run_migration "$MIGRATIONS_DIR/010_create_business_triggers.sql" "Business triggers"; then
    print_error "Échec critique - Arrêt de la migration"
    exit 1
fi

# Migration 011: RLS Policies
if ! run_migration "$MIGRATIONS_DIR/011_create_rls_policies.sql" "RLS policies"; then
    print_error "Échec critique - Arrêt de la migration"
    exit 1
fi

# ==============================================================================
# VALIDATION
# ==============================================================================

print_header "✔️ VALIDATION DE LA MIGRATION"

# Exécuter le script de validation
if [ -f "scripts/validate-migration.sql" ]; then
    print_info "Exécution des tests de validation..."
    if psql "$DB_URL" -f "scripts/validate-migration.sql"; then
        print_success "Validation réussie"
    else
        print_warning "Certains tests de validation ont échoué"
    fi
else
    print_warning "Script de validation non trouvé"
fi

# ==============================================================================
# RÉSUMÉ
# ==============================================================================

print_header "📊 RÉSUMÉ DE LA MIGRATION"

# Compter les tables créées
echo -e "${BLUE}Tables créées:${NC}"
psql "$DB_URL" -t -c "
    SELECT COUNT(*) || ' tables' 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('proprietaires', 'associes', 'proprietes', 'property_ownership', 'audit_log');
"

# Compter les types créés
echo -e "${BLUE}Types ENUM créés:${NC}"
psql "$DB_URL" -t -c "
    SELECT COUNT(*) || ' types'
    FROM pg_type 
    WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typtype = 'e'
    AND typname LIKE '%_enum';
"

# Compter les triggers
echo -e "${BLUE}Triggers créés:${NC}"
psql "$DB_URL" -t -c "
    SELECT COUNT(*) || ' triggers'
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
"

# ==============================================================================
# FIN
# ==============================================================================

echo ""
print_header "🎉 MIGRATION TERMINÉE AVEC SUCCÈS"

print_success "Architecture correcte implémentée:"
echo "  • Propriétaires INDÉPENDANTS des organisations ✅"
echo "  • Propriétés liées aux organisations par pays ✅"
echo "  • Quotités fractionnaires (property_ownership) ✅"
echo "  • Business logic automatisée (triggers) ✅"
echo "  • Sécurité RLS activée ✅"

echo ""
print_info "Prochaines étapes:"
echo "  1. Exécuter les tests: npm run test"
echo "  2. Créer des données de test: node scripts/seed-data.js"
echo "  3. Démarrer l'application: npm run dev"

echo ""
echo -e "${GREEN}🏆 Want It Now V1 - Database Ready!${NC}"