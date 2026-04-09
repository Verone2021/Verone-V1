# Regle Post-Migration — Mise a jour documentation DB

## OBLIGATOIRE : Apres chaque migration SQL

Apres CHAQUE creation ou modification de fichier dans `supabase/migrations/` :

1. Executer `python scripts/generate-db-docs.py` pour re-generer la documentation DB
2. Verifier que les fichiers dans `docs/current/database/schema/` sont a jour
3. Commiter la documentation mise a jour avec la migration

## Pourquoi

La documentation dans `docs/current/database/schema/` est la SOURCE DE VERITE pour tous les agents.
Si elle n'est pas a jour, les agents devinent la structure des tables au lieu de la lire → erreurs, doublons, incoherences.

## Commande rapide

```bash
python scripts/generate-db-docs.py
```

## INTERDIT

- Creer une migration sans mettre a jour la documentation DB
- Supposer qu'une table/colonne existe sans verifier dans `docs/current/database/schema/`
- Modifier le schema DB sans lire d'abord le fichier du domaine concerne
