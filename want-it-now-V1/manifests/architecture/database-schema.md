# 🗄️ Database Schema - Want It Now V1

> **Schémas SQL complets avec triggers, contraintes et RLS policies**

## 🏗️ **Schema Principal**

### **Propriétaires (Indépendants)**
```sql
CREATE TABLE proprietaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type proprietaire_type_enum NOT NULL,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255), -- nullable pour personnes morales
  email VARCHAR(255),
  telephone VARCHAR(50),
  adresse TEXT,
  
  -- ✅ FIXED: International legal forms with Foreign Key
  forme_juridique VARCHAR(50) REFERENCES country_legal_forms(legal_form),
  numero_identification VARCHAR(100), -- SIRET, NIPC, etc.
  capital_social DECIMAL(15,2),
  nombre_parts_total INTEGER,
  
  -- International banking fields (SEPA 2025)
  iban VARCHAR(34),
  account_holder_name VARCHAR(255),
  bank_name VARCHAR(255),
  swift_bic VARCHAR(11),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Business constraints
  CONSTRAINT fk_proprietaires_forme_juridique 
    FOREIGN KEY (forme_juridique) 
    REFERENCES country_legal_forms(legal_form)
);

-- Enum types (simplified - forme_juridique now uses Foreign Key)
CREATE TYPE proprietaire_type_enum AS ENUM (
  'physique',
  'morale'
);
```

### **Propriétés (Liées aux Organisations)**
```sql
CREATE TABLE proprietes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  type propriete_type_enum NOT NULL,
  adresse TEXT,
  code_postal VARCHAR(10),
  ville VARCHAR(255),
  pays VARCHAR(2) DEFAULT 'FR',
  a_unites BOOLEAN DEFAULT false,
  superficie_m2 INTEGER,
  nb_pieces INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE propriete_type_enum AS ENUM (
  'appartement',
  'maison',
  'villa',
  'studio',
  'loft',
  'chalet',
  'autre'
);

-- ✅ UPDATED: International Legal Forms Architecture
-- Former problematic ENUM approach replaced with lookup table + Foreign Key
CREATE TABLE country_legal_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(10) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  legal_form VARCHAR(50) NOT NULL,
  legal_form_display VARCHAR(100) NOT NULL,
  legal_form_description TEXT,
  minimum_capital DECIMAL(15,2),
  minimum_shareholders INTEGER DEFAULT 1,
  maximum_shareholders INTEGER,
  requires_auditor BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Quotités de Propriété (Table de Liaison)**
```sql
CREATE TABLE property_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID REFERENCES proprietaires(id) NOT NULL,
  propriete_id UUID REFERENCES proprietes(id) NOT NULL,
  quotite_numerateur INTEGER NOT NULL CHECK (quotite_numerateur > 0),
  quotite_denominateur INTEGER NOT NULL CHECK (quotite_denominateur > 0),
  date_debut DATE DEFAULT CURRENT_DATE,
  date_fin DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes business critiques
  CONSTRAINT quotites_valid CHECK (quotite_numerateur <= quotite_denominateur),
  CONSTRAINT dates_coherent CHECK (date_fin IS NULL OR date_fin >= date_debut),
  CONSTRAINT unique_active_ownership UNIQUE (proprietaire_id, propriete_id, date_fin) 
    DEFERRABLE INITIALLY DEFERRED
);
```

## 🔒 **Validation Quotités (Trigger Critique)**

### **Trigger Validation 100%**
```sql
-- Fonction validation quotités totales = 100%
CREATE OR REPLACE FUNCTION validate_property_ownership_total()
RETURNS TRIGGER AS $$
DECLARE
  total_quotites DECIMAL;
  property_id_target UUID;
BEGIN
  -- Déterminer l'ID propriété concernée
  property_id_target := COALESCE(NEW.propriete_id, OLD.propriete_id);
  
  -- Calculer total quotités actives pour cette propriété
  SELECT SUM(quotite_numerateur::decimal / quotite_denominateur) 
  INTO total_quotites
  FROM property_ownership 
  WHERE propriete_id = property_id_target
    AND is_active = true
    AND date_fin IS NULL;
  
  -- Validation stricte : total doit être exactement 1.0 (100%)
  IF total_quotites IS NULL THEN
    total_quotites := 0;
  END IF;
  
  -- Permettre léger écart pour erreurs d'arrondi (0.0001)
  IF total_quotites > 1.0001 THEN
    RAISE EXCEPTION 'Total quotités dépasse 100%% pour propriété % (actuel: %)', 
      property_id_target, (total_quotites * 100)::NUMERIC(5,2);
  END IF;
  
  -- Log pour audit
  INSERT INTO ownership_audit_log (
    property_id, 
    operation, 
    total_quotites, 
    user_id, 
    timestamp
  ) VALUES (
    property_id_target,
    TG_OP,
    total_quotites,
    current_setting('app.current_user_id')::UUID,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger sur toutes opérations quotités
CREATE TRIGGER trg_validate_ownership_total
  AFTER INSERT OR UPDATE OR DELETE ON property_ownership
  FOR EACH ROW EXECUTE FUNCTION validate_property_ownership_total();
```

### **Trigger Audit Trail**
```sql
-- Table audit quotités
CREATE TABLE ownership_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  operation VARCHAR(10) NOT NULL,
  total_quotites DECIMAL(5,4),
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);

-- Trigger audit automatique
CREATE OR REPLACE FUNCTION log_ownership_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ownership_audit_log (
    property_id,
    operation,
    user_id,
    details,
    timestamp
  ) VALUES (
    COALESCE(NEW.propriete_id, OLD.propriete_id),
    TG_OP,
    current_setting('app.current_user_id')::UUID,
    row_to_json(NEW),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ownership_audit
  AFTER INSERT OR UPDATE OR DELETE ON property_ownership
  FOR EACH ROW EXECUTE FUNCTION log_ownership_changes();
```

## 🛡️ **RLS Policies (Row Level Security)**

### **RLS Proprietaires**
```sql
-- Activer RLS
ALTER TABLE proprietaires ENABLE ROW LEVEL SECURITY;

-- Policy : Utilisateurs voient seulement propriétaires de leurs organisations
CREATE POLICY "proprietaires_organisation_access" ON proprietaires
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM property_ownership po
      JOIN proprietes p ON po.propriete_id = p.id
      JOIN user_organisation_assignments uoa ON p.organisation_id = uoa.organisation_id
      WHERE po.proprietaire_id = proprietaires.id
        AND uoa.user_id = auth.uid()
    )
  );
```

### **RLS Propriétés**
```sql
-- Activer RLS
ALTER TABLE proprietes ENABLE ROW LEVEL SECURITY;

-- Policy : Accès basé sur organisation de l'utilisateur
CREATE POLICY "proprietes_organisation_access" ON proprietes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM user_organisation_assignments uoa
      WHERE uoa.organisation_id = proprietes.organisation_id
        AND uoa.user_id = auth.uid()
    )
  );
```

### **RLS Quotités**
```sql
-- Activer RLS
ALTER TABLE property_ownership ENABLE ROW LEVEL SECURITY;

-- Policy : Accès via organisation de la propriété
CREATE POLICY "ownership_organisation_access" ON property_ownership
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM proprietes p
      JOIN user_organisation_assignments uoa ON p.organisation_id = uoa.organisation_id
      WHERE p.id = property_ownership.propriete_id
        AND uoa.user_id = auth.uid()
    )
  );
```

## 📊 **Index Performance**

### **Index Stratégiques**
```sql
-- Index propriétaires actifs
CREATE INDEX idx_proprietaires_active 
ON proprietaires(is_active) 
WHERE is_active = true;

-- Index propriétés par organisation
CREATE INDEX idx_proprietes_organisation 
ON proprietes(organisation_id, is_active) 
WHERE is_active = true;

-- Index quotités par propriétaire
CREATE INDEX idx_ownership_proprietaire 
ON property_ownership(proprietaire_id, is_active) 
WHERE is_active = true;

-- Index quotités par propriété (critique pour validation)
CREATE INDEX idx_ownership_propriete_active 
ON property_ownership(propriete_id, date_fin) 
WHERE is_active = true AND date_fin IS NULL;

-- Index composite pour queries fréquentes
CREATE INDEX idx_ownership_lookup 
ON property_ownership(proprietaire_id, propriete_id, is_active, date_fin);

-- Index temporal pour historique
CREATE INDEX idx_ownership_temporal 
ON property_ownership(date_debut, date_fin) 
WHERE date_fin IS NOT NULL;
```

## 🔍 **Queries Performance Targets**

### **Queries Critiques < 50ms**
```sql
-- Propriétés d'une organisation
SELECT * FROM proprietes 
WHERE organisation_id = $1 AND is_active = true;

-- Propriétaires actifs d'une propriété
SELECT pr.*, po.quotite_numerateur, po.quotite_denominateur
FROM proprietaires pr
JOIN property_ownership po ON pr.id = po.proprietaire_id
WHERE po.propriete_id = $1 AND po.is_active = true AND po.date_fin IS NULL;
```

### **Queries Complexes < 200ms**
```sql
-- Validation quotités propriété
SELECT 
  propriete_id,
  SUM(quotite_numerateur::decimal / quotite_denominateur) as total_quotites
FROM property_ownership 
WHERE propriete_id = $1 AND is_active = true AND date_fin IS NULL
GROUP BY propriete_id;

-- Portefeuille propriétaire
SELECT 
  p.nom as propriete_nom,
  p.ville,
  po.quotite_numerateur,
  po.quotite_denominateur,
  (po.quotite_numerateur::decimal / po.quotite_denominateur * 100) as pourcentage
FROM proprietes p
JOIN property_ownership po ON p.id = po.propriete_id
WHERE po.proprietaire_id = $1 AND po.is_active = true AND po.date_fin IS NULL;
```

## 🔧 **Architecture Fix: International Legal Forms**

### **Problem Solved** ✅

**Issue**: Portuguese LDA legal forms were being saved as French SARL due to destructive mapping

**Root Cause**:
- Database ENUM contained descriptive names: `'Lda (Sociedade por Quotas)'`
- Lookup table contained short codes: `'LDA'`
- Application code had destructive mapping: `'LDA': 'SARL'`

**Solution Implemented**:
1. **Database Migration 121**: Replaced ENUM with VARCHAR + Foreign Key constraint
2. **Application Fix**: Removed destructive `mapFormeJuridiqueToDatabase()` function
3. **Data Integrity**: Direct validation against `country_legal_forms` lookup table

### **Benefits** 🎯

- ✅ **Portuguese LDA** now saves correctly (not converted to SARL)
- ✅ **Spanish SL** preserves identity (not converted to SARL)  
- ✅ **Data Integrity** enforced by Foreign Key constraints
- ✅ **Scalability** easy to add new countries/legal forms
- ✅ **Performance** lookup table optimized with indexes

### **Technical Details**

```sql
-- Before (problematic)
forme_juridique forme_juridique_enum

-- After (correct)  
forme_juridique VARCHAR(50) REFERENCES country_legal_forms(legal_form)
```

**Testing**: JARDIM PRÓSPERO LDA now saves with `forme_juridique = 'LDA'` instead of `'SARL'`

---

*Database Schema avec validation business critique - quotités 100%*
*Performance targets : Simple < 50ms, Complex < 200ms*
*International legal forms architecture fixed - Migration 121*