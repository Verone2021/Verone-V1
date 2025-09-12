# Want It Now - Manifestes Architecture

## 📋 Vue d'ensemble

Ce dossier contient les manifestes centralisés pour l'architecture Want It Now avec intégration TDD + Agents spécialisés.

## 🗂️ Structure

```
manifests/
├── business-rules/          # Règles métier centralisées
│   ├── quotites-validation.md
│   ├── booking-constraints.md
│   ├── contract-variables.md
│   └── reservation-constraints.md
├── design-specifications/   # Spécifications design (migration PERSONNEL)
│   ├── want-it-now-design-system.md
│   ├── component-hierarchy.md
│   ├── wireframes-specifications.md
│   └── color-system.md
├── implementation-plans/    # Plans d'implémentation par phase
│   ├── phase-1-core-database.md
│   ├── phase-2-ui-auth.md
│   ├── phase-3-vertical-slices.md
│   ├── phase-4-functions-transversales.md
│   ├── phase-5-finances-operations.md
│   └── phase-6-reservations.md
├── testing-strategies/      # Stratégies de test Playwright + TDD
│   ├── playwright-patterns.md
│   ├── business-rules-testing.md
│   ├── edge-cases-coverage.md
│   └── tdd-workflows.md
└── mcp-integration/        # Configuration MCP existants + nouveaux
    ├── current-mcp-stack.md
    ├── playwright-integration.md
    ├── agents-coordination.md
    └── workflow-automation.md
```

## 🎯 Philosophie

- **Single Source of Truth** : Toutes les spécifications centralisées
- **Traceability** : Lien direct requirements → implementation → tests
- **Business Rules First** : Règles métier au cœur de l'architecture
- **TDD Enhanced** : Tests-first avec validation business rules
- **MCP Integration** : Conservation et enrichissement stack MCP existante

## 🚀 Usage

1. **Phase Design** : Consulter `design-specifications/` et `business-rules/`
2. **Phase Implementation** : Suivre `implementation-plans/` avec `testing-strategies/`
3. **Phase Testing** : Appliquer patterns `testing-strategies/` avec MCP stack
4. **Phase Integration** : Coordonner via `mcp-integration/` workflows

## 🔗 Intégration

- **Workflow EPCT** : Explorer → Planifier (manifeste) → Coder (TDD) → Tester
- **Agents Claude** : Orchestrateur + Playwright Expert + Shadcn Expert
- **MCP Stack** : Serena + Context7 + Ref + Sequential Thinking + Playwright + IDE
- **Smart Commits** : Sauvegarde automatisée chaque cycle TDD

---

*Généré automatiquement par l'architecture TDD + Agents Want It Now*