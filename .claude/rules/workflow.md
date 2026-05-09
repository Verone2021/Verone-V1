# Règles Workflow Verone

**Source de vérité unique** pour Git / PR / merge + workflow solo (jamais
`git worktree`) + checklist 4 questions avant nouvelle branche.

> Historique : ancien `branch-strategy.md` fusionné en `[INFRA-LEAN-001]`,
> compaction en `[INFRA-LEAN-002]`, fusion `no-worktree-solo.md` en
> `[BO-INFRA-DX-001]` ADR-031.

---

## Workflow solo — JAMAIS de `git worktree`

Roméo travaille **seul** sur ce repo, dans **un seul dossier physique** :
`/Users/romeodossantos/verone-back-office-V1`. Les sprints n'ont besoin
que d'**une branche à la fois**. Bascule via `git checkout` (avec
`git stash` si dirty). Pas de worktree, pas de dossier secondaire.

**Interdictions absolues** :

- `git worktree add ...`
- Tool `Agent` avec `isolation: "worktree"` — toujours laisser ce
  paramètre vide ou non spécifié.
- `git worktree list` / `remove` autorisé uniquement pour ménage si un
  worktree résiduel traîne.

**Pourquoi** : l'ancienne règle `multi-agent-workflow.md` (PR #862, ADR-023
2026-04-30) imposait `git worktree add` pour gérer plusieurs agents en
parallèle. Résultat chaotique pour un dev solo : worktrees multiples,
serveur Next.js qui servait le code d'un autre worktree, cycles CI
doublés. ADR-024 (2026-05-02) a annulé ADR-023 et restauré le workflow
standard.

**Si Roméo lance un autre agent en parallèle (rare)** : ils partagent le
même dossier et la même branche. Coordination via `git status` et
`git pull --ff-only`. Pas de worktree. Si conflit récurrent, arrêter
un des deux agents.

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

**TOUJOURS** : commit après chaque sous-tâche cohérente (sauvegarde
locale, historique propre), format `[APP-DOMAIN-NNN] type: description`,
`git push --force-with-lease` quand on pousse (jamais `--force` nu).

**Push : UNE SEULE FOIS à la fin du chantier complet** — voir section
« RÈGLE ABSOLUE — ZÉRO PUSH ENTRE SOUS-TÂCHES » ci-dessous.

**JAMAIS** : commit "WIP" vague, `--force` nu, commit sans Task ID (sauf
`[NO-TASK]`), `git worktree add`, push entre phases d'un chantier
multi-phases.

### PR

UNE PR = UN BLOC COHÉRENT. PR uniquement quand bloc fonctionnellement
complet ET reviewer PASS. Sinon continuer commits/push sur la branche.

### Merge

1 merge squash par PR. Merge SEULEMENT quand bloc entier fini. JAMAIS en
cours de bloc pour "avancer".

**RÈGLE ABSOLUE — ZÉRO MERGE INTERMÉDIAIRE** (ajoutée 2026-05-07 après
incident de lenteur perçue par Roméo) :

- Sur un chantier multi-phases (ex: refonte RLS Phase 1+2+3, sprint perf
  vagues 1+2+3), **UNE SEULE** PR mergée à la TOUTE FIN.
- Pendant le chantier : commit + push, c'est tout. Pas de `gh pr merge`,
  pas de `--auto`, pas de "petit merge intermédiaire pour valider".
- Chaque merge = CI complète + déploiement Vercel + déploiement Supabase
  = 5 à 15 minutes d'attente bloquante. Multiplier les merges = perdre
  Roméo en attente sur des cycles inutiles.
- Les développeurs seniors ne mergent pas toutes les 5 minutes. Tu non plus.
- Une seule PR ouverte qui s'enrichit au fur et à mesure des phases.
  À la toute fin, Roméo donne UN GO, tu merges UNE FOIS.

**Exception** : hotfix critique en production (page cassée, paiement
bloqué). Tu préviens Roméo, il décide. Sinon : pas de merge intermédiaire.

**S'applique à TOUS les agents** : coordinateur, dev-agent,
reviewer-agent, perf-optimizer. Si un agent propose un merge en cours
de chantier, le coordinateur refuse et continue les commits.

---

## RÈGLE ABSOLUE — ZÉRO PUSH ENTRE SOUS-TÂCHES (ajoutée 2026-05-09 ADR-031)

**Sur un chantier multi-phases ou multi-vagues, l'agent ne pousse PAS
entre les phases.** Une seule PR, ouverte une seule fois à la toute fin,
avec un seul cycle CI complet.

Pourquoi : chaque `git push` sur une PR ouverte déclenche un cycle CI
complet (5 à 15 minutes). Pousser à la fin de la Vague 1 puis encore à
la fin de la Vague 2 = 2 cycles CI = 10-30 min payés inutilement, alors
qu'un seul cycle aurait validé l'ensemble.

**Procédure correcte sur un chantier multi-phases** :

1. Création de la branche au début (depuis `staging` à jour).
2. `git commit` après chaque sous-tâche cohérente (sauvegarde locale,
   permet de retrouver l'historique). **Pas de push.**
3. `git commit` accumulés sur la branche locale jusqu'à ce que TOUTES
   les phases soient finies.
4. Vérification locale : type-check, lint, tests Playwright si pertinent.
5. **UN SEUL `git push -u origin <branche>` à la toute fin.**
6. **UN SEUL `gh pr create`** (ou édition de la PR existante si elle est
   déjà ouverte avec le mauvais titre — corriger le titre/description
   pour refléter le bloc complet).
7. Roméo donne UN GO. Merge UNE fois. Cycle CI UNIQUE.

**Cas où l'agent peut pousser AVANT la fin** (rare, exceptionnel) :

- Sauvegarde longue : la branche contient > 4 h de travail non sauvegardé
  et le risque de perte de la machine est réel. Pousser comme « WIP » et
  prévenir Roméo : « Je pousse pour sauvegarder, ne déclenche pas la CI
  encore ». Marquer la PR en draft.
- Roméo demande explicitement : « pousse maintenant, je veux voir ».

**Cas où l'agent ne pousse JAMAIS** :

- Fin d'une phase intermédiaire d'un chantier multi-phases (ex: fin de
  Vague 1 alors que Vague 2 et Vague 3 sont prévues sur le même
  chantier).
- « Je pousse pour que tu voies l'avancée » → NON. Le statut s'annonce
  en français dans la conversation, pas via un push.
- « Je pousse pour avoir un retour CI partiel » → NON. La CI se paie une
  fois, à la fin.

**Référence senior** : c'est la pratique standard d'un dev expérimenté
solo sur une CI lente. Trunk-based development avec push fréquent
suppose une CI < 90 secondes (Google, Meta) ou une équipe qui se relaie.
Pour Verone (CI 8-15 min, dev solo), la règle « 1 chantier = 1 push final »
est la seule économie viable.

**S'applique à TOUS les agents** : coordinateur, dev-agent,
reviewer-agent, perf-optimizer.

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

## Quand MERGER une PR — AUTO-MERGE PAR DÉFAUT (ADR-032 — 2026-05-09)

**Pratique senior standard** (Google, Meta, GitHub, Vercel) : la PR est
créée AVEC auto-merge activé. La CI = sanity check, pas une décision.
Si la CI passe verte → merge automatique. Si elle échoue → on corrige.
Pas de validation humaine post-CI.

### Procédure obligatoire à la création de PR

Dès `gh pr create` réussi, l'agent enchaîne **immédiatement** :

```bash
gh pr merge <num> --auto --squash --delete-branch
```

Cette commande dit à GitHub : « fusionne dès que tous les checks
required passent verts ». Roméo ne touche à rien. Pas de retour pour
demander « merge ? ».

### Critères pour activer auto-merge

Tous ces critères doivent être remplis **AVANT** d'activer auto-merge :

- [ ] Bloc fonctionnellement complet (pas mi-fini)
- [ ] Pas de régression sur les pages déjà migrées (vérifié localement)
- [ ] Reviewer-agent PASS dans `docs/scratchpad/review-report-*.md` si
      applicable au type de chantier
- [ ] Aucun CRITICAL dans le review report
- [ ] Bloc regroupe 3+ sous-tâches OU bloc atomique critique

Une fois activé : auto-merge **fusionnera tout seul** dès la CI verte.
Pas de validation Roméo intermédiaire. Pas de « j'attends et je
décide ».

### Cas où l'agent NE active PAS auto-merge

- Hotfix critique production : Roméo doit voir la PR avant merge pour
  arbitrer.
- Modification base de données (migration, RLS, triggers) : un humain
  doit valider l'impact métier.
- Action irréversible (suppression colonne, drop table) : Roméo
  arbitre.
- Trade financier réel ou changement de logique facturation/paiement.

Pour TOUS LES AUTRES CAS (refactor, feature, fix UX, doc, infra,
nettoyage `.claude/`) : auto-merge activé immédiatement.

### Squash et delete branch

Toujours `--squash --delete-branch`. Un commit propre par PR sur
staging, branche distante supprimée à la fusion.

### Chantier multi-phases

Voir section « ZÉRO PUSH ENTRE SOUS-TÂCHES » : 1 PR par chantier complet,
auto-merge activé une fois la dernière phase poussée.

---

## Anti-patterns interdits (checklist branche/PR)

- ❌ Nouvelle branche pour fix UX d'un bandeau déjà en PR ouverte
- ❌ 2 branches pour 2 commits qui touchent les mêmes fichiers
- ❌ Merger une PR puis créer immédiatement une autre PR sur le même écran pour un raffinement (le raffinement aurait dû être un commit de plus avant le merge)
- ❌ Force-rebase à répétition parce que les branches partent de staging à des moments différents
- ❌ **Merger une phase intermédiaire d'un chantier multi-phases** (ex: merger Phase 1 RLS alors que Phase 2 et 3 sont prévues sur le même sujet). UNE PR mergée à la toute fin du chantier.
- ❌ **`gh pr merge --auto` sur un chantier en cours** — l'auto-merge déclenche le merge dès que la CI passe, ce qui contourne la règle "merger seulement à la fin du chantier complet".

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

- `.claude/DECISIONS.md` ADR-022 (incident 2026-04-28), ADR-024 (workflow solo restauré 2026-05-02), ADR-025 (fusion `[INFRA-LEAN-001]` 2026-05-02), ADR-027 (compaction `[INFRA-LEAN-002]` 2026-05-02), ADR-031 (fusion `no-worktree-solo` 2026-05-09)
