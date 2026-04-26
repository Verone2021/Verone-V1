# Stratégie de branche — 1 sujet = 1 branche jusqu'à fin du bloc

**Source de vérité unique** pour décider quand créer une nouvelle branche /
PR vs continuer sur une branche existante.

Cette règle complète `.claude/rules/workflow.md` ("1 PR = 1 BLOC COHÉRENT")
en imposant une **checklist obligatoire** avant tout `git checkout -b` ou
`gh pr create`. Sans cette checklist, l'agent dérive en créant 4 PRs sur le
même sujet, déclenche une cascade de rebases, et fait perdre du temps à
Romeo (incident du 2026-04-25 — 4 PRs `[BO-LM-MISSING-*]` au lieu d'1).

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

## Référence

Référencé par :

- `CLAUDE.md` racine (section WORKFLOW GIT)
- `.claude/rules/workflow.md` (règle complémentaire "1 PR = 1 bloc")
- `.claude/DECISIONS.md` (à créer : ADR sur cette règle)
