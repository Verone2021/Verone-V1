# AXE 5 — PLAN D'ACTION POST-AUDIT

**Date** : 17 avril 2026
**Auteur** : Claude (session coordinateur)
**Objectif** : Synthetiser les 4 rapports precedents en un plan d'action priorise.
**Destinataire** : Romeo (owner, novice en developpement).

---

## 1. SYNTHESE EXECUTIVE

### Etat general du projet : **solide mais desordonne**

**Points forts** :

- Architecture technique mure (monorepo, Supabase, workflow multi-agents bien concu)
- Workflow dev-plan/dev-report effectivement utilise (25 fichiers scratchpad en 2 jours)
- Protection des fichiers critiques formalisee (`PROTECTED_FILES.json`)
- CI qualite (ESLint + type-check + build) bien concue
- 6 agents IA specialises configures + 5 rules + 3 skills + 5 commands
- Romeo a instaure des garde-fous cles (Triple Lecture, chemins casses interdits, zero `any`, etc.)

**Points faibles** :

- Documentation officielle (README.md, quelques CLAUDE.md) **ment** : chiffres faux, workflows inexistants, chemins casses
- Pas de tests E2E en CI, pas de validation migrations SQL
- Doublons documentaires et artefacts anormaux (types Supabase imbriques)
- 25 fichiers > 400 lignes (dette CLAUDE.md violee)
- 18 stash git, 99 TODO/FIXME, branches feature non nettoyees
- Chrome extension orpheline

### Risques si rien n'est fait

1. **Agents IA qui deraillent** : chemins casses dans CLAUDE.md → erreurs silencieuses ou hallucinations
2. **Onboarding humain catastrophique** : README ment, nouveau dev perdu
3. **Refactoring bloque** : doublons types Supabase rendent les imports ambigus
4. **Perte de travail** : 18 stash peuvent contenir du travail critique oublie

### Effort total estime pour **tout** traiter

- Correctifs critiques (chemins casses + doublons types) : **1 jour**
- Reecriture README + corrections docs principales : **1-2 jours**
- Sprint refactoring fichiers > 400 lignes : **2 semaines**
- Creation CLAUDE.md dans 18 packages : **1-2 jours** (si templatise)
- Documentation integrations (Stripe, Revolut, etc.) : **1 semaine**
- Warnings DB + nettoyage stash/branches : **0.5 jour**

**Total realiste** : **3-4 semaines** de travail concentre, ou ~2 mois en fond avec autres developpements en parallele.

---

## 2. PLAN D'ACTION PRIORISE (GANTT SEQUENTIEL)

### Phase 1 — URGENT (< 1 jour) — **Sprint BO-DOC-001**

**Objectif** : eliminer les chemins casses et contradictions critiques qui desorientent les agents IA.

Sprint : `[BO-DOC-001] fix: corriger chemins casses et contradictions critiques documentation`

- [ ] Corriger `CLAUDE.md` racine : `rules/stock-triggers-protected.md` → `.claude/rules/stock-triggers-protected.md`
- [ ] Corriger `apps/linkme/CLAUDE.md` : `.claude/rules/database/rls-patterns.md` → `.claude/rules/database.md` (ou creer le fichier dedie)
- [ ] Corriger `apps/site-internet/CLAUDE.md` : meme correction
- [ ] Corriger `README.md` section Contributing : PR vers **staging** (pas main)
- [ ] Corriger `PROTECTED_FILES.json` : supprimer `packages/@verone/kpi/**` (package inexistant)
- [ ] Mettre a jour `README.md` : `23 packages` (non 26), `142 tables` (non 74), `660 migrations` (non 74), `2 workflows` (non 8), `3 dossiers business-rules` (non 93)

**Sortie** : 1 PR vers staging, commit `[BO-DOC-001] fix: align documentation with reality`.
**Effort** : 2-3h.
**Qui** : delegation a `@writer-agent` avec briefing precis.

### Phase 2 — Nettoyer les artefacts anormaux (< 1 jour)

Sprint : `[BO-TECH-002] refactor: nettoyer doublons imbriques @verone/types et @verone/ui`

- [ ] Grep pour verifier qu'aucun import ne pointe vers les sous-dossiers imbriques
- [ ] Supprimer `packages/@verone/types/apps/`
- [ ] Supprimer `packages/@verone/types/packages/`
- [ ] Supprimer (si confirmes) dans `packages/@verone/ui/packages/`
- [ ] `pnpm install` + `pnpm turbo run type-check`
- [ ] Supprimer `apps/back-office/src/types/supabase.d.ts` (duplicata)

**Sortie** : 1 PR vers staging, `[BO-TECH-002]`.
**Effort** : 1-2h.
**Qui** : delegation a `@dev-agent`.

### Phase 3 — Warnings DB residuels (0.5 jour)

Sprint : 3 tickets `BO-STOCK-W1`, `BO-STOCK-W2`, `BO-STOCK-W5`

Prerequis : Romeo reveille, migrations SQL validees manuellement.

Voir detail dans `docs/scratchpad/dette-technique-2026-04-17.md` section 2.3 et `docs/scratchpad/review-report-retroactive-2026-04-17.md`.

**Effort** : 2-3h total.

### Phase 4 — Reecriture README + documentation workflow (1-2 jours)

Sprint : `[BO-DOC-002] docs: reecriture README + formalisation scratchpad workflow`

- [ ] Reecriture ciblee du `README.md` : supprimer les sections erronees, pointer vers `docs/README.md` pour l'inventaire
- [ ] Creer `docs/current/workflows/scratchpad-workflow.md` (dev-plan → dev-report → review-report → archive)
- [ ] Creer `docs/logs/README.md` (role et format)
- [ ] Reecrire `docs/current/deploy-runbooks.md` pour refleter la realite (Vercel auto-deploy, pas Actions)
- [ ] Ajouter header standardise a 5-10 docs phares (date, statut, source canonique)

**Sortie** : 1 PR `[BO-DOC-002]`.
**Effort** : 1-2 jours.
**Qui** : delegation a `@writer-agent` apres validation plan par Romeo.

### Phase 5 — CLAUDE.md dans les packages (1-2 jours, parallelisable)

Sprint : `[BO-DOC-003] docs: CLAUDE.md minimal pour 18 packages @verone`

- [ ] Creer template `.claude/templates/package-CLAUDE.md`
- [ ] Generer un CLAUDE.md par package metier (18 paquets)
- [ ] Review croise avant commit (reviewer-agent)

**Sortie** : 1-2 PRs.
**Effort** : 1-2 jours.
**Qui** : delegation a `@writer-agent`.

### Phase 6 — Documentation integrations manquantes (1 semaine)

Sprint : `[INFRA-DOC-001] docs: guides integrations Stripe + Revolut`

- [ ] `docs/integrations/stripe/GUIDE-COMPLET-STRIPE.md`
- [ ] `docs/integrations/revolut/GUIDE-COMPLET-REVOLUT.md`
- [ ] `docs/current/feature-flags.md`
- [ ] `docs/current/GLOSSAIRE.md`

**Effort** : 1 semaine en fond (pas bloquant).

### Phase 7 — Hygiene Git (0.5 jour)

Sprint : `[NO-TASK] chore: nettoyage stash + branches mergees`

- [ ] Audit des 18 stash : conservation ou suppression
- [ ] `git branch --merged staging` + suppression

**Effort** : 2-3h.

### Phase 8 — Refactoring fichiers > 400 lignes (sprints dedies)

Sprints progressifs :

- `[BO-MAXLINES-*]` — 10-12 fichiers back-office
- `[LM-MAXLINES-*]` — 10-12 fichiers linkme
- `[SI-MAXLINES-*]` — quelques fichiers site-internet (checkout prioritaire)

**Deja existe** : `docs/current/AUDIT-MAX-LINES-2026-04-14.md` (a relire). Probable que des tickets soient deja ouverts.

**Effort** : 2 semaines intensif.
**Qui** : delegation a `@dev-agent` par paquet de 2-3 fichiers, avec `@reviewer-agent` apres chaque.

### Phase 9 — Tests E2E en CI (0.5-1 jour)

Sprint : `[BO-CI-001] feat: integrer e2e smoke tests a quality.yml`

- [ ] Identifier les tests critiques (les "smoke tests" minimaux)
- [ ] Ajouter un job `e2e-smoke` dans `quality.yml`
- [ ] Gerer les env vars en CI

**Effort** : 0.5-1 jour.

### Phase 10 — Dette basse (au fil de l'eau)

- Inventaire TODO/FIXME → tickets (3h)
- Alignement versions dependances (2h)
- Nettoyage `docs/marketing/`, `docs/runbooks/`, `reports/` → `docs/archive/` (1h)
- Documentation chrome-extension (si conservee) (2h)

---

## 3. REPONSES AUX 15 QUESTIONS OUVERTES DE L'AUDIT 16/04

Je ne peux pas repondre a ta place. Mais voici comment les grouper pour y repondre efficacement :

### A. Questions **business** — Romeo seul peut repondre

- Q1 (deploiement production) — quel Vercel, quelles URLs ?
- Q2 (etat production actuel) — fonctionnalites cassees en prod ?
- Q5 (priorites fonctionnelles) — top 3-5 features a livrer
- Q6 (utilisateurs actifs) — volumes reels par app
- Q7 (equipe) — Romeo seul ou autres ?
- Q10 (Google Merchant actif ?)
- Q11 (Stripe actif ?)
- Q12 (Revolut operationnel ?)
- Q13 (systeme ambassadeurs lance ?)

**Action proposee** : tu repondrez ligne a ligne dans un fichier `docs/scratchpad/reponses-audit-2026-04-17.md` ou dans notre prochaine conversation.

### B. Questions **techniques** — je peux aider a repondre

- Q3 (Phase 1-6 refonte Claude config testees en prod ?) → on peut verifier l'historique Vercel via les logs
- Q4 (doublons types Supabase) → **traite en Axe 4 section 1.1** — ce sont des artefacts a supprimer
- Q8 (18 stash — lesquels garder ?) → on peut les inspecter ensemble un par un
- Q9 (branches mergees) → `git branch --merged` repond directement
- Q14 (chrome-extension) → je n'ai pas assez d'infos, tu dois decider son avenir
- Q15 (tests E2E en CI) → **reponse : NON**, confirme par lecture de `quality.yml`

**Action proposee** : traiter ces questions techniques dans la Phase 7 (hygiene git) et Phase 9 (CI).

---

## 4. RECOMMANDATIONS POUR LE COACHING DE ROMEO

Quelques remarques en dehors du technique pur, puisque tu m'as demande un audit complet.

### 4.1 Sur la discipline scratchpad

Tres bien tenu. 25 fichiers en 2 jours, organises par convention `type-XXX-date-TASK.md`. **Garde ce reflexe.** C'est ce qui te sauve quand tu ne te souviens plus de ce que tu as fait.

Recommandation : formaliser la regle de purge (p. ex. deplacer les dev-plans/reports > 30 jours vers un sous-dossier `docs/scratchpad/archive/`).

### 4.2 Sur le versionnage

Tu as un `CHANGELOG.md` a la racine (vu en listing). `package.json` = v1.0.0, README = v5.1.0. **Choisir un seul systeme** :

- Option simple (recommandee novice) : pas de versionnage, juste dater le README "derniere MAJ le YYYY-MM-DD"
- Option pro : semver, auto-bump via outil (changesets, semantic-release)

Eviter d'avoir 2 sources qui divergent (c'est le cas actuel).

### 4.3 Sur les contradictions entre CLAUDE.md et README.md

Quand ton agent principal (moi) lit CLAUDE.md, il est prioritaire.
Quand un developpeur humain arrive, il lit README.md d'abord.
Les deux doivent etre alignes. Aujourd'hui ils se contredisent sur la branche PR. C'est le genre de piege qui fait que ton agent et un humain donneront des reponses opposees sur la meme question.

### 4.4 Sur le choix de deleguer

Tu as bien instaure la regle "Romeo donne la mission, le coordinateur dispatche". C'est sain. Mais dans l'etat actuel du repo, certaines taches gagneraient a t'etre presentees plus tot pour decision (ex : "garde-t-on chrome-extension ?"). Ne te contente pas d'attendre les questions — **ouvre des tickets "DECISION NEEDED"** pour les choses qui te bloquent.

---

## 5. PROCHAINE ETAPE CONCRETE

Pour que tu ne te noies pas dans ces 5 rapports, voici ma recommandation :

### Etape A — Relis les 5 rapports (30-60 minutes)

Fichiers dans l'ordre :

1. `docs/scratchpad/audit-verone-2026-04-17.md` (mise a jour)
2. `docs/scratchpad/coherence-documentaire-2026-04-17.md` (Axe 2)
3. `docs/scratchpad/documentation-manquante-2026-04-17.md` (Axe 3)
4. `docs/scratchpad/dette-technique-2026-04-17.md` (Axe 4)
5. `docs/scratchpad/plan-action-post-audit-2026-04-17.md` (ce fichier)

### Etape B — Valide le plan en Phase 1 uniquement

Tu me dis : "OK pour Phase 1". Je delegue a `@writer-agent` avec briefing precis. Tu recois 1 PR `[BO-DOC-001]` a reviewer.

### Etape C — Enchaine Phase 2, puis 3, etc.

Une phase a la fois. Je ne demarre jamais une phase sans ton OK explicite.

### Etape D — Questions business (Axe 5 section 3.A)

Reponds aux 9 questions business (Q1, Q2, Q5, Q6, Q7, Q10, Q11, Q12, Q13) quand tu auras 15-20 minutes. Je pourrai alors ajuster les priorites du plan.

---

## 6. CE QUE JE N'AI PAS FAIT (transparence)

Pour que tu saches exactement ou en est l'audit :

- Je n'ai **pas lu** le contenu de chaque CLAUDE.md package (seulement organisations, orders, customers deja cites dans l'audit 16/04)
- Je n'ai **pas verifie** un par un les 23 packages pour savoir lesquels ont un README
- Je n'ai **pas inspecte** les 18 entrees `git stash` (pas les outils pour le faire — il faudrait bash)
- Je n'ai **pas relu** les audits anterieurs de `docs/archive/` (3 audits perf, audit finance) pour voir ce qui avait deja ete decide
- Je n'ai **pas lu** `docs/current/AUDIT-MAX-LINES-2026-04-14.md` (qui aurait peut-etre des tickets deja ouverts)
- Je n'ai **pas lu** `CHANGELOG.md`
- Je n'ai **pas inspecte** `.claude/settings.json` (permissions et hooks detailes)
- Je n'ai **pas verifie** que `.github/CODEOWNERS` existe (mentionne par PROTECTED_FILES.json)

Ces lectures seront faites quand la phase concernee demandera leur contenu. Inutile de tout lire en bloc.

---

**FIN DU RAPPORT — AXE 5**

Plan complet. Maintenant, a toi.
