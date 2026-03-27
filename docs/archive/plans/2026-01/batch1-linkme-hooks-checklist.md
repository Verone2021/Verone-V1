# Batch 1 : Hooks LinkMe Back-Office - Checklist

**Date** : 2026-01-28
**Objectif** : Typer tous les hooks LinkMe du back-office avec `<Database>`
**Estimation** : ~2000-2500 warnings corrigés (40% du total)

---

## 📋 Fichiers à Corriger (23 fichiers)

### Priorité 1 : Hooks Commandes (Core Business)

- [ ] `use-linkme-order-actions.ts` (~150 warnings estimés) ⭐
- [ ] `use-linkme-orders.ts` (~200 warnings estimés) ⭐
- [ ] `use-linkme-selections.ts` (~100 warnings)
- [ ] `use-payment-requests-admin.ts` (~80 warnings)

### Priorité 2 : Hooks Enseignes & Affiliates

- [ ] `use-linkme-enseignes.ts` (~120 warnings) ✅ DÉJÀ FAIT
- [ ] `use-linkme-affiliates.ts` (~100 warnings) ✅ DÉJÀ FAIT
- [ ] `use-linkme-affiliates-for-storage.ts` (~60 warnings)
- [ ] `use-enseigne-details.ts` (~80 warnings)

### Priorité 3 : Hooks Catalogue & Produits

- [ ] `use-linkme-catalog.ts` (~150 warnings) ✅ DÉJÀ FAIT
- [ ] `use-products-for-affiliate.ts` (~100 warnings)
- [ ] `use-product-approvals.ts` (~80 warnings)

### Priorité 4 : Hooks Clients & Contacts

- [ ] `use-linkme-enseigne-customers.ts` (~100 warnings) ✅ DÉJÀ FAIT
- [ ] `use-organisation-contacts-bo.ts` (~80 warnings)
- [ ] `use-organisation-addresses-bo.ts` (~70 warnings)
- [ ] `use-organisation-approvals.ts` (~90 warnings)

### Priorité 5 : Hooks Utilitaires & Analytics

- [ ] `use-linkme-users.ts` (~100 warnings) ✅ DÉJÀ FAIT
- [ ] `use-linkme-dashboard.ts` (~120 warnings)
- [ ] `use-linkme-analytics.ts` (~100 warnings)
- [ ] `use-linkme-storage.ts` (~80 warnings)
- [ ] `use-linkme-page-config.ts` (~60 warnings)
- [ ] `use-linkme-suppliers.ts` (~80 warnings)
- [ ] `use-performance-analytics.ts` (~100 warnings)
- [ ] `use-tracking-stats.ts` (~60 warnings)

---

## ✅ Déjà Corrigés (5 fichiers)

- ✅ `use-linkme-catalog.ts` (commit 3af225ea)
- ✅ `use-linkme-users.ts` (commit 44f964bf)
- ✅ `use-linkme-enseignes.ts` (commit 1b1aab25)
- ✅ `use-linkme-enseigne-customers.ts` (commit 7f71605d)
- ✅ `use-linkme-affiliates.ts` (commit 3af225ea - selections aussi)

---

## 📝 Pattern à Appliquer

```typescript
// AVANT
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// APRÈS
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/types';

const supabase = createClient<Database>();
```

**Modifications** :

1. Ajouter `import type { Database } from '@verone/types'` en haut
2. Changer tous `createClient()` en `createClient<Database>()`
3. Retirer tous `as any`, `: any`, casts manuels
4. Laisser TypeScript inférer les types

---

## 🔄 Workflow

Pour chaque fichier :

1. ✅ **Lire** le fichier complet
2. ✅ **Ajouter** import Database
3. ✅ **Typer** tous createClient avec `<Database>`
4. ✅ **Retirer** tous casts `as any`
5. ✅ **Valider** : `pnpm type-check && pnpm build`
6. ✅ **Cocher** dans cette checklist
7. ✅ **Commit** si batch de 3-5 fichiers complété

---

## 📊 Progrès

- **Total** : 23 fichiers
- **Déjà corrigés** : 5 fichiers (22%)
- **Restants** : 18 fichiers (78%)
- **Estimation warnings** : ~1800-2200 warnings à corriger

---

**Référence** : Voir `.claude/templates/supabase-client-pattern.md` pour pattern complet
