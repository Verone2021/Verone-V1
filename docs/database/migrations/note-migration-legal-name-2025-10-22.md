# 📋 Note de Migration: Distinction Legal Name / Trade Name

**Date**: 2025-10-22
**Migration**: `20251022_001_add_legal_name_trade_name_to_organisations.sql`
**Impact**: Majeur - Modification structure table `organisations`

---

## 🎯 Objectif

Séparer clairement l'identité légale (dénomination sociale) de l'identité commerciale (nom commercial) des organisations, conformément aux pratiques comptables françaises.

---

## 📊 Changements Base de Données

### Nouvelles Colonnes

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `legal_name` | VARCHAR(255) | NOT NULL | Dénomination sociale officielle (ex: SARL MEUBLES PARISIENS) |
| `trade_name` | VARCHAR(255) | NULL | Nom commercial utilisé publiquement (ex: Meubles & Déco Paris) |
| `has_different_trade_name` | BOOLEAN | DEFAULT FALSE | Indicateur si l'organisation utilise un nom commercial différent |
| `siren` | VARCHAR(9) | NULL | Numéro SIREN (identifiant entreprise - 9 chiffres) |
| `siret` | VARCHAR(14) | NULL | Numéro SIRET (identifiant établissement - 14 chiffres) |

### Migration de Données

```sql
-- Migration automatique: name → legal_name
UPDATE organisations
SET legal_name = name
WHERE legal_name IS NULL OR legal_name = '';

-- Colonne 'name' conservée temporairement pour rétrocompatibilité
-- ⚠️ DEPRECATED: Ne plus utiliser dans nouveaux développements
```

### Helper Function

```sql
CREATE OR REPLACE FUNCTION get_organisation_display_name(org organisations)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    NULLIF(org.trade_name, ''),
    org.legal_name,
    'Organisation sans nom'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Logique d'affichage**:
1. Si `trade_name` défini → Afficher nom commercial
2. Sinon → Afficher dénomination sociale
3. Sinon → "Organisation sans nom"

---

## 🔧 Modifications Code

### Fichiers Corrigés (2025-10-22)

| Fichier | Occurrences | Type Changement |
|---------|-------------|-----------------|
| `src/hooks/use-purchase-orders.ts` | 2 | Query SELECT + fallback |
| `src/hooks/use-purchase-receptions.ts` | 2 | Query SELECT + search filter |
| `src/hooks/use-stock-dashboard.ts` | 4 | Query SELECT (suppliers + customers) |
| `src/hooks/metrics/use-order-metrics.ts` | 2 | Query SELECT + fallback |
| `src/components/business/universal-order-details-modal.tsx` | 2 | Query SELECT + fallback |

**Total**: 12 lignes corrigées

### Pattern de Correction

**AVANT** (❌ BUG):
```typescript
const { data: supplier } = await supabase
  .from('organisations')
  .select('name')  // ❌ Column does not exist
  .eq('id', supplierId)
  .single()

supplierName = supplier?.name || 'Fournisseur inconnu'
```

**APRÈS** (✅ CORRECT):
```typescript
const { data: supplier } = await supabase
  .from('organisations')
  .select('legal_name')  // ✅ Utiliser legal_name
  .eq('id', supplierId)
  .single()

supplierName = supplier?.legal_name || 'Fournisseur inconnu'
```

---

## 🎨 Composant UI

### LegalIdentityEditSection

**Fichier**: `src/components/business/legal-identity-edit-section.tsx`

**Features**:
- ✅ Édition inline dénomination sociale (legal_name)
- ✅ Checkbox pour activer nom commercial différent
- ✅ Champ nom commercial conditionnel (trade_name)
- ✅ Validation SIREN (9 chiffres)
- ✅ Validation SIRET (14 chiffres)
- ✅ Sauvegarde optimiste
- ✅ Gestion erreurs

**Validation**:
```typescript
// SIREN: exactement 9 chiffres
const sirenRegex = /^\d{9}$/

// SIRET: exactement 14 chiffres
const siretRegex = /^\d{14}$/
```

**Intégration**:
- Page Clients Pro: `/contacts-organisations/customers/[customerId]/page.tsx`
- Page Fournisseurs: `/contacts-organisations/suppliers/[supplierId]/page.tsx`
- Page Partenaires: `/contacts-organisations/partners/[partnerId]/page.tsx`

---

## ✅ Tests Effectués

### Playwright Browser Tests (2025-10-22)

| Page | Status | Console Errors | Fields Verified |
|------|--------|----------------|-----------------|
| Clients Pro (B2B) | ✅ PASS | 0 | legal_name, trade_name, SIREN, SIRET |
| Fournisseurs | ✅ PASS | 0 (après correction) | legal_name, trade_name, SIREN, SIRET |
| Partenaires | ✅ PASS | 0 | legal_name, trade_name, SIREN, SIRET |

**Erreurs corrigées**:
- 🐛 `column organisations_1.name does not exist` → Résolu dans 5 fichiers

---

## 📚 Documentation Mise à Jour

### Fichiers Documentation

| Fichier | Section | Status |
|---------|---------|--------|
| `docs/database/SCHEMA-REFERENCE.md` | Table organisations (lignes 242-266) | ✅ À JOUR |
| `docs/database/migrations/note-migration-legal-name-2025-10-22.md` | Note migration détaillée | ✅ CRÉÉ |

---

## ⚠️ Breaking Changes

### Colonne `name` DEPRECATED

```typescript
// ❌ NE PLUS UTILISER
organisations.name

// ✅ UTILISER À LA PLACE
organisations.legal_name  // Dénomination sociale
organisations.trade_name  // Nom commercial (optionnel)
get_organisation_display_name(organisations)  // Helper display
```

### Migration Frontend

**Affichage organisations**:
```typescript
// ❌ AVANT
<span>{organisation.name}</span>

// ✅ APRÈS (Option 1: Afficher dénomination sociale)
<span>{organisation.legal_name}</span>

// ✅ APRÈS (Option 2: Afficher nom préféré)
<span>{organisation.trade_name || organisation.legal_name}</span>

// ✅ APRÈS (Option 3: Utiliser helper SQL)
// SELECT get_organisation_display_name(organisations.*)
```

---

## 🔍 Recherche Anti-Hallucination

**Avant toute création table/colonne**, vérifier:
```bash
# Rechercher usages existants
grep -r "organisations.name" src/

# Vérifier documentation
cat docs/database/SCHEMA-REFERENCE.md | grep -A 20 "organisations"
```

**Tables NE JAMAIS créer** (déjà existantes):
- ❌ `suppliers` → ✅ Utiliser `organisations WHERE type='supplier'`
- ❌ `customers` → ✅ Utiliser `organisations WHERE type='customer'`

---

## 📞 Contact

**Questions migration**: Romeo Dos Santos
**Documentation complète**: `docs/database/SCHEMA-REFERENCE.md`
**Migration SQL**: `supabase/migrations/20251022_001_add_legal_name_trade_name_to_organisations.sql`

---

**Note**: Cette migration est **rétrocompatible**. La colonne `name` est conservée temporairement mais DEPRECATED. Elle sera supprimée dans une future migration après validation complète du système.
