# 🗺️ ROADMAP DÉVELOPPEMENT - Vérone Back-Office V1

**Date création** : 2025-11-08
**Version** : 1.0
**Horizon** : T1 2026 (4 mois)
**Public** : Développeur novice

---

## 📍 POINT DE SITUATION (2025-11-08)

### ✅ État Actuel

**Architecture Monorepo** :

- ✅ Migration 100% terminée (VAGUES 1-5)
- ✅ 21 packages `@verone/*` opérationnels
- ✅ 0 erreurs TypeScript
- ✅ Build production fonctionnel
- ✅ Pre-commit hooks sans `--no-verify`

**Composants Design System V2** :

- ✅ 2 composants unifiés production-ready (ButtonUnified, KPICardUnified)
- ✅ Design tokens complets (colors, spacing, typography, shadows)
- ✅ 4,030 lignes de documentation professionnelle
- ✅ CVA + Radix UI + Tailwind CSS configurés

**Back-Office** :

- ✅ Modules core actifs (Auth, Dashboard, Organisations, Contacts, Admin)
- 🟡 Modules business en développement (Produits, Stocks, Commandes, Finance)

---

## 🎯 OBJECTIFS GLOBAUX

### Court Terme (T4 2025 - 1 mois)

1. **Finaliser fondations réutilisables** (composants + monorepo)
2. **Stabiliser back-office** (modules existants)
3. **Préparer architecture multi-apps** (Turborepo)

### Moyen Terme (T1 2026 - 3 mois)

1. **Lancer développement site web e-commerce**
2. **Compléter back-office** (modules restants)
3. **Documenter patterns pour scaling**

---

## 🛣️ CHEMINS DE CONTINUITÉ

### Option A : Composants d'abord (Recommandé Novice)

**Timeline** : 2-3 semaines
**Charge** : ~25-30h (mi-temps)
**Difficulté** : 🟢 Facile à Moyen

**Avantages** :

- ✅ Suite logique de VAGUE 1
- ✅ Apprentissage progressif CVA + Radix UI
- ✅ Résultats visuels rapides (motivation)
- ✅ Composants prêts pour website (gain temps futur)

**Planning détaillé** :

#### Semaine 1 : Composants Simples

```
Lundi-Mardi : BadgeUnified (2-3h)
- 10 variants (default, secondary, destructive, outline, success, warning, info, customer, supplier, partner)
- Props : variant, size, icon, dot, removable
- Pattern : Copier ButtonUnified.tsx

Mercredi-Jeudi : CardUnified (2-3h)
- 6 variants (elevated, flat, outline, interactive, glass, gradient)
- Props : variant, padding, clickable, hoverable, header, footer
- Pattern : Composant wrapper simple

Vendredi : Storybook Documentation (2h)
- Stories BadgeUnified + CardUnified
- Exemples d'utilisation
```

#### Semaine 2 : Composant Input + Intégration

```
Lundi-Mercredi : InputUnified (3-4h)
- 4 variants (default, filled, outlined, underlined)
- Props : variant, size, icon, error, helper
- Gérer états (focus, error, disabled)

Jeudi : Utilisation dans back-office (2-3h)
- Remplacer 5-10 boutons par ButtonUnified
- Remplacer 3-5 cards par CardUnified
- Remplacer 5-10 inputs par InputUnified

Vendredi : Tests manuels (1-2h)
- MCP Playwright Browser
- Vérifier console = 0 errors
- Screenshots avant/après
```

#### Semaine 3 : Composant Complexe (Optionnel)

```
Lundi-Vendredi : FormUnified (6-8h)
- 3 variants (inline, stacked, floating)
- Props : schema (Zod), onSubmit, fields, loading
- Intégration React Hook Form
- Documentation complète
```

**Résultat attendu** :

- 3-5 composants unifiés production-ready
- 10-20 fichiers back-office utilisant nouveaux composants
- Storybook coverage 20-30%
- Confiance accrue CVA + Radix UI

---

### Option B : Monorepo d'abord

**Timeline** : 3-5 jours
**Charge** : ~10-12h
**Difficulté** : 🟡 Moyen

**Avantages** :

- ✅ Base 100% propre (0 dette technique)
- ✅ Architecture finale stable
- ✅ Prêt pour Turborepo multi-apps

**Inconvénients** :

- ❌ Moins visuel (peut sembler monotone)
- ❌ Courbe d'apprentissage tools (imports, exports)

**Planning détaillé** :

#### Jour 1 : VAGUE 3 - Migration src/lib/ (4h)

```
1. Analyser fichiers src/lib/ restants (65 fichiers)
2. Identifier destination packages :
   - utils → @verone/utils
   - integrations → @verone/integrations
3. Migrer batch par batch (10 fichiers)
4. Update imports (150-200 fichiers)
5. Tests : type-check + build
```

#### Jour 2 : VAGUE 4 - Update imports (3h30)

```
1. Script automatique migration imports
2. Update 326 fichiers :
   - @/lib/* → @verone/utils ou @verone/integrations
   - Imports relatifs → Imports monorepo
3. Tests exhaustifs :
   - type-check = 0 errors
   - build = success
   - MCP Browser = 0 console errors
```

#### Jour 3 : VAGUE 5 - Cleanup (3h15)

```
1. Supprimer dossiers vides src/lib/
2. Update tsconfig.json paths
3. Validation finale :
   - 411 fichiers src/shared/modules/ clean
   - Aucun import @/lib/* restant
   - Documentation à jour
4. Commit + Push + Tag release v2.1.0
```

**Résultat attendu** :

- Architecture monorepo 100% finalisée
- 0 imports legacy @/lib/\*
- Base stable pour Turborepo
- Documentation complète monorepo

---

### Option C : Mix Progressif (Idéal Novice)

**Timeline** : 4 semaines
**Charge** : ~35-40h
**Difficulté** : 🟢 Facile (équilibré)

**Avantages** :

- ✅ Équilibre apprendre/produire
- ✅ Pas monotone (alternance visuel/technique)
- ✅ Avancement constant visible
- ✅ Flexibilité si blocage

**Planning détaillé** :

#### Semaine 1 : BadgeUnified + Storybook

```
Lundi-Mercredi : BadgeUnified (2-3h)
Jeudi-Vendredi : Storybook docs (2h)
```

#### Semaine 2 : VAGUE 3 (migration src/lib/)

```
Lundi-Vendredi : Migration complète (4h)
```

#### Semaine 3 : CardUnified + InputUnified

```
Lundi-Mercredi : CardUnified (2-3h)
Jeudi-Vendredi : InputUnified (3-4h)
```

#### Semaine 4 : VAGUES 4-5 (cleanup final)

```
Lundi-Mercredi : VAGUE 4 imports (3h30)
Jeudi-Vendredi : VAGUE 5 cleanup (3h15)
```

**Résultat attendu** :

- 3 composants unifiés production-ready
- Architecture monorepo 100% finalisée
- Apprentissage équilibré
- Motivation maintenue

---

## 📅 ROADMAP COMPLÈTE (4 mois)

### Phase 1 : Fondations Solides (3-4 semaines)

**Objectif** : Composants réutilisables + Monorepo finalisé

| Semaine | Actions                               | Livrables                    |
| ------- | ------------------------------------- | ---------------------------- |
| **S1**  | Choisir option (A/B/C) + BadgeUnified | 1 composant + décision       |
| **S2**  | CardUnified + InputUnified OU VAGUE 3 | 2 composants OU monorepo 50% |
| **S3**  | FormUnified OU VAGUES 4-5             | 1 composant OU monorepo 100% |
| **S4**  | Finalisation option choisie           | Tous objectifs atteints      |

**Critères de succès** :

- ✅ 3-5 composants unifiés production-ready
- ✅ Monorepo 100% finalisé (si Option B/C)
- ✅ Storybook coverage 20-30%
- ✅ 0 erreurs TypeScript
- ✅ Documentation complète

---

### Phase 2 : Stabilisation Back-Office (4-6 semaines)

**Objectif** : Modules business fonctionnels + Tests E2E

| Semaine   | Module                 | Actions                                 |
| --------- | ---------------------- | --------------------------------------- |
| **S5-S6** | **Produits/Catalogue** | Finir CRUD complet, images, variants    |
| **S7-S8** | **Stocks**             | Mouvements, alertes, inventaire         |
| **S9**    | **Commandes**          | Workflow commandes clients/fournisseurs |
| **S10**   | **Finance**            | Factures, paiements, trésorerie         |

**Critères de succès** :

- ✅ 4 modules business fonctionnels
- ✅ Tests E2E critiques (20 tests)
- ✅ Console = 0 errors (toutes pages)
- ✅ Performance SLOs respectés (<2s dashboard)

---

### Phase 3 : Setup Turborepo Multi-Apps (1 semaine)

**Objectif** : Préparer architecture pour website

**Actions** :

```bash
# Jour 1 : Installation Turborepo
pnpm add -D turbo

# Jour 2-3 : Restructuration
mkdir -p apps/back-office
mv src/* apps/back-office/src/
mv package.json apps/back-office/

# Jour 4 : Configuration turbo.json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"] },
    "dev": { "cache": false }
  }
}

# Jour 5 : Tests validation
pnpm dev:back-office  # Port 3000
pnpm build:back-office
```

**Critères de succès** :

- ✅ Structure `apps/` fonctionnelle
- ✅ Scripts `dev:back-office`, `build:back-office`
- ✅ Build temps <20s
- ✅ Documentation Turborepo

---

### Phase 4 : Développement Website (8-10 semaines)

**Objectif** : Site e-commerce v1 (landing + catalogue)

| Semaine     | Feature               | Composants                   |
| ----------- | --------------------- | ---------------------------- |
| **S13-S14** | Setup Next.js + Home  | Hero, Features, CTA          |
| **S15-S16** | Catalogue produits    | ProductCard, Filters, Search |
| **S17-S18** | Pages produit détail  | Gallery, Specs, Reviews      |
| **S19-S20** | Panier + Tunnel achat | Cart, Checkout, Payment      |
| **S21-S22** | Compte client         | Login, Orders, Profile       |

**Critères de succès** :

- ✅ Website déployé (Vercel)
- ✅ 5 pages core fonctionnelles
- ✅ Composants @verone/ui réutilisés
- ✅ Performance Lighthouse >90

---

## 🎓 LEARNING PATH (Novice)

### Concepts à Maîtriser (dans l'ordre)

#### Niveau 1 : Composants UI (Semaines 1-3)

```typescript
✅ CVA (Class Variance Authority) : Variants type-safe
✅ Radix UI : Primitives accessibles (Slot, Dialog, Popover)
✅ Props TypeScript : Interface, VariantProps, React.ComponentProps
✅ Composition : asChild pattern, forwarding refs
```

#### Niveau 2 : Architecture Monorepo (Semaines 4-5)

```typescript
✅ pnpm workspaces : workspace:* protocol
✅ Package exports : Subpath exports, types resolution
✅ TypeScript project references : tsconfig extends
✅ Imports monorepo : @verone/* vs relatifs
```

#### Niveau 3 : Next.js Avancé (Semaines 6-10)

```typescript
✅ App Router : RSC, Server Actions, Route Handlers
✅ Data fetching : Supabase client SSR/CSR
✅ Caching : revalidatePath, cache tags
✅ Optimizations : next/image, next/font, dynamic imports
```

#### Niveau 4 : Turborepo Multi-Apps (Semaine 11)

```typescript
✅ Pipeline configuration : Dependencies, caching
✅ Workspace apps : Shared packages, isolated builds
✅ Deployment : Vercel multi-apps, env variables
```

---

## 📋 CHECKLISTS PAR PHASE

### Checklist Phase 1 (Fondations)

**Avant de commencer** :

- [ ] Choix option continuité (A/B/C)
- [ ] Git status clean (rien à commit)
- [ ] Dev server fonctionnel (`npm run dev`)

**Pour chaque composant** :

- [ ] Lire ButtonUnified.tsx comme référence
- [ ] Définir variants (3-10 variants)
- [ ] Définir props (TypeScript interfaces)
- [ ] Implémenter avec CVA
- [ ] Créer Story Storybook
- [ ] Tester manuellement (MCP Browser)
- [ ] Console = 0 errors
- [ ] Commit + Push

**Fin de phase** :

- [ ] 3-5 composants production-ready
- [ ] Storybook coverage 20-30%
- [ ] Documentation à jour
- [ ] 0 erreurs TypeScript
- [ ] Tag release (si applicable)

### Checklist Phase 2 (Back-Office)

**Pour chaque module** :

- [ ] CRUD complet (Create, Read, Update, Delete)
- [ ] Formulaires validés (React Hook Form + Zod)
- [ ] Tables avec tri/filtres (@tanstack/react-table)
- [ ] États loading/error gérés
- [ ] Console = 0 errors
- [ ] Performance <3s
- [ ] Tests E2E critiques

### Checklist Phase 3 (Turborepo)

- [ ] Turborepo installé (`pnpm add -D turbo`)
- [ ] Structure `apps/` créée
- [ ] `turbo.json` configuré
- [ ] Scripts `dev:*`, `build:*` fonctionnels
- [ ] Documentation architecture
- [ ] Tests validation (dev + build)

### Checklist Phase 4 (Website)

- [ ] Next.js app créée (`apps/website`)
- [ ] Packages @verone/\* réutilisés
- [ ] Design system cohérent
- [ ] Pages core fonctionnelles (5+)
- [ ] Performance Lighthouse >90
- [ ] Déploiement Vercel

---

## 🚨 RISQUES & MITIGATION

### Risque 1 : Fatigue/Monotonie

**Probabilité** : Moyenne
**Impact** : Abandon temporaire
**Mitigation** : Option C (mix progressif) recommandée

### Risque 2 : Blocages Techniques

**Probabilité** : Élevée (novice)
**Impact** : Perte temps
**Mitigation** :

- Documentation exhaustive disponible (4,030 lignes)
- Exemples référence (ButtonUnified, KPICardUnified)
- Sequential Thinking MCP pour décomposer problèmes

### Risque 3 : Scope Creep

**Probabilité** : Moyenne
**Impact** : Timeline dépassée
**Mitigation** :

- Roadmap stricte avec critères succès
- Composants MVP (pas perfectionnisme)
- Reviews régulières (1x/semaine)

### Risque 4 : Dépendances Manquantes

**Probabilité** : Faible (déjà résolu)
**Impact** : Blocage build
**Mitigation** :

- Pre-commit hooks validant types
- pnpm install systématique après modifications packages

---

## 🎯 INDICATEURS DE SUCCÈS

### KPI Techniques

| Métrique                      | Objectif | Actuel | Status |
| ----------------------------- | -------- | ------ | ------ |
| **Erreurs TypeScript**        | 0        | 0      | ✅     |
| **Build time**                | <20s     | ~15s   | ✅     |
| **Performance Dashboard**     | <2s      | ~1.5s  | ✅     |
| **Console errors production** | 0        | 0      | ✅     |
| **Composants unifiés**        | 7        | 2      | 🟡 29% |
| **Storybook coverage**        | 50%      | 9.8%   | 🔴 19% |
| **Tests E2E critiques**       | 20       | 5      | 🟡 25% |

### KPI Business

| Métrique                   | Objectif T1 2026 | Actuel | Status |
| -------------------------- | ---------------- | ------ | ------ |
| **Modules back-office**    | 15               | 4      | 🟡 27% |
| **Pages website**          | 5                | 0      | 🔴 0%  |
| **Performance Lighthouse** | >90              | -      | ⏳     |
| **Uptime production**      | >99%             | 100%   | ✅     |

---

## 🔄 MISE À JOUR ROADMAP

**Fréquence** : Hebdomadaire (ou après milestone)

**Responsable** : Romeo Dos Santos + Claude Code

**Triggers de mise à jour** :

- Fin de phase (1-4)
- Changement priorités business
- Blocage >3 jours
- Nouvelle fonctionnalité critique

**Format MAJ** :

```markdown
## [YYYY-MM-DD] - Phase X Update

### Progrès

- ✅ Completed: [...]
- 🟡 In Progress: [...]
- ❌ Blocked: [...]

### Décisions

- [Décision 1]
- [Décision 2]

### Ajustements Timeline

- [Ajustement 1]

### Next Steps

- [Step 1]
- [Step 2]
```

---

## 📚 RESSOURCES CLÉS

### Documentation Interne

- `docs/STATUS-COMPOSANTS-DYNAMIQUES.md` : État actuel composants
- `docs/audits/2025-11/GUIDE-DESIGN-SYSTEM-V2.md` : Guide utilisateur Design System
- `docs/audits/2025-11/ARCHITECTURE-COMPOSANTS-GENERIQUES-V2.md` : Specs techniques
- `CLAUDE.md` : Workflow universel 2025

### Code Référence

- `packages/@verone/ui/src/components/ui/button-unified.tsx` : Pattern composant simple
- `packages/@verone/ui/src/components/ui/kpi-card-unified.tsx` : Pattern composant complexe
- `packages/@verone/ui/src/design-system/tokens/` : Design tokens complets

### Outils Externes

- [CVA Documentation](https://cva.style/docs) : Variants management
- [Radix UI Documentation](https://www.radix-ui.com) : Accessible primitives
- [Turborepo Documentation](https://turbo.build/repo/docs) : Monorepo build system
- [Next.js 15 Documentation](https://nextjs.org/docs) : App Router, RSC

---

## 📞 SUPPORT & ESCALATION

### Blocages Techniques

1. **Consulter documentation** (docs/ exhaustif)
2. **Lire code référence** (ButtonUnified, KPICardUnified)
3. **Sequential Thinking MCP** : Décomposer problème
4. **Context7 MCP** : Documentation officielle libraries
5. **Demander à Claude Code** (avec contexte précis)

### Décisions Business

1. **Consulter roadmap** (ce document)
2. **Vérifier business rules** (`docs/business-rules/`)
3. **Escalade Romeo** si priorités changent

---

**Version** : 1.0
**Dernière mise à jour** : 2025-11-08
**Prochaine revue** : 2025-11-15 (ou fin Phase 1)

---

## 🎬 DÉMARRAGE RAPIDE

**Pour commencer MAINTENANT** :

1. **Choisir votre option** : A (composants), B (monorepo), ou C (mix)
2. **Lire guide novice** : `docs/GUIDE-NOVICE-PERSONNALISE.md` (à créer)
3. **Consulter STATUS** : `docs/STATUS-COMPOSANTS-DYNAMIQUES.md`
4. **Lancer dev server** : `npm run dev`
5. **Commencer première tâche** : Selon option choisie

**Questions fréquentes** :

- "Par où commencer ?" → **Option C recommandée** (mix progressif)
- "Combien de temps ?" → **2-3 semaines Phase 1** (mi-temps)
- "Quelle difficulté ?" → **🟢 Facile avec documentation exhaustive**

**Prêt à démarrer ? Choisissez votre option (A/B/C)** et on continue ! 🚀
