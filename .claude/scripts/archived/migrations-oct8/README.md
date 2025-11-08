# Scripts Migration Obsolètes - Octobre 2024

**Date archivage** : 2025-11-07
**Raison** : Scripts one-shot migrations database - Non réutilisables

---

## Fichiers Archivés

### 1. execute-color-migration.sh

**Date création** : 2024-10-08
**Objectif** : Migration ajout champ couleur produits
**Utilisé** : Migration database octobre 2024
**Status** : ✅ Complété

**Description** :
Script migration ajout colonne `color` à table `products`.
Migration réalisée avec succès octobre 2024.

### 2. execute-sql-migration.mjs

**Date création** : 2024-10-08
**Objectif** : Exécution migrations SQL génériques
**Utilisé** : Migrations database octobre 2024
**Status** : ✅ Complété

**Description** :
Script Node.js exécution migrations SQL.
Utilisé pour plusieurs migrations octobre 2024.
Remplacé par système migrations Supabase standard.

---

## Pourquoi Archivé ?

- ❌ Scripts **one-shot** non réutilisables
- ❌ Migrations déjà appliquées en production
- ❌ Supabase migrations system utilisé maintenant
- ✅ Conservation historique seulement

**Action future** : Supprimer après 6 mois si non nécessaires pour rollback.

---

**Archivé par** : Claude Code
**Approuvé par** : Romeo Dos Santos
