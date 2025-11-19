# ADR-0001: Turborepo Monorepo Architecture

**Date** : 2025-10-20
**Auteur** : Romeo Dos Santos
**Statut** : Accepté

---

## Statut

**Accepté** ✅ - Implémenté et déployé en production (2025-11-19)

---

## Contexte

**Situation** : Vérone Back Office évoluait vers une application multi-frontends avec besoin de partager du code (composants UI, types, hooks, utils) entre plusieurs apps.

**Problèmes** :

1. Duplication code entre apps (composants, types, business logic)
2. Versions dépendances désynchronisées entre apps
3. Build time élevé (rebuild complet à chaque changement)
4. Difficulté refactoring cross-apps (pas de garantie type safety)
5. Scalabilité limitée (ajout nouvelle app = duplication setup)

**Contraintes** :

- Migration sans Big Bang (progressive)
- Zero downtime production
- Maintien DX (Developer Experience) excellente
- Build time <30s pour feedback rapide

---

## Décision

**Nous avons décidé d'adopter une architecture Turborepo monorepo** avec structure suivante :

```
verone-back-office-V1/
├── apps/
│   ├── back-office/    # CRM/ERP complet (Port 3000)
│   ├── site-internet/  # E-commerce public (Port 3001)
│   └── linkme/         # Commissions apporteurs (Port 3002)
├── packages/
│   ├── @verone/ui/           # Design System (54 composants)
│   ├── @verone/products/     # Composants produits
│   ├── @verone/orders/       # Composants commandes
│   ├── @verone/stock/        # Composants stock
│   ├── @verone/types/        # Types TypeScript communs
│   ├── @verone/utils/        # Utilitaires communs
│   └── ... (25 packages total)
└── turbo.json            # Configuration Turborepo
```

**Implémentation** :

- **Turborepo v2.6.0** pour orchestration build/dev/test
- **pnpm workspaces** pour gestion dépendances
- **TypeScript strict mode** avec path aliases `@verone/*`
- **Build incrémental** : Turborepo cache local + remote (Vercel)
- **Shared packages** : 25 packages business + UI + utils

---

## Conséquences

### ✅ Positives

**Architecture** :

- ✅ Code partagé (DRY) : Composants UI, types, hooks réutilisés entre 3 apps
- ✅ Build incrémental : 90% cache hit rate (2s builds vs 20s)
- ✅ Type safety cross-apps : Refactoring safe avec TypeScript strict
- ✅ Scalabilité : Ajouter nouvelle app = réutiliser 25 packages existants

**DX (Developer Experience)** :

- ✅ Hot reload cross-packages (modif @verone/ui → refresh back-office instantané)
- ✅ Jump-to-definition cross-workspace (VS Code)
- ✅ Commandes uniformes (`turbo dev`, `turbo build`, `turbo test`)

**Qualité** :

- ✅ Lint/format/tests uniformes (configs partagées)
- ✅ Versioning cohérent (1 package.json root)
- ✅ CI/CD optimisé (build seulement packages modifiés)

### ⚠️ Négatives

- ⚠️ **Complexité setup initiale** (+2 jours migration)
  → Mitigation : Documentation exhaustive ([TURBOREPO-FINAL-CHECKLIST.md](/docs/architecture/TURBOREPO-FINAL-CHECKLIST.md))

- ⚠️ **Courbe apprentissage Turborepo** (~1 semaine équipe)
  → Mitigation : Formation + pair programming

- ⚠️ **Taille repo** (25 packages + 3 apps)
  → Mitigation : `.gitignore` optimisé, cache Turborepo

### 🔄 Neutre / À Surveiller

- **Build cache invalidation** : Risque cache stale si modif dépendances
- **Monorepo vs Polyrepo** : Décision difficile à reverser (migration coûteuse)

---

## Alternatives Considérées

### Option A : Polyrepo (Repos séparés)

**Description** : Maintenir 3 repos Git séparés (back-office, site-internet, linkme) avec packages npm publiés séparément.

**Avantages** :

- Simplicité conceptuelle (1 app = 1 repo)
- Isolation complète (changement app A n'impacte pas app B)
- Déploiement indépendant

**Inconvénients** :

- Duplication code (composants UI, types, hooks)
- Versioning complexe (gérer versions packages partagés)
- Refactoring cross-repos difficile (pas de garantie type safety)
- Build time total élevé (rebuild chaque repo séparément)

**Raison rejet** : Duplication code inacceptable avec 3 apps utilisant 80% code commun.

---

### Option B : Nx Monorepo

**Description** : Alternative Turborepo avec plus de features (code generators, graph visualization, affected commands).

**Avantages** :

- Plus de features que Turborepo (generators, plugins, affected)
- Graph dépendances visuel
- Intégration CI/CD avancée

**Inconvénients** :

- Complexité configuration (plus verbeux que Turborepo)
- Overhead fonctionnalités non utilisées (over-engineering)
- Lock-in vendor (écosystème Nx propriétaire)

**Raison rejet** : Turborepo plus simple, suffit pour besoins Vérone. Principe YAGNI (You Aren't Gonna Need It).

---

### Option C : Yarn/npm Workspaces seul

**Description** : Utiliser seulement Yarn/npm workspaces sans outil build orchestration (Turborepo/Nx).

**Avantages** :

- Simplicité maximale (pas d'outil additionnel)
- Standard npm/yarn natif

**Inconvénients** :

- Pas de build incrémental (rebuild complet toujours)
- Pas de cache distribué (chaque dev rebuild from scratch)
- Pas d'orchestration tasks (dev/build/test)

**Raison rejet** : Build time inacceptable sans cache incrémental (20s+ vs 2s avec Turborepo).

---

## Validation

**Critères de réussite** :

- [x] 3 apps déployées en production
- [x] 25 packages @verone/\* fonctionnels
- [x] Build time <20s (objectif <30s) ✅ Atteint : 2s avec cache
- [x] Zero console errors (tolérance zéro)
- [x] TypeScript strict mode activé partout
- [x] Documentation complète migration

**Métriques** :

- **Build time** : 2s (avec cache) vs 20s (sans cache) → **90% réduction**
- **Apps déployées** : 3/3 (back-office, site-internet, linkme)
- **Packages partagés** : 25 packages @verone/\*
- **Cache hit rate** : ~90% (Turborepo local cache)
- **Type safety** : 100% (zero TypeScript errors)

---

## Liens & Références

**Documentation** :

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [TURBOREPO-FINAL-CHECKLIST.md](/docs/architecture/TURBOREPO-FINAL-CHECKLIST.md)
- [MIGRATION-TURBOREPO-TODO.md](/docs/architecture/MIGRATION-TURBOREPO-TODO.md)
- [.claude/contexts/monorepo.md](/.claude/contexts/monorepo.md)

**ADR Connexes** :

- ADR-0002 : Design System V2 avec CVA (composants partagés)
- ADR-0004 : Pricing Multi-Canaux (packages business)

**Discussions** :

- GitHub PR #47 : Migration Turborepo Phase 4
- Commit : `b4ad97fa` (2025-11-19) - Finalisation documentation

---

**Date finalisation** : 2025-11-19
**Dernière mise à jour** : 2025-11-19
**Migration** : ✅ COMPLÉTÉE (47/47 problèmes résolus)
