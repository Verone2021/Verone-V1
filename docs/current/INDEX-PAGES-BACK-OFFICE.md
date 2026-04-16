# Index Master - Pages Back Office Verone

**Total pages** : 147
**Total modules** : 18
**Derniere mise a jour** : 2026-04-16
**Genere par** : Resync code vs index (find page.tsx)

---

## Resume par Type

| Type              | Count   | Pourcentage |
| ----------------- | ------- | ----------- |
| **List**          | 44      | 29.9%       |
| **Detail**        | 34      | 23.1%       |
| **Hub/Dashboard** | 16      | 10.9%       |
| **Analytics**     | 16      | 10.9%       |
| **Settings**      | 11      | 7.5%        |
| **Form**          | 9       | 6.1%        |
| **Admin**         | 4       | 2.7%        |
| **Special**       | 4       | 2.7%        |
| **Messaging**     | 3       | 2.0%        |
| **Public**        | 4       | 2.7%        |
| **Other**         | 2       | 1.4%        |
| **Total**         | **147** | 100%        |

---

## Index par Module

### 1. DASHBOARD (1 page)

| Route        | Type | Description                          |
| ------------ | ---- | ------------------------------------ |
| `/dashboard` | Hub  | 9 KPIs + 8 Quick Actions + 3 Widgets |

---

### 2. PRODUITS (18 pages)

| Route                                               | Type   | Description             |
| --------------------------------------------------- | ------ | ----------------------- |
| `/produits`                                         | Hub    | 4 KPIs + navigation     |
| `/produits/affilies`                                | List   | Produits affilies       |
| `/produits/sourcing`                                | List   | Sourcing fournisseurs   |
| `/produits/sourcing/produits/create`                | Form   | Creer produit sourcing  |
| `/produits/sourcing/produits/[id]`                  | Detail | Detail produit sourcing |
| `/produits/sourcing/echantillons`                   | List   | Echantillons sourcing   |
| `/produits/catalogue`                               | List   | Catalogue complet       |
| `/produits/catalogue/nouveau`                       | Form   | Creer produit catalogue |
| `/produits/catalogue/[productId]`                   | Detail | Detail produit          |
| `/produits/catalogue/archived`                      | List   | Produits archives       |
| `/produits/catalogue/categories`                    | List   | Categories              |
| `/produits/catalogue/categories/[categoryId]`       | Detail | Detail categorie        |
| `/produits/catalogue/subcategories/[subcategoryId]` | Detail | Detail sous-categorie   |
| `/produits/catalogue/collections`                   | List   | Collections             |
| `/produits/catalogue/collections/[collectionId]`    | Detail | Detail collection       |
| `/produits/catalogue/families/[familyId]`           | Detail | Detail famille          |
| `/produits/catalogue/variantes`                     | List   | Groupes variantes       |
| `/produits/catalogue/variantes/[groupId]`           | Detail | Detail groupe variante  |

---

### 3. STOCKS (13 pages)

| Route                        | Type      | Description                               |
| ---------------------------- | --------- | ----------------------------------------- |
| `/stocks`                    | Hub       | Dashboard stocks avec alertes             |
| `/stocks/inventaire`         | List      | Inventaire complet                        |
| `/stocks/mouvements`         | List      | Historique mouvements                     |
| `/stocks/alertes`            | List      | Alertes stock (rupture, critique, faible) |
| `/stocks/stockage`           | Detail    | Map stockage                              |
| `/stocks/entrees`            | List      | Entrees stock                             |
| `/stocks/receptions`         | List      | Receptions fournisseurs                   |
| `/stocks/sorties`            | List      | Sorties stock                             |
| `/stocks/expeditions`        | List      | Expeditions clients                       |
| `/stocks/ajustements`        | List      | Ajustements                               |
| `/stocks/ajustements/create` | Form      | Creer ajustement                          |
| `/stocks/analytics`          | Analytics | Analytics avancees                        |
| `/stocks/previsionnel`       | Analytics | Previsions/forecasting                    |

---

### 4. COMMANDES (2 pages)

| Route                     | Type | Description                     |
| ------------------------- | ---- | ------------------------------- |
| `/commandes/clients`      | List | Commandes clients (ventes)      |
| `/commandes/fournisseurs` | List | Commandes fournisseurs (achats) |

---

### 5. CONTACTS & ORGANISATIONS (13 pages)

| Route                                            | Type   | Description         |
| ------------------------------------------------ | ------ | ------------------- |
| `/contacts-organisations`                        | Hub    | Hub CRM             |
| `/contacts-organisations/[id]`                   | Detail | Detail organisation |
| `/contacts-organisations/contacts`               | List   | Tous contacts       |
| `/contacts-organisations/contacts/[contactId]`   | Detail | Detail contact      |
| `/contacts-organisations/customers`              | List   | Clients B2B         |
| `/contacts-organisations/customers/[customerId]` | Detail | Detail client       |
| `/contacts-organisations/enseignes`              | List   | Enseignes           |
| `/contacts-organisations/enseignes/[id]`         | Detail | Detail enseigne     |
| `/contacts-organisations/partners`               | List   | Partenaires         |
| `/contacts-organisations/partners/[partnerId]`   | Detail | Detail partenaire   |
| `/contacts-organisations/suppliers`              | List   | Fournisseurs        |
| `/contacts-organisations/suppliers/[supplierId]` | Detail | Detail fournisseur  |
| `/contacts-organisations/clients-particuliers`   | List   | Clients B2C         |

---

### 6. CANAUX DE VENTE (39 pages)

| Route                                                                    | Type      | Description               |
| ------------------------------------------------------------------------ | --------- | ------------------------- |
| `/canaux-vente`                                                          | Hub       | Hub canaux de vente       |
| `/canaux-vente/prix-clients`                                             | Settings  | Prix personnalises        |
| `/canaux-vente/google-merchant`                                          | Settings  | Integration GMC           |
| `/canaux-vente/meta`                                                     | Settings  | Integration Meta Commerce |
| `/canaux-vente/site-internet`                                            | Settings  | Site e-commerce           |
| `/canaux-vente/site-internet/produits/[id]`                              | Detail    | Detail produit site       |
| `/canaux-vente/linkme`                                                   | Hub       | Hub LinkMe                |
| `/canaux-vente/linkme/catalogue`                                         | List      | Catalogue LinkMe          |
| `/canaux-vente/linkme/catalogue/[id]`                                    | Detail    | Detail produit            |
| `/canaux-vente/linkme/catalogue/configuration`                           | Settings  | Config catalogue          |
| `/canaux-vente/linkme/catalogue/fournisseurs`                            | List      | Catalogue par fournisseur |
| `/canaux-vente/linkme/catalogue/vedettes`                                | List      | Produits vedettes         |
| `/canaux-vente/linkme/commandes`                                         | List      | Commandes LinkMe          |
| `/canaux-vente/linkme/commandes/[id]`                                    | Detail    | Detail commande           |
| `/canaux-vente/linkme/commandes/[id]/details`                            | Detail    | Sous-detail commande      |
| `/canaux-vente/linkme/selections`                                        | List      | Selections affilies       |
| `/canaux-vente/linkme/selections/new`                                    | Form      | Creer selection           |
| `/canaux-vente/linkme/selections/[id]`                                   | Detail    | Detail selection          |
| `/canaux-vente/linkme/commissions`                                       | Analytics | Commissions affilies      |
| `/canaux-vente/linkme/utilisateurs`                                      | List      | Utilisateurs              |
| `/canaux-vente/linkme/utilisateurs/[id]`                                 | Detail    | Detail utilisateur        |
| `/canaux-vente/linkme/enseignes`                                         | List      | Enseignes                 |
| `/canaux-vente/linkme/enseignes/[id]`                                    | Detail    | Detail enseigne           |
| `/canaux-vente/linkme/organisations`                                     | List      | Organisations             |
| `/canaux-vente/linkme/organisations/[id]`                                | Detail    | Detail organisation       |
| `/canaux-vente/linkme/stockage`                                          | List      | Stockage affilies         |
| `/canaux-vente/linkme/stockage/[id]`                                     | Detail    | Detail stockage           |
| `/canaux-vente/linkme/stockage/[id]/produit/[allocationId]`              | Detail    | Detail allocation produit |
| `/canaux-vente/linkme/approbations`                                      | List      | Approbations              |
| `/canaux-vente/linkme/demandes-paiement`                                 | List      | Demandes paiement         |
| `/canaux-vente/linkme/messages`                                          | Messaging | Messagerie                |
| `/canaux-vente/linkme/analytics`                                         | Hub       | Hub analytics             |
| `/canaux-vente/linkme/analytics/rapports`                                | Analytics | Rapports                  |
| `/canaux-vente/linkme/analytics/performance`                             | Analytics | Performance               |
| `/canaux-vente/linkme/analytics/performance/[affiliateId]`               | Detail    | Perf affilie              |
| `/canaux-vente/linkme/analytics/performance/[affiliateId]/[selectionId]` | Detail    | Perf selection            |
| `/canaux-vente/linkme/configuration`                                     | Hub       | Hub config                |
| `/canaux-vente/linkme/configuration/commissions`                         | Settings  | Config commissions        |
| `/canaux-vente/linkme/configuration/integrations`                        | Settings  | Integrations              |

---

### 7. FINANCE (28 pages)

| Route                                | Type      | Description              |
| ------------------------------------ | --------- | ------------------------ |
| `/finance`                           | Hub       | Hub comptabilite         |
| `/finance/depenses`                  | List      | Depenses                 |
| `/finance/depenses/[id]`             | Detail    | Detail depense           |
| `/finance/depenses/regles`           | Settings  | Regles categorisation    |
| `/finance/transactions`              | List      | Transactions bancaires   |
| `/finance/justificatifs`             | List      | Justificatifs            |
| `/finance/livres`                    | Analytics | Livres comptables        |
| `/finance/echeancier`                | List      | Echeancier paiements     |
| `/finance/immobilisations`           | List      | Immobilisations          |
| `/finance/admin/reset`               | Admin     | Reinitialisation         |
| `/finance/admin/cloture`             | Admin     | Cloture exercice         |
| `/finance/annexe`                    | List      | Documents annexes        |
| `/finance/bibliotheque`              | List      | Bibliotheque comptable   |
| `/finance/bilan`                     | Analytics | Bilan comptable          |
| `/finance/comptabilite`              | Hub       | Hub comptabilite detail  |
| `/finance/documents`                 | Hub       | Hub documents comptables |
| `/finance/documents/achats`          | List      | Documents achats         |
| `/finance/documents/annexe`          | List      | Documents annexes        |
| `/finance/documents/bilan`           | Analytics | Bilan documents          |
| `/finance/documents/compte-resultat` | Analytics | Compte de resultat       |
| `/finance/documents/grand-livre`     | Analytics | Grand livre documents    |
| `/finance/documents/recettes`        | List      | Documents recettes       |
| `/finance/documents/resultats`       | Analytics | Resultats comptables     |
| `/finance/documents/tva`             | Analytics | Documents TVA            |
| `/finance/grand-livre`               | Analytics | Grand livre              |
| `/finance/rapprochement`             | List      | Rapprochement bancaire   |
| `/finance/tresorerie`                | Analytics | Tresorerie               |
| `/finance/tva`                       | Analytics | Declaration TVA          |

---

### 8. FACTURES (6 pages)

| Route                  | Type     | Description                                          |
| ---------------------- | -------- | ---------------------------------------------------- |
| `/factures`            | List     | Factures                                             |
| `/factures/nouvelle`   | Form     | Creation facture (choix: depuis commande ou service) |
| `/factures/[id]`       | Detail   | Detail facture                                       |
| `/factures/[id]/edit`  | Form     | Editer facture                                       |
| `/factures/devis/[id]` | Detail   | Detail devis                                         |
| `/factures/qonto`      | Settings | Integration Qonto                                    |

---

### 9. CONSULTATIONS (3 pages)

| Route                             | Type   | Description         |
| --------------------------------- | ------ | ------------------- |
| `/consultations`                  | List   | Liste consultations |
| `/consultations/create`           | Form   | Creer consultation  |
| `/consultations/[consultationId]` | Detail | Detail consultation |

---

### 10. PARAMETRES (8 pages)

| Route                               | Type     | Description          |
| ----------------------------------- | -------- | -------------------- |
| `/parametres`                       | Hub      | Hub parametres       |
| `/parametres/emails`                | List     | Templates email      |
| `/parametres/emails/[slug]/edit`    | Form     | Editer template      |
| `/parametres/emails/[slug]/preview` | Settings | Preview template     |
| `/parametres/notifications`         | Settings | Config notifications |
| `/parametres/webhooks`              | List     | Webhooks             |
| `/parametres/webhooks/new`          | Form     | Creer webhook        |
| `/parametres/webhooks/[id]/edit`    | Form     | Editer webhook       |

---

### 11. ADMIN (3 pages)

| Route                          | Type      | Description        |
| ------------------------------ | --------- | ------------------ |
| `/admin/users`                 | List      | Utilisateurs       |
| `/admin/users/[id]`            | Detail    | Detail utilisateur |
| `/admin/activite-utilisateurs` | Analytics | Journal activite   |

---

### 12. MESSAGERIE (2 pages)

| Route                   | Type      | Description            |
| ----------------------- | --------- | ---------------------- |
| `/messages`             | Messaging | Messagerie globale     |
| `/messages/[categorie]` | Messaging | Messages par categorie |

---

### 13. NOTIFICATIONS (1 page)

| Route            | Type | Description          |
| ---------------- | ---- | -------------------- |
| `/notifications` | Hub  | Centre notifications |

---

### 14. PROFILE (1 page)

| Route      | Type     | Description        |
| ---------- | -------- | ------------------ |
| `/profile` | Settings | Profil utilisateur |

---

### 15. PRISES DE CONTACT (1 page)

| Route                  | Type   | Description |
| ---------------------- | ------ | ----------- |
| `/prises-contact/[id]` | Detail | Detail lead |

---

### 16. DEVIS (2 pages)

| Route            | Type | Description                                       |
| ---------------- | ---- | ------------------------------------------------- |
| `/devis`         | List | Devis (redirect vers /factures?tab=devis)         |
| `/devis/nouveau` | Form | Creation devis (choix: depuis commande ou vierge) |

---

### 17. ACHATS & VENTES (2 pages)

| Route     | Type      | Description      |
| --------- | --------- | ---------------- |
| `/achats` | Hub       | Hub achats       |
| `/ventes` | Dashboard | Dashboard ventes |

---

### 18. PAGES SYSTEME (4 pages)

| Route              | Type   | Description        |
| ------------------ | ------ | ------------------ |
| `/`                | Public | Redirection login  |
| `/login`           | Public | Authentification   |
| `/module-inactive` | Info   | Module desactive   |
| `/unauthorized`    | Info   | Acces non autorise |

---

## Permissions par Role

| Role              | Acces                                        |
| ----------------- | -------------------------------------------- |
| `owner`           | Toutes les pages + admin + finance/admin     |
| `admin`           | Toutes les pages + finance/admin             |
| `sales`           | Toutes les pages sauf admin et finance/admin |
| `catalog_manager` | Toutes les pages sauf admin et finance/admin |

**Guard** : Toutes les routes sous `(protected)` requierent un role `back-office` actif dans `user_app_roles`.
Les routes `/admin/**` requierent `owner`. Les routes `/finance/admin/**` requierent `owner` ou `admin`.

---

## Distribution par Module

```
canaux-vente:           39 pages (26.5%)
finance:                28 pages (19.0%)
produits:               18 pages (12.2%)
contacts-organisations: 13 pages (8.8%)
stocks:                 13 pages (8.8%)
parametres:              8 pages (5.4%)
factures:                6 pages (4.1%)
admin:                   3 pages (2.0%)
consultations:           3 pages (2.0%)
commandes:               2 pages (1.4%)
devis:                   2 pages (1.4%)
messagerie:              2 pages (1.4%)
achats-ventes:           2 pages (1.4%)
dashboard:               1 page  (0.7%)
notifications:           1 page  (0.7%)
profile:                 1 page  (0.7%)
prises-contact:          1 page  (0.7%)
systeme:                 4 pages (2.7%)
```

---

## Workflows Metier Principaux

### Workflow Produit

```
/produits -> /produits/sourcing -> /produits/sourcing/produits/create
                                -> /produits/sourcing/produits/[id]
                                -> /produits/sourcing/echantillons
          -> /produits/catalogue -> /produits/catalogue/nouveau
                                -> /produits/catalogue/[productId]
                                -> /produits/catalogue/categories
                                -> /produits/catalogue/variantes
          -> /produits/affilies
```

### Workflow Stock

```
/stocks -> /stocks/inventaire
        -> /stocks/alertes
        -> /stocks/receptions (entrees)
        -> /stocks/expeditions (sorties)
        -> /stocks/previsionnel
```

### Workflow Commandes

```
/commandes/clients
/commandes/fournisseurs
```

### Workflow Finance

```
/finance -> /finance/depenses -> /finance/depenses/[id]
         -> /finance/transactions
         -> /finance/rapprochement
         -> /finance/tresorerie
         -> /finance/tva
         -> /finance/echeancier
         -> /finance/immobilisations
         -> /finance/documents -> /finance/documents/achats
                               -> /finance/documents/recettes
                               -> /finance/documents/bilan
                               -> /finance/documents/compte-resultat
                               -> /finance/documents/grand-livre
                               -> /finance/documents/tva
         -> /finance/admin/cloture
```

### Workflow LinkMe

```
/canaux-vente/linkme -> /catalogue -> /selections -> /commandes
                     -> /analytics/performance
                     -> /demandes-paiement
```

---

**Derniere mise a jour** : 2026-04-16 par Claude (resync find page.tsx)
