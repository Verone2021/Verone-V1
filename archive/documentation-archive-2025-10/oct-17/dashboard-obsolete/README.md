# 📦 Documentation Dashboard Obsolète - Archivée 2025-10-17

**Raison Archivage** : Audit module Dashboard a révélé divergences majeures entre documentation et code RÉEL.

---

## Fichiers Archivés

### 1. dashboard-kpis.md.obsolete
**Source** : `docs/metrics/dashboard-kpis.md`
**Date Archive** : 2025-10-17
**Raison** : Documentation décrit **16 hooks métriques** qui n'existent PAS dans le code

**Problème** :
- Hooks documentés : use-product-metrics, use-user-metrics, use-stock-metrics, etc. (16 total)
- Code RÉEL : useCompleteDashboardMetrics() avec 4 sources seulement
- Divergence : 75% architecture inexacte

**Remplacement** : `docs/modules/dashboard/hooks.md` (basé sur code RÉEL)

---

### 2. PRD-DASHBOARD-CURRENT.md.obsolete
**Source** : `manifests/prd/current/PRD-DASHBOARD-CURRENT.md`
**Date Archive** : 2025-10-17
**Raison** : Divergences composants + features non implémentées

**Problèmes** :
1. Composant `StatCard` documenté → Code utilise `ElegantKpiCard`
2. Mock badges "⚠️ MOCK" documentés → Absents du code
3. Architecture décrite ne correspond pas au code

**Remplacement** : `docs/modules/dashboard/README.md` + autres fichiers module

---

## Nouvelle Documentation Officielle

✅ **docs/modules/dashboard/** (Créée 2025-10-17)
- README.md - Overview + Quick Start
- hooks.md - 4 hooks RÉELS documentés
- components.md - ElegantKpiCard props
- testing.md - 7 scenarios E2E validés
- performance.md - SLOs + metrics réelles

**Précision** : 100% (basée sur code, pas specs)

---

## Pourquoi Archiver (et non Supprimer) ?

- ✅ Préserver historique documentation
- ✅ Référence décisions passées
- ✅ Traçabilité évolution architecture
- ✅ Audit trail compliance

---

## Liens Utiles

- **Documentation Officielle** : `/docs/modules/dashboard/`
- **Rapport Audit** : `/MEMORY-BANK/audits/dashboard-2025-10-17.md`
- **Code Source** : `/src/app/dashboard/page.tsx`

---

**Archivage effectué par** : Claude Code `/audit-module dashboard`
**Date** : 2025-10-17
