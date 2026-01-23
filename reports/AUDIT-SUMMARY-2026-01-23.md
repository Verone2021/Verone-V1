# 📊 Audit Knip - Rapport Initial (Baseline)

**Date :** 2026-01-23 10:13
**Version Knip :** 5.68.0
**Fichiers analysés :** Monorepo complet (3 apps + packages)

---

## 🎯 Résumé Exécutif

**Total fichiers avec issues :** 154
**Baseline établie pour suivi futur**

### Répartition par Application

| Application | Fichiers avec issues | % du total |
|-------------|---------------------|-----------|
| back-office | 127 | 82% |
| linkme | 16 | 10% |
| site-internet | 6 | 4% |
| root/scripts | 5 | 3% |

---

## 🔝 Top 10 Fichiers à Auditer

1. `scripts/.eslintrc.js`
2. `scripts/finance-v2-screenshots.mjs`
3. `tests/auth.setup.ts`
4. `tools/scripts/audit-database.js`
5. `tools/scripts/generate-stories.js`
6. `apps/back-office/src/hooks/use-archive-notifications.ts`
7. `apps/back-office/src/lib/feature-flags.ts`
8. `apps/back-office/src/types/business-rules.ts`
9. `apps/back-office/src/types/collections.ts`
10. `apps/back-office/src/types/reception-shipment.ts`

---

## 📈 Catégories d'Issues Détectées

### 1. Types Non Utilisés
- `business-rules.ts`
- `collections.ts`
- `reception-shipment.ts`
- `room-types.ts`
- `variant-attributes-types.ts`
- `variant-groups.ts`

**Action :** Vérifier si exports réellement inutilisés ou faux positifs

### 2. Composants Forms
- `eco-tax-vat-input.tsx`
- `product-selector.tsx`
- `quick-variant-form.tsx`
- `simple-product-form.tsx`
- `variant-group-form.tsx`

**Action :** Script audit avancé pour détecter dynamic imports

### 3. Composants Business
- `abc-analysis-view.tsx`
- `add-product-to-order-modal.tsx`
- `address-edit-section.tsx`
- `aging-report-view.tsx`
- `cancel-movement-modal.tsx`
- `category-*` (plusieurs fichiers)
- `collection-*` (plusieurs fichiers)

**Action :** Audit manuel avec script Bash

### 4. Scripts & Tools
- `.eslintrc.js` (config)
- `finance-v2-screenshots.mjs` (screenshots)
- `audit-database.js` (tools)
- `generate-stories.js` (tools)

**Action :** Vérifier usage réel

---

## 🎯 Plan d'Action Recommandé

### Phase 1 : Validation (1 semaine)
- [ ] Exécuter script audit avancé sur top 20 composants
- [ ] Identifier vrais positifs vs faux positifs
- [ ] Catégoriser par priorité (DELETE / REVIEW / KEEP)

### Phase 2 : Marquage (1 sprint)
- [ ] Marquer composants obsolètes avec `@deprecated`
- [ ] Documenter raisons dans commentaires
- [ ] Notifier équipe sur Slack

### Phase 3 : Suppression (après 1 sprint)
- [ ] Supprimer composants marqués @deprecated
- [ ] Tests passent
- [ ] 1 commit par composant (facilite rollback)

### Phase 4 : Mesure Progrès
- [ ] Re-lancer audit Knip
- [ ] Comparer avec baseline
- [ ] Objectif : < 50 fichiers avec issues

---

## 📂 Fichiers Générés

- **Baseline JSON :** `reports/baseline-2026-01-23.json` (236 KB)
- **Ce rapport :** `reports/AUDIT-SUMMARY-2026-01-23.md`
- **Knip config :** `knip.json`
- **Scripts audit :** `scripts/audit-component-advanced.sh`

---

## 🛠️ Commandes Utiles

```bash
# Re-lancer audit
pnpm audit:deadcode:json

# Auditer un composant spécifique
pnpm audit:component apps/back-office/src/components/business/abc-analysis-view.tsx

# Audit batch (tous les composants)
pnpm audit:batch

# Comparer avec baseline
diff <(jq -r '.files[]' reports/baseline-2026-01-23.json | sort) \
     <(jq -r '.files[]' knip-report.json | sort)
```

---

## 📊 Métriques de Succès

| Métrique | Baseline (Actuel) | Objectif Q1 2026 |
|----------|-------------------|------------------|
| Fichiers avec issues | 154 | < 50 |
| Issues dans back-office | 127 | < 40 |
| Issues dans linkme | 16 | < 5 |
| Issues dans site-internet | 6 | 0 |

---

## 🎉 Prochaines Étapes Immédiates

1. ✅ **Baseline établie** - Fait !
2. 🔄 **Lancer audit batch** - À faire
3. 📋 **Revue top 20 fichiers** - À faire
4. 🏷️ **Marquer premiers @deprecated** - À faire

---

**Audit réalisé par :** Claude Code (Sonnet 4.5)  
**Documentation :** `AUDIT-SETUP.md`, `docs/current/component-audit-guidelines.md`
