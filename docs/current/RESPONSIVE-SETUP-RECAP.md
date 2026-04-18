# Infrastructure Responsive Verone — Recap installation

**Date** : 2026-04-18
**Status** : Infrastructure posee, prete a migration

---

## Fichiers crees / modifies par Romeo (cette nuit)

### 1. Regles & Documentation (source de verite)

| Fichier                                           | Role                                     |
| ------------------------------------------------- | ---------------------------------------- |
| `CLAUDE.md` (racine)                              | Regles globales + STANDARDS RESPONSIVE   |
| `.claude/rules/responsive.md`                     | Regle dediee (source detaillee)          |
| `apps/back-office/CLAUDE.md`                      | Instructions app back-office             |
| `apps/linkme/CLAUDE.md`                           | Instructions app linkme (mobile-first)   |
| `apps/site-internet/CLAUDE.md`                    | Instructions site e-commerce             |
| `docs/current/GUIDE-RESPONSIVE.md`                | Guide complet avec exemple copier-coller |
| `.claude/templates/sprint-responsive-template.md` | Template de sprint reutilisable          |

### 2. Infrastructure technique

| Fichier                                                            | Role                                    |
| ------------------------------------------------------------------ | --------------------------------------- |
| `packages/@verone/hooks/src/use-breakpoint.ts`                     | Hook `useBreakpoint()` + constantes     |
| `packages/@verone/hooks/src/index.ts`                              | Exports mis a jour                      |
| `packages/@verone/ui/src/components/ui/responsive-action-menu.tsx` | `<ResponsiveActionMenu>` dropdown auto  |
| `packages/@verone/ui/src/components/ui/responsive-data-view.tsx`   | `<ResponsiveDataView>` table/cards auto |
| `packages/@verone/ui/src/components/ui/responsive-toolbar.tsx`     | `<ResponsiveToolbar>` header de page    |
| `packages/@verone/ui/src/components/ui/index.ts`                   | Exports mis a jour                      |

### 3. Agents & Tests

| Fichier                                          | Role                                          |
| ------------------------------------------------ | --------------------------------------------- |
| `.claude/agents/reviewer-agent.md`               | + Axe 4 Responsive (checklist + FAIL)         |
| `.claude/agents/dev-agent.md`                    | + Obligations responsive Mobile-First         |
| `tests/fixtures/responsive.ts`                   | Helpers Playwright (5 viewports + assertions) |
| `.claude/scripts/check-responsive-violations.sh` | Audit pre-commit des anti-patterns            |

---

## Comment utiliser

### Pour une nouvelle page

1. Lire `docs/current/GUIDE-RESPONSIVE.md`
2. Copier l'exemple Pattern A
3. Adapter aux donnees
4. Tester aux 5 viewports Playwright

### Pour migrer une page existante

1. Copier `.claude/templates/sprint-responsive-template.md` pour le sprint
2. Auditer la page (identifier le pattern)
3. Appliquer les 3 composants standards
4. Tests Playwright 5 tailles
5. PR avec screenshots joints

### Pour un agent Claude Code

Les regles sont DEJA en place dans :

- `CLAUDE.md` (lu automatiquement)
- `.claude/rules/responsive.md`
- `.claude/agents/dev-agent.md` (check automatique)
- `.claude/agents/reviewer-agent.md` (FAIL si non conforme)

L'agent appliquera automatiquement les 5 techniques sur tous les nouveaux
composants UI.

---

## Prochaines etapes (demain matin)

### Sprint 1 : [BO-UI-RESP-001] — Validation infrastructure

Prompt a coller a Claude Code :

```
Sprint [BO-UI-RESP-001] : valider infrastructure responsive posee par Romeo.

LECTURE OBLIGATOIRE :
1. CLAUDE.md (section STANDARDS RESPONSIVE)
2. .claude/rules/responsive.md
3. docs/current/GUIDE-RESPONSIVE.md
4. Les 3 composants responsive crees

MISSION :
1. VERIFIER BUILD :
   pnpm install
   pnpm --filter @verone/hooks build
   pnpm --filter @verone/ui build
   pnpm --filter @verone/back-office type-check
   pnpm --filter @verone/linkme type-check
   pnpm --filter @verone/site-internet type-check

2. FIXER les erreurs de build eventuelles (imports, types)

3. COMMIT ce qu'a prepare Romeo :
   git checkout -b feat/BO-UI-RESP-001-infrastructure
   git add -A
   git commit -m "[BO-UI-RESP-001] feat: responsive infrastructure + standards"

4. PR --base staging, merge squash apres CI verte

5. RAPPORT : PR number + confirmation build OK sur les 3 apps

INTERDICTIONS :
- AUCUNE modification de page existante
- AUCUN nouveau composant UI
- AUCUN ajustement de style sur les pages actuelles

Infrastructure uniquement. Migration viendra dans les sprints 002+.
```

### Sprint 2 : [BO-UI-RESP-002] — Audit global des 147+ pages

Prompt a coller ensuite :

```
Sprint [BO-UI-RESP-002] : audit global responsive des 3 apps.

LECTURE : infrastructure responsive deja en place (BO-UI-RESP-001 merge).

MISSION : auditer TOUTES les pages des 3 apps et les classer par pattern.

Livrable : docs/scratchpad/audit-responsive-global-2026-04-19.md

Pour chaque page :
- Route
- Pattern (A/B/C/D/E/F)
- Colonnes a masquer / breakpoints
- Actions a mettre en dropdown
- Effort (S/M/L)
- Priorite (1-3)

Proposer le decoupage en sprints 003 a 009 :
- [BO-UI-RESP-003] : Pattern A pages critiques (factures, commandes, stocks)
- [BO-UI-RESP-004] : Pattern A pages secondaires
- [BO-UI-RESP-005] : Pattern B (listes + filtres)
- [BO-UI-RESP-006] : Pattern C (detail pages)
- [BO-UI-RESP-007] : Pattern D (dashboards)
- [BO-UI-RESP-008] : Pattern E + F (modals + forms)
- [BO-UI-RESP-009] : Couverture LinkMe + site-internet

INTERDICTIONS : zero code modifie. Audit pur + plan.

Rapport final : PR audit + plan de 7 sprints approuve par Romeo avant execution.
```

---

## Criteres de succes

- 3 apps totalement responsive de 320px a 2560px
- Touch targets 44px sur mobile partout
- Actions CRUD toujours accessibles
- Tests Playwright verts aux 5 tailles sur toutes les pages migrees
- Aucun scroll horizontal parasite
- Reviewer-agent PASS systematique

Estimation totale migration : 8-10 jours (7 sprints × 1-2 jours).

---

## Anti-regression

Garanties posees pour eviter regressions futures :

1. `reviewer-agent.md` : checklist responsive obligatoire, FAIL si non conforme
2. `dev-agent.md` : obligation de lire `.claude/rules/responsive.md` avant toute PR UI
3. `CLAUDE.md` : anti-patterns listes en interdictions absolues
4. `check-responsive-violations.sh` : detecte anti-patterns dans code source
5. `tests/fixtures/responsive.ts` : helpers pour tests systematiques

Tout nouveau code UI devra respecter ces standards automatiquement.
