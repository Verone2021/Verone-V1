# Règles Workflow Verone

**Source de vérité unique** pour Git / PR / merge + checklist 4 questions
avant nouvelle branche (anciennement `branch-strategy.md`, fusionnée en
`[INFRA-LEAN-001]`).

> Compactée en `[INFRA-LEAN-002]` — exemples redondants retirés.

**Voir aussi** : `.claude/rules/no-worktree-solo.md` — JAMAIS `git worktree add`.

---

## RÈGLE ABSOLUE — Cible des branches

**Toute branche feature/fix/hotfix part de `staging` et PR vers `staging`. JAMAIS vers `main`.**

```bash
git checkout staging && git pull
git checkout -b feat/XXX
gh pr create --base staging --head feat/XXX
```

Seule exception vers `main` : la **release PR** `staging → main`, créée
**EXCLUSIVEMENT par Romeo** (manuel ou via `auto-release-staging-to-main.yml`).
L'agent ne crée JAMAIS cette release PR de sa propre initiative.

Toute autre PR vers `main` est bloquée par `protect-main-source.yml`. Bypass
via label `hotfix-direct` réservé à Romeo. **Avant tout `gh pr create` :
vérifie deux fois la base.** Si tu hésites, c'est `--base staging`.

Pourquoi : si tu PR vers main directement, main avance avant staging → la
release PR staging→main devient un calvaire de conflits (incident 2026-04-25).

---

## Checklist OBLIGATOIRE avant nouvelle branche / nouvelle PR

4 questions. Si une seule réponse est ambiguë → demander Romeo (cas business).

### 1. Une PR ouverte couvre-t-elle déjà le sujet ?

```bash
gh pr list --state open --base staging --json number,title,headRefName
```

"Même sujet fonctionnel" = même tag `[APP-DOMAIN-*]` ou même page/feature
métier. **Si OUI** → continuer sur sa branche, ajouter un commit. Pas de nouvelle PR.

### 2. La correction est-elle dans la même boucle d'itération ?

Si Romeo enchaîne plusieurs corrections sur le même écran/feature dans la
même session, c'est UNE itération → UNE branche. **Si OUI** → continuer.

### 3. Romeo a-t-il explicitement dit "fais une nouvelle PR" ?

L'agent ne décide pas seul de séparer. **Si NON** → reste sur la branche en
cours. Par défaut, commit sur la branche en cours.

### 4. Le sujet touche-t-il un RPC, une fonction DB, ou une colonne ?

Si oui, la PR DOIT inclure dans le même commit (ou un 2e commit) :

```bash
pnpm run generate:types
git add packages/@verone/types/src/supabase.ts
```

Sans ça, le check `Supabase TS types drift (blocking)` fail au merge release
main → PR de rattrapage = ~25 min. Si `pnpm run generate:types` échoue,
utiliser `mcp__supabase__generate_typescript_types` (attention : omet
`graphql_public`, télécharger artifact `supabase-types-drift` du CI failed
pour fichier byte-for-byte conforme).

### Démarrage de session

```bash
gh pr list --state open --base staging --json number,title,headRefName,isDraft
```

### Si la règle semble impossible à respecter

Cas : Romeo demande pendant une PR ouverte un fix totalement indépendant
et urgent. Demander : "Branche X (PR #YYY pour A). Tu veux Y dans la même
PR ou une PR dédiée ?" Attendre. Une demande inutile coûte 5 s, une PR
éclatée coûte 1 h de rebase.

---

## Principe : 1 PR = 1 bloc cohérent

Pas une PR par sprint. UNE PR par bloc cohérent qui a du sens pour le reviewer.

| Mauvais (banni)       | Bon (obligatoire)                       |
| --------------------- | --------------------------------------- |
| Sprint 1 → PR → merge | Sprint 1 → commit + push (même branche) |
| Sprint 2 → PR → merge | Sprint 2 → commit + push (même branche) |
| Sprint 3 → PR → merge | Sprint 3 → commit + push (même branche) |
| 45 min CI overhead    | Bloc complet → 1 PR → 1 CI (15 min)     |

Exemples de blocs cohérents (= 1 PR) :

- Migration responsive Pattern A complet (factures + commandes + stocks ensemble)
- Sprint finance entier (R1 → R7)
- Bundling thématique (Meta + Google Merchant + Site Internet ensemble)

---

## Règles strictes

### Commits & Push

**TOUJOURS** : commit après chaque sous-tâche, push après chaque commit,
format `[APP-DOMAIN-NNN] type: description`, `git push --force-with-lease`
(jamais `--force` nu).

**JAMAIS** : commit "WIP" vague, `--force` nu, commit sans Task ID (sauf
`[NO-TASK]`), `git worktree add`.

### PR

UNE PR = UN BLOC COHÉRENT. PR uniquement quand bloc fonctionnellement
complet ET reviewer PASS. Sinon continuer commits/push sur la branche.

### Merge

1 merge squash par PR. Merge SEULEMENT quand bloc entier fini. JAMAIS en
cours de bloc pour "avancer".

### Branches

Une branche par bloc. Vit plusieurs jours si nécessaire. Bascule via
`git checkout` (avec `git stash` si dirty). JAMAIS `git worktree add`.

---

## Quand CRÉER une PR

Tous ces critères doivent être remplis :

- [ ] Bloc fonctionnellement complet (pas mi-fini)
- [ ] Pas de régression sur les pages déjà migrées
- [ ] Type-check + build verts localement (ou CI)
- [ ] Tests Playwright OK (si applicable)
- [ ] Reviewer-agent PASS dans `docs/scratchpad/review-report-*.md`
- [ ] Bloc regroupe 3+ sous-tâches OU bloc atomique critique

Un seul critère manquant : pas de PR, continuer commits/push.

## Quand MERGER une PR

- [ ] CI verte (type-check + build + tests + drift DB)
- [ ] Reviewer-agent PASS
- [ ] Aucun CRITICAL dans le review report
- [ ] Romeo a validé OU CI verte sur sprint pré-approuvé (cf. mémoire feedback `ci_green_auto_merge`)

Merger en `--squash --delete-branch`.

---

## Anti-patterns interdits (checklist branche/PR)

- ❌ Nouvelle branche pour fix UX d'un bandeau déjà en PR ouverte
- ❌ 2 branches pour 2 commits qui touchent les mêmes fichiers
- ❌ Merger une PR puis créer immédiatement une autre PR sur le même écran pour un raffinement (le raffinement aurait dû être un commit de plus avant le merge)
- ❌ Force-rebase à répétition parce que les branches partent de staging à des moments différents

---

## Communication Romeo ↔ agent

Commit/push régulier (rassure que ça avance), pas de PR intermédiaire,
rapport après chaque commit important (pas après chaque ligne), demander
validation UNIQUEMENT quand PR prête à merger. Si Romeo dit "continue",
enchaîner sprints sur la même branche sans PR entre chaque.

---

## Playbooks

Pour la migration responsive uniquement, voir `.claude/playbooks/migrate-page-responsive.md` (capture le fix du bug "Rendered more hooks" du pilote v1 FAIL).

Autres playbooks supprimés (ADR-011) : doublonnaient les capacités natives.

---

## Résumé en 3 lignes

1. Commit + push souvent (sauvegarde)
2. PR uniquement quand bloc cohérent (3+ sprints) fini
3. Merge uniquement quand tout validé

---

## Incident 2026-04-28 — bundling thématique manqué (1h50 perdues)

Romeo a enchaîné 3 fixes Canaux de Vente (Meta + Google Merchant + Site
Internet). L'agent a créé **4 PRs séparées** (#822, #823, #824, #826) au
lieu de **1 PR bundle**. Coût : 1h50 de CI vs 25 min en bundle propre.

**Causes racines** :

1. Interprétation littérale de "L'un après l'autre" = 1 PR par sujet (faux : voulait dire commits successifs sur même branche).
2. Migration SQL Meta sans régen types → drift TS détecté → PR de rattrapage.

**Règle de prévention** : à la 2e demande dans le même domaine fonctionnel,
demander : "Vu que [Y] suit [X] dans le même domaine ([canaux-vente]), je
mets sur la même branche en 2 commits, 1 seule PR. OK ?". Attendre confirmation.

Question 4 de la checklist (régen types) couvre l'autre cause racine.

### Détection systématique des onglets fantômes

Si on touche `apps/back-office/src/components/layout/channel-tabs.tsx` ou
si on découvre un lien 404 → audit complet des onglets de TOUS les canaux
dans la même PR.

---

## Référence

- `.claude/rules/no-worktree-solo.md` — workflow solo
- `.claude/DECISIONS.md` ADR-022 (incident 2026-04-28), ADR-024 (workflow solo restauré 2026-05-02), ADR-025 (fusion `[INFRA-LEAN-001]` 2026-05-02), ADR-027 (compaction `[INFRA-LEAN-002]` 2026-05-02)
