# Prompt Claude Code — LOT 5 : arrêter les régressions avant la production

`[QA-TESTS-001]` — 2 PR vers `staging`.

## Constat

- **Aucun framework de test unitaire installé** (ni vitest ni jest). Les quelques `*.test.ts` existants sont des
  scripts `node:assert` que **rien ne lance**.
- Apps : 3 fichiers de test pour 1 550 fichiers (back-office), 1 pour 472 (LinkMe), **0** pour 167 (site).
- 153 tests Playwright existent mais le contrôle est **non bloquant**, et les secrets `E2E_TEST_EMAIL` /
  `E2E_TEST_PASSWORD` manquent dans GitHub : ils échouent tous pour une raison d'infrastructure.
- **Les tests E2E de stock écrivent et suppriment dans la base pointée par `NEXT_PUBLIC_SUPABASE_URL`**, sans
  garde vérifiant que ce n'est pas la production. Signalé en juillet, toujours vrai.
- Aucune mesure de couverture (le `type-coverage` mesure le typage, pas l'exécution).

## Travail

1. **Garde anti-production d'abord** : `assertTestEnvironment()` en `globalSetup` Playwright — refus de démarrer
   si l'URL Supabase est celle de la production. C'est la correction la plus urgente du lot.
2. **Vitest** à la racine, tâche `test` dans `turbo.json`, et les fichiers `node:assert` existants convertis.
3. **Priorité de couverture, dans cet ordre** : les calculs d'argent (`finance-totals`, marges, TVA, remises),
   puis le cycle de vie des commandes, puis le stock. Le reste attendra. Objectif de couverture sur ces
   modules-là uniquement : 80 %, mesuré et affiché en CI.
4. **Rendre le contrôle E2E bloquant** une fois les deux secrets en place et la garde anti-production livrée.
   Supprimer l'alias `e2e-smoke-aggregate` qui a rapporté vert pendant deux mois et demi sans rien exécuter.

## Vérification

Un test qui échoue doit bloquer la fusion. Prouve-le : ouvre une PR avec un test volontairement cassé et montre
que le contrôle est rouge et bloquant.
