---
name: pre-edit-audit
description: Avant de modifier du code, vérifier systématiquement l'existant (DB, patterns, composants) pour ne rien casser.
autoApply: true
---

# Audit pré-modification

Avant de modifier un fichier, tu DOIS avoir vérifié :

## 1. Le fichier lui-même

- As-tu LU le fichier entier (ou au moins la fonction concernée) ?
- Connais-tu les imports et dépendances ?

## 2. Le contexte

- Y a-t-il d'autres fichiers qui importent ce composant/cette fonction ?
  → Utilise `Grep` pour chercher le nom exporté
- Y a-t-il un test associé ?

## 3. La base de données (si le code touche Supabase)

- As-tu vérifié les colonnes réelles de la table avec `mcp__supabase__execute_sql` ?
  ```sql
  SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'TABLE';
  ```
- Ne JAMAIS supposer qu'une colonne existe — vérifier.

## 4. Les patterns du projet

- Comment les fichiers similaires font-ils la même chose ?
  → Cherche un fichier équivalent dans le même dossier ou domaine

## Quand appliquer

- Toute modification de composant React (.tsx)
- Toute modification de route API
- Toute modification de hook
- Toute modification de schéma/migration

## Quand ignorer

- Corrections de typos
- Modifications de commentaires/documentation
- Formatage (prettier/eslint --fix)
