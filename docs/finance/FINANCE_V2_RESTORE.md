# Finance v2 - Procedure de Restauration (RESTORE)

**Date**: 2025-12-27
**Version**: 1.0
**Statut**: Document operationnel

---

## Quand utiliser ce document

- Probleme critique avec Finance v2
- Regression detectee apres activation
- Demande utilisateur de revenir en arriere
- Comportement inattendu des transactions

---

## Pre-requis

1. **Acces Supabase Dashboard** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl
2. **Acces Vercel** : Pour modifier les variables d'environnement
3. **Droits SQL** : Acces au SQL Editor Supabase
4. **Le script de rollback** : `supabase/migrations/20251227_finance_v2_ROLLBACK.sql`

---

## Procedure de Restauration (5 etapes)

### Etape 1: Desactiver le feature flag (IMMEDIAT)

**Vercel Dashboard:**

```
1. Aller sur https://vercel.com/[votre-org]/verone-back-office
2. Settings > Environment Variables
3. Trouver NEXT_PUBLIC_FINANCE_V2
4. Changer la valeur de "true" a "false"
5. Redeploy le projet
```

**OU en local (.env.local):**

```bash
# Changer:
NEXT_PUBLIC_FINANCE_V2=false
```

### Etape 2: Verifier l'acces legacy

Naviguer vers:

```
https://[votre-domaine]/finance/transactions
```

**Critere de validation**: La page legacy s'affiche (pas de banner "Finance v2").

### Etape 3: Restaurer les donnees (SQL)

Aller sur: https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/sql/new

Executer **section par section** le script `20251227_finance_v2_ROLLBACK.sql`:

```sql
-- SECTION 1: Restaurer les enrichissements
-- Copier-coller le bloc DO $$ ... $$ de la Section 1

-- SECTION 2: Supprimer vue et fonctions
DROP VIEW IF EXISTS v_transactions_unified CASCADE;
DROP FUNCTION IF EXISTS get_transactions_stats(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS search_transactions(TEXT, TEXT, TEXT, BOOLEAN, INTEGER, INTEGER, UUID, INTEGER, INTEGER) CASCADE;
```

### Etape 4: Smoke Tests

Executer ces tests manuellement:

| Test              | URL                     | Validation                        |
| ----------------- | ----------------------- | --------------------------------- |
| Page transactions | `/finance/transactions` | Tableau visible, pas de banner v2 |
| KPIs dashboard    | `/finance`              | Stats correctes                   |
| Classification    | Clic sur transaction    | Modal classification s'ouvre      |
| Sync Qonto        | Bouton Sync             | Pas d'erreur 500                  |

### Etape 5: Nettoyage (OPTIONNEL - apres validation)

**Seulement apres 48h de stabilite:**

```sql
-- Supprimer la table d'audit (perd la capacite de re-restaurer)
DROP TABLE IF EXISTS bank_transactions_enrichment_audit CASCADE;
```

---

## Verification Post-Restore

Executer cette requete pour verifier:

```sql
-- Verifier que la v2 est bien supprimee
SELECT
  (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'v_transactions_unified') as vue_existe,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'get_transactions_stats') as func_existe,
  (SELECT COUNT(*) FROM bank_transactions WHERE category_pcg IS NOT NULL) as tx_avec_pcg;
```

**Resultats attendus:**

- `vue_existe` = 0
- `func_existe` = 0
- `tx_avec_pcg` = nombre similaire a avant le reset (environ 459)

---

## Rollback du Rollback (si besoin de revenir en v2)

Si le restore cause des problemes et qu'on veut revenir a v2:

1. Re-executer les migrations v2:
   - `20251227_finance_v2_audit_table.sql`
   - `20251227_finance_v2_unified_view.sql`
2. Remettre `NEXT_PUBLIC_FINANCE_V2=true`
3. Redeploy

---

## Contacts d'urgence

- **Supabase Support**: https://supabase.com/dashboard/support
- **Vercel Status**: https://www.vercel-status.com/

---

## Historique

| Date       | Action            | Par         |
| ---------- | ----------------- | ----------- |
| 2025-12-27 | Creation document | Claude Code |

---

_Document genere automatiquement - Finance v2 Phase A_
