# Maintenance de `.claude/work/ACTIVE.md`

**Source de vérité unique** pour la gestion de la file de tâches locale Roméo.

`ACTIVE.md` est gitignored (cf. `.gitignore` `.claude/work/`). Il vit
uniquement sur la machine de Roméo. Sa fragilité : il se désynchronise
silencieusement de la réalité du repo si l'agent ne le maintient pas. Une
fois obsolète, il fait dire des bêtises au coordinateur (« continue
[BO-FIN-018] » alors que c'est mergé depuis deux semaines).

Cette règle empêche cette dérive.

---

## Règle stricte

**Après chaque merge sur `staging`, l'agent met à jour `.claude/work/ACTIVE.md`
dans le même mouvement** : il supprime la ligne / section correspondant à la
tâche mergée. Pas dans un commit séparé, pas plus tard, pas « si on y pense ».
**Dans le même geste que le merge.**

**Le fichier ne doit JAMAIS contenir une tâche déjà résolue depuis plus de
7 jours.** Si une tâche traîne au-delà, c'est qu'elle n'est plus active —
soit elle est mergée (à supprimer), soit elle est abandonnée (à supprimer
aussi), soit elle attend une décision Roméo (à reformuler en « EN ATTENTE
décision Roméo » avec date).

---

## Procédure post-merge (à appliquer systématiquement)

Quand un merge sur `staging` réussit :

1. Identifier le `[APP-DOMAIN-NNN]` mergé
2. Ouvrir `.claude/work/ACTIVE.md`
3. Supprimer la section correspondante (ne pas la déplacer en « FAIT », pas
   d'archive — Git contient déjà l'historique via `git log`)
4. Si la tâche ouvre un follow-up immédiat (ex: phase 2 d'un sprint),
   l'écrire en remplacement de la section supprimée. Sinon, fichier réduit.
5. Sauvegarder

L'agent ne demande pas confirmation à Roméo. C'est de la maintenance
technique, couverte par la règle 6 anti-paralysie de
`.claude/rules/communication-style.md`.

---

## Audit hebdomadaire

À chaque session, l'agent vérifie au démarrage que toutes les tâches
listées dans `ACTIVE.md` :

- ne sont pas déjà mergées sur `staging` (`git log --grep="[TASK-ID]"` ou
  `gh pr list --search "[TASK-ID]"`)
- ne datent pas de plus de 7 jours sans activité

Si écart détecté → nettoyer immédiatement, sans demander Roméo.

---

## Ce qui DOIT figurer dans ACTIVE.md

- Priorités immédiates (1 à 5 max — au-delà, c'est du backlog déguisé)
- Tâches en cours (1 ou 2 max — sinon c'est du multi-tasking irréaliste)
- Décisions en attente Roméo (avec date d'émission claire)
- Idées backlog (section optionnelle, jamais > 10 entrées)

## Ce qui ne DOIT PAS figurer

- Tâches déjà mergées (Git contient l'historique)
- Sprints ratés / abandonnés (à supprimer, pas à archiver inline)
- Notes techniques détaillées (vont dans `docs/scratchpad/dev-plan-*.md` ou
  `dev-report-*.md`)
- Décisions internes agent (workflow git, sous-agents, fix safe — couvert
  par la règle 6 anti-paralysie)

---

## Pourquoi cette règle existe

Le 2026-05-02, Roméo a constaté que `ACTIVE.md` listait encore comme « à
faire » des tâches mergées il y a 2-3 semaines (BO-FIN-018, BO-FIN-020,
régression « client depuis commande », sprints responsive complets…). Il a
basé sa lecture du projet sur ce fichier obsolète et a perdu du temps à
demander des choses déjà faites.

Le code source de vérité est `git log`. Le fichier `ACTIVE.md` doit être un
miroir rafraîchi de ce qui n'est PAS encore dans `git log`. Sans cette
discipline, le fichier devient un cimetière qui pollue la lecture du
projet.

---

## Référence

Référencé par :

- `CLAUDE.md` racine (section POINT D'ENTRÉE)
- `.claude/INDEX.md` (liste des règles)
- `.claude/work/ACTIVE.md` (en-tête du fichier)
