# Back-Office Expert — Memoire Persistante

## Patterns decouverts

- Dashboard : 4 KPIs, hooks use-complete-dashboard-metrics
- Stock : pas de table stock_levels, tout calcule via triggers (12 interdependants)
- Finance : double table invoices (legacy Abby) + financial_documents (Qonto STI)
- Qonto = source primaire devis, DB = copie secondaire

## Bugs recurrents

- parseInt NaN (28 occurrences identifiees, 15 fichiers)
- JAMAIS modifier routes API Qonto (casse systematiquement)
- Middleware back-office = INTERDIT (7 echecs, MIDDLEWARE_INVOCATION_FAILED)

## Decisions architecturales

- Protection auth via layout (protected) + RLS (pas middleware)
- 165 pages, 22 modules
- eslint.ignoreDuringBuilds = true (531 warnings, crash SIGTRAP si active)
