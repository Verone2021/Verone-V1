# Finance v2 - Documentation Principale

**Date**: 2025-12-27
**Version**: 2.0
**Statut**: En cours de deploiement

---

## Vue d'Ensemble

Finance v2 simplifie le module comptabilite en fusionnant 4 pages en 1:

- `/finance/transactions` (NOUVELLE PAGE UNIFIEE)
- ~~`/finance/justificatifs`~~ -> redirect
- ~~`/finance/rapprochement`~~ -> redirect
- ~~`/finance/depenses`~~ -> redirect

---

## Plan de Deploiement A/B/C

### Phase A: Parallele (No Breaking Changes)

**Objectif**: Construire la v2 sans casser l'existant

#### Checklist Phase A

- [ ] **Migrations SQL**
  - [ ] Appliquer `20251227_finance_v2_audit_table.sql`
  - [ ] Appliquer `20251227_finance_v2_reset_enrichments.sql`
  - [ ] Appliquer `20251227_finance_v2_unified_view.sql`
  - [ ] Verifier: `supabase db push`

- [ ] **Feature Flag**
  - [ ] Ajouter `NEXT_PUBLIC_FINANCE_V2=false` dans `.env.local`
  - [ ] Creer hook `useFinanceV2Flag()`

- [ ] **Page Transactions v2**
  - [ ] Creer `apps/back-office/src/app/finance/transactions/page-v2.tsx`
  - [ ] Conditionner affichage sur feature flag
  - [ ] Bandeau "Finance v2 (beta)" + lien retour

- [ ] **Hook Unifie**
  - [ ] Creer `packages/@verone/finance/src/hooks/use-unified-transactions.ts`
  - [ ] Utiliser `v_transactions_unified` comme source
  - [ ] Exporter dans `index.ts`

- [ ] **Composants**
  - [ ] `TransactionRow.tsx` - Ligne editable
  - [ ] `TransactionSidePanel.tsx` - Panel actions
  - [ ] `CCAModal.tsx` - Compte courant associe
  - [ ] Reutiliser: `QuickClassificationModal`, `OrganisationLinkingModal`, `InvoiceUploadModal`

- [ ] **Tests**
  - [ ] `npm run type-check` = 0 erreurs
  - [ ] `npm run build` = success
  - [ ] Test manuel sur localhost

#### Criteres GO Phase A -> B

- [ ] Page v2 fonctionne avec feature flag
- [ ] KPIs identiques v1 vs v2
- [ ] 3 actions coeur OK (org, PCG, justif)
- [ ] Pas de regression sur pages existantes

---

### Phase B: Switch (Redirections)

**Objectif**: Activer v2 par defaut, rediriger anciennes URLs

#### Checklist Phase B

- [ ] **Activer Feature Flag**
  - [ ] `NEXT_PUBLIC_FINANCE_V2=true` en production
  - [ ] Deployer sur Vercel

- [ ] **Redirections (PAS de 410)**
  - [ ] `/finance/justificatifs` -> `/finance/transactions?filter=without_attachment`
  - [ ] `/finance/rapprochement` -> `/finance/transactions?filter=to_process`
  - [ ] `/finance/depenses` -> `/finance/transactions?filter=debit`

- [ ] **Sidebar**
  - [ ] Retirer entrees: Justificatifs, Rapprochement, Depenses
  - [ ] Garder: Tableau de bord, Transactions, Livres comptables

- [ ] **Monitoring**
  - [ ] Verifier logs Vercel
  - [ ] Tracker erreurs Sentry (si configure)
  - [ ] Feedback utilisateur

#### Criteres GO Phase B -> C

- [ ] 1 semaine sans bug majeur
- [ ] Validation explicite utilisateur
- [ ] Pas de rollback necessaire

---

### Phase C: Cleanup (Suppression)

**Objectif**: Supprimer code obsolete

#### Checklist Phase C

- [ ] **Pages a supprimer**
  - [ ] `apps/back-office/src/app/finance/justificatifs/`
  - [ ] `apps/back-office/src/app/finance/rapprochement/`
  - [ ] `apps/back-office/src/app/finance/depenses/`

- [ ] **Hooks a supprimer**
  - [ ] `use-bank-transactions-justificatifs.ts`
  - [ ] `use-bank-transaction-stats.ts`
  - [ ] `use-expenses.ts`
  - [ ] `use-counterparties.ts`

- [ ] **Composants a supprimer**
  - [ ] `ExpenseClassificationModal.tsx`
  - [ ] `ClassificationModal.tsx`
  - [ ] `SimpleExpenseModal.tsx`
  - [ ] `CategoryCardGrid.tsx`
  - [ ] `HierarchicalCategorySelector.tsx`

- [ ] **Documentation a supprimer**
  - [ ] `docs/architecture/WORKFLOW-FACTURATION-ABBY-BEST-PRACTICES.md`
  - [ ] `docs/integration-facturation/ABBY-API-SETUP-GUIDE.md`
  - [ ] `docs/workflows/WORKFLOW-RAPPROCHEMENT-BANCAIRE-GUIDE-UTILISATEUR.md`
  - [ ] Marquer autres docs "DEPRECATED - voir FINANCE_V2.md"

- [ ] **Feature Flag**
  - [ ] Retirer `NEXT_PUBLIC_FINANCE_V2` (plus necessaire)
  - [ ] Supprimer conditions dans le code

- [ ] **Changelog**
  - [ ] Documenter tous les changements
  - [ ] Git tag `finance-v2.0.0`

---

## Architecture Technique

### Source de Verite

```
bank_transactions (table)
    |
    v
v_transactions_unified (vue)
    |
    v
use-unified-transactions.ts (hook)
    |
    v
/finance/transactions (UI)
```

### Feature Flag

```typescript
// apps/back-office/src/lib/feature-flags.ts
export function useFinanceV2Flag(): boolean {
  return process.env.NEXT_PUBLIC_FINANCE_V2 === 'true';
}
```

### Statuts Unifies

| Statut       | Couleur | Icone | Description             |
| ------------ | ------- | ----- | ----------------------- |
| `to_process` | orange  | ⚠️    | A traiter               |
| `classified` | blue    | ✓     | Classifie (PCG ou org)  |
| `matched`    | green   | ✓✓    | Rapproche avec document |
| `ignored`    | gray    | —     | Ignore                  |
| `cca`        | purple  | 👤    | Compte courant associe  |

---

## Documents Associes

| Document                                               | Description             |
| ------------------------------------------------------ | ----------------------- |
| [FINANCE_V2_DB_MAPPING.md](./FINANCE_V2_DB_MAPPING.md) | Mapping DB -> UI        |
| [FINANCE_V2_OPERATIONS.md](./FINANCE_V2_OPERATIONS.md) | Workflows operationnels |
| [qonto-auth.md](./qonto-auth.md)                       | Configuration Qonto     |

---

## Rollback

En cas de probleme majeur:

1. **Desactiver feature flag**: `NEXT_PUBLIC_FINANCE_V2=false`
2. **Restaurer enrichissements** (si reset applique):

```sql
-- Voir instructions dans migration 20251227_finance_v2_reset_enrichments.sql
```

3. **Redeploy** sur Vercel

---

_Document mis a jour le 2025-12-27_
