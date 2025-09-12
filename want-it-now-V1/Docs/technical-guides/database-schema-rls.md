# 🗄️ Guide Technique Database Schema & RLS - Want It Now V1

> **Guide complet pour l'implémentation du schéma de base de données PostgreSQL avec Row Level Security**

## 📋 **Vue d'ensemble**

Ce guide détaille l'implémentation du schéma de base de données pour Want It Now V1, basé sur les 62 pages d'expertise Supabase du manuel PERSONNEL/ et l'architecture correcte des propriétaires indépendants.

## 🏗️ **Architecture Database**

### **Principes Fondamentaux**

1. **Database-as-Source-of-Truth** : Toute la business logic dans PostgreSQL
2. **Row Level Security** : Multi-tenant sécurisé par organisation
3. **Contraintes déclaratives** : Validation des quotités au niveau SQL
4. **Triggers efficaces** : Automation business logic
5. **Functions SECURITY DEFINER** : Encapsulation logique complexe

### **Relations Entités (Architecture Correcte)**

```sql
-- CORE: Organisations comme entités de gestion par pays
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    pays CHAR(2) NOT NULL DEFAULT 'FR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CORE: Utilisateurs avec rôles multi-tenant
CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CORE: Gestion des rôles par organisation
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES utilisateurs(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, organisation_id, role)
);

-- NEW: Propriétaires indépendants (PAS liés aux organisations)
CREATE TABLE proprietaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- PAS DE organisation_id ! Architecture correcte
    type proprietaire_type_enum NOT NULL,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255), -- NULL pour personnes morales
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
    
    -- Adresse
    adresse TEXT,
    ville VARCHAR(255),
    code_postal VARCHAR(20),
    pays VARCHAR(100),
    
    -- Meta
    is_brouillon BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEW: Associés pour propriétaires de type 'morale'
CREATE TABLE associes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID REFERENCES proprietaires(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES organisations(id) NOT NULL,
    
    type associe_type_enum NOT NULL,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255), -- NULL pour personnes morales
    nombre_parts INTEGER NOT NULL CHECK (nombre_parts > 0),
    ordre_affichage INTEGER DEFAULT 0,
    
    -- Personne physique
    date_naissance DATE,
    lieu_naissance VARCHAR(255),
    nationalite VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEW: Propriétés liées aux organisations (par pays)
CREATE TABLE proprietes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    type propriete_type_enum NOT NULL,
    
    -- Adresse (utilisée pour assignment auto organisation)
    adresse_ligne1 TEXT,
    adresse_ligne2 TEXT,
    ville VARCHAR(255),
    code_postal VARCHAR(20),
    pays CHAR(2) NOT NULL DEFAULT 'FR',
    
    -- Structure
    a_unites BOOLEAN DEFAULT false,
    
    -- Business
    statut propriete_statut_simple DEFAULT 'brouillon',
    date_changement_statut TIMESTAMPTZ DEFAULT NOW(),
    is_brouillon BOOLEAN DEFAULT false,
    
    -- Meta
    created_by UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEW: Table de quotités (relation N-à-N propriétaires ↔ propriétés)
CREATE TABLE property_ownership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID REFERENCES proprietaires(id) ON DELETE CASCADE,
    propriete_id UUID REFERENCES proprietes(id) ON DELETE CASCADE,
    
    -- Quotité (validation: somme = 100% par propriété)
    quotite_numerateur INTEGER NOT NULL CHECK (quotite_numerateur > 0),
    quotite_denominateur INTEGER NOT NULL CHECK (quotite_denominateur > 0),
    
    -- Temporalité
    date_debut DATE DEFAULT CURRENT_DATE,
    date_fin DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT quotites_valid 
        CHECK (quotite_numerateur <= quotite_denominateur),
    CONSTRAINT dates_coherent 
        CHECK (date_fin IS NULL OR date_fin >= date_debut),
    UNIQUE(proprietaire_id, propriete_id) -- Un seul lien actif
);
```

## 🔐 **Row Level Security (RLS)**

### **Stratégie RLS Multi-tenant**

```sql
-- Enable RLS sur toutes les tables sensibles
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprietaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprietes ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE associes ENABLE ROW LEVEL SECURITY;

-- Helper function pour les rôles utilisateur
CREATE OR REPLACE FUNCTION get_user_role(org_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role::TEXT 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND organisation_id = org_id 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function pour super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Policies RLS par Entité**

```sql
-- ORGANISATIONS: Super admins tout, admins leurs organisations
CREATE POLICY "organisations_select_policy" ON organisations 
    FOR SELECT TO authenticated 
    USING (
        is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organisation_id = organisations.id
        )
    );

CREATE POLICY "organisations_insert_policy" ON organisations 
    FOR INSERT TO authenticated 
    WITH CHECK (is_super_admin());

-- PROPRIÉTAIRES: Indépendants, accessibles par toutes organisations
CREATE POLICY "proprietaires_select_policy" ON proprietaires 
    FOR SELECT TO authenticated 
    USING (
        is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "proprietaires_insert_policy" ON proprietaires 
    FOR INSERT TO authenticated 
    WITH CHECK (
        is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin')
        )
    );

-- PROPRIÉTÉS: Filtrées par organisation
CREATE POLICY "proprietes_select_policy" ON proprietes 
    FOR SELECT TO authenticated 
    USING (
        is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organisation_id = proprietes.organisation_id
        )
    );

-- QUOTITÉS: Basées sur l'accès aux propriétés
CREATE POLICY "property_ownership_select_policy" ON property_ownership 
    FOR SELECT TO authenticated 
    USING (
        is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM proprietes p 
            JOIN user_roles ur ON ur.organisation_id = p.organisation_id
            WHERE p.id = property_ownership.propriete_id 
            AND ur.user_id = auth.uid()
        )
    );
```

## ⚙️ **Business Logic avec Triggers**

### **1. Assignment Automatique Organisation par Pays**

```sql
-- Trigger assignment automatique organisation par pays
CREATE OR REPLACE FUNCTION assign_organisation_by_pays()
RETURNS TRIGGER AS $$
BEGIN
    -- Assignment automatique selon pays propriété
    SELECT id INTO NEW.organisation_id 
    FROM organisations 
    WHERE pays = NEW.pays 
    AND is_active = true 
    LIMIT 1;
    
    -- Si pas d'organisation pour ce pays, erreur
    IF NEW.organisation_id IS NULL THEN
        RAISE EXCEPTION 'Aucune organisation active pour le pays: %', NEW.pays;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_assign_organisation_by_pays
    BEFORE INSERT ON proprietes
    FOR EACH ROW EXECUTE FUNCTION assign_organisation_by_pays();
```

### **2. Validation Quotités = 100%**

```sql
-- Function validation quotités propriété = 100%
CREATE OR REPLACE FUNCTION validate_property_ownership_total()
RETURNS TRIGGER AS $$
DECLARE
    total_quotites DECIMAL(10,4);
    propriete_id_check UUID;
BEGIN
    propriete_id_check := COALESCE(NEW.propriete_id, OLD.propriete_id);
    
    -- Calculer total quotités actives pour cette propriété
    SELECT COALESCE(SUM(
        quotite_numerateur::DECIMAL / quotite_denominateur::DECIMAL
    ), 0) INTO total_quotites
    FROM property_ownership 
    WHERE propriete_id = propriete_id_check
    AND date_fin IS NULL;
    
    -- Vérifier que total <= 100%
    IF total_quotites > 1.0000 THEN
        RAISE EXCEPTION 'Total quotités dépasse 100%% pour propriété % (total: %)', 
            propriete_id_check, total_quotites * 100;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_ownership_total
    AFTER INSERT OR UPDATE OR DELETE ON property_ownership
    FOR EACH ROW EXECUTE FUNCTION validate_property_ownership_total();
```

### **3. Validation Quotités Associés = 100%**

```sql
-- Function validation quotités associés = 100%
CREATE OR REPLACE FUNCTION validate_associes_total()
RETURNS TRIGGER AS $$
DECLARE
    total_parts INTEGER;
    parts_total_proprietaire INTEGER;
    proprietaire_id_check UUID;
BEGIN
    proprietaire_id_check := COALESCE(NEW.proprietaire_id, OLD.proprietaire_id);
    
    -- Récupérer nombre_parts_total du propriétaire
    SELECT nombre_parts_total INTO parts_total_proprietaire
    FROM proprietaires 
    WHERE id = proprietaire_id_check;
    
    -- Calculer total parts associés
    SELECT COALESCE(SUM(nombre_parts), 0) INTO total_parts
    FROM associes 
    WHERE proprietaire_id = proprietaire_id_check;
    
    -- Vérifier égalité stricte
    IF total_parts != parts_total_proprietaire THEN
        RAISE EXCEPTION 'Total parts associés (%) != nombre_parts_total (%) pour propriétaire %', 
            total_parts, parts_total_proprietaire, proprietaire_id_check;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_associes_total
    AFTER INSERT OR UPDATE OR DELETE ON associes
    FOR EACH ROW EXECUTE FUNCTION validate_associes_total();
```

## 📊 **Performance & Indexation**

### **Index Strategy**

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_organisations_pays_active 
    ON organisations(pays) WHERE is_active = true;

CREATE INDEX idx_proprietaires_type_active 
    ON proprietaires(type) WHERE is_active = true;

CREATE INDEX idx_proprietes_organisation_active 
    ON proprietes(organisation_id) WHERE is_active = true;

CREATE INDEX idx_ownership_propriete_active 
    ON property_ownership(propriete_id) WHERE date_fin IS NULL;

CREATE INDEX idx_ownership_proprietaire_active 
    ON property_ownership(proprietaire_id) WHERE date_fin IS NULL;

CREATE INDEX idx_user_roles_user_org 
    ON user_roles(user_id, organisation_id);

-- Index pour les recherches textuelles
CREATE INDEX idx_proprietaires_nom_trgm 
    ON proprietaires USING gin (nom gin_trgm_ops);

CREATE INDEX idx_proprietes_nom_trgm 
    ON proprietes USING gin (nom gin_trgm_ops);
```

### **Views Optimisées**

```sql
-- Vue propriétés enrichies avec propriétaires
CREATE VIEW proprietes_with_owners AS
SELECT 
    p.*,
    o.nom as organisation_nom,
    ARRAY_AGG(
        pr.nom || CASE 
            WHEN pr.prenom IS NOT NULL THEN ' ' || pr.prenom 
            ELSE '' 
        END
    ) as proprietaires_noms,
    ARRAY_AGG(
        po.quotite_numerateur::DECIMAL / po.quotite_denominateur * 100
    ) as quotites_pct
FROM proprietes p
LEFT JOIN organisations o ON o.id = p.organisation_id
LEFT JOIN property_ownership po ON po.propriete_id = p.id AND po.date_fin IS NULL
LEFT JOIN proprietaires pr ON pr.id = po.proprietaire_id
GROUP BY p.id, o.nom;

-- Vue propriétaires avec leur portefeuille
CREATE VIEW proprietaires_portfolio AS
SELECT 
    pr.*,
    COUNT(po.propriete_id) as nb_proprietes,
    ARRAY_AGG(p.nom) as proprietes_noms,
    SUM(po.quotite_numerateur::DECIMAL / po.quotite_denominateur) as quotite_totale
FROM proprietaires pr
LEFT JOIN property_ownership po ON po.proprietaire_id = pr.id AND po.date_fin IS NULL
LEFT JOIN proprietes p ON p.id = po.propriete_id
GROUP BY pr.id;
```

## 🔍 **Functions Business Logic**

### **Quick Create Propriétaire**

```sql
CREATE OR REPLACE FUNCTION quick_create_proprietaire(
    p_nom VARCHAR(255),
    p_prenom VARCHAR(255) DEFAULT NULL,
    p_type proprietaire_type_enum DEFAULT 'physique',
    p_email VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO proprietaires (
        nom, prenom, type, email, is_brouillon, created_at
    ) VALUES (
        p_nom, p_prenom, p_type, p_email, false, NOW()
    )
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Assign Quotité avec Validation**

```sql
CREATE OR REPLACE FUNCTION assign_property_ownership(
    p_proprietaire_id UUID,
    p_propriete_id UUID,
    p_quotite_numerateur INTEGER,
    p_quotite_denominateur INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérification autorisation (RLS automatique)
    -- Insertion avec validation trigger automatique
    INSERT INTO property_ownership (
        proprietaire_id, propriete_id, 
        quotite_numerateur, quotite_denominateur
    ) VALUES (
        p_proprietaire_id, p_propriete_id,
        p_quotite_numerateur, p_quotite_denominateur
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur assignment quotité: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🧪 **Testing Strategy**

### **pgTAP Tests**

```sql
-- Test validation quotités
SELECT plan(4);

-- Test 1: Création propriétaire morale avec associés
SELECT lives_ok(
    $$INSERT INTO proprietaires (nom, type, nombre_parts_total) 
      VALUES ('Test SARL', 'morale', 1000)$$,
    'Création propriétaire morale'
);

-- Test 2: Validation quotités associés = 100%
SELECT throws_ok(
    $$INSERT INTO associes (proprietaire_id, nom, nombre_parts) 
      VALUES ((SELECT id FROM proprietaires WHERE nom='Test SARL'), 'Associé 1', 1500)$$,
    'Total parts associés (1500) != nombre_parts_total (1000)',
    'Validation quotités associés échoue correctement'
);

-- Test 3: Assignment automatique organisation par pays
SELECT lives_ok(
    $$INSERT INTO proprietes (nom, type, pays) 
      VALUES ('Test Propriété', 'appartement', 'FR')$$,
    'Assignment automatique organisation par pays'
);

-- Test 4: Validation quotités propriété <= 100%
SELECT throws_ok(
    $$INSERT INTO property_ownership (proprietaire_id, propriete_id, quotite_numerateur, quotite_denominateur)
      VALUES (
        (SELECT id FROM proprietaires WHERE nom='Test SARL'),
        (SELECT id FROM proprietes WHERE nom='Test Propriété'),
        120, 100
      )$$,
    'Total quotités dépasse 100%',
    'Validation quotités propriété échoue correctement'
);

SELECT finish();
```

## 📈 **Migration Strategy**

### **Phase 1: Suppression Tables Obsolètes**

```sql
-- Supprimer en ordre inverse des dépendances
DROP TABLE IF EXISTS contrat_documents CASCADE;
DROP TABLE IF EXISTS contrats CASCADE;
DROP TABLE IF EXISTS propriete_photos CASCADE;
DROP TABLE IF EXISTS unites CASCADE;
DROP TABLE IF EXISTS propriete_quotites CASCADE;
DROP TABLE IF EXISTS user_property_assignments CASCADE;
DROP TABLE IF EXISTS associes CASCADE; -- Ancienne version
DROP TABLE IF EXISTS proprietes CASCADE; -- Ancienne version
DROP TABLE IF EXISTS proprietaires CASCADE; -- Ancienne version

-- Nettoyer les types enum obsolètes si nécessaire
-- (Sera géré par les nouvelles migrations)
```

### **Phase 2: Nouvelle Architecture**

```sql
-- Migration complète avec nouvelles tables
-- (Détaillé dans les prochains guides techniques)
```

## 🚨 **Sécurité & Best Practices**

### **SECURITY DEFINER Risks**

```sql
-- ❌ DANGEREUX - Fonction trop permissive
CREATE OR REPLACE FUNCTION dangerous_function()
RETURNS VOID AS $$
BEGIN
    -- Accès à toutes les données sans contrôle
    DELETE FROM proprietes; -- CATASTROPHIQUE !
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ SÉCURISÉ - Fonction avec contrôles
CREATE OR REPLACE FUNCTION secure_function(p_propriete_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Vérification autorisation RLS
    IF NOT EXISTS (
        SELECT 1 FROM proprietes 
        WHERE id = p_propriete_id 
        -- RLS policy appliquée automatiquement
    ) THEN
        RAISE EXCEPTION 'Accès interdit à cette propriété';
    END IF;
    
    -- Action sécurisée
    UPDATE proprietes SET updated_at = NOW() WHERE id = p_propriete_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **RLS Performance**

```sql
-- ❌ Policy lente
CREATE POLICY "slow_policy" ON proprietes 
    FOR SELECT TO authenticated 
    USING (
        -- Requête complexe dans policy = lenteur
        organisation_id IN (
            SELECT o.id FROM organisations o
            JOIN complex_view cv ON cv.org_id = o.id
            WHERE cv.user_id = auth.uid()
        )
    );

-- ✅ Policy optimisée
CREATE POLICY "fast_policy" ON proprietes 
    FOR SELECT TO authenticated 
    USING (
        -- Index direct sur user_roles
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organisation_id = proprietes.organisation_id
        )
    );
```

---

## 📋 **Checklist Implémentation**

### **Architecture Database** ✅
- [ ] Tables créées selon architecture correcte
- [ ] Relations FK définies et testées
- [ ] Contraintes business validées
- [ ] Triggers quotités fonctionnels
- [ ] Functions business logic opérationnelles

### **Row Level Security** ✅
- [ ] RLS activé sur toutes tables sensibles
- [ ] Policies multi-tenant testées
- [ ] Functions helper créées et sécurisées
- [ ] Performance policies validée

### **Performance** ✅
- [ ] Index sur requêtes fréquentes
- [ ] Views optimisées créées
- [ ] Query performance < 100ms
- [ ] No N+1 queries identifiées

### **Testing** ✅
- [ ] Tests pgTAP business logic
- [ ] Tests contraintes quotités
- [ ] Tests RLS policies
- [ ] Tests performance queries

---

*Guide Database Schema & RLS v1.0 - Janvier 2025*
*Basé sur manuel Supabase 62 pages PERSONNEL/ + architecture correcte*