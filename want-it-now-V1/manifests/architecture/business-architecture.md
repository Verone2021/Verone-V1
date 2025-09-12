# 🏛️ Business Architecture - Want It Now V1

> **Architecture métier fondamentale basée sur ADR-003 : Propriétaires Indépendants**

## 🎯 **Décision Architecturale Critique**

### **Architecture CORRECTE : Propriétaires Indépendants** ✅

```
ORGANISATIONS (sociétés de gestion)
    ↓ [1:N]
PROPRIETES (biens gérés)
    ↕ [N:M via quotités]  
PROPRIETAIRES (entités indépendantes)
    ↓ [1:N]
ASSOCIES (si personne morale)
```

### **Rationale Business**

#### **Flexibilité Requise**
- ✅ Propriétaire peut investir France + Portugal + Espagne
- ✅ SCI peut détenir dans plusieurs filiales Want It Now
- ✅ Quotités précises (1/3, 2/5, etc.) avec validation 100%
- ✅ Historique temporal (achat/vente quotités)

#### **Scenarios Métier Réels**
```
Jean Dupont (propriétaire indépendant)
├─ 60% Villa Nice (Want It Now France)
├─ 30% Appartement Paris (Want It Now France)  
└─ 80% Maison Porto (Want It Now Portugal)

Villa Marseille (Want It Now France)
├─ Jean Martin : 50% 
├─ SCI Familiale : 30%
└─ Marie Durand : 20%
```

## 🏗️ **Architecture Technique**

### **Tables Principales**

```sql
-- Propriétaires indépendants (PAS de organisation_id)
CREATE TABLE proprietaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type proprietaire_type_enum NOT NULL,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255), -- nullable pour personnes morales
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Propriétés liées aux organisations
CREATE TABLE proprietes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  type propriete_type_enum NOT NULL,
  adresse TEXT,
  a_unites BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison avec quotités
CREATE TABLE property_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID REFERENCES proprietaires(id) NOT NULL,
  propriete_id UUID REFERENCES proprietes(id) NOT NULL,
  quotite_numerateur INTEGER NOT NULL CHECK (quotite_numerateur > 0),
  quotite_denominateur INTEGER NOT NULL CHECK (quotite_denominateur > 0),
  date_debut DATE DEFAULT CURRENT_DATE,
  date_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT quotites_valid CHECK (quotite_numerateur <= quotite_denominateur),
  CONSTRAINT dates_coherent CHECK (date_fin IS NULL OR date_fin >= date_debut)
);
```

## ✅ **Validation Business**

### **Architecture Review Stakeholders** ✅
- [x] **Équipe business** : Validation modèle propriété
- [x] **Équipe juridique** : Compliance quotités françaises  
- [x] **Équipe technique** : Faisabilité et performance
- [x] **Users finaux** : UX workflow validation

### **Acceptance Criteria** ✅
- [x] Propriétaire peut posséder dans plusieurs organisations
- [x] Propriété appartient à une seule organisation
- [x] Quotités flexibles avec validation 100%
- [x] SCI avec associés et parts sociales
- [x] Historique temporal (date_debut/date_fin)

## 🎯 **Impact Business**

### **Flexibilité Maximale**
- **Multi-pays** : Investisseur français peut acheter Portugal/Espagne
- **Multi-organisations** : SCI peut détenir via différentes filiales
- **Quotités précises** : 1/3, 2/5, 7/12 etc. (pas seulement %)
- **Évolution temporelle** : Achat/vente quotités trackées

### **Compliance Légale**
- **Droit français** : Quotités propriété respectées
- **Copropriété** : Validation 100% automatique
- **Audit trail** : Historique modifications quotités
- **Multi-juridiction** : Support pays différents

---

*Business Architecture basée sur ADR-003 - Architecture Decision Record critique*
*Validation business stakeholders : Janvier 2025*