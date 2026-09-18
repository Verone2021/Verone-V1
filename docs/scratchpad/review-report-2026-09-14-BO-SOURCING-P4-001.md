# Review Report — 2026-09-14 — BO-SOURCING-P4-001

Revue du commit local d5bd36b6 (diff a881953c..d5bd36b6, 34 fichiers) par reviewer-agent.

## Verdict : PASS avec réserves

Trois réserves : une limite de taille de fichier franchie, un pattern de promesse incohérent, et un fetch sans `.limit()`. Aucun CRITICAL. La migration P4 est correcte, la cohérence TS/SQL est solide, zéro raccourci détecté.

---

### IMPORTANT — `apps/back-office/src/app/(protected)/produits/sourcing/produits/[id]/page.tsx:1` — Fichier de 404 lignes

**Problème** : 404 lignes, 4 de plus que la limite de 400 lignes (`code-standards.md`). Le composant concentre états, handlers, dialogs inline (`SourcingReasonDialog`, `ConfirmDialog`, `ProductPhotosModal`) et le JSX principal.

**Fix** : extraire les trois dialogs dans un composant co-localisé sans logique propre (reçoit handlers et états `open` en props).

---

### WARNING — `packages/@verone/products/src/components/sourcing/product-page/SourcingJournalForm.tsx:138` — `void handleSubmit()` sans `.catch()`

**Problème** : incohérent avec le pattern du projet (`void fn().catch(...)`). `handleSubmit` gère ses erreurs en interne (try/catch → `setFailed`), donc pas de rejet non géré réel.

**Fix** : `void handleSubmit().catch(error => { console.error('[SourcingJournalForm] submit failed:', error); });`

---

### WARNING — `packages/@verone/products/src/hooks/sourcing/use-sourcing-notebook.ts:134` — `sourcing_communications` sans `.limit()`

**Problème** : `data-fetching.md` exige `.limit()` quand la table peut grossir.

**Fix** : `.limit(200)`.

---

### INFO — `apps/back-office/src/app/(protected)/produits/sourcing/page.tsx:174` — Comportement post-validation asymétrique liste / fiche

Depuis la liste, la validation rafraîchit la liste (le produit disparaît, message affiché) ; depuis la fiche, redirection vers `/produits/catalogue/[id]`. Choix d'expérience, pas un bug. Aucun correctif requis.

---

## Analyse des axes

- **Anti-raccourcis** : CLEAN — zéro `@ts-ignore`, `as any`, `as unknown as`, `eslint-disable` introduit ; aucun seuil abaissé.
- **Clean code** : imports `@verone/*`, fonctions pures isolées dans `utils/` et testées, nommage cohérent (`runLifecycle`, `runAction`, `applyAction`).
- **Sécurité** : migration P4 `REVOKE EXECUTE FROM PUBLIC, anon` + `GRANT` à `authenticated, service_role` ; garde `is_backoffice_user()` ; `select` explicites ; `.limit(50)` sur `useSampleState`.
- **Performance** : `invalidateMenuCounts` et `invalidateQueries` attendus ; `applyAction` en `useCallback` à dépendances stables ; `useSampleState` en TanStack Query (`staleTime` 30 s) ; `use-sourcing-sample-order.ts` remplace ~250 lignes de logique client par un seul appel à `request_sample_order`.
- **Responsive** : page hors liste des pages 5 tailles obligatoires ; classes conformes (`h-11 md:h-9`, `grid-cols-2 sm:grid-cols-4`, `flex-col md:flex-row`, `hidden lg:flex` + menu « Plus »), aucun `w-auto` / `w-screen` / tableau nu.

## Cohérence TS ↔ SQL vérifiée

| Action      | Garde SQL                            | TS `availableLifecycleActions`                          |
| ----------- | ------------------------------------ | ------------------------------------------------------- |
| `set_stage` | `c_in_progress`                      | en cours uniquement ✓                                   |
| `pause`     | `c_in_progress`                      | en cours uniquement ✓                                   |
| `resume`    | `on_hold`                            | pause uniquement ✓                                      |
| `refuse`    | `c_in_progress` ou `on_hold`         | en cours + pause ✓                                      |
| `reopen`    | `refused` ou `cancelled`             | refusé + annulé ✓                                       |
| `validate`  | `c_in_progress` + fournisseur + prix | en cours, bouton grisé si fournisseur / prix manquant ✓ |
| `withdraw`  | motif + non déjà retiré              | tous statuts non retirés ✓                              |
| `restore`   | déjà retiré                          | retiré uniquement ✓                                     |

`deriveSampleState` filtre ligne non archivée et commande non annulée : miroir exact de la garde VS001 de `request_sample_order`. ✓

## Suite donnée (coordinateur)

Les trois réserves sont corrigées dans le commit suivant sur la même branche.
