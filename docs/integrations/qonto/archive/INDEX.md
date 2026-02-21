# Archive Documentation Qonto

Documentation restauree depuis l'historique git (supprimee le 23 janvier 2026, commit `2701d206`).

## Finance V2 (8 fichiers)

| Fichier                                         | Description              |
| ----------------------------------------------- | ------------------------ |
| `finance-v2/FINANCE_V2.md`                      | Architecture Finance V2  |
| `finance-v2/FINANCE_V2_DB_MAPPING.md`           | Mapping base de donnees  |
| `finance-v2/FINANCE_V2_OPERATIONS.md`           | Operations CRUD          |
| `finance-v2/FINANCE_V2_RELEASE_NOTES.md`        | Notes de release         |
| `finance-v2/FINANCE_V2_RESTORE.md`              | Guide de restauration    |
| `finance-v2/FINANCE_V2_VALIDATION_CHECKLIST.md` | Checklist de validation  |
| `finance-v2/README_FINANCE.md`                  | README module finance    |
| `finance-v2/pcg-categories-reference.md`        | Reference categories PCG |
| `finance-v2/qonto-auth.md`                      | Authentification Qonto   |

## Serena Snapshots (3 fichiers)

| Fichier                                                        | Description                |
| -------------------------------------------------------------- | -------------------------- |
| `serena-snapshots/facturation-qonto-audit-critique-2026-01.md` | Audit critique facturation |
| `serena-snapshots/qonto-documents-roadmap-2026-01.md`          | Roadmap documents Qonto    |
| `serena-snapshots/qonto-invoices-never-finalize-2026-01-07.md` | Regle JAMAIS finaliser     |

## Guides (1 fichier)

| Fichier                                      | Description                     |
| -------------------------------------------- | ------------------------------- |
| `guides/QONTO-API-CONFIGURATION-COMPLETE.md` | Guide complet configuration API |

## LinkMe (1 fichier)

| Fichier                                   | Description                           |
| ----------------------------------------- | ------------------------------------- |
| `linkme-invoice-verification-workflow.md` | Workflow verification factures LinkMe |

## Restauration

Restaure le 2026-02-19 depuis :

- Commit `2701d206^` (fichiers finance + serena + guide)
- Commit `eb67a2c3^` (fichier LinkMe)
