# 🏠 Concepts de Propriété - Architecture Want It Now

> **Documentation architecturale des concepts de propriété avec la logique métier correcte**

## 🎯 **Vision Architecturale Want It Now**

Dans **Want It Now**, l'architecture suit ces principes fondamentaux :
1. **Propriétaires indépendants** - Non liés directement aux organisations
2. **Propriétés liées aux organisations** - Portage par les sociétés de gestion
3. **Quotités comme pont** - Relation propriétaires ↔ propriétés via quotités
4. **Flexibilité maximale** - Un propriétaire peut posséder dans plusieurs organisations

## 🏗️ **Architecture de Données**

### **1. Organisations (Sociétés de Gestion)**
```sql
CREATE TABLE organisations (
  id UUID PRIMARY KEY,
  nom VARCHAR NOT NULL,
  pays VARCHAR(2) DEFAULT 'FR',
  is_active BOOLEAN DEFAULT true
);
```

**Rôle** : Sociétés de gestion immobilière (master-lease, conciergerie)
**Exemples** : "Want It Now France", "Want It Now Portugal"

### **2. Propriétés (Liées aux Organisations)**
```sql
CREATE TABLE proprietes (
  id UUID PRIMARY KEY,
  organisation_id UUID REFERENCES organisations(id), -- LIEN DIRECT
  nom VARCHAR NOT NULL,
  type propriete_type_enum,
  adresse_complete TEXT,
  a_unites BOOLEAN DEFAULT false
);
```

**Rôle** : Biens immobiliers gérés par une organisation spécifique

### **3. Propriétaires (Entités Indépendantes)**
```sql
CREATE TABLE proprietaires (
  id UUID PRIMARY KEY,
  -- PAS de organisation_id ! Indépendants !
  type proprietaire_type_enum, -- 'physique' | 'morale'
  nom VARCHAR NOT NULL,
  prenom VARCHAR, -- Si physique
  forme_juridique VARCHAR, -- Si morale
  is_active BOOLEAN DEFAULT true
);
```

**Rôle** : Propriétaires réels (personnes physiques ou morales)
**Important** : ❌ **JAMAIS de lien direct avec organisations**

### **4. Quotités (Table de Relation)**
```sql
CREATE TABLE property_ownership (
  id UUID PRIMARY KEY,
  proprietaire_id UUID REFERENCES proprietaires(id),
  propriete_id UUID REFERENCES proprietes(id),
  quotite_numerateur INTEGER NOT NULL, -- Ex: 3 pour 3/5
  quotite_denominateur INTEGER NOT NULL, -- Ex: 5 pour 3/5
  date_debut DATE DEFAULT CURRENT_DATE,
  date_fin DATE, -- NULL = toujours actif
  
  -- Contrainte métier
  CONSTRAINT quotite_valide CHECK (
    quotite_numerateur > 0 
    AND quotite_denominateur > 0 
    AND quotite_numerateur <= quotite_denominateur
  )
);

-- Index performance
CREATE INDEX idx_ownership_proprietaire ON property_ownership(proprietaire_id);
CREATE INDEX idx_ownership_propriete ON property_ownership(propriete_id);
```

## 📊 **Modèle Logique Complet**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ORGANISATIONS │    │   PROPRIETES    │    │ PROPRIETAIRES   │
│                 │    │                 │    │                 │
│ • Want IT Now FR│◄───┤ • organisation_id│    │ • Indépendants  │
│ • Want IT Now PT│    │ • nom           │    │ • Type phys/mor │
│ • Sociétés      │    │ • adresse       │    │ • Pas org_id!   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              │                        │
                              ▼                        ▼
                       ┌─────────────────────────────────────┐
                       │      PROPERTY_OWNERSHIP            │
                       │                                     │
                       │ • proprietaire_id                   │
                       │ • propriete_id                      │
                       │ • quotite_numerateur/denominateur   │
                       │ • date_debut/fin                    │
                       └─────────────────────────────────────┘
```

## 🎭 **Scénarios Business Réels**

### **Scénario 1 : Propriétaire Multi-Organisations**
```
Jean Dupont (propriétaire physique)
├─ 60% Villa Nice (Want It Now France)
├─ 30% Appartement Paris (Want It Now France)  
└─ 80% Maison Porto (Want It Now Portugal)
```

**Implémentation** :
```sql
-- Jean Dupont (indépendant)
INSERT INTO proprietaires (id, type, nom, prenom) 
VALUES ('jean-id', 'physique', 'Dupont', 'Jean');

-- Ses quotités dans différentes organisations
INSERT INTO property_ownership VALUES 
  ('q1', 'jean-id', 'villa-nice-id', 3, 5),    -- 60% Nice
  ('q2', 'jean-id', 'appart-paris-id', 3, 10), -- 30% Paris
  ('q3', 'jean-id', 'maison-porto-id', 4, 5);  -- 80% Porto
```

### **Scénario 2 : Propriété Multi-Propriétaires**
```
Appartement Marseille (Want It Now France)
├─ Jean Martin : 50% (1/2)
├─ SCI Familiale : 30% (3/10)
└─ Marie Durand : 20% (1/5)
```

**Implémentation** :
```sql
-- Propriétaires indépendants
INSERT INTO proprietaires VALUES 
  ('jean-martin-id', 'physique', 'Martin', 'Jean'),
  ('sci-fam-id', 'morale', 'SCI Familiale', NULL),
  ('marie-durand-id', 'physique', 'Durand', 'Marie');

-- Quotités sur même propriété
INSERT INTO property_ownership VALUES 
  ('q4', 'jean-martin-id', 'appart-marseille-id', 1, 2),   -- 50%
  ('q5', 'sci-fam-id', 'appart-marseille-id', 3, 10),     -- 30%
  ('q6', 'marie-durand-id', 'appart-marseille-id', 1, 5); -- 20%
```

### **Scénario 3 : SCI avec Associés**
```sql
-- Table associés pour personnes morales
CREATE TABLE associes (
  id UUID PRIMARY KEY,
  proprietaire_id UUID REFERENCES proprietaires(id), -- Lien vers propriétaire morale
  type associe_type_enum, -- 'physique' | 'morale'
  nom VARCHAR NOT NULL,
  prenom VARCHAR,
  nombre_parts INTEGER NOT NULL,
  pourcentage DECIMAL(5,2) GENERATED ALWAYS AS (
    nombre_parts::decimal / (
      SELECT SUM(nombre_parts) 
      FROM associes a2 
      WHERE a2.proprietaire_id = associes.proprietaire_id
    ) * 100
  ) STORED
);
```

## 🔍 **Requêtes Business Intelligence**

### **1. Portfolio d'un Propriétaire**
```sql
-- Toutes les propriétés d'un propriétaire avec leurs quotités
SELECT 
  p.nom as propriete_nom,
  o.nom as organisation_nom,
  o.pays,
  po.quotite_numerateur,
  po.quotite_denominateur,
  (po.quotite_numerateur::decimal / po.quotite_denominateur * 100) as pourcentage
FROM property_ownership po
JOIN proprietaires pr ON po.proprietaire_id = pr.id
JOIN proprietes p ON po.propriete_id = p.id
JOIN organisations o ON p.organisation_id = o.id
WHERE pr.nom = 'Dupont' AND pr.prenom = 'Jean'
AND po.date_fin IS NULL; -- Quotités actives
```

### **2. Propriétaires d'une Propriété**
```sql
-- Tous les propriétaires d'une propriété donnée
SELECT 
  pr.nom,
  pr.prenom,
  pr.type,
  po.quotite_numerateur,
  po.quotite_denominateur,
  (po.quotite_numerateur::decimal / po.quotite_denominateur * 100) as pourcentage
FROM property_ownership po
JOIN proprietaires pr ON po.proprietaire_id = pr.id
JOIN proprietes p ON po.propriete_id = p.id
WHERE p.nom = 'Villa Cannes'
AND po.date_fin IS NULL;
```

### **3. Validation Quotités à 100%**
```sql
-- Vérifier que les quotités totalisent 100% par propriété
SELECT 
  p.nom as propriete,
  SUM(po.quotite_numerateur::decimal / po.quotite_denominateur) as total_quotites
FROM property_ownership po
JOIN proprietes p ON po.propriete_id = p.id
WHERE po.date_fin IS NULL
GROUP BY p.id, p.nom
HAVING SUM(po.quotite_numerateur::decimal / po.quotite_denominateur) != 1.0;
```

## ✅ **Validations Métier Obligatoires**

### **1. Trigger Validation Quotités**
```sql
CREATE OR REPLACE FUNCTION validate_quotites_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que les quotités ne dépassent pas 100%
  IF (
    SELECT SUM(quotite_numerateur::decimal / quotite_denominateur)
    FROM property_ownership
    WHERE propriete_id = COALESCE(NEW.propriete_id, OLD.propriete_id)
    AND date_fin IS NULL
  ) > 1.0 THEN
    RAISE EXCEPTION 'Les quotités totales dépassent 100%% pour cette propriété';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_quotites
  AFTER INSERT OR UPDATE OR DELETE ON property_ownership
  FOR EACH ROW EXECUTE FUNCTION validate_quotites_total();
```

### **2. Contraintes d'Intégrité**
```sql
-- Pas de quotité sans propriétaire actif
ALTER TABLE property_ownership
ADD CONSTRAINT fk_proprietaire_actif 
FOREIGN KEY (proprietaire_id) 
REFERENCES proprietaires(id);

-- Pas de quotité sans propriété active
ALTER TABLE property_ownership
ADD CONSTRAINT fk_propriete_active
FOREIGN KEY (propriete_id) 
REFERENCES proprietes(id);

-- Dates cohérentes
ALTER TABLE property_ownership
ADD CONSTRAINT dates_coherentes 
CHECK (date_fin IS NULL OR date_fin >= date_debut);
```

## 🎯 **Avantages Architecture Want It Now**

### **✅ Flexibilité Business**
- **Propriétaires cross-organisations** : Jean peut investir en France ET Portugal
- **Partenariats** : SCI peut détenir dans plusieurs filiales Want It Now
- **Évolutivité** : Nouveaux pays = nouvelles organisations, propriétaires inchangés

### **✅ Performance & Scalabilité**
- **Index optimisés** sur relations many-to-many
- **Requêtes efficaces** avec jointures planifiées
- **Cache friendly** : données propriétaires stables

### **✅ Compliance Légale**
- **Quotités exactes** avec fractions précises
- **Historique temporel** avec dates début/fin
- **Audit trail** complet sur changements de propriété

## 🚨 **Erreurs Architecturales à Éviter**

### ❌ **JAMAIS faire ceci**
```sql
-- ERREUR : Propriétaires liés directement aux organisations
CREATE TABLE proprietaires (
  id UUID,
  organisation_id UUID -- ❌ INTERDIT !
);

-- ERREUR : Propriétés sans organisation
CREATE TABLE proprietes (
  id UUID,
  proprietaire_id UUID -- ❌ FAUX modèle !
);
```

### ✅ **Architecture correcte**
```sql
-- ✅ Propriétaires indépendants
CREATE TABLE proprietaires (
  id UUID -- Pas de organisation_id !
);

-- ✅ Propriétés organisationnelles  
CREATE TABLE proprietes (
  id UUID,
  organisation_id UUID -- Lien vers société de gestion
);

-- ✅ Quotités comme pont
CREATE TABLE property_ownership (
  proprietaire_id UUID,
  propriete_id UUID,
  quotite_numerateur INTEGER,
  quotite_denominateur INTEGER
);
```

---

## 📚 **Documentation Technique**

**Pour l'implémentation** : Voir `/Docs/technical-guides/supabase-implementation.md`
**Pour les migrations** : Voir `/supabase/migrations/`
**Pour les validations frontend** : Voir `/lib/validations/`

*Cette architecture garantit la flexibilité, performance et conformité légale du système Want It Now.*