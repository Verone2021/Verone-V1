# Module Finance - Documentation Index

**Derniere mise a jour**: 2025-12-27
**Version actuelle**: Finance v2 Phase A (Beta)

---

## Source de Verite

Ce README est l'index central de la documentation Finance. Toute autre documentation doit etre referencee ici.

---

## Documents Actifs

| Document                                                     | Description                            | Statut |
| ------------------------------------------------------------ | -------------------------------------- | ------ |
| [FINANCE_V2.md](./FINANCE_V2.md)                             | Architecture et plan de deploiement v2 | ACTIF  |
| [FINANCE_V2_DB_MAPPING.md](./FINANCE_V2_DB_MAPPING.md)       | Mapping base de donnees vers UI        | ACTIF  |
| [FINANCE_V2_OPERATIONS.md](./FINANCE_V2_OPERATIONS.md)       | Workflows utilisateur v2               | ACTIF  |
| [FINANCE_V2_RELEASE_NOTES.md](./FINANCE_V2_RELEASE_NOTES.md) | Notes de version Phase A               | ACTIF  |
| [FINANCE_V2_RESTORE.md](./FINANCE_V2_RESTORE.md)             | Procedure de rollback/restore          | ACTIF  |
| [qonto-auth.md](./qonto-auth.md)                             | Configuration OAuth Qonto              | ACTIF  |

---

## Documents Deprecies

| Document                                    | Raison                                     | Remplace par  |
| ------------------------------------------- | ------------------------------------------ | ------------- |
| `NAVIGATION-FINANCE-BEST-PRACTICES-2025.md` | Structure menu obsolete (6 entrees -> 2-3) | FINANCE_V2.md |

---

## Acces Rapides

### Page Transactions v2 (Beta)

```
http://localhost:3000/finance/transactions?v2=true
```

### Activation permanente

```bash
# .env.local
NEXT_PUBLIC_FINANCE_V2=true
```

### Rollback d'urgence

Voir [FINANCE_V2_RESTORE.md](./FINANCE_V2_RESTORE.md)

---

## Architecture Technique

### Hooks principaux

- `useUnifiedTransactions()` - Source unique transactions + stats
- `useTransactionActions()` - Actions: classify, linkOrg, ignore, markCCA

### Composants cles

- `QuickClassificationModal` - Classification PCG rapide
- `OrganisationLinkingModal` - Liaison organisation
- `InvoiceUploadModal` - Upload justificatif
- `RapprochementModal` - Rapprochement commandes

### Base de donnees

- Table: `bank_transactions`
- Vue: `v_transactions_unified`
- Fonction: `get_transactions_stats()`
- Audit: `bank_transactions_enrichment_audit`

---

## Historique des versions

| Version    | Date       | Description                                            |
| ---------- | ---------- | ------------------------------------------------------ |
| v2 Phase A | 2025-12-27 | Page unifiee beta, reset logique, audit trail          |
| v1 Legacy  | 2024-2025  | Pages separees (transactions, justificatifs, depenses) |

---

_Index genere automatiquement - Claude Code_
