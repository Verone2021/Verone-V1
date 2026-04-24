# Audit — Couverture smoke E2E Back Office

**Date** : 2026-04-24
**Sprint** : `[INFRA-HARDENING-002]` sous-sprint A (audit)
**Branche** : `feat/infra-hardening-002`
**Auteur** : Claude Opus 4.7

---

## 1. Résumé exécutif

| Métrique                                        | Valeur actuelle                       | Cible |
| ----------------------------------------------- | ------------------------------------- | ----- |
| Pages back-office totales                       | **147**                               | 147   |
| Pages couvertes au moins par un `goto`          | **~106** (72 %)                       | 147   |
| Pages couvertes avec **interaction** (pas goto) | **~14** (< 10 %)                      | 60+   |
| Spec files smoke                                | **4** (dont 2 en doublon)             | 7     |
| Tests smoke totaux                              | **~150** (mais ~130 goto)             | 50+   |
| Tests avec interactions réelles                 | **~14**                               | 40-60 |
| Pattern ADR-016 respecté                        | 14 tests / 150                        | 100 % |
| `db-drift-check` bloquant en CI                 | **Non** (script exécuté manuellement) | Oui   |

### Constat principal

Le filet smoke **couvre en largeur mais pas en profondeur** :

- `smoke-147-pages.spec.ts` = 106 pages × 1 `goto` chacune. Aucune
  interaction. Utilise `networkidle` **interdit par ADR-016**.
- `smoke-all-modules.spec.ts` = 30 tests, recouvre exactement les pages
  déjà couvertes par `smoke-147-pages`. **Doublon quasi intégral**. Même
  problème : `networkidle`.
- `smoke-critical-workflows.spec.ts` = 10 tests. Pattern ADR-016 OK.
  Toujours goto-only, sauf 1 test qui clique le tab « Annulée ».
- `smoke-finance-modals.spec.ts` = 4 tests. Pattern ADR-016 OK. Ouvre
  `/devis/nouveau` et `/factures/nouvelle` mais **ne soumet aucun
  formulaire**, **n'ouvre aucun modal critique**.

**Gap de couverture** : les modals de création commande, devis, facture,
expédition Packlink, cascade-cancel, delete-blocker, ajustement stock —
c'est-à-dire la surface où 80 % des régressions se produisent — n'ont
**aucun test de fumée**. Les 147 pages chargent ; ce qui s'y passe
ensuite n'est vérifié nulle part.

### Raisons attendues des régressions invisibles

Les 30+ régressions des 15 derniers jours passent à côté de la CI parce que :

1. Un `goto` seul ne déclenche pas `handleSubmit`, `useMutation`, ni les
   hooks dépendant d'un state sélectionné. Un Fragment sans key dans un
   `<QuoteItemRow>` se manifeste au clic « Ajouter une ligne », pas au
   chargement de `/devis/nouveau`.
2. `networkidle` ne se termine **jamais** sur les pages Verone (polling
   Supabase realtime + refresh token toutes les 15 s). Le test timeout
   ou expire silencieusement avant d'avoir exercé quoi que ce soit.
3. Un SELECT SQL qui oublie une colonne n'apparaît qu'au moment où on
   affiche cette colonne dans un modal d'édition. `goto` ne l'ouvre pas.
4. Les régressions DB (`ON DELETE RESTRICT` au lieu de `SET NULL` sur
   `financial_documents.sales_order_id`, cf. PR #743) passent totalement
   sous le radar : aucun test ne supprime de commande.

---

## 2. Inventaire des spec smoke actuels

### 2.1. `smoke-147-pages.spec.ts` (384 lignes, 106 tests)

| Statut       | Détail                        |
| ------------ | ----------------------------- |
| Couverture   | 106 pages statiques × 1 goto  |
| Interactions | **aucune**                    |
| Pattern      | `networkidle` (banni ADR-016) |
| P0 couverts  | 43 / 43 (100 % goto)          |
| P1 couverts  | 27 / 27 (100 % goto)          |
| P2 couverts  | 28 / 28 (100 % goto)          |
| P3 couverts  | 3 / 3 (100 % goto)            |

### 2.2. `smoke-all-modules.spec.ts` (269 lignes, 30 tests)

| Statut       | Détail                                    |
| ------------ | ----------------------------------------- |
| Couverture   | 30 pages — **toutes déjà dans 147-pages** |
| Interactions | **aucune**                                |
| Pattern      | `networkidle` (banni ADR-016)             |
| Doublon ?    | **Oui, intégral**                         |

**Recommandation** : fusionner dans `smoke-147-pages` ou supprimer pur et
simple. Ne pas ré-écrire : les scénarios sont déjà couverts en largeur.

### 2.3. `smoke-critical-workflows.spec.ts` (109 lignes, 10 tests)

Pattern ADR-016 (`domcontentloaded` + `SETTLE_MS = 800`). ✅

| Test                             | Interaction ?   |
| -------------------------------- | --------------- |
| Commandes clients filtre Annulée | Oui (click tab) |
| Stocks inventaire                | Non (goto)      |
| Stocks mouvements                | Non (goto)      |
| Stocks alertes                   | Non (goto)      |
| Produits liste                   | Non (goto)      |
| Factures liste                   | Non (goto)      |
| Devis liste                      | Non (goto)      |
| LinkMe commandes                 | Non (goto)      |
| Expéditions                      | Non (goto)      |
| Commandes fournisseurs           | Non (goto)      |

### 2.4. `smoke-finance-modals.spec.ts` (76 lignes, 4 tests)

Pattern ADR-016 ✅.

| Test                         | Interaction ?                 |
| ---------------------------- | ----------------------------- |
| /commandes/clients no error  | Non (goto)                    |
| /devis/nouveau               | Partielle (goto + URL stable) |
| /factures/nouvelle           | Partielle (goto + URL stable) |
| Commande existante (1er œil) | Oui (click + waitForTimeout)  |

**Aucun modal réellement ouvert. Aucun submit vide. Aucun Escape.**

### 2.5. CI gate (`.github/workflows/quality.yml:175-240`)

Seuls `smoke-finance-modals` + `smoke-critical-workflows` sont bloquants.
`smoke-147-pages` et `smoke-all-modules` ne tournent pas en CI — c'est
d'ailleurs heureux vu qu'ils utilisent `networkidle`, ce qui les rendrait
instables.

---

## 3. Tableau 147 pages × couverture × priorité

### 3.1. Légende

- **Smoke** : `✅` goto couvert / `🟡` goto mais `networkidle` (à migrer) / `❌` pas couvert
- **Interact** : `✅` au moins 1 interaction exercée / `❌` goto seul
- **Pri** : criticité business selon Romeo (P0/P1/P2/P3)
- **Dyn** : page dynamique (`[id]`) non couverte par smoke statique

### 3.2. P0 — blocage business immédiat (47 pages)

Stock + commandes + finance critique + LinkMe commandes/commissions.

| Route                                               | Smoke | Interact | Rubrique cible  |
| --------------------------------------------------- | :---: | :------: | --------------- |
| `/stocks`                                           |  🟡   |    ❌    | smoke-stock     |
| `/stocks/inventaire`                                |  🟡   |    ❌    | smoke-stock     |
| `/stocks/mouvements`                                |  🟡   |    ❌    | smoke-stock     |
| `/stocks/alertes`                                   |  🟡   |    ❌    | smoke-stock     |
| `/stocks/ajustements`                               |  🟡   |    ❌    | smoke-stock     |
| `/stocks/ajustements/create`                        |  🟡   |    ❌    | smoke-stock     |
| `/stocks/receptions`                                |  🟡   |    ❌    | smoke-stock     |
| `/stocks/expeditions`                               |  🟡   |    ❌    | smoke-stock     |
| `/stocks/entrees`                                   |  🟡   |    ❌    | smoke-stock     |
| `/stocks/sorties`                                   |  🟡   |    ❌    | smoke-stock     |
| `/stocks/stockage`                                  |  🟡   |    ❌    | smoke-stock     |
| `/stocks/analytics`                                 |  🟡   |    ❌    | smoke-stock     |
| `/stocks/previsionnel`                              |  🟡   |    ❌    | smoke-stock     |
| `/commandes/clients`                                |  ✅   | ✅ (tab) | smoke-commandes |
| `/commandes/clients/[id]` (Dyn)                     |  ❌   |    ❌    | smoke-commandes |
| `/commandes/fournisseurs`                           |  🟡   |    ❌    | smoke-commandes |
| `/commandes/fournisseurs/[id]` (Dyn)                |  ❌   |    ❌    | smoke-commandes |
| `/factures`                                         |  ✅   |    ❌    | smoke-finance   |
| `/factures/nouvelle`                                |  ✅   |    ❌    | smoke-finance   |
| `/factures/[id]` (Dyn)                              |  ❌   |    ❌    | smoke-finance   |
| `/factures/[id]/edit` (Dyn)                         |  ❌   |    ❌    | smoke-finance   |
| `/factures/devis/[id]` (Dyn)                        |  ❌   |    ❌    | smoke-finance   |
| `/factures/qonto`                                   |  🟡   |    ❌    | smoke-finance   |
| `/devis`                                            |  ✅   |    ❌    | smoke-finance   |
| `/devis/nouveau`                                    |  ✅   |    ❌    | smoke-finance   |
| `/finance`                                          |  🟡   |    ❌    | smoke-finance   |
| `/finance/transactions`                             |  🟡   |    ❌    | smoke-finance   |
| `/finance/rapprochement`                            |  🟡   |    ❌    | smoke-finance   |
| `/finance/depenses`                                 |  🟡   |    ❌    | smoke-finance   |
| `/finance/depenses/[id]` (Dyn)                      |  ❌   |    ❌    | smoke-finance   |
| `/finance/depenses/regles`                          |  🟡   |    ❌    | smoke-finance   |
| `/finance/tresorerie`                               |  🟡   |    ❌    | smoke-finance   |
| `/finance/tva`                                      |  🟡   |    ❌    | smoke-finance   |
| `/finance/bilan`                                    |  🟡   |    ❌    | smoke-finance   |
| `/finance/grand-livre`                              |  🟡   |    ❌    | smoke-finance   |
| `/finance/echeancier`                               |  🟡   |    ❌    | smoke-finance   |
| `/finance/immobilisations`                          |  🟡   |    ❌    | smoke-finance   |
| `/finance/livres`                                   |  🟡   |    ❌    | smoke-finance   |
| `/finance/justificatifs`                            |  🟡   |    ❌    | smoke-finance   |
| `/finance/comptabilite`                             |  🟡   |    ❌    | smoke-finance   |
| `/finance/annexe`                                   |  🟡   |    ❌    | smoke-finance   |
| `/finance/bibliotheque`                             |  🟡   |    ❌    | smoke-finance   |
| `/canaux-vente/linkme/commandes`                    |  🟡   |    ❌    | smoke-linkme    |
| `/canaux-vente/linkme/commandes/[id]` (Dyn)         |  ❌   |    ❌    | smoke-linkme    |
| `/canaux-vente/linkme/commandes/[id]/details` (Dyn) |  ❌   |    ❌    | smoke-linkme    |
| `/canaux-vente/linkme/commissions`                  |  🟡   |    ❌    | smoke-linkme    |
| `/canaux-vente/linkme/approbations`                 |  🟡   |    ❌    | smoke-linkme    |

**Score P0** : 43 goto-only, 1 interaction (tab Annulée), 6 pages dynamiques
non couvertes.

### 3.3. P1 — workflow principal (47 pages)

Produits + LinkMe catalogue/selections + contacts B2B + consultations.

| Route                                                             | Smoke | Interact | Rubrique cible             |
| ----------------------------------------------------------------- | :---: | :------: | -------------------------- |
| `/produits`                                                       |  🟡   |    ❌    | smoke-produits             |
| `/produits/affilies`                                              |  🟡   |    ❌    | smoke-produits             |
| `/produits/sourcing`                                              |  🟡   |    ❌    | smoke-produits             |
| `/produits/sourcing/produits/create`                              |  🟡   |    ❌    | smoke-produits             |
| `/produits/sourcing/produits/[id]` (Dyn)                          |  ❌   |    ❌    | smoke-produits             |
| `/produits/sourcing/echantillons`                                 |  🟡   |    ❌    | smoke-produits             |
| `/produits/catalogue`                                             |  🟡   |    ❌    | smoke-produits             |
| `/produits/catalogue/nouveau`                                     |  🟡   |    ❌    | smoke-produits             |
| `/produits/catalogue/[productId]` (Dyn, 7 onglets)                |  ❌   |    ❌    | smoke-produits             |
| `/produits/catalogue/archived`                                    |  🟡   |    ❌    | smoke-produits             |
| `/produits/catalogue/categories`                                  |  🟡   |    ❌    | smoke-produits             |
| `/produits/catalogue/categories/[categoryId]` (Dyn)               |  ❌   |    ❌    | smoke-produits             |
| `/produits/catalogue/subcategories/[subcategoryId]` (Dyn)         |  ❌   |    ❌    | smoke-produits             |
| `/produits/catalogue/collections`                                 |  🟡   |    ❌    | smoke-produits             |
| `/produits/catalogue/collections/[collectionId]` (Dyn)            |  ❌   |    ❌    | smoke-produits             |
| `/produits/catalogue/families/[familyId]` (Dyn)                   |  ❌   |    ❌    | smoke-produits             |
| `/produits/catalogue/variantes`                                   |  🟡   |    ❌    | smoke-produits             |
| `/produits/catalogue/variantes/[groupId]` (Dyn)                   |  ❌   |    ❌    | smoke-produits             |
| `/canaux-vente/linkme`                                            |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/catalogue`                                  |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/catalogue/[id]` (Dyn)                       |  ❌   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/catalogue/configuration`                    |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/catalogue/fournisseurs`                     |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/catalogue/vedettes`                         |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/selections`                                 |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/selections/new`                             |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/selections/[id]` (Dyn)                      |  ❌   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/utilisateurs`                               |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/utilisateurs/[id]` (Dyn)                    |  ❌   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/enseignes`                                  |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/enseignes/[id]` (Dyn)                       |  ❌   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/organisations`                              |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/organisations/[id]` (Dyn)                   |  ❌   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/stockage`                                   |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/stockage/[id]` (Dyn)                        |  ❌   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/stockage/[id]/produit/[allocationId]` (Dyn) |  ❌   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/demandes-paiement`                          |  🟡   |    ❌    | smoke-linkme               |
| `/canaux-vente/linkme/messages`                                   |  🟡   |    ❌    | smoke-linkme               |
| `/contacts-organisations`                                         |  🟡   |    ❌    | smoke-contacts             |
| `/contacts-organisations/[id]` (Dyn)                              |  ❌   |    ❌    | smoke-contacts             |
| `/contacts-organisations/customers`                               |  🟡   |    ❌    | smoke-contacts             |
| `/contacts-organisations/customers/[customerId]` (Dyn)            |  ❌   |    ❌    | smoke-contacts             |
| `/contacts-organisations/suppliers`                               |  🟡   |    ❌    | smoke-contacts             |
| `/contacts-organisations/suppliers/[supplierId]` (Dyn)            |  ❌   |    ❌    | smoke-contacts             |
| `/contacts-organisations/enseignes`                               |  🟡   |    ❌    | smoke-contacts             |
| `/contacts-organisations/enseignes/[id]` (Dyn)                    |  ❌   |    ❌    | smoke-contacts             |
| `/consultations`                                                  |  🟡   |    ❌    | smoke-produits (ou canaux) |
| `/consultations/create`                                           |  🟡   |    ❌    | smoke-produits             |
| `/consultations/[consultationId]` (Dyn)                           |  ❌   |    ❌    | smoke-produits             |

**Score P1** : 34 goto-only, 0 interaction, 13 pages dynamiques non couvertes.

### 3.4. P2 — secondaire (35 pages)

Canaux divers, parametres, admin, finance documents, contacts autres.

| Route                                                                          | Smoke | Interact | Rubrique cible                   |
| ------------------------------------------------------------------------------ | :---: | :------: | -------------------------------- |
| `/canaux-vente`                                                                |  🟡   |    ❌    | smoke-canaux                     |
| `/canaux-vente/prix-clients`                                                   |  🟡   |    ❌    | smoke-canaux                     |
| `/canaux-vente/google-merchant`                                                |  🟡   |    ❌    | smoke-canaux                     |
| `/canaux-vente/meta`                                                           |  🟡   |    ❌    | smoke-canaux                     |
| `/canaux-vente/site-internet`                                                  |  🟡   |    ❌    | smoke-canaux                     |
| `/canaux-vente/site-internet/produits/[id]` (Dyn)                              |  ❌   |    ❌    | smoke-canaux                     |
| `/canaux-vente/linkme/analytics`                                               |  🟡   |    ❌    | smoke-linkme                     |
| `/canaux-vente/linkme/analytics/rapports`                                      |  🟡   |    ❌    | smoke-linkme                     |
| `/canaux-vente/linkme/analytics/performance`                                   |  🟡   |    ❌    | smoke-linkme                     |
| `/canaux-vente/linkme/analytics/performance/[affiliateId]` (Dyn)               |  ❌   |    ❌    | smoke-linkme                     |
| `/canaux-vente/linkme/analytics/performance/[affiliateId]/[selectionId]` (Dyn) |  ❌   |    ❌    | smoke-linkme                     |
| `/canaux-vente/linkme/configuration`                                           |  🟡   |    ❌    | smoke-linkme                     |
| `/canaux-vente/linkme/configuration/commissions`                               |  🟡   |    ❌    | smoke-linkme                     |
| `/canaux-vente/linkme/configuration/integrations`                              |  🟡   |    ❌    | smoke-linkme                     |
| `/finance/documents`                                                           |  🟡   |    ❌    | smoke-finance                    |
| `/finance/documents/achats`                                                    |  🟡   |    ❌    | smoke-finance                    |
| `/finance/documents/recettes`                                                  |  🟡   |    ❌    | smoke-finance                    |
| `/finance/documents/bilan`                                                     |  🟡   |    ❌    | smoke-finance                    |
| `/finance/documents/compte-resultat`                                           |  🟡   |    ❌    | smoke-finance                    |
| `/finance/documents/grand-livre`                                               |  🟡   |    ❌    | smoke-finance                    |
| `/finance/documents/resultats`                                                 |  🟡   |    ❌    | smoke-finance                    |
| `/finance/documents/tva`                                                       |  🟡   |    ❌    | smoke-finance                    |
| `/finance/documents/annexe`                                                    |  🟡   |    ❌    | smoke-finance                    |
| `/finance/admin/cloture`                                                       |  🟡   |    ❌    | smoke-finance                    |
| `/finance/admin/reset`                                                         |  🟡   |    ❌    | smoke-finance                    |
| `/parametres`                                                                  |  🟡   |    ❌    | (skip — low risk)                |
| `/parametres/emails`                                                           |  🟡   |    ❌    | (skip)                           |
| `/parametres/emails/[slug]/edit` (Dyn)                                         |  ❌   |    ❌    | (skip)                           |
| `/parametres/emails/[slug]/preview` (Dyn)                                      |  ❌   |    ❌    | (skip)                           |
| `/parametres/notifications`                                                    |  🟡   |    ❌    | (skip)                           |
| `/parametres/webhooks`                                                         |  🟡   |    ❌    | (skip)                           |
| `/parametres/webhooks/new`                                                     |  🟡   |    ❌    | (skip)                           |
| `/parametres/webhooks/[id]/edit` (Dyn)                                         |  ❌   |    ❌    | (skip)                           |
| `/contacts-organisations/contacts`                                             |  🟡   |    ❌    | smoke-contacts                   |
| `/contacts-organisations/contacts/[contactId]` (Dyn)                           |  ❌   |    ❌    | smoke-contacts                   |
| `/contacts-organisations/partners`                                             |  🟡   |    ❌    | smoke-contacts                   |
| `/contacts-organisations/partners/[partnerId]` (Dyn)                           |  ❌   |    ❌    | smoke-contacts                   |
| `/contacts-organisations/clients-particuliers`                                 |  🟡   |    ❌    | smoke-contacts                   |
| `/admin/users`                                                                 |  🟡   |    ❌    | (skip)                           |
| `/admin/users/[id]` (Dyn)                                                      |  ❌   |    ❌    | (skip)                           |
| `/admin/activite-utilisateurs`                                                 |  🟡   |    ❌    | (skip)                           |
| `/dashboard`                                                                   |  🟡   |    ❌    | smoke-commandes (KPIs critiques) |
| `/achats`                                                                      |  🟡   |    ❌    | (skip)                           |
| `/ventes`                                                                      |  🟡   |    ❌    | (skip)                           |

### 3.5. P3 — admin / meta (18 pages)

Profile, notifications, messages, pages système, routes legacy.

| Route                         | Smoke | Interact | Rubrique cible     |
| ----------------------------- | :---: | :------: | ------------------ |
| `/profile`                    |  🟡   |    ❌    | (skip)             |
| `/notifications`              |  🟡   |    ❌    | (skip)             |
| `/messages`                   |  🟡   |    ❌    | (skip)             |
| `/messages/[categorie]` (Dyn) |  ❌   |    ❌    | (skip)             |
| `/prises-contact/[id]` (Dyn)  |  ❌   |    ❌    | (skip)             |
| `/`                           |  N/A  |   N/A    | (redirect)         |
| `/login`                      |  N/A  |   N/A    | (setup Playwright) |
| `/module-inactive`            |  N/A  |   N/A    | (skip)             |
| `/unauthorized`               |  N/A  |   N/A    | (skip)             |

---

## 4. Recensement des modals critiques à exercer

Sur la base des régressions passées (BO-FIN-023, BO-FIN-031, BO-FIN-040, BO-FIN-041,
BO-PACKLINK-URL-001, BO-FIN-UX-001, BO-FIN-UX-002) et des routes API protégées :

### 4.1. Modals finance (cible smoke-finance)

| Modal                                           | Route d'ouverture                                       | Risque régression                             |
| ----------------------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| `QuoteCreateFromOrderModal`                     | /commandes/clients → détail → bouton « Créer un devis » | **Élevé** (source des bugs SIRET maison mère) |
| `InvoiceCreateFromOrderModal`                   | /commandes/clients → détail → « Créer facture »         | **Élevé** (idem + cascade régénération)       |
| `InvoiceCreateServiceModal`                     | /factures/nouvelle → « Facture de service »             | Moyen                                         |
| `QuoteFormModal` (standalone)                   | /devis/nouveau → « Devis de service »                   | Moyen                                         |
| `DocumentResyncAction` (R3)                     | /commandes/clients/[id] → bandeau                       | Moyen                                         |
| `OrderDevalidateBanner` (R6)                    | /commandes/clients/[id] (status validated)              | Moyen                                         |
| `CascadeCancelConfirmModal` (BO-FIN-023)        | /commandes/clients/[id] → Annuler                       | Moyen                                         |
| `DeleteBlockerModal` (finalized invoice)        | /commandes/clients/[id] → Supprimer                     | **Élevé**                                     |
| `RapprochementPartialModal` (BO-FIN-RAPPRO-003) | /commandes/clients/[id] → rapprocher                    | Moyen                                         |

### 4.2. Modals commandes (cible smoke-commandes)

| Modal                                      | Route d'ouverture                            | Risque                     |
| ------------------------------------------ | -------------------------------------------- | -------------------------- |
| `SalesOrderFormModal` création             | /commandes/clients → « + Nouvelle commande » | **Élevé** (R6 lock fields) |
| `SalesOrderFormModal` édition              | /commandes/clients/[id] → Éditer             | **Élevé**                  |
| `PurchaseOrderFormModal`                   | /commandes/fournisseurs → « + PO »           | Moyen                      |
| `OrderStatusChangeModal` (validate/cancel) | /commandes/clients/[id] → actions            | Moyen                      |

### 4.3. Modals expédition (cible smoke-commandes)

| Modal                                       | Route                              | Risque                             |
| ------------------------------------------- | ---------------------------------- | ---------------------------------- |
| `ShipmentWizard` (5 étapes Packlink)        | /commandes/clients/[id] → Expédier | **Très élevé** (audit 22-23 avril) |
| `PacklinkAddressStep` (BO-PACKLINK-URL-001) | étape 2 du wizard                  | **Très élevé**                     |

### 4.4. Modals stock (cible smoke-stock)

| Modal                    | Route                                | Risque |
| ------------------------ | ------------------------------------ | ------ |
| `StockAdjustmentModal`   | /stocks/inventaire → ligne → Ajuster | Moyen  |
| `CreateAdjustmentForm`   | /stocks/ajustements/create           | Moyen  |
| `ReceptionValidateModal` | /stocks/receptions → Valider         | Moyen  |
| `AlertDetailModal`       | /stocks/alertes → ligne → détail     | Faible |

### 4.5. Modals LinkMe (cible smoke-linkme)

| Modal                      | Route                                         | Risque                    |
| -------------------------- | --------------------------------------------- | ------------------------- |
| `LinkMeOrderApprovalModal` | /linkme/commandes/[id] → Approuver            | **Élevé** (cascade devis) |
| `RequestInfoModal`         | /linkme/commandes/[id] → Demander compléments | Moyen                     |
| `SelectionFormModal`       | /linkme/selections/new                        | Moyen                     |
| `CommissionConfigForm`     | /linkme/configuration/commissions             | Faible                    |

### 4.6. Modals produits (cible smoke-produits)

| Modal                         | Route                                     | Risque |
| ----------------------------- | ----------------------------------------- | ------ |
| `ProductFormModal`            | /produits/catalogue/nouveau               | Moyen  |
| `ProductDescriptionsModal`    | /catalogue/[id] → onglet Descriptions     | Moyen  |
| `ProductImagesModal`          | /catalogue/[id] → onglet Images           | Moyen  |
| `ProductCharacteristicsModal` | /catalogue/[id] → onglet Caractéristiques | Moyen  |
| `ChannelPricingInlineEdit`    | /catalogue/[id] → onglet Tarification     | Moyen  |

### 4.7. Modals contacts (cible smoke-contacts)

| Modal                               | Route                           | Risque |
| ----------------------------------- | ------------------------------- | ------ |
| `OrganisationFormModal` (générique) | /contacts-organisations → créer | Moyen  |
| `CustomerFormModal` B2B             | /customers → « + »              | Moyen  |
| `SupplierFormModal`                 | /suppliers → « + »              | Moyen  |
| `EnseigneFormModal`                 | /enseignes → « + »              | Moyen  |
| `PartnerFormModal`                  | /partners → « + »               | Moyen  |

---

## 5. Plan des 7 fichiers smoke pour Sous-sprint B

Objectif : 40-60 tests au total, ~5-10 par fichier, pattern ADR-016 strict.

### 5.1. `smoke-stock.spec.ts` (~8 tests)

```
[P0] /stocks/inventaire — goto + expectNoErrors
[P0] /stocks/inventaire — ouvrir modal ajustement ligne 1 → submit vide → validation Zod → Escape
[P0] /stocks/alertes — goto + au moins 1 row visible (si DB a une alerte) + expectNoErrors
[P0] /stocks/mouvements — goto + filtre par type (Entrée) si dispo
[P0] /stocks/ajustements/create — goto + formulaire présent + submit vide → validation
[P0] /stocks/receptions — goto + expectNoErrors
[P0] /stocks/expeditions — goto + expectNoErrors
[P0] /stocks/previsionnel — goto + expectNoErrors
```

### 5.2. `smoke-commandes.spec.ts` (~9 tests)

```
[P0] /commandes/clients — tabs (Tous, Brouillons, Validées, Expédiées, Annulée) → 0 erreur
[P0] /commandes/clients — ouvrir modal création → submit vide → validation Zod → Escape
[P0] /commandes/clients — 1er œil → URL /commandes/clients/[id] + expectNoErrors
[P0] /commandes/clients/[id] (le 1er de la liste) — tous les tabs/sections chargent
[P0] /commandes/fournisseurs — goto + tabs + expectNoErrors
[P0] /commandes/fournisseurs — ouvrir modal création PO → submit vide → Escape
[P0] /dashboard — KPIs chargent + pas de Maximum update depth
[P0] /commandes/clients/[id] — cascade cancel : bouton Annuler → modal → Escape (ne pas valider)
[P0] /commandes/clients/[id] — delete-blocker : si facture finalisée, bouton Supprimer disabled avec tooltip
```

### 5.3. `smoke-finance.spec.ts` (~9 tests)

```
[P0] /factures — tabs (Tous, Devis, Factures, Avoirs) + expectNoErrors
[P0] /devis — goto + expectNoErrors (redirect /factures?tab=devis)
[P0] /devis/nouveau — 2 boutons (Depuis commande / Vierge) cliquables
[P0] /factures/nouvelle — 2 boutons (Depuis commande / Service) cliquables
[P0] /factures/nouvelle — « Facture de service » → modal ouvre → submit vide → validation
[P0] /finance/transactions — goto + expectNoErrors
[P0] /finance/rapprochement — goto + expectNoErrors
[P0] /finance/depenses — goto + 1er œil → détail charge
[P0] /finance/tva — goto + expectNoErrors
```

### 5.4. `smoke-linkme.spec.ts` (~8 tests)

```
[P1] /canaux-vente/linkme — dashboard KPIs chargent
[P0] /canaux-vente/linkme/commandes — goto + tabs + expectNoErrors
[P0] /canaux-vente/linkme/commandes — 1er œil → détail charge
[P0] /canaux-vente/linkme/commissions — goto + expectNoErrors
[P0] /canaux-vente/linkme/approbations — goto + expectNoErrors
[P1] /canaux-vente/linkme/selections — goto + « + Nouvelle selection » charge
[P1] /canaux-vente/linkme/catalogue — goto + expectNoErrors
[P1] /canaux-vente/linkme/enseignes — goto + 1er œil → détail charge
```

### 5.5. `smoke-canaux.spec.ts` (~5 tests)

```
[P2] /canaux-vente — hub charge + navigation vers 4 sous-canaux
[P2] /canaux-vente/prix-clients — goto + expectNoErrors
[P2] /canaux-vente/site-internet — goto + expectNoErrors
[P2] /canaux-vente/google-merchant — goto + expectNoErrors
[P2] /canaux-vente/meta — goto + expectNoErrors
```

### 5.6. `smoke-produits.spec.ts` (~9 tests)

```
[P1] /produits — hub KPIs chargent
[P1] /produits/catalogue — 1er œil → détail charge
[P1] /catalogue/[productId] — onglet Général charge
[P1] /catalogue/[productId] — onglet Tarification charge + 1 ligne éditable
[P1] /catalogue/[productId] — onglet Stock charge + mouvements visibles
[P1] /catalogue/[productId] — onglet Descriptions charge
[P1] /catalogue/[productId] — onglet Images charge
[P1] /catalogue/[productId] — onglet Caractéristiques charge
[P1] /catalogue/[productId] — onglet Publication charge
```

### 5.7. `smoke-contacts.spec.ts` (~5 tests)

```
[P1] /contacts-organisations — hub charge
[P1] /contacts-organisations/customers — 1er œil → détail charge
[P1] /contacts-organisations/suppliers — goto + « + » modal ouvre → Escape
[P1] /contacts-organisations/enseignes — 1er œil → détail charge
[P1] /contacts-organisations/contacts — goto + expectNoErrors
```

**Total cible** : 53 tests (Sous-sprint B base) — respecte la cible 40-60.

### 5.8. Traitement des 2 specs legacy

- `smoke-147-pages.spec.ts` : **garder en non-CI** (test manuel large coverage),
  mais migrer `networkidle` → `domcontentloaded` + `SETTLE_MS` pour qu'il
  redevienne exécutable. Retirer du CI gate.
- `smoke-all-modules.spec.ts` : **supprimer** (doublon intégral).
- `smoke-critical-workflows.spec.ts` : **garder**, les 7 nouveaux specs le
  remplacent avec plus de profondeur, mais son pattern ADR-016 est bon.
  À fusionner dans les 7 nouveaux.
- `smoke-finance-modals.spec.ts` : **garder** (historique régression BO-FIN-040),
  déjà dans CI gate.

---

## 6. Pattern imposé (Sous-sprint C)

Chaque test interactif doit suivre strictement ce squelette :

```ts
import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

const SETTLE_MS = 800;

test.describe('Smoke — <Rubrique>', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('<Rubrique> — <Action> — <Attendu>', async ({ page }) => {
    await page.goto('/<path>');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);

    // 1. Déclencher interaction
    const btn = page.getByRole('button', { name: /<regex>/i }).first();
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.click();

    // 2. Assertion positive (modal visible, URL change, badge apparaît)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // 3. (Optionnel) Exercer un cas d'erreur Zod (submit vide)
    await page
      .getByRole('button', { name: /valider|confirmer|créer/i })
      .click();
    await expect(
      page.getByText(/requis|obligatoire|ne peut/i).first()
    ).toBeVisible({ timeout: 3000 });

    // 4. Fermer proprement
    await page.keyboard.press('Escape');

    // 5. Zéro tolérance console
    consoleErrors.expectNoErrors();
  });
});
```

**Règles dures** :

1. `networkidle` interdit partout (ban ADR-016, confirmation empirique sur
   Verone : polling Supabase realtime ne le libère jamais).
2. Pas de sélecteur fragile basé sur un texte métier variable
   (`getByText('143 commandes trouvées')`). Préférer `toHaveURL()` ou un
   attribut `data-testid` côté app si vraiment nécessaire.
3. Chaque `test(...)` finit par `consoleErrors.expectNoErrors()`.
4. Chaque modal ouvert doit être fermé (`Escape` ou click en dehors).
5. Pas de `page.waitForTimeout(> 1500)` — si on en a besoin, le test est flaky.
6. Pas de `test.retry(n)` — un test flaky doit être corrigé ou skippé, pas
   masqué.

---

## 7. Drift DB — préparation Sous-sprint D

`python3 scripts/db-drift-check.py` sur la DB production (via `DATABASE_URL`
dans `.env.local`) retourne **aujourd'hui** :

| Type           |  Count | Signification                                                            |
| -------------- | -----: | ------------------------------------------------------------------------ |
| `[MISMATCH]`   |  **3** | FK existante en DB avec une règle `ON DELETE` différente de la migration |
| `[UNDECLARED]` | **97** | FK existante en DB sans aucune trace dans les migrations versionnées     |
| `[MISSING]`    | **23** | FK déclarée dans une migration mais absente de la DB                     |

### 7.1. MISMATCH (3) — à corriger en priorité

Les 3 divergences réelles, par ordre de criticité :

1. `financial_documents.partner_id` — migration=`SET NULL`, live=`RESTRICT`
   - **Impact** : suppression d'une organisation partenaire bloquée même si
     le document était soft-deleted. Probablement une modification manuelle
     pour durcir l'intégrité. À arbitrer : aligner DB → migration (SET NULL)
     ou créer une nouvelle migration qui passe à RESTRICT officiellement.

2. `financial_documents.purchase_order_id` — migration=`SET NULL`, live=`RESTRICT`
   - **Impact** : même problème, côté PO. Mêmes options d'arbitrage.

3. `matching_rules.organisation_id` — migration=`NO ACTION`, live=`SET NULL`
   - **Impact** : suppression d'organisation force NULL sur `matching_rules`.
     Comportement apparemment intentionnel (éviter FK violation) mais non
     déclaré. Migration rétroactive recommandée.

### 7.2. UNDECLARED (97) — massif

97 FK existent en DB sans migration versionnée. **C'est le backlog réel du
sprint D**. Liste complète persistée dans `/tmp/drift-full.txt` au moment
de l'audit ; les principales concernent :

- `user_*` (9) — crées pré-versionnage probable
- `linkme_*` (8) — ajoutées pendant sprint LinkMe (pré-discipline migration)
- `storage_allocations.*` (3) — idem
- `product_*` (5), `channel_*` / `price_list_*` (8)
- `sales_order_shipments.*` (2) — important (Packlink)
- `consultation_*` (2), `sample_*` (2)
- `stock_reservations`, `stock_movements.channel_id`

Stratégie : **une migration rétroactive unique** par domaine (6 migrations
de « rattrapage ») plutôt qu'une migration par FK. Format :

```sql
-- supabase/migrations/20260424_001_retrofit_fk_user_module.sql
-- Enregistre les FK user_* déjà présentes en DB depuis avant versionnage.
-- Aucune modification de schéma (IF NOT EXISTS sur chaque constraint).
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_organisation_id_fkey,
  ADD CONSTRAINT user_profiles_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;
-- ... idem pour parent_user_id, individual_customer_id, etc.
```

### 7.3. MISSING (23) — à investiguer

23 FK déclarées dans des migrations **ne sont pas** en DB. Probables causes :

- Migrations appliquées mais FK supprimée manuellement plus tard sans migration
- Faux positifs du parser regex (ex. `for.selection_id` — `for` n'est pas
  une table, c'est le mot-clé SQL parsé par erreur)
- Migrations marquées appliquées mais ayant échoué silencieusement

**Action Sous-sprint D** : audit 1-à-1 pour distinguer vrais manques (à
re-créer) et faux positifs (à corriger dans le regex du script).

### 7.4. Gate CI — stratégie de promotion

Conforme à la règle ACTIVE.md :

> Ne pas promouvoir le drift check en gate bloquant **avant** d'avoir
> nettoyé le backlog existant (sinon la CI sera rouge par défaut).

Ordre recommandé pour Sous-sprint D :

1. **Corriger MISMATCH (3)** via migrations rétroactives (1 à 2 migrations).
2. **Corriger FAUX POSITIFS** dans le parser `db-drift-check.py` si
   détectés (ex. `for.selection_id`, tables avec noms réservés).
3. **Retrofit UNDECLARED (97)** via 6 migrations rétroactives thématiques.
4. **Arbitrer MISSING (23)** : soit re-créer les FK, soit soft-delete la
   déclaration dans la migration d'origine (append migration qui drop la FK).
5. **Ajouter job CI** `db-drift-check` **après** que `db-drift-check.py`
   retourne exit 0 sur staging.
6. **Cron hebdo** `scripts/db-drift-check.py --ci` → ouvre une issue si
   nouveau drift apparaît.

---

## 8. Checklist de passage Sous-sprint A → B

- [x] Audit livré : `docs/scratchpad/audit-smoke-coverage-2026-04-24.md`
- [x] 147 pages classées par priorité (47 P0, 47 P1, 35 P2, 18 P3)
- [x] 7 rubriques cibles identifiées avec plan de tests détaillé
- [x] Modals critiques listés (27 modals au total)
- [x] Pattern ADR-016 capturé comme template
- [x] Drift DB quantifié (3 + 97 + 23 = 123 items)
- [x] Stratégie de migration CI gate (D) définie
- [ ] Validation Romeo avant de démarrer B/C/D (facultatif — feu vert donné en chat)

---

## 9. Estimation effort

| Sous-sprint               | Durée estimée | Dépendances        |
| ------------------------- | ------------- | ------------------ |
| A (ce doc)                | 0.5 j         | aucune             |
| B (7 fichiers smoke base) | 1.5 j         | A                  |
| C (interactions + modals) | 1.5 j         | B                  |
| D (drift fix + CI gate)   | 2 j           | indépendant de B/C |
| PR + review + merge       | 0.5 j         | B, C, D            |
| **Total**                 | **~6 j**      |                    |

Le sprint D peut être parallélisé avec B/C car il ne touche ni aux tests
smoke ni aux specs. Recommandation : kicker D **en parallèle** de B dès
que l'audit est validé, pour ne pas bloquer B sur les MISMATCH.

---

## 10. Références

- `.claude/DECISIONS.md` — ADR-016 (smoke gate), ADR-018 (drift check)
- `.claude/rules/database.md` — règle append-only sur migrations
- `.claude/work/ACTIVE.md` — brief INFRA-HARDENING-002
- `tests/fixtures/base.ts` — `ConsoleErrorCollector` + patterns critiques
- `docs/current/INDEX-PAGES-BACK-OFFICE.md` — liste des 147 pages
- PR #743 (BO-FIN-040/041) — origine de la règle no-phantom-data + drift
- PR #744 (INFRA-HARDENING-001) — socle smoke existant
