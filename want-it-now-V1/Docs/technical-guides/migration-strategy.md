# 🚀 Guide Technique Migration Strategy - Want It Now V1

> **Guide complet pour la stratégie de migration database avec Supabase et PostgreSQL**

## 📋 **Vue d'ensemble**

Ce guide détaille la stratégie de migration pour Want It Now V1, depuis le nettoyage de l'architecture incorrecte jusqu'à l'implémentation de la nouvelle architecture avec propriétaires indépendants et quotités.

## 🏗️ **État Actuel Post-Nettoyage**

### **Tables Conservées (Fonctionnelles)**

```sql
-- Tables essentielles après nettoyage (18 janvier 2025)
┌─────────────────────────────────┬────────────┐
│ Table                           │ Status     │
├─────────────────────────────────┼────────────┤
│ organisations                   │ ✅ Active  │
│ utilisateurs                    │ ✅ Active  │
│ user_roles                      │ ✅ Active  │
│ user_organisation_assignments  │ ✅ Active  │
│ pending_auth_users             │ ✅ Active  │
│ pending_auth_deletions         │ ✅ Active  │
└─────────────────────────────────┴────────────┘
```

### **Tables Supprimées (Obsolètes)**

```sql
-- Tables supprimées car architecture incorrecte
┌─────────────────────────────────┬────────────┐
│ Table                           │ Status     │
├─────────────────────────────────┼────────────┤
│ proprietaires (ancienne)        │ ❌ Deleted │
│ proprietes (ancienne)           │ ❌ Deleted │
│ associes (ancienne)             │ ❌ Deleted │
│ unites                          │ ❌ Deleted │
│ propriete_photos                │ ❌ Deleted │
│ propriete_quotites              │ ❌ Deleted │
│ contrats                        │ ❌ Deleted │
│ contrat_documents               │ ❌ Deleted │
│ user_property_assignments      │ ❌ Deleted │
└─────────────────────────────────┴────────────┘
```

## 📊 **Stratégie de Migration en Phases**

### **Phase 1: Préparation & Validation** ✅ COMPLÉTÉ

```sql
-- Script exécuté : cleanup-obsolete-tables.sql
BEGIN;

-- 1. Backup des données importantes (si nécessaire)
-- Aucune donnée critique trouvée (seulement données test)

-- 2. Suppression tables obsolètes
DROP TABLE IF EXISTS contrat_documents CASCADE;
DROP TABLE IF EXISTS contrats CASCADE;
-- ... etc

-- 3. Validation
COMMIT;
```

### **Phase 2: Création Types & Enums**

```sql
-- Migration 005: Create enum types
BEGIN;

-- Types pour propriétaires
CREATE TYPE proprietaire_type_enum AS ENUM (
    'physique',
    'morale'
);

-- Types pour propriétés  
CREATE TYPE propriete_type_enum AS ENUM (
    'appartement',
    'maison',
    'villa',
    'studio',
    'loft',
    'duplex',
    'penthouse',
    'immeuble_petit',    -- < 10 unités
    'immeuble_moyen',    -- 10-50 unités
    'immeuble_grand',    -- > 50 unités
    'terrain',
    'parking',
    'local_commercial',
    'bureau',
    'entrepot',
    'hotel',
    'autre'
);

-- Statuts propriétés
CREATE TYPE propriete_statut_enum AS ENUM (
    'brouillon',
    'sourcing',
    'evaluation', 
    'negociation',
    'achetee',
    'disponible',
    'louee',
    'vendue'
);

-- Type associé
CREATE TYPE associe_type_enum AS ENUM (
    'physique',
    'morale'
);

COMMIT;
```

### **Phase 3: Tables Core Business**

```sql
-- Migration 006: Create proprietaires (indépendants)
BEGIN;

CREATE TABLE proprietaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- PAS de organisation_id ! Architecture correcte
    
    -- Type
    type proprietaire_type_enum NOT NULL,
    
    -- Informations communes
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255), -- NULL pour morales
    email VARCHAR(255),
    telephone VARCHAR(50),
    
    -- Personne physique
    date_naissance DATE,
    lieu_naissance VARCHAR(255),
    nationalite VARCHAR(100),
    
    -- Personne morale
    forme_juridique VARCHAR(100),
    numero_identification VARCHAR(100),
    capital_social DECIMAL(15,2),
    nombre_parts_total INTEGER,
    date_creation DATE,
    
    -- Adresse
    adresse TEXT,
    ville VARCHAR(255),
    code_postal VARCHAR(20),
    pays VARCHAR(100),
    
    -- Metadata
    is_brouillon BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES utilisateurs(id),
    
    -- Contraintes
    CONSTRAINT check_personne_physique CHECK (
        type = 'morale' OR prenom IS NOT NULL
    ),
    CONSTRAINT check_personne_morale CHECK (
        type = 'physique' OR forme_juridique IS NOT NULL
    )
);

-- Index pour performance
CREATE INDEX idx_proprietaires_type ON proprietaires(type);
CREATE INDEX idx_proprietaires_active ON proprietaires(is_active) WHERE is_active = true;
CREATE INDEX idx_proprietaires_nom_trgm ON proprietaires USING gin (nom gin_trgm_ops);

COMMIT;
```

```sql
-- Migration 007: Create associes
BEGIN;

CREATE TABLE associes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID REFERENCES proprietaires(id) ON DELETE CASCADE NOT NULL,
    organisation_id UUID REFERENCES organisations(id) NOT NULL,
    
    -- Type associé
    type associe_type_enum NOT NULL,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255), -- NULL pour morales
    
    -- Parts sociales
    nombre_parts INTEGER NOT NULL CHECK (nombre_parts > 0),
    pourcentage_detention DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN (SELECT nombre_parts_total FROM proprietaires WHERE id = proprietaire_id) > 0
            THEN (nombre_parts::DECIMAL / (SELECT nombre_parts_total FROM proprietaires WHERE id = proprietaire_id) * 100)
            ELSE 0
        END
    ) STORED,
    
    -- Personne physique
    date_naissance DATE,
    lieu_naissance VARCHAR(255),
    nationalite VARCHAR(100),
    
    -- Ordre affichage
    ordre_affichage INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_associes_proprietaire ON associes(proprietaire_id);
CREATE INDEX idx_associes_organisation ON associes(organisation_id);

COMMIT;
```

```sql
-- Migration 008: Create proprietes
BEGIN;

CREATE TABLE proprietes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) NOT NULL,
    
    -- Informations générales
    nom VARCHAR(255) NOT NULL,
    type propriete_type_enum NOT NULL,
    description TEXT,
    
    -- Localisation
    adresse_ligne1 TEXT,
    adresse_ligne2 TEXT,
    ville VARCHAR(255),
    code_postal VARCHAR(20),
    pays CHAR(2) NOT NULL DEFAULT 'FR',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Caractéristiques
    surface_m2 DECIMAL(10,2),
    nombre_pieces INTEGER,
    nombre_chambres INTEGER,
    nombre_sdb INTEGER,
    etage INTEGER,
    nombre_etages_total INTEGER,
    annee_construction INTEGER,
    
    -- Structure
    a_unites BOOLEAN DEFAULT false,
    nombre_unites INTEGER DEFAULT 1,
    
    -- Financier
    prix_acquisition DECIMAL(15,2),
    valeur_actuelle DECIMAL(15,2),
    loyer_mensuel DECIMAL(10,2),
    charges_mensuelles DECIMAL(10,2),
    taxe_fonciere_annuelle DECIMAL(10,2),
    
    -- Statut
    statut propriete_statut_enum DEFAULT 'brouillon',
    date_changement_statut TIMESTAMPTZ DEFAULT NOW(),
    date_acquisition DATE,
    date_mise_location DATE,
    
    -- Metadata
    is_brouillon BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES utilisateurs(id),
    
    -- Contraintes
    CONSTRAINT check_unites_coherence CHECK (
        (a_unites = false AND nombre_unites = 1) OR
        (a_unites = true AND nombre_unites > 1)
    )
);

-- Index
CREATE INDEX idx_proprietes_organisation ON proprietes(organisation_id);
CREATE INDEX idx_proprietes_statut ON proprietes(statut);
CREATE INDEX idx_proprietes_pays ON proprietes(pays);
CREATE INDEX idx_proprietes_active ON proprietes(is_active) WHERE is_active = true;

COMMIT;
```

### **Phase 4: Table de Quotités (Relation N-à-N)**

```sql
-- Migration 009: Create property_ownership (quotités)
BEGIN;

CREATE TABLE property_ownership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID REFERENCES proprietaires(id) ON DELETE CASCADE NOT NULL,
    propriete_id UUID REFERENCES proprietes(id) ON DELETE CASCADE NOT NULL,
    
    -- Quotité fractionnaire
    quotite_numerateur INTEGER NOT NULL CHECK (quotite_numerateur > 0),
    quotite_denominateur INTEGER NOT NULL CHECK (quotite_denominateur > 0),
    
    -- Pourcentage calculé
    pourcentage DECIMAL(5,2) GENERATED ALWAYS AS (
        (quotite_numerateur::DECIMAL / quotite_denominateur::DECIMAL) * 100
    ) STORED,
    
    -- Temporalité
    date_debut DATE DEFAULT CURRENT_DATE,
    date_fin DATE,
    
    -- Informations acquisition
    prix_acquisition DECIMAL(15,2),
    frais_notaire DECIMAL(10,2),
    mode_acquisition VARCHAR(50), -- 'achat', 'heritage', 'donation'
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT quotites_valid CHECK (quotite_numerateur <= quotite_denominateur),
    CONSTRAINT dates_coherent CHECK (date_fin IS NULL OR date_fin >= date_debut),
    CONSTRAINT unique_active_ownership UNIQUE(proprietaire_id, propriete_id, date_fin)
);

-- Index
CREATE INDEX idx_ownership_proprietaire ON property_ownership(proprietaire_id);
CREATE INDEX idx_ownership_propriete ON property_ownership(propriete_id);
CREATE INDEX idx_ownership_active ON property_ownership(propriete_id) 
    WHERE date_fin IS NULL;

COMMIT;
```

### **Phase 5: Triggers Business Logic**

```sql
-- Migration 010: Create business triggers
BEGIN;

-- 1. Auto-assignment organisation par pays
CREATE OR REPLACE FUNCTION assign_organisation_by_pays()
RETURNS TRIGGER AS $$
BEGIN
    -- Si organisation_id non fourni, assigner par pays
    IF NEW.organisation_id IS NULL THEN
        SELECT id INTO NEW.organisation_id
        FROM organisations
        WHERE pays = NEW.pays
        AND is_active = true
        LIMIT 1;
        
        IF NEW.organisation_id IS NULL THEN
            RAISE EXCEPTION 'Aucune organisation active pour le pays: %', NEW.pays;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_assign_organisation
    BEFORE INSERT ON proprietes
    FOR EACH ROW 
    WHEN (NEW.organisation_id IS NULL)
    EXECUTE FUNCTION assign_organisation_by_pays();

-- 2. Validation quotités <= 100%
CREATE OR REPLACE FUNCTION validate_quotites_total()
RETURNS TRIGGER AS $$
DECLARE
    total_quotites DECIMAL(10,4);
BEGIN
    -- Calculer total pour cette propriété
    SELECT COALESCE(SUM(
        quotite_numerateur::DECIMAL / quotite_denominateur::DECIMAL
    ), 0) INTO total_quotites
    FROM property_ownership
    WHERE propriete_id = COALESCE(NEW.propriete_id, OLD.propriete_id)
    AND date_fin IS NULL;
    
    IF total_quotites > 1.0001 THEN -- Tolérance floating point
        RAISE EXCEPTION 'Total quotités dépasse 100%% : %', total_quotites * 100;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_quotites
    AFTER INSERT OR UPDATE OR DELETE ON property_ownership
    FOR EACH ROW EXECUTE FUNCTION validate_quotites_total();

-- 3. Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_timestamp_proprietaires
    BEFORE UPDATE ON proprietaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_update_timestamp_proprietes
    BEFORE UPDATE ON proprietes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
```

### **Phase 6: Row Level Security**

```sql
-- Migration 011: Create RLS policies
BEGIN;

-- Enable RLS
ALTER TABLE proprietaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprietes ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE associes ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_organisation_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_super_admin() OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND organisation_id = org_id
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies Propriétaires (accessibles globalement pour sélection)
CREATE POLICY "proprietaires_select" ON proprietaires
    FOR SELECT TO authenticated
    USING (true); -- Tous peuvent voir pour sélection

CREATE POLICY "proprietaires_insert" ON proprietaires
    FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

CREATE POLICY "proprietaires_update" ON proprietaires
    FOR UPDATE TO authenticated
    USING (is_super_admin() OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

-- Policies Propriétés (filtrées par organisation)
CREATE POLICY "proprietes_select" ON proprietes
    FOR SELECT TO authenticated
    USING (has_organisation_access(organisation_id));

CREATE POLICY "proprietes_insert" ON proprietes
    FOR INSERT TO authenticated
    WITH CHECK (has_organisation_access(organisation_id));

CREATE POLICY "proprietes_update" ON proprietes
    FOR UPDATE TO authenticated
    USING (has_organisation_access(organisation_id));

-- Policies Quotités (basées sur accès propriété)
CREATE POLICY "ownership_select" ON property_ownership
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM proprietes p
        WHERE p.id = property_ownership.propriete_id
        AND has_organisation_access(p.organisation_id)
    ));

CREATE POLICY "ownership_insert" ON property_ownership
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM proprietes p
        WHERE p.id = property_ownership.propriete_id
        AND has_organisation_access(p.organisation_id)
    ));

COMMIT;
```

## 🔄 **Rollback Strategy**

### **Script de Rollback d'Urgence**

```sql
-- rollback-emergency.sql
BEGIN;

-- Sauvegarder les données critiques si nécessaire
CREATE TABLE backup_proprietaires AS SELECT * FROM proprietaires;
CREATE TABLE backup_proprietes AS SELECT * FROM proprietes;

-- Supprimer les nouvelles tables dans l'ordre inverse
DROP TABLE IF EXISTS property_ownership CASCADE;
DROP TABLE IF EXISTS associes CASCADE;
DROP TABLE IF EXISTS proprietes CASCADE;
DROP TABLE IF EXISTS proprietaires CASCADE;

-- Supprimer les types
DROP TYPE IF EXISTS proprietaire_type_enum CASCADE;
DROP TYPE IF EXISTS propriete_type_enum CASCADE;
DROP TYPE IF EXISTS propriete_statut_enum CASCADE;
DROP TYPE IF EXISTS associe_type_enum CASCADE;

-- Restaurer depuis backup si nécessaire
-- (À implémenter selon besoins)

ROLLBACK; -- ou COMMIT si sûr
```

## 📊 **Monitoring & Validation**

### **Requêtes de Validation Post-Migration**

```sql
-- 1. Vérifier intégrité des quotités
SELECT 
    p.nom as propriete,
    SUM(po.quotite_numerateur::DECIMAL / po.quotite_denominateur) as total_quotites,
    CASE 
        WHEN SUM(po.quotite_numerateur::DECIMAL / po.quotite_denominateur) = 1 
        THEN '✅ OK'
        WHEN SUM(po.quotite_numerateur::DECIMAL / po.quotite_denominateur) < 1 
        THEN '⚠️ Incomplet'
        ELSE '❌ Dépassement'
    END as statut
FROM proprietes p
LEFT JOIN property_ownership po ON po.propriete_id = p.id
WHERE po.date_fin IS NULL
GROUP BY p.id, p.nom;

-- 2. Vérifier cohérence associés
SELECT 
    p.nom as proprietaire,
    p.nombre_parts_total,
    COALESCE(SUM(a.nombre_parts), 0) as parts_attribuees,
    CASE 
        WHEN p.nombre_parts_total = COALESCE(SUM(a.nombre_parts), 0)
        THEN '✅ OK'
        ELSE '❌ Incohérent'
    END as statut
FROM proprietaires p
LEFT JOIN associes a ON a.proprietaire_id = p.id
WHERE p.type = 'morale'
GROUP BY p.id, p.nom, p.nombre_parts_total;

-- 3. Statistiques globales
SELECT 
    'Propriétaires' as entite,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active THEN 1 END) as actifs,
    COUNT(CASE WHEN is_brouillon THEN 1 END) as brouillons
FROM proprietaires
UNION ALL
SELECT 
    'Propriétés' as entite,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active THEN 1 END) as actifs,
    COUNT(CASE WHEN is_brouillon THEN 1 END) as brouillons
FROM proprietes;
```

## 🚀 **Script de Migration Complet**

### **run-migration.sh**

```bash
#!/bin/bash

# Configuration
DB_URL="postgresql://postgres.ptqwayandsfhciitjnhb:ADKSDODesd003szzms@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"
MIGRATIONS_DIR="supabase/migrations"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Want It Now V1 Migration...${NC}"

# Function to run migration
run_migration() {
    local file=$1
    local name=$2
    
    echo -e "${YELLOW}Running: $name${NC}"
    
    if psql "$DB_URL" -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name completed${NC}"
        return 0
    else
        echo -e "${RED}❌ $name failed${NC}"
        return 1
    fi
}

# Run migrations in order
run_migration "$MIGRATIONS_DIR/005_create_enum_types.sql" "Enum Types" || exit 1
run_migration "$MIGRATIONS_DIR/006_create_proprietaires.sql" "Proprietaires Table" || exit 1
run_migration "$MIGRATIONS_DIR/007_create_associes.sql" "Associes Table" || exit 1
run_migration "$MIGRATIONS_DIR/008_create_proprietes.sql" "Proprietes Table" || exit 1
run_migration "$MIGRATIONS_DIR/009_create_property_ownership.sql" "Property Ownership" || exit 1
run_migration "$MIGRATIONS_DIR/010_create_triggers.sql" "Business Triggers" || exit 1
run_migration "$MIGRATIONS_DIR/011_create_rls_policies.sql" "RLS Policies" || exit 1

echo -e "${GREEN}🎉 Migration completed successfully!${NC}"

# Run validation
echo -e "${YELLOW}Running validation...${NC}"
psql "$DB_URL" -f "scripts/validate-migration.sql"
```

## 🧪 **Testing Post-Migration**

### **Test Script**

```typescript
// scripts/test-migration.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testMigration() {
  console.log('🧪 Testing migration...')
  
  try {
    // 1. Test création propriétaire
    const { data: proprietaire, error: propError } = await supabase
      .from('proprietaires')
      .insert({
        type: 'physique',
        nom: 'Test',
        prenom: 'Migration',
        email: 'test@migration.com'
      })
      .select()
      .single()
    
    if (propError) throw propError
    console.log('✅ Propriétaire créé:', proprietaire.id)
    
    // 2. Test création propriété
    const { data: propriete, error: propteError } = await supabase
      .from('proprietes')
      .insert({
        nom: 'Test Propriété',
        type: 'appartement',
        pays: 'FR'
      })
      .select()
      .single()
    
    if (propteError) throw propteError
    console.log('✅ Propriété créée:', propriete.id)
    
    // 3. Test quotité
    const { data: ownership, error: ownerError } = await supabase
      .from('property_ownership')
      .insert({
        proprietaire_id: proprietaire.id,
        propriete_id: propriete.id,
        quotite_numerateur: 1,
        quotite_denominateur: 1
      })
      .select()
      .single()
    
    if (ownerError) throw ownerError
    console.log('✅ Quotité créée: 100%')
    
    // 4. Cleanup
    await supabase.from('property_ownership').delete().eq('id', ownership.id)
    await supabase.from('proprietes').delete().eq('id', propriete.id)
    await supabase.from('proprietaires').delete().eq('id', proprietaire.id)
    
    console.log('🎉 Migration test successful!')
    
  } catch (error) {
    console.error('❌ Migration test failed:', error)
    process.exit(1)
  }
}

testMigration()
```

## 📈 **Performance Considerations**

### **Index Strategy Post-Migration**

```sql
-- Analyse des requêtes lentes
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Voir les requêtes les plus lentes
SELECT 
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
WHERE query LIKE '%proprietes%'
   OR query LIKE '%proprietaires%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Créer index additionnels si nécessaire
CREATE INDEX CONCURRENTLY idx_proprietes_search 
    ON proprietes(nom, ville, statut) 
    WHERE is_active = true;
```

## 🚨 **Troubleshooting Common Issues**

### **Issue 1: Quotités Dépassement**

```sql
-- Diagnostic
SELECT * FROM property_ownership
WHERE propriete_id = 'xxx'
ORDER BY created_at;

-- Fix: Ajuster quotités
UPDATE property_ownership
SET quotite_denominateur = 100
WHERE propriete_id = 'xxx';
```

### **Issue 2: RLS Blocking Access**

```sql
-- Diagnostic
SET ROLE authenticated;
SELECT current_setting('request.jwt.claims', true);

-- Fix: Vérifier policies
SELECT * FROM pg_policies
WHERE tablename = 'proprietes';
```

---

## 📋 **Checklist Migration**

### **Pre-Migration** ✅
- [x] Backup database
- [x] Test rollback procedure
- [x] Review migration scripts
- [x] Notify team

### **Migration** ✅
- [ ] Run migrations in order
- [ ] Validate each step
- [ ] Test critical paths
- [ ] Monitor performance

### **Post-Migration** ✅
- [ ] Run validation queries
- [ ] Test application
- [ ] Monitor errors
- [ ] Document issues

### **Go-Live** ✅
- [ ] Update documentation
- [ ] Train users
- [ ] Monitor metrics
- [ ] Celebrate! 🎉

---

*Guide Migration Strategy v1.0 - Janvier 2025*
*Basé sur manuel Supabase 62 pages PERSONNEL/ + architecture correcte*