# Stratégie de branche — 1 sujet = 1 branche jusqu'à fin du bloc

**Source de vérité unique** pour décider quand créer une nouvelle branche /
PR vs continuer sur une branche existante.

Cette règle complète `.claude/rules/workflow.md` ("1 PR = 1 BLOC COHÉRENT")
en imposant une **checklist obligatoire** avant tout `git checkout -b` ou
`gh pr create`. Sans cette checklist, l'agent dérive en créant 4 PRs sur le
même sujet, déclenche une cascade de rebases, et fait perdre du temps à
Romeo (incident du 2026-04-25 — 4 PRs `[BO-LM-MISSING-*]` au lieu d'1).

**Voir aussi (obligatoire en multi-agents)** :

- `.claude/rules/multi-agent-workflow.md` — Branche tôt, push draft immédiat, rebase précoce, worktree obligatoire quand un autre agent travaille en parallèle, stacked PRs, fix CI sans `--admin`. À lire AVANT toute création de branche en contexte multi-agents.

---

## Checklist OBLIGATOIRE avant `git checkout -b` ou `gh pr create`

L'agent doit répondre aux **3 questions** ci-dessous AVANT toute création
de branche ou de PR. Si **une seule** réponse est ambiguë → demander Romeo
avant d'agir.

### 1. Existe-t-il déjà une PR ouverte sur le même sujet fonctionnel ?

Action attendue :

```bash
gh pr list --state open --base staging --json number,title,headRefName
```

Le "même sujet fonctionnel" = même tag domaine `[APP-DOMAIN-*]` (ex:
`[BO-LM-MISSING-*]`, `[BO-SHIP-WIZ-*]`) OU même page / même feature
métier (ex: bandeau missing-info, formulaire commande LinkMe).

**Si OUI** → continuer sur sa branche, ajouter un commit. Pas de
nouvelle PR.

### 2. La correction demandée est-elle dans la même boucle d'itération ?

Si Romeo enchaîne plusieurs corrections sur le même écran ou la même
feature dans la même session, c'est UNE seule itération → UNE seule
branche.

**Exemple concret** : redesign du bandeau missing-info, puis ajout d'un
bouton inline, puis filtre destinataire. Tout sur la même feature →
empiler les commits sur la même branche.

**Si OUI** → continuer sur la branche actuelle.

### 3. Romeo a-t-il explicitement dit "fais une nouvelle PR" ?

L'agent ne décide PAS seul de séparer les changements en plusieurs PRs.
Soit Romeo a explicitement demandé une PR séparée ("fais une PR à
part pour ça"), soit la règle par défaut s'applique : **commit sur la
branche en cours**.

**Si NON** → reste sur la branche en cours.

---

## Règle d'or

**Par défaut, commit sur la branche en cours.** La création d'une nouvelle
branche est l'exception, pas la règle.

Une nouvelle branche se justifie SEULEMENT si :

- Sujet **complètement** différent (ex: bug FeesSection ↔ wizard
  expédition Packlink — pas de lien fonctionnel)
- Romeo demande explicitement une PR séparée
- La PR ouverte précédente est déjà mergée et le sujet a changé

---

## Au démarrage de chaque session

L'agent DOIT exécuter en première action :

```bash
gh pr list --state open --base staging --json number,title,headRefName,isDraft
```

Et garder en tête les sujets en cours pour ne pas en créer de
redondants.

---

## Anti-patterns interdits

- ❌ Créer une nouvelle branche pour ajouter un fix UX à un bandeau qui
  est déjà l'objet d'une PR ouverte
- ❌ Créer 2 branches pour 2 commits qui touchent les mêmes fichiers
- ❌ Merger une PR puis créer immédiatement une autre PR sur le même
  écran pour un raffinement (le raffinement aurait dû être un commit
  de plus avant le merge)
- ❌ Force-rebase à répétition parce que les branches partent de
  staging à des moments différents

---

## Si la règle semble impossible à respecter

Cas typique : Romeo demande pendant une PR ouverte un fix totalement
indépendant et urgent. Alors :

1. **Demander** : "Je suis sur la branche X (PR #YYY pour le sujet A).
   Tu veux que ce nouveau fix B parte sur la même PR ou je crée une PR
   dédiée ?"
2. **Attendre** la réponse explicite
3. Agir selon

Une demande inutile coûte 5 secondes. Une PR éclatée coûte 1h de rebase.

---

## Checklist enrichie 2026-04-28 (incident bundling Canaux de Vente)

**4e question obligatoire** avant `gh pr create` :

### 4. Le sujet touche-t-il un RPC, une fonction DB, ou une colonne ?

Si oui, la PR DOIT inclure dans le même commit (ou un 2e commit sur la même branche) :

```bash
pnpm run generate:types
git add packages/@verone/types/src/supabase.ts
```

**Pourquoi** : sans ça, le check `Supabase TS types drift (blocking)` du workflow Quality fail au moment du merge release staging→main. Il faut alors créer une PR de rattrapage qui ajoute 1 cycle CI staging + 1 re-cycle CI main = ~25 min de plus.

Si `pnpm run generate:types` échoue (CLI Supabase non auth), utiliser `mcp__supabase__generate_typescript_types`. **Attention** : le MCP omet le schema `graphql_public`. Pour un fichier byte-for-byte conforme au CI, télécharger l'artifact `supabase-types-drift` du run failed du CI et utiliser `supabase.ts.generated`.

---

## Checklist enrichie 2026-04-30 (incident multi-agents working dir partagé)

**5e question obligatoire** avant `git checkout -b` :

### 5. Un autre agent travaille-t-il en parallèle dans le working dir partagé ?

Vérification :

```bash
gh pr list --state open --base staging --json number,title,headRefName,isDraft
```

Si OUI (cas habituel multi-agents Romeo) → **`git worktree add` OBLIGATOIRE** :

```bash
git fetch origin staging
git worktree add /Users/romeodossantos/verone-[task-short] -b feat/<branche> origin/staging
cd /Users/romeodossantos/verone-[task-short]
# Travail entièrement dans ce dossier
```

**Si tu fais `git checkout -b` ou `git pull --rebase` dans le working dir
partagé** : tu changes la branche active sous les pieds de l'autre agent,
tu casses son contexte. **Incident réel observé le 2026-04-30.**

Si tu dispatches un sous-agent (Agent tool) pendant qu'un autre agent
humain travaille → toujours `isolation: "worktree"`.

Voir `.claude/rules/multi-agent-workflow.md` pour le workflow complet.

---

## Anti-pattern incident 2026-04-28

❌ **Vu** : Romeo a enchaîné 3 fixes Canaux de Vente (Meta + Google Merchant + Site Internet). L'agent a créé **4 PRs séparées** au lieu d'1 bundle. Coût : 1h50 de cycles CI.

❌ **Aussi vu** : la PR Meta contenait une migration SQL mais ne régénérait pas les types. → check drift TS fail sur la release main → PR #826 de rattrapage.

✅ **Bonne pratique** : 1 PR `[BO-CHAN-CLEANUP-001]` avec 4 commits :

1. Fix Meta (DB + code + types)
2. Fix Google Merchant (onglets fantômes)
3. Fix Site Internet (onglet fantôme)
4. Si applicable : régen types Supabase (peut-être inclus au commit 1)

---

## Référence

Référence :

- `.claude/rules/multi-agent-workflow.md` — pratique senior multi-agents (worktree, rebase précoce, push draft, stacked PRs)
- `.claude/rules/workflow.md` — règle "1 PR = 1 bloc cohérent"

Référencé par :

- `CLAUDE.md` racine (section WORKFLOW GIT + INTERDICTIONS ABSOLUES)
- `.claude/rules/workflow.md` (règle complémentaire "1 PR = 1 bloc" + section incident 2026-04-28)
- `.claude/DECISIONS.md` (ADR-022 — incident bundling Canaux de Vente, ADR-023 — multi-agent workflow)
