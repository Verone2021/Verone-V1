# Playbooks — recettes réutilisables

Un playbook = une procédure standardisée pour un type de tâche récurrente.

**Principe** : une tâche dans `.claude/queue/` référence un playbook via `playbook: <nom>` dans son YAML. L'agent lit la recette, l'applique, puis rapporte.

## Playbooks disponibles

| Nom | Quand l'utiliser |
|-----|------------------|
| `migrate-page-responsive.md` | Migrer une page (liste, détail, form, dashboard) vers responsive |
| `fix-bug.md` | Corriger un bug identifié, avec reproduction + fix + test |
| `review-and-merge.md` | Workflow de review + CI + merge d'une PR prête |
| `handle-ci-failure.md` | Diagnostiquer et corriger une CI rouge |

## Ajouter un playbook

1. Créer un fichier `.md` dans ce dossier
2. Respecter la structure : `## Quand utiliser` / `## Étapes` / `## Critères de succès` / `## Pièges courants`
3. Référencer le playbook depuis les tâches concernées (`playbook: <nom>`)
4. Ajouter une entrée dans le tableau ci-dessus
5. Logger la création dans `DECISIONS.md` si ajout structurel

## Principe de qualité

Un bon playbook est **court** (<200 lignes), **précis** (commandes bash incluses), **sans ambiguïté** (pas de « faire ce qui semble pertinent »).

Si un playbook commence à faire 400 lignes, il couvre probablement 2 cas d'usage → le scinder.
