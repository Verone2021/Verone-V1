# Scripts Migration Obsolètes - Novembre 2024

**Date archivage** : 2025-11-07
**Raison** : Scripts one-shot utilisés pour migration modulaire (JOUR 4) - Non réutilisables

---

## Fichiers Archivés

### Scripts Migration Imports (6 scripts)

1. **fix-all-hook-imports.js**
   - Correction globale imports hooks vers modules
   - Utilisé : Migration JOUR 4 (2025-11-06)
   - Status : ✅ Complété

2. **fix-broken-imports.js**
   - Correction imports cassés après restructuration
   - Utilisé : Migration JOUR 4 (2025-11-06)
   - Status : ✅ Complété

3. **fix-hooks-imports.js**
   - Correction spécifique imports hooks
   - Utilisé : Migration JOUR 4 (2025-11-06)
   - Status : ✅ Complété

4. **fix-relative-imports.js**
   - Normalisation imports relatifs
   - Utilisé : Migration JOUR 4 (2025-11-06)
   - Status : ✅ Complété

5. **generate-missing-reexports.js**
   - Génération barrel exports manquants
   - Utilisé : Migration JOUR 4 (2025-11-06)
   - Status : ✅ Complété

6. **migrate-hook-imports.js**
   - Migration bulk imports hooks
   - Utilisé : Migration JOUR 4 (2025-11-06)
   - Status : ✅ Complété

### Logs Migration (1 fichier)

7. **import-replacements-log.json** (36 KB)
   - Journal détaillé remplacements imports
   - Contenu : 1000+ lignes remplacements
   - Utilisé : Audit post-migration

---

## Contexte Migration

**Objectif** : Migration architecture modulaire `src/hooks/` → `src/shared/modules/*/hooks/`

**Résultats** :
- ✅ 60+ hooks migrés
- ✅ 250+ fichiers modifiés
- ✅ 0 erreurs build
- ✅ 0 erreurs console

**Documentation** : Voir `docs/audits/2025-11/RAPPORT-MIGRATION-IMPORTS-JOUR-4-2025-11-06.md`

---

## Pourquoi Archivé ?

- ❌ Scripts **one-shot** non réutilisables
- ❌ Architecture source modifiée (hooks dispersés n'existent plus)
- ❌ Maintenance inutile
- ✅ Conservation historique seulement

**Action future** : Supprimer après 6 mois si non nécessaires pour rollback.

---

**Archivé par** : Claude Code
**Approuvé par** : Romeo Dos Santos
