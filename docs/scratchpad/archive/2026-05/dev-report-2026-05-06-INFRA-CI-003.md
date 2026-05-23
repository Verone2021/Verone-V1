# Rapport — INFRA-CI-003 — Refonte E2E 3 niveaux

**Date** : 2026-05-06
**Branche** : `chore/INFRA-CI-003-e2e-refonte`

---

## Résumé des changements

### Fichiers modifiés

- `playwright.config.ts` : `fullyParallel: false → true`, `workers: CI?1:1 → CI?4:1`
- `.github/workflows/quality.yml` : ajout `workflow_dispatch`, remplacement job `e2e-smoke` par 3 jobs (`smoke-golden`, `smoke-domaine` matrix 4 shards, `e2e-full` matrix 4 shards)
- `tests/e2e/workflows/auth-flow.spec.ts` : variables d'env `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` + commentaire en-tête

### Fichiers créés

- `tests/e2e/smoke/smoke-golden.spec.ts` (1 test, ~80 lignes) : golden path dashboard → commandes → LinkMe → détail
- `tests/e2e/workflows/workflow-shipment-wizard.spec.ts` (~150 lignes) : ShipmentWizard 7 étapes, Escape mid-wizard, sans validation réelle
- `tests/e2e/workflows/workflow-chaine-commerciale.spec.ts` (~200 lignes) : ouverture modals devis + facture, listes /factures et /devis, sans appel Qonto

### Fichiers supprimés (8 redondants)

- `tests/e2e/workflows/dashboard-navigation.spec.ts`
- `tests/e2e/workflows/contacts-organisations.spec.ts`
- `tests/e2e/workflows/stock-management.spec.ts`
- `tests/e2e/workflows/product-management.spec.ts`
- `tests/e2e/workflows/linkme-channel.spec.ts`
- `tests/e2e/workflows/finance-flow.spec.ts`
- `tests/e2e/stocks/inventaire.spec.ts`
- `tests/e2e/stocks/mouvements.spec.ts`

---

## Architecture CI après

| Niveau | Job                        | Quand                         | Durée cible       |
| ------ | -------------------------- | ----------------------------- | ----------------- |
| 1      | `smoke-golden`             | PR UI (e2e-needed)            | ~30 sec           |
| 2      | `smoke-domaine` (4 shards) | PR UI + push main             | ~2 min wall-clock |
| 3      | `e2e-full` (4 shards)      | push main + workflow_dispatch | ~5 min wall-clock |

---

## Bloqueurs rencontrés

Aucun. Type-check back-office passe. YAML valide (python3 yaml.safe_load).

---

## Points à valider en CI (durées réelles)

- `smoke-golden` : cible < 60 sec (mesure CI à faire)
- `smoke-domaine` sharded 4 runners : cible < 3 min wall-clock
- `e2e-full` sharded 4 runners : cible < 8 min wall-clock
- Vérifier que le `needs: smoke-golden` sur `smoke-domaine` fonctionne correctement quand `smoke-golden` est skippé (PR backend pure où e2e-needed == false → `smoke-golden` ne tourne pas → `smoke-domaine` doit aussi skip via le `if:` combiné)

## Notes implémentation specs

### smoke-golden

- Gracieux : si aucune commande LinkMe, step 4 est simplement ignoré (pas d'échec)
- Assertion KPI dashboard : heading ou attributs class contenant stat/card — robuste sans data-testid

### workflow-shipment-wizard

- Skip propre avec `test.info().annotations.push` + `test.skip()` si aucune commande validée
- On s'arrête à l'étape 4 mid-wizard pour l'Escape (pas le step 7 final)
- Sur step 2, tentative de sélection "Manuel" avant d'avancer (évite le blocage sur le bouton Suivant désactivé)

### workflow-chaine-commerciale

- Skip propre si aucune commande seed
- Zéro appel Qonto réel : ouverture modal → assertions texte → Escape
- 3 tests séparés pour cohérence : workflow principal + /factures + /devis

## Mesure locale

Type-check : PASS (sortie vide `tsc --noEmit`)
YAML lint : PASS
Durée locale test runner : non mesurée (pnpm dev non lancé)
