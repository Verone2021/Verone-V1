# Dev Plan — BO-FIN-039 — Rollback BO-FIN-037 + colonne billing_org_id

**Date** : 2026-04-19
**Branche cible** : `feat/BO-FIN-031-org-picker-modal` (continuer, pas de nouvelle branche)
**Task ID** : `BO-FIN-039`
**Décision source** : audit `docs/scratchpad/audit-siret-devis-facture-2026-04-19.md` §5 (Option B)

---

## Problème

BO-FIN-037 (`f3be01249`, 2026-04-19 16:24) propage `billingOrgId` vers `sales_orders.customer_id` quand l'utilisateur choisit une org de facturation différente de l'org commande. Conséquence : la commande perd sa réalité métier "Pokawa Avignon a commandé" et devient "Pokawa SAS a commandé".

**Comportement attendu (Option B, validé par Romeo 2026-04-19)** :

- `sales_orders.customer_id` reste l'org commande originale (Pokawa Avignon)
- `financial_documents.billing_org_id` (nouvelle colonne) = org de facturation (Pokawa SAS)
- `financial_documents.partner_id` = org commande (Pokawa Avignon) — cohérent avec R5
- Qonto utilise `billing_org_id` pour le TIN (déjà OK dans `resolve-qonto-client.ts` lignes 41-67)

---

## Prod impact

Aucun. BO-FIN-037 est sur `feat/BO-FIN-031-org-picker-modal` non mergée. Les 2 devis créés aujourd'hui (`36786acf`, `b6478f4c`) ont `partner_id = customer_id` → cas où billingOrg == orderCustomer. **Pas de rollback data nécessaire**.

---

## Scope (fichiers touchés)

### DB

- `supabase/migrations/20260430_add_billing_org_id_to_financial_documents.sql` — **CRÉÉ** (non appliqué, FEU ROUGE pour apply)

### Code à rollback (suppression propagation BO-FIN-037)

1. `apps/back-office/src/app/api/qonto/invoices/_lib/propagate-order-customer.ts` — **DELETE**
2. `apps/back-office/src/app/api/qonto/invoices/route.ts` — retirer import (ligne 28) + appel (lignes 232-241)
3. `apps/back-office/src/app/api/qonto/quotes/route.post.ts` — retirer import (ligne 35) + appel (lignes 176-185)

### Code à ajouter (persist billing_org_id en DB)

4. `apps/back-office/src/app/api/qonto/invoices/_lib/persist-financial-document.ts`
   - Ligne 68 : remettre `partnerId = order.customer_id` (sans fallback `ctx.billingOrgId`)
   - Ajouter `billing_org_id: ctx.billingOrgId ?? null` dans `insertPayload`
5. `apps/back-office/src/app/api/qonto/quotes/route.post.ts` (fonction `persistQuoteResults`)
   - Ligne 174 : remettre `effectiveCustomerId = orderCustomerId` (pour `saveQuoteToLocalDb.customerId`)
   - Passer `billingOrgId: billingOrg?.id` à `saveQuoteToLocalDb`
6. `apps/back-office/src/app/api/qonto/quotes/route.context.ts` (fonction `saveQuoteToLocalDb`)
   - Ajouter paramètre `billingOrgId?: string`
   - Insérer `billing_org_id: billingOrgId ?? null` dans l'INSERT `financial_documents`

### Guard SIRET strict devis (règle R4 renforcée par Romeo 2026-04-19)

7. `apps/back-office/src/app/api/qonto/quotes/route.post.ts` (fonction `buildAndCreateQontoQuote`)
   - Après `resolveCustomerInfo` : si `customerType === 'organization'` et `!vatNumber && !taxId` → HTTP 400 "SIRET requis pour émettre un devis. Choisissez l'organisation maison mère."
   - Pour factures : guard déjà en place dans `resolve-qonto-client.ts` lignes 75-88

### Types

8. `packages/@verone/types/src/database.types.ts` — régénérer via `supabase gen types typescript` après application migration (FEU ROUGE Romeo)

---

## Out of scope (tâches séparées)

- **Fix bug UI livraison** `OrganisationCard.tsx:272-277` → dev-agent #2 en parallèle
- **Auto-resolve maison mère** (BO-FIN-040) → BLOQUÉ en attente décision Romeo :
  - Option A1 : filtrage `organisations` par `enseigne_id` commun (si Pokawa Avignon + Pokawa SAS partagent même `enseigne_id`)
  - Option A2 : nouvelle colonne `organisations.parent_org_id`
  - Option A3 : juste pré-filtrer picker existant sur orgs avec SIRET

---

## Validation

1. `pnpm --filter @verone/back-office type-check` → PASS
2. `pnpm --filter @verone/back-office lint` → PASS
3. Diff review manuel : aucune propagation vers `sales_orders` restante (grep `propagateOrderCustomer`)
4. Test manuel (post-migration appliquée) :
   - Créer devis Pokawa Avignon (sans SIRET) → HTTP 400 avec message clair
   - Créer devis avec billingOrg = Pokawa SAS → `financial_documents.billing_org_id = pokawa-sas-id`, `partner_id = pokawa-avignon-id`, `sales_orders.customer_id` INCHANGÉ

---

## Ordre d'exécution

1. Migration SQL **créée** (file existe) — Romeo valide + applique (FEU ROUGE)
2. Rollback code (fichiers 1-3) → dev-agent
3. Ajout billing_org_id dans persist (fichiers 4-6) → dev-agent
4. Guard SIRET devis (fichier 7) → dev-agent
5. Régénérer types Database → Romeo
6. Type-check → verify-agent
7. Review PASS → reviewer-agent (blind audit)
8. Commit `[BO-FIN-039] fix: rollback BO-FIN-037 + add financial_documents.billing_org_id column` sur branche courante
