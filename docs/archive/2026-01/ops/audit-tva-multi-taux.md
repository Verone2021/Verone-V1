# Audit: Ventilation TVA Multi-Taux (10% + 20%)

**Date**: 2026-01-01
**Status**: Plan prêt pour implémentation

---

## Contexte Métier

Pour une comptabilité de qualité avec déclaration TVA exacte, certaines dépenses ont des taux mixtes:

- **10%** pour la nourriture (restaurant)
- **20%** pour les boissons/alcool

**Exemple**: Un ticket de 47,50€ TTC peut être:

- Repas 38€ TTC (HT: 34,55€, TVA 10%: 3,45€)
- Boissons 9,50€ TTC (HT: 7,92€, TVA 20%: 1,58€)

---

## Audit de l'Existant

### Structure Actuelle - bank_transactions

| Colonne      | Type    | Description                         |
| ------------ | ------- | ----------------------------------- |
| `amount`     | numeric | Montant TTC (source de vérité)      |
| `vat_rate`   | numeric | Taux TVA unique (0, 5.5, 10, 20)    |
| `amount_ht`  | numeric | Montant HT calculé automatiquement  |
| `amount_vat` | numeric | Montant TVA calculé automatiquement |

**Trigger existant**: `calculate_ht_vat_amounts()` calcule automatiquement HT et TVA quand on définit `vat_rate`.

### Ce que Qonto expose (API)

L'API Qonto expose `vat_details` dans les transactions:

```json
{
  "vat_details": {
    "status": "computed",
    "items": [
      { "rate": 10, "amount_cents": 345 },
      { "rate": 20, "amount_cents": 158 }
    ]
  }
}
```

**MAIS**: Notre type `QontoTransaction` dans `packages/@verone/integrations/src/qonto/types.ts` ne capture PAS `vat_details`. Le champ `raw_data.vat_details` est NULL dans toutes les transactions existantes.

### Fichiers Clés Existants

| Fichier                                                                | Rôle                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------ |
| `packages/@verone/finance/src/components/QuickClassificationModal.tsx` | Modal classification rapide (affiche HT/TVA/TTC) |
| `apps/back-office/src/components/forms/expense-form.tsx`               | Formulaire dépense (sélection TVA unique)        |
| `packages/@verone/integrations/src/qonto/types.ts`                     | Types Qonto (ligne 131-133)                      |
| `packages/@verone/integrations/src/qonto/sync.ts`                      | Sync Qonto → bank_transactions                   |
| `apps/back-office/src/lib/tva.ts`                                      | Utilitaires TVA (calculs HT/TVA/TTC)             |

---

## Solution Recommandée: Approche Hybride

### Phase 1: Capturer vat_details de Qonto (automatique)

**Fichier à modifier**: `packages/@verone/integrations/src/qonto/types.ts`

Ajouter dans QontoTransaction (après ligne 133):

```typescript
vat_details?: {
  status: 'computed' | 'not_computed' | 'pending';
  items?: Array<{ rate: number; amount_cents: number }>;
};
```

**Résultat**: Les futures syncs stockeront automatiquement les données multi-TVA dans `raw_data.vat_details`.

### Phase 2: Modifier QuickClassificationModal pour ventilation

**Fichier**: `packages/@verone/finance/src/components/QuickClassificationModal.tsx`

Ajouter dans le modal (après la sélection TVA unique):

1. **Section "Ventilation TVA"** avec toggle:
   - Mode simple: Un seul taux (existant)
   - Mode ventilé: Plusieurs lignes

2. **Lignes de ventilation**:

   ```typescript
   interface VatLine {
     description: string;
     amount_ht: number;
     tva_rate: 0 | 5.5 | 10 | 20;
     // tva_amount et amount_ttc calculés automatiquement
   }
   ```

3. **Validation**:
   - Somme des TTC doit = montant transaction
   - Au moins 2 lignes si mode ventilé

4. **Stockage**:
   - Utiliser une colonne JSONB `vat_breakdown` sur bank_transactions
   - Mettre `vat_rate = NULL` quand ventilation active

### Phase 3: Migration base de données

**Créer**: `supabase/migrations/YYYYMMDD_add_vat_breakdown_column.sql`

```sql
-- Ajouter colonne vat_breakdown pour ventilation multi-TVA
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS vat_breakdown JSONB DEFAULT NULL;

-- Commentaire explicatif
COMMENT ON COLUMN bank_transactions.vat_breakdown IS
  'Ventilation TVA multi-taux. Format: [{"description": "Repas", "amount_ht": 35.00, "tva_rate": 10, "tva_amount": 3.50}, ...]';

-- Contrainte: vat_breakdown XOR vat_rate
ALTER TABLE bank_transactions
ADD CONSTRAINT chk_vat_exclusive
CHECK (
  (vat_breakdown IS NULL AND vat_rate IS NOT NULL)
  OR (vat_breakdown IS NOT NULL AND vat_rate IS NULL)
  OR (vat_breakdown IS NULL AND vat_rate IS NULL)
);
```

---

## UX Proposée

### Modal QuickClassificationModal modifié

```
┌─────────────────────────────────────────────────────────┐
│ Classifier la dépense                          [X]      │
├─────────────────────────────────────────────────────────┤
│ TOTAL LA TETE A TOTO - 47,50€                           │
│                                                         │
│ [Catégorie: Restauration ▼]                             │
│                                                         │
│ ── TVA ──────────────────────────────────────────────── │
│                                                         │
│ ○ Taux unique: [20% ▼]                                  │
│ ● Ventilé (plusieurs taux)                              │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Description    │ HT      │ TVA  │ TVA €  │ TTC     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Repas          │ 34,55 € │ 10%  │ 3,45 € │ 38,00 € │ │
│ │ Boissons       │  7,92 € │ 20%  │ 1,58 € │  9,50 € │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [+ Ajouter une ligne]                                   │
│                                                         │
│ Total ventilé: 47,50 € ✓ (= montant transaction)        │
│                                                         │
│            [Annuler]  [Enregistrer]                     │
└─────────────────────────────────────────────────────────┘
```

---

## Estimation Effort

| Tâche                                   | Complexité | Temps estimé |
| --------------------------------------- | ---------- | ------------ |
| Enrichir types Qonto                    | Simple     | 15 min       |
| Modifier sync pour capturer vat_details | Simple     | 30 min       |
| Migration SQL vat_breakdown             | Simple     | 15 min       |
| Modifier QuickClassificationModal       | Moyenne    | 2-3h         |
| Tests manuels                           | Simple     | 30 min       |

**Total**: ~4 heures

---

## Commandes de Vérification

```bash
npm run type-check   # 0 erreurs
npm run build        # Build succeeded
npm run e2e:smoke    # Si UI modifiée
```

---

## Points d'attention

1. **Ne pas créer de fichiers séparés** - Modifier QuickClassificationModal directement
2. **Utiliser les utilitaires existants** - `apps/back-office/src/lib/tva.ts`
3. **Validation en temps réel** - La somme des TTC doit toujours = montant transaction
4. **Contrainte XOR** - Une transaction a soit `vat_rate`, soit `vat_breakdown`, jamais les deux

---

**Prêt pour implémentation!**
