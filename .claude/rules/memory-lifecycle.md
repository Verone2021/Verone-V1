# Lifecycle des mémoires `feedback_*` et règles `.claude/rules/`

**Source de vérité unique** pour la maintenance des mémoires (auto-memory) et
règles de l'agent. Lue à chaque session par tout agent qui ajoute, modifie,
ou supprime une mémoire `feedback_*` ou une règle `.claude/rules/`.

Crée le 2026-05-08 dans `[INFRA-AGENT-COHERENCE-001]` après audit révélant que
les mémoires obsolètes ne sont jamais supprimées quand de nouvelles règles
sont ajoutées, créant des contradictions persistantes que tous les agents
finissent par lire en parallèle.

---

## Le problème historique

Sur ce repo, des règles évoluent rapidement (ADRs hebdomadaires, parfois
quotidiens). Mais les mémoires `feedback_*` sont écrites au moment d'un
incident précis et **ne sont jamais nettoyées** quand une règle officielle
arrive après. Résultat :

- 3 mémoires contradictoires sur le merge auto staging
- 2 mémoires opposées sur l'usage de `git worktree`
- 2 mémoires concurrentes sur le pattern multi-phases
- Des mémoires qui pointent vers des fichiers `.claude/rules/` supprimés

L'agent qui ouvre la doc voit toutes ces voix en parallèle, sans arbitre.
Il choisit la première qu'il rencontre. Comportement chaotique session
après session.

---

## Règle 1 — Une seule source de vérité par sujet

Pour chaque sujet (git, merge, worktree, communication, autonomie, dépôt
de mémoires...), il y a **un seul fichier de référence** dans
`.claude/rules/`. Ce fichier est mentionné dans la table « SOURCES DE
VÉRITÉ » de `CLAUDE.md` racine et dans `.claude/INDEX.md`.

Toute mémoire `feedback_*` qui contredit ce fichier doit être supprimée
ou réécrite pour ne plus contredire. Pas de coexistence « partielle ».

---

## Règle 2 — Quand on ajoute une nouvelle règle

Avant d'écrire une nouvelle règle dans `.claude/rules/` ou un nouvel ADR
dans `.claude/DECISIONS.md` :

1. **Identifier les mémoires `feedback_*` existantes** sur le même sujet
   (`grep` dans `/Users/romeodossantos/.claude/projects/<projet>/memory/`).
2. Pour chaque mémoire trouvée :
   - Si la nouvelle règle annule la mémoire → **supprimer** la mémoire
     (pas de « mémoire annulée mais conservée »).
   - Si la mémoire et la règle sont compatibles → mettre à jour la mémoire
     pour pointer vers la règle (au lieu de répéter le contenu).
   - Si la mémoire reste autonome (cas spécifique non couvert par la règle) →
     ajouter dans la mémoire un lien vers la règle pour le contexte.
3. **Mettre à jour `MEMORY.md`** (l'index) pour refléter les suppressions.
4. **Vérifier les références orphelines** : si la nouvelle règle remplace
   un ancien fichier supprimé, chercher tous les fichiers qui pointaient
   vers l'ancien et les rediriger.

---

## Règle 3 — Quand on ajoute une mémoire `feedback_*`

Avant d'écrire une nouvelle mémoire :

1. **Vérifier qu'il n'existe pas déjà une mémoire ou règle sur le même
   sujet**. Si oui : modifier l'existante au lieu d'en créer une nouvelle.
2. Si la mémoire est ponctuelle (cas spécifique d'un incident) : OK,
   mais **lier explicitement** dans son corps la règle générale qui la
   couvre.
3. Si la mémoire généralise un pattern → c'est probablement une **règle
   `.claude/rules/`** déguisée. La promouvoir directement en règle.

---

## Règle 4 — Quand on supprime une règle (ADR de suppression)

Avant de supprimer un fichier `.claude/rules/` :

1. **Chercher toutes les références** : `grep -r "<nom-fichier>"
.claude/ docs/ /Users/romeodossantos/.claude/projects/<projet>/memory/`.
2. Pour chaque référence trouvée : la rediriger vers le fichier qui
   remplace, ou la supprimer si elle est devenue caduque.
3. Mettre à jour `INDEX.md` et `CLAUDE.md` (table SOURCES DE VÉRITÉ).
4. Documenter dans `DECISIONS.md` (nouvel ADR) avec liste des refs nettoyées.

---

## Règle 5 — Audit périodique trimestriel

Tous les ~3 mois OU à la demande explicite de Roméo :

1. Lister toutes les mémoires `feedback_*` et noter leur date de création.
2. Pour chacune, vérifier si une règle `.claude/rules/` ou un ADR plus
   récent l'a annulée ou couverte.
3. Supprimer ou rediriger en conséquence.
4. Vérifier que `MEMORY.md` index reflète l'état réel (pas de ligne
   orpheline pointant vers un fichier supprimé, pas de fichier mémoire
   sans ligne dans l'index).
5. Vérifier que toutes les références dans la doc pointent vers des
   fichiers existants.

---

## Anti-patterns interdits

- Garder une mémoire en disant « partiellement annulée » → soit on la
  supprime, soit on la réécrit pour ne plus contredire.
- Créer une mémoire qui contredit explicitement une règle `.claude/rules/`
  sans soit modifier la règle, soit ne pas créer la mémoire.
- Supprimer un fichier `.claude/rules/` sans grep pour les références.
- Laisser une mémoire pointer vers un fichier inexistant (référence morte).
- Conserver `MEMORY.md` qui liste un fichier `feedback_*.md` qui a été
  supprimé.

---

## Référence

Référencé par :

- `CLAUDE.md` racine (section SOURCES DE VÉRITÉ + section INTERDICTIONS)
- `.claude/INDEX.md`
- `.claude/DECISIONS.md` (ADR-030 — création de cette règle)

Complémentaire de :

- `.claude/rules/active-md-maintenance.md` (lifecycle d'`ACTIVE.md`)
- `.claude/rules/workflow.md` (lifecycle des branches/PR)
