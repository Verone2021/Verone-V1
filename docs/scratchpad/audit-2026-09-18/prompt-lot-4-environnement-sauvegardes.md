# Prompt Claude Code — LOT 4 : un filet sous la production

`[INFRA-ENV-001]` — plusieurs PR. Aucune modification de la base de production.

## Constat

- **Aucun environnement de préproduction** : `vercel.json` désactive le déploiement de `staging`. Il n'existe
  aucun endroit où vérifier un correctif avant la production. C'est ce qui a rendu le middleware du 18/09
  invérifiable, donc abandonné.
- **Base non reconstructible** : 804 fichiers de migration, seulement **97 `CREATE TABLE` distincts** pour
  **137 tables**. On ne peut pas recréer le schéma à neuf, donc pas de base de test crédible.
- **Aucun plan de reprise** : ni RPO, ni RTO, ni test de restauration documenté — sur une application qui gère
  TVA et rapprochement bancaire. C'est le runbook du dépôt lui-même qui le dit.
- 5 fichiers `export type Database`, dont 2 dans des chemins imbriqués aberrants (704 Ko de code mort versionné,
  séquelle d'un revert de mai).

## Travail

1. **Environnement de préproduction** : activer le déploiement `staging` sur Vercel, branché sur une branche
   Supabase de test (pas la production). Chiffre le coût avant, Roméo valide.
2. **Schéma reconstructible** : produire une migration de référence (`baseline`) qui recrée les 137 tables,
   leurs contraintes, leurs policies et leurs fonctions. Critère de réussite : une branche Supabase vierge
   démarre et passe les tests E2E. Les 804 migrations historiques restent en place (append-only).
3. **Sauvegardes** : documenter ce que Supabase garde réellement sur l'offre actuelle, définir RPO et RTO avec
   Roméo, **et faire une restauration d'essai** sur la branche de test. Une sauvegarde jamais restaurée n'est
   pas une sauvegarde. Écrire le runbook dans `docs/runbooks/restauration.md`.
4. **Types Database** : une seule source (`packages/@verone/types/src/supabase.ts`), suppression des deux copies
   mortes dans les chemins imbriqués, et la copie locale de `apps/back-office` remplacée par l'import du package.

## Vérification

La preuve du lot 4, c'est une restauration réussie et une branche de test qui démarre depuis zéro. Pas un document.
