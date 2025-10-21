# 📦 Packages - Future Monorepo

Ce dossier contient la structure **préparée** pour le futur monorepo Vérone Back Office.

⚠️ **IMPORTANT** : Cette structure n'est **PAS encore active**. Elle sera migrée **après la Phase 1**.

---

## 📂 Structure packages/

```
packages/
├── ui/           # Design system + composants Storybook
├── kpi/          # KPI documentés en YAML + hooks React
├── types/        # Types TypeScript partagés (API ↔ Frontend)
├── config/       # Configurations partagées (ESLint, Prettier, TS)
└── utils/        # Helpers et utilitaires communs
```

---

## 🎯 Objectif

Préparer dès maintenant la structure pour faciliter la migration monorepo **après Phase 1 stabilisée**.

**Critères migration** :
- ✅ Phase 1 déployée en production
- ✅ Tous modules core validés
- ✅ Storybook complet
- ✅ Zero console errors

---

## 📖 Documentation complète

Voir [docs/monorepo/migration-plan.md](../docs/monorepo/migration-plan.md) pour le plan détaillé de migration.

---

*Préparé le : 2025-10-21*
*À activer : Après Phase 1*
