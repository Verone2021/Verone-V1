# 🎯 LISTE PRIORISÉE : Du Plus Simple au Plus Complexe

**Date** : 2026-01-31
**Mode** : Option B (Blitz - Sprint 6-8h vers 0 warnings)
**État actuel** : 3,464 warnings dans back-office

---

## 📗 TIER 1 : Quick Wins (37 fichiers) - **COMMENCER ICI**

**Complexité** : Très faible | **Temps** : 1-2 min/fichier | **Gain** : ~37 warnings

### 🎯 Fichiers avec 1 warning (ultra-rapides)

1. `e2e/smoke-finance.spec.ts` → 1 warning (prefer-nullish-coalescing)
2. `src/app/(protected)/canaux-vente/linkme/catalogue/vedettes/page.tsx` → 1 warning
3. `src/app/(protected)/canaux-vente/linkme/commandes/[id]/page.tsx` → 1 warning
4. `src/app/(protected)/canaux-vente/linkme/components/ProductPricingCard.tsx` → 1 warning
5. `src/app/(protected)/canaux-vente/linkme/hooks/use-organisation-approvals.ts` → 1 warning
6. `src/app/(protected)/canaux-vente/site-internet/components/ConfigurationSection.tsx` → 1 warning (no-img-element)
7. `src/app/(protected)/canaux-vente/site-internet/hooks/use-update-metadata.ts` → 1 warning
8. `src/app/(protected)/canaux-vente/site-internet/hooks/use-update-pricing.ts` → 1 warning
9. `src/app/(protected)/canaux-vente/site-internet/produits/[id]/components/ProductMetadataSection.tsx` → 1 warning
10. `src/app/(protected)/canaux-vente/site-internet/produits/[id]/components/ProductStockSection.tsx` → 1 warning
11. `src/app/(protected)/consultations/[consultationId]/page.tsx` → 1 warning (react-hooks/exhaustive-deps)
12. `src/app/(protected)/dashboard/components/dashboard-section.tsx` → 1 warning
13. `src/app/(protected)/organisation/all/page.tsx` → 1 warning
14. `src/app/(protected)/parametres/emails/page.tsx` → 1 warning (react-hooks)
15. `src/app/(protected)/parametres/webhooks/[id]/edit/page.tsx` → 1 warning
16. `src/app/(protected)/parametres/webhooks/page.tsx` → 1 warning
17. `src/app/(protected)/produits/catalogue/variantes/page.tsx` → 1 warning
18. `src/app/(protected)/produits/page.tsx` → 1 warning
19. `src/app/(protected)/stocks/mouvements/page.tsx` → 1 warning
20. `src/app/(protected)/stocks/stockage/hooks/use-linkme-owners.ts` → 1 warning
21. `src/app/actions/purchase-orders.ts` → 1 warning (no-explicit-any)
22. `src/app/api/health/route.ts` → 1 warning
23. `src/app/api/qonto/attachments/[id]/route.ts` → 1 warning
24. `src/app/api/qonto/attachments/cleanup-duplicates/route.ts` → 1 warning
25. `src/app/api/qonto/attachments/upload/route.ts` → 1 warning
26. `src/app/api/qonto/invoices/[id]/pdf/route.ts` → 1 warning
27. `src/app/api/qonto/invoices/route.ts` → 1 warning
28. `src/app/api/qonto/quotes/route.ts` → 1 warning
29. `src/app/api/qonto/sync/route.ts` → 1 warning
30. `src/app/demo-stock-ui/page.tsx` → 1 warning
31. `src/components/forms/eco-tax-vat-input.tsx` → 1 warning
32. `src/components/layout/auth-wrapper.tsx` → 1 warning
33. `src/components/providers/activity-tracker-provider.tsx` → 1 warning
34. `src/components/ui-v2/stock/channel-filter.tsx` → 1 warning
35. `src/hooks/base/use-supabase-crud.ts` → 1 warning
36. `src/types/room-types.ts` → 1 warning
37. `src/app/api/qonto/invoices/[id]/convert-to-quote/route.ts` → 1 warning (no-unsafe-assignment)

---

## 📘 TIER 2 : Faciles (87 fichiers)

**Complexité** : Faible | **Temps** : 3-5 min/fichier | **Gain** : ~200-300 warnings

### Top 20 fichiers TIER 2 (2-5 warnings chacun)

1. `src/app/(protected)/admin/users/[id]/components/user-security-tab.tsx` → 2 warnings
2. `src/app/(protected)/canaux-vente/linkme/components/AnalyticsDateFilter.tsx` → 2 warnings
3. `src/app/(protected)/canaux-vente/linkme/components/EditLinkMeOrderModal.tsx` → 2 warnings
4. `src/app/(protected)/canaux-vente/linkme/components/LinkMeOrderDetailModal.tsx` → 2 warnings
5. `src/app/(protected)/canaux-vente/linkme/components/UserViewModal.tsx` → 2 warnings
6. `src/app/(protected)/canaux-vente/site-internet/hooks/use-product-variants.ts` → 2 warnings
7. `src/app/(protected)/canaux-vente/site-internet/hooks/use-site-internet-categories.ts` → 2 warnings
8. `src/app/(protected)/canaux-vente/site-internet/produits/[id]/components/ProductPricingSection.tsx` → 2 warnings
9. `src/app/(protected)/parametres/emails/[slug]/edit/page.tsx` → 2 warnings
10. `src/app/api/admin/users/route.ts` → 2 warnings
11. `src/app/api/delivery-notes/[id]/route.ts` → 2 warnings
12. `src/app/api/delivery-notes/route.ts` → 2 warnings
13. `src/app/api/emails/form-reply/route.ts` → 2 warnings
14. `src/app/api/invoices/[id]/route.ts` → 2 warnings
15. Fichiers avec 3-5 warnings → Voir liste complète dans `/tmp/eslint-files.txt`

... et 67 autres fichiers (3-7 warnings chacun)

---

## 📙 TIER 3 : Moyens (88 fichiers)

**Complexité** : Moyenne | **Temps** : 5-10 min/fichier | **Gain** : ~800-1,000 warnings

### Top 15 fichiers TIER 3 (8-15 warnings)

1. `src/app/(protected)/canaux-vente/linkme/components/LinkMeResetPasswordDialog.tsx` → 8 warnings
2. `src/app/(protected)/canaux-vente/linkme/components/PaymentRequestModalAdmin.tsx` → 8 warnings
3. `src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-order-actions.ts` → 8 warnings
4. `src/app/(protected)/canaux-vente/linkme/hooks/use-product-approvals.ts` → 8 warnings
5. `src/app/(protected)/canaux-vente/linkme/organisations/page.tsx` → 8 warnings
6. `src/app/(protected)/canaux-vente/site-internet/components/ProductsSection.tsx` → 8 warnings
7. `src/app/(protected)/commandes/page.tsx` → 8 warnings
8. `src/app/(protected)/contacts-organisations/clients-particuliers/page.tsx` → 8 warnings
9. `src/app/(protected)/contacts-organisations/suppliers/page.tsx` → 8 warnings
10. `src/app/(protected)/produits/sourcing/echantillons/page.tsx` → 8 warnings
11. Fichiers avec 9-15 warnings → Voir liste complète

... et 73 autres fichiers (10-25 warnings chacun)

---

## 📕 TIER 4 : Difficiles (35 fichiers)

**Complexité** : Élevée | **Temps** : 10-20 min/fichier | **Gain** : ~1,200-1,500 warnings

### Tous les fichiers TIER 4 (27-66 warnings)

1. `src/app/(protected)/canaux-vente/linkme/hooks/use-enseigne-details.ts` → 27 warnings
2. `src/app/(protected)/canaux-vente/site-internet/components/CategoriesSection.tsx` → 28 warnings
3. `src/app/(protected)/factures/qonto/page.tsx` → 28 warnings
4. `src/app/(protected)/finance/depenses/[id]/page.tsx` → 28 warnings
5. `src/app/(protected)/produits/catalogue/stocks/page.tsx` → 29 warnings
6. `src/app/(protected)/canaux-vente/linkme/enseignes/[id]/page.tsx` → 30 warnings
7. `src/app/(protected)/admin/users/page.tsx` → 31 warnings
8. `src/hooks/use-archive-notifications.ts` → 31 warnings
9. `src/app/api/catalogue/products/route.ts` → 32 warnings
10. `src/components/forms/variant-group-form.tsx` → 32 warnings
11. `src/app/(protected)/devis/[id]/page.tsx` → 34 warnings
12. `src/app/api/cron/google-merchant-poll/route.ts` → 35 warnings
13. `src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-dashboard.ts` → 36 warnings
14. `src/app/(protected)/produits/catalogue/collections/[collectionId]/page.tsx` → 36 warnings
15. `src/app/(protected)/consultations/page.tsx` → 37 warnings
16. `src/app/(protected)/produits/catalogue/categories/page.tsx` → 38 warnings
17. `src/app/api/form-submissions/[id]/messages/route.ts` → 38 warnings
18. `src/app/(protected)/canaux-vente/linkme/components/CommissionsSection.tsx` → 39 warnings
19. `src/app/(protected)/produits/catalogue/families/[familyId]/page.tsx` → 40 warnings
20. `src/app/(protected)/factures/[id]/edit/page.tsx` → 41 warnings
21. `src/app/(protected)/admin/users/[id]/page.tsx` → 42 warnings
22. `src/app/(protected)/produits/catalogue/categories/[categoryId]/page.tsx` → 43 warnings
23. `src/app/(protected)/canaux-vente/linkme/commandes/page.tsx` → 46 warnings
24. `src/app/(protected)/finance/transactions/page.tsx` → 46 warnings
25. `src/app/(protected)/produits/catalogue/variantes/[groupId]/page.tsx` → 46 warnings
26. `src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-orders.ts` → 50 warnings
27. `src/app/(protected)/finance/livres/page.tsx` → 53 warnings
28. `src/app/api/google-merchant/sync-product/[id]/route.ts` → 55 warnings
29. `src/app/(protected)/canaux-vente/linkme/components/AffiliatesSection.tsx` → 58 warnings
30. `src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-storage.ts` → 58 warnings
31. `src/app/api/google-merchant/test-connection/route.ts` → 58 warnings
32. `src/app/(protected)/factures/[id]/page.tsx` → 59 warnings
33. `src/app/(protected)/prises-contact/[id]/page.tsx` → 60 warnings
34. `src/app/(protected)/parametres/notifications/actions.ts` → 62 warnings
35. `src/app/(protected)/canaux-vente/linkme/components/EnseignesSection.tsx` → 66 warnings

---

## 🔥 TIER 5 : MONSTRES (3 fichiers) - **STRATÉGIE eslint-disable**

**Complexité** : Très élevée | **Temps** : 30-60 min/fichier | **Gain** : ~492 warnings

⚠️ **Recommandation** : Utiliser `// eslint-disable-next-line` pour `no-unsafe-*` car trop chronophage

### 3 Monstres à Traiter en Phase 2

1. **`src/app/(protected)/canaux-vente/linkme/components/CreateLinkMeOrderModal.tsx`**
   - **82 warnings** (déjà fixé dans PR #119, à vérifier)
   - Majorité : no-unsafe-member-access, no-explicit-any
   - Stratégie : eslint-disable ciblé

2. **`src/app/(protected)/stocks/expeditions/page.tsx`**
   - **180 warnings**
   - 96 no-unsafe-member-access + 19 no-explicit-any
<<<<<<< Updated upstream
   - Stratégie : eslint-disable en bloc pour no-unsafe-*
=======
   - Stratégie : eslint-disable en bloc pour no-unsafe-\*
>>>>>>> Stashed changes

3. **`src/app/(protected)/stocks/receptions/page.tsx`**
   - **230 warnings** (LE PLUS GROS FICHIER)
   - 122 no-unsafe-member-access + 24 no-explicit-any
<<<<<<< Updated upstream
   - Stratégie : eslint-disable en bloc pour no-unsafe-*
=======
   - Stratégie : eslint-disable en bloc pour no-unsafe-\*
>>>>>>> Stashed changes

---

## 📊 STATISTIQUES GLOBALES

- **Fichiers totaux** : 250
- **Warnings totaux** : 3,464
- **Distribution par complexité** :
  - TIER 1 (Quick Wins) : 37 fichiers (~37 warnings)
  - TIER 2 (Faciles) : 87 fichiers (~250-300 warnings)
  - TIER 3 (Moyens) : 88 fichiers (~900-1,000 warnings)
  - TIER 4 (Difficiles) : 35 fichiers (~1,300-1,500 warnings)
  - TIER 5 (Monstres) : 3 fichiers (~492 warnings)

---

## 🎯 PLAN D'EXÉCUTION BLITZ MODE (6-8h)

### Phase 1 : Quick Wins Automatiques (30 min)

**Objectif** : Fixer warnings simples auto-fixables

```bash
# Auto-fix avec ESLint
cd apps/back-office
pnpm eslint . --fix --quiet

# Gain estimé : ~20-30 warnings (no-unused-vars, formatage)
```

**Alternative** : Script Python pour `prefer-nullish-coalescing` (voir plan)

### Phase 2 : TIER 5 Monstres avec eslint-disable (1-2h)

**Objectif** : Neutraliser 3 fichiers monstres (492 warnings)

**Stratégie** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
```typescript
// Dans stocks/receptions/page.tsx et stocks/expeditions/page.tsx
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

// ... code existant ...
```

**Gain** : ~492 warnings → 2,972 warnings restants

### Phase 3 : TIER 1-4 Manuel (4-5h)

**Ordre d'attaque** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
1. ✅ **TIER 1** (1-2h) → 37 fichiers, 1-2 min chacun
2. ✅ **TIER 2** (1-2h) → 87 fichiers, 3-5 min chacun
3. ✅ **TIER 3** (1-2h) → 88 fichiers (sélectif : top 30)
4. ✅ **TIER 4** (si temps) → 35 fichiers (sélectif : top 10)

**Workflow par fichier** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
```bash
# 1. Ouvrir fichier
# 2. Corriger warnings un par un
# 3. Tester : pnpm type-check
# 4. Commit : git commit -m "[BO-LINT-006] fix: X warnings in file.tsx"
# 5. Passer au suivant
```

---

## ✅ CRITÈRES DE SUCCÈS

- [ ] Phase 1 complète : < 3,400 warnings
- [ ] Phase 2 complète : < 3,000 warnings (monstres neutralisés)
- [ ] Phase 3 complète : **0 warnings** ✅
- [ ] Type-check passe : `pnpm type-check` ✅
- [ ] Build passe : `pnpm build` ✅
- [ ] PR créée avec résumé complet

---

## 📝 NOTES & TIPS

### Patterns Récurrents

**prefer-nullish-coalescing** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
```typescript
// ❌ Avant
const value = foo || 'default';

// ✅ Après
const value = foo ?? 'default';
```

**no-unsafe-member-access** (complexe) :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
```typescript
// Option 1 : Typer correctement
const data = response as { id: string };

// Option 2 : eslint-disable si impossible à typer
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const id = data.id;
```

### Commandes Utiles

```bash
# Compter warnings restants
pnpm lint 2>&1 | grep "problems"

# Linter un seul fichier
pnpm eslint src/path/to/file.tsx

# Auto-fix un seul fichier
pnpm eslint src/path/to/file.tsx --fix
```

---

**Bon courage pour le sprint ! 🚀**
