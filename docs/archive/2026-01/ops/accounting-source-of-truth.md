# Source de Vérité Comptabilité - Catégorisation

**Date**: 2025-12-30
**Version**: 1.0

---

## Principe Fondamental

**UNE SEULE source de vérité pour les catégories comptables : les codes PCG**

```
pcg-categories.ts → getPcgCategory(code) → Label affiché
```

---

## Architecture Canonique

### Tables DB (Source de données)

| Table               | Colonne            | Description                                    |
| ------------------- | ------------------ | ---------------------------------------------- |
| `matching_rules`    | `default_category` | Code PCG (ex: '6251') pour classification auto |
| `expenses`          | `category`         | Code PCG stocké après classification           |
| `bank_transactions` | `category_pcg`     | Code PCG pour transactions bancaires           |

### Code (Mapping et affichage)

| Fichier             | Export                     | Usage                           |
| ------------------- | -------------------------- | ------------------------------- |
| `pcg-categories.ts` | `ALL_PCG_CATEGORIES`       | Liste complète des codes PCG    |
| `pcg-categories.ts` | `PCG_SUGGESTED_CATEGORIES` | Catégories suggérées (dropdown) |
| `pcg-categories.ts` | `getPcgCategory(code)`     | Convertit code → label          |

---

## Flux de Données

### Classification automatique (page /finance/depenses)

```
1. matching_rules.default_category = '6251'
           ↓
2. useAutoClassification() → suggestion.category
           ↓
3. SupplierCell → getPcgCategory('6251')
           ↓
4. Affichage: "Voyages et déplacements"
```

### Classification manuelle (QuickClassificationModal)

```
1. POPULAR_CATEGORIES (constante PCG)
           ↓
2. User sélectionne code PCG
           ↓
3. INSERT expenses.category = code PCG
   UPDATE bank_transactions.category_pcg = code PCG
           ↓
4. Affichage via getPcgCategory()
```

---

## Legacy Supprimé

### Table `expense_categories` (DB)

**Status**: OBSOLÈTE - Ne plus utiliser

Cette table contenait 15 catégories avec account_code (ex: '627000').
Elle n'est plus lue par l'application.

### Constante `EXPENSE_CATEGORIES` (code)

**Status**: SUPPRIMÉ

Était dans `use-expenses.ts` lignes 184-205.
Remplacé par `PCG_SUGGESTED_CATEGORIES`.

---

## Règles de Développement

### DO ✅

- Utiliser `getPcgCategory(code)` pour afficher un label
- Stocker les codes PCG (ex: '6251') dans les colonnes category
- Utiliser `PCG_SUGGESTED_CATEGORIES` pour les dropdowns

### DON'T ❌

- Ne PAS créer de nouvelle table de catégories
- Ne PAS hardcoder des labels de catégories
- Ne PAS utiliser `expense_categories` (table legacy)

---

## Contrainte Métier

**Une dépense = Un code PCG**

Impossible d'avoir 2 catégories sur une même dépense.
Si besoin multi-postes → ventilation en plusieurs lignes.

---

## Codes PCG Fréquents

| Code | Label                   | Usage               |
| ---- | ----------------------- | ------------------- |
| 607  | Achats de marchandises  | Achats revente      |
| 6132 | Locations immobilières  | Loyers              |
| 616  | Primes d'assurance      | Assurances          |
| 6226 | Honoraires              | Comptable, avocat   |
| 623  | Publicité               | Marketing           |
| 6251 | Voyages et déplacements | Transport           |
| 6256 | Missions                | Hôtels, repas       |
| 6262 | Télécommunications      | Téléphone, internet |
| 6278 | Frais bancaires         | Services bancaires  |
| 651  | Redevances              | Logiciels SaaS      |

---

_Documentation générée automatiquement - Ne pas modifier manuellement_
