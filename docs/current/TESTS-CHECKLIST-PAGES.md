# Checklist Tests Pages Back-Office

**Total pages** : 147
**Derniere mise a jour** : 2026-04-16
**Source** : find apps/back-office/src/app -name "page.tsx"
**Ref** : [INDEX-PAGES-BACK-OFFICE.md](./INDEX-PAGES-BACK-OFFICE.md)

---

## Priorites

- **P0** : Bug = perte financiere ou bloque l'activite. Tester EN PREMIER.
- **P1** : Bug = dysfonctionnement majeur mais contournable.
- **P2** : Bug = inconfort utilisateur, pas bloquant.
- **P3** : Page simple, smoke test suffisant.

---

## P0 — Critique (42 pages)

### Stocks et Expeditions (13 pages)

| Route                        | Type      | Verifier                                            |
| ---------------------------- | --------- | --------------------------------------------------- |
| `/stocks`                    | Hub       | 4 KPI coherents, pas de NaN                         |
| `/stocks/inventaire`         | List      | Tri, filtres, quantites a jour                      |
| `/stocks/mouvements`         | List      | Chronologie, filtres par type                       |
| `/stocks/alertes`            | List      | Alertes rupture/critique/faible                     |
| `/stocks/stockage`           | Detail    | Emplacements physiques                              |
| `/stocks/entrees`            | List      | Historique entrees stock                            |
| `/stocks/receptions`         | List      | Receptions fournisseurs                             |
| `/stocks/sorties`            | List      | Sorties stock                                       |
| `/stocks/expeditions`        | List      | Wizard 7 etapes s'ouvre, Escape ferme sans expedier |
| `/stocks/ajustements`        | List      | Liste ajustements                                   |
| `/stocks/ajustements/create` | Form      | Formulaire complet, validation, creation            |
| `/stocks/analytics`          | Analytics | Graphiques chargent sans erreur                     |
| `/stocks/previsionnel`       | Analytics | Previsions affichees                                |

Test prioritaire absolu : `/stocks/expeditions` → clic "Expedier" → wizard 7 etapes → fermeture Escape.

### Finance (28 pages)

| Route                                | Type      | Verifier                           |
| ------------------------------------ | --------- | ---------------------------------- |
| `/finance`                           | Hub       | KPI comptables, totaux             |
| `/finance/comptabilite`              | Hub       | Sous-navigation fonctionne         |
| `/finance/depenses`                  | List      | Liste depenses, filtres            |
| `/finance/depenses/[id]`             | Detail    | Detail depense complet             |
| `/finance/depenses/regles`           | Settings  | Regles categorisation              |
| `/finance/transactions`              | List      | Transactions bancaires Qonto       |
| `/finance/rapprochement`             | List      | Rapprochement bancaire             |
| `/finance/tresorerie`                | Analytics | Graphique tresorerie               |
| `/finance/tva`                       | Analytics | Calcul TVA correct (20%/10%/5.5%)  |
| `/finance/bilan`                     | Analytics | Bilan comptable                    |
| `/finance/grand-livre`               | Analytics | Grand livre                        |
| `/finance/echeancier`                | List      | Echeancier paiements               |
| `/finance/immobilisations`           | List      | Immobilisations                    |
| `/finance/livres`                    | Analytics | Livres comptables                  |
| `/finance/justificatifs`             | List      | Justificatifs fiscaux              |
| `/finance/annexe`                    | List      | Documents annexes                  |
| `/finance/bibliotheque`              | List      | Bibliotheque comptable             |
| `/finance/documents`                 | Hub       | Hub documents comptables           |
| `/finance/documents/achats`          | List      | Documents achats                   |
| `/finance/documents/recettes`        | List      | Documents recettes                 |
| `/finance/documents/bilan`           | Analytics | Bilan documents                    |
| `/finance/documents/compte-resultat` | Analytics | Compte de resultat                 |
| `/finance/documents/grand-livre`     | Analytics | Grand livre documents              |
| `/finance/documents/resultats`       | Analytics | Resultats comptables               |
| `/finance/documents/tva`             | Analytics | Documents TVA                      |
| `/finance/documents/annexe`          | List      | Annexe documents                   |
| `/finance/admin/cloture`             | Admin     | Cloture exercice (owner seulement) |
| `/finance/admin/reset`               | Admin     | Reinitialisation (owner seulement) |

Vigilance : `/finance/admin/*` reserves au role owner. Tester avec et sans permission.

### Factures (6 pages)

| Route                  | Type     | Verifier                             |
| ---------------------- | -------- | ------------------------------------ |
| `/factures`            | List     | Liste factures et devis, onglets     |
| `/factures/nouvelle`   | Form     | Choix "depuis commande" OU "service" |
| `/factures/[id]`       | Detail   | PDF genere, montants TVA corrects    |
| `/factures/[id]/edit`  | Form     | Edition champs                       |
| `/factures/devis/[id]` | Detail   | Detail devis                         |
| `/factures/qonto`      | Settings | Integration Qonto (NE PAS MODIFIER)  |

---

## P1 — Elevee (55 pages)

### Produits (18 pages)

| Route                                               | Type   | Verifier                    |
| --------------------------------------------------- | ------ | --------------------------- |
| `/produits`                                         | Hub    | 4 KPI + navigation          |
| `/produits/affilies`                                | List   | Produits affilies           |
| `/produits/sourcing`                                | List   | 3 vues (Liste/Kanban/Carte) |
| `/produits/sourcing/produits/create`                | Form   | Creation produit sourcing   |
| `/produits/sourcing/produits/[id]`                  | Detail | Detail + simulateur marges  |
| `/produits/sourcing/echantillons`                   | List   | Echantillons                |
| `/produits/catalogue`                               | List   | Catalogue complet, filtres  |
| `/produits/catalogue/nouveau`                       | Form   | Wizard creation produit     |
| `/produits/catalogue/[productId]`                   | Detail | Fiche produit complete      |
| `/produits/catalogue/archived`                      | List   | Produits archives           |
| `/produits/catalogue/categories`                    | List   | Categories                  |
| `/produits/catalogue/categories/[categoryId]`       | Detail | Detail categorie            |
| `/produits/catalogue/subcategories/[subcategoryId]` | Detail | Detail sous-categorie       |
| `/produits/catalogue/collections`                   | List   | Collections                 |
| `/produits/catalogue/collections/[collectionId]`    | Detail | Detail collection           |
| `/produits/catalogue/families/[familyId]`           | Detail | Detail famille              |
| `/produits/catalogue/variantes`                     | List   | Groupes variantes           |
| `/produits/catalogue/variantes/[groupId]`           | Detail | Detail groupe variante      |

### LinkMe — Pages critiques (12 pages sur 39)

| Route                                            | Type      | Verifier                                  |
| ------------------------------------------------ | --------- | ----------------------------------------- |
| `/canaux-vente/linkme`                           | Hub       | Dashboard LinkMe                          |
| `/canaux-vente/linkme/catalogue`                 | List      | Pivot metier LinkMe                       |
| `/canaux-vente/linkme/commandes`                 | List      | Commandes affilies                        |
| `/canaux-vente/linkme/commandes/[id]`            | Detail    | Detail commande                           |
| `/canaux-vente/linkme/commandes/[id]/details`    | Detail    | Bouton "Expedier" ouvre wizard (bug fixe) |
| `/canaux-vente/linkme/commissions`               | Analytics | Montants commissions = argent reel        |
| `/canaux-vente/linkme/selections`                | List      | Selections affilies                       |
| `/canaux-vente/linkme/selections/new`            | Form      | Creation selection                        |
| `/canaux-vente/linkme/demandes-paiement`         | List      | Demandes paiement = argent reel           |
| `/canaux-vente/linkme/approbations`              | List      | Workflow approbations                     |
| `/canaux-vente/linkme/analytics/performance`     | Analytics | Performance affilies                      |
| `/canaux-vente/linkme/configuration/commissions` | Settings  | Taux commissions                          |

### LinkMe — Pages secondaires (27 pages, smoke test)

| Route                                                                    | Type      |
| ------------------------------------------------------------------------ | --------- |
| `/canaux-vente/linkme/catalogue/[id]`                                    | Detail    |
| `/canaux-vente/linkme/catalogue/configuration`                           | Settings  |
| `/canaux-vente/linkme/catalogue/fournisseurs`                            | List      |
| `/canaux-vente/linkme/catalogue/vedettes`                                | List      |
| `/canaux-vente/linkme/selections/[id]`                                   | Detail    |
| `/canaux-vente/linkme/utilisateurs`                                      | List      |
| `/canaux-vente/linkme/utilisateurs/[id]`                                 | Detail    |
| `/canaux-vente/linkme/enseignes`                                         | List      |
| `/canaux-vente/linkme/enseignes/[id]`                                    | Detail    |
| `/canaux-vente/linkme/organisations`                                     | List      |
| `/canaux-vente/linkme/organisations/[id]`                                | Detail    |
| `/canaux-vente/linkme/stockage`                                          | List      |
| `/canaux-vente/linkme/stockage/[id]`                                     | Detail    |
| `/canaux-vente/linkme/stockage/[id]/produit/[allocationId]`              | Detail    |
| `/canaux-vente/linkme/messages`                                          | Messaging |
| `/canaux-vente/linkme/analytics`                                         | Hub       |
| `/canaux-vente/linkme/analytics/rapports`                                | Analytics |
| `/canaux-vente/linkme/analytics/performance/[affiliateId]`               | Detail    |
| `/canaux-vente/linkme/analytics/performance/[affiliateId]/[selectionId]` | Detail    |
| `/canaux-vente/linkme/configuration`                                     | Hub       |
| `/canaux-vente/linkme/configuration/integrations`                        | Settings  |

### Commandes (2 pages)

| Route                     | Type | Verifier                                       |
| ------------------------- | ---- | ---------------------------------------------- |
| `/commandes/clients`      | List | Ventes clients, action "Expedier" ouvre wizard |
| `/commandes/fournisseurs` | List | Achats fournisseurs                            |

### Devis (2 pages)

| Route            | Type | Verifier                                   |
| ---------------- | ---- | ------------------------------------------ |
| `/devis`         | List | Liste devis                                |
| `/devis/nouveau` | Form | Creation devis (depuis commande ou vierge) |

### Consultations (3 pages)

| Route                             | Type   | Verifier                |
| --------------------------------- | ------ | ----------------------- |
| `/consultations`                  | List   | Liste consultations     |
| `/consultations/create`           | Form   | Wizard 3 etapes         |
| `/consultations/[consultationId]` | Detail | Simulateur marges + PDF |

---

## P2 — Moyenne (32 pages)

### Contacts et Organisations (13 pages)

| Route                                            | Type   |
| ------------------------------------------------ | ------ |
| `/contacts-organisations`                        | Hub    |
| `/contacts-organisations/[id]`                   | Detail |
| `/contacts-organisations/contacts`               | List   |
| `/contacts-organisations/contacts/[contactId]`   | Detail |
| `/contacts-organisations/customers`              | List   |
| `/contacts-organisations/customers/[customerId]` | Detail |
| `/contacts-organisations/enseignes`              | List   |
| `/contacts-organisations/enseignes/[id]`         | Detail |
| `/contacts-organisations/partners`               | List   |
| `/contacts-organisations/partners/[partnerId]`   | Detail |
| `/contacts-organisations/suppliers`              | List   |
| `/contacts-organisations/suppliers/[supplierId]` | Detail |
| `/contacts-organisations/clients-particuliers`   | List   |

Vigilance : Sprint BO-ORG recent a modifie SupplierFormModal, PartnerFormModal, CustomerOrganisationFormModal.

### Canaux de vente hors LinkMe (6 pages)

| Route                                       | Type     |
| ------------------------------------------- | -------- |
| `/canaux-vente`                             | Hub      |
| `/canaux-vente/prix-clients`                | Settings |
| `/canaux-vente/google-merchant`             | Settings |
| `/canaux-vente/meta`                        | Settings |
| `/canaux-vente/site-internet`               | Settings |
| `/canaux-vente/site-internet/produits/[id]` | Detail   |

### Parametres (8 pages)

| Route                               | Type     |
| ----------------------------------- | -------- |
| `/parametres`                       | Hub      |
| `/parametres/emails`                | List     |
| `/parametres/emails/[slug]/edit`    | Form     |
| `/parametres/emails/[slug]/preview` | Preview  |
| `/parametres/notifications`         | Settings |
| `/parametres/webhooks`              | List     |
| `/parametres/webhooks/new`          | Form     |
| `/parametres/webhooks/[id]/edit`    | Form     |

### Admin, Dashboard, Achats, Ventes (5 pages)

| Route                          | Type                  |
| ------------------------------ | --------------------- |
| `/admin/users`                 | List (owner)          |
| `/admin/users/[id]`            | Detail (owner)        |
| `/admin/activite-utilisateurs` | Analytics             |
| `/dashboard`                   | Hub (9 KPI + widgets) |
| `/achats`                      | Hub                   |
| `/ventes`                      | Dashboard             |

---

## P3 — Smoke test (8 pages)

| Route                   | Type              |
| ----------------------- | ----------------- |
| `/`                     | Redirection login |
| `/login`                | Authentification  |
| `/unauthorized`         | Info              |
| `/module-inactive`      | Info              |
| `/profile`              | Settings          |
| `/notifications`        | Hub               |
| `/messages`             | Messaging         |
| `/messages/[categorie]` | Messaging         |
| `/prises-contact/[id]`  | Detail            |

---

## Vigilances transversales

### Modals et wizards (risque de bypass)

Le bug d'expedition (PR #615) a montre qu'un bouton peut bypasser un wizard.
Verifier que ces formulaires ouvrent bien leur modal/wizard :

- `/stocks/expeditions` → ShipmentWizard 7 etapes
- `/canaux-vente/linkme/commandes/[id]/details` → ShipmentWizard (fixe PR #615)
- `/produits/catalogue/nouveau` → Wizard creation produit
- `/consultations/create` → Wizard 3 etapes
- `/factures/nouvelle` → Choix depuis commande ou service
- `/stocks/ajustements/create` → Formulaire ajustement
- `/devis/nouveau` → Creation devis
- `/canaux-vente/linkme/selections/new` → Creation selection
- `/parametres/webhooks/new` → Creation webhook

### Permissions par role

- `/admin/*` et `/finance/admin/*` : tester avec owner/admin/sales/catalog_manager
- Pages LinkMe : verifier isolation par enseigne_id/organisation_id

### Console JS

Zero erreur console toleree sur chaque navigation (`browser_console_messages(level: "error")`).

---

**Derniere mise a jour** : 2026-04-16
