# Index Master - Pages Back Office Vérone

**Total pages** : 138
**Total modules** : 21
**Dernière mise à jour** : 2026-01-23
**Généré par** : Agent Explore + Claude

---

## 📊 Résumé par Type

| Type              | Count   | Pourcentage |
| ----------------- | ------- | ----------- |
| **List**          | 43      | 31.2%       |
| **Detail**        | 32      | 23.2%       |
| **Hub/Dashboard** | 15      | 10.9%       |
| **Settings**      | 10      | 7.2%        |
| **Form**          | 9       | 6.5%        |
| **Analytics**     | 9       | 6.5%        |
| **Public**        | 9       | 6.5%        |
| **Special**       | 8       | 5.8%        |
| **Messaging**     | 2       | 1.4%        |
| **Total**         | **138** | 100%        |

---

## 📁 Index par Module

### 1. DASHBOARD (1 page)

| Route        | Type | Description                          |
| ------------ | ---- | ------------------------------------ |
| `/dashboard` | Hub  | 9 KPIs + 8 Quick Actions + 3 Widgets |

---

### 2. PRODUITS (18 pages)

| Route                                               | Type      | Description             |
| --------------------------------------------------- | --------- | ----------------------- |
| `/produits`                                         | Hub       | 4 KPIs + navigation     |
| `/produits/sourcing`                                | List      | Sourcing fournisseurs   |
| `/produits/sourcing/produits/create`                | Form      | Créer produit sourcing  |
| `/produits/sourcing/produits/[id]`                  | Detail    | Détail produit sourcing |
| `/produits/catalogue`                               | List      | Catalogue complet       |
| `/produits/catalogue/nouveau`                       | Form      | Créer produit catalogue |
| `/produits/catalogue/[productId]`                   | Detail    | Détail produit          |
| `/produits/catalogue/archived`                      | List      | Produits archivés       |
| `/produits/catalogue/stocks`                        | Analytics | État stocks par produit |
| `/produits/catalogue/categories`                    | List      | Catégories              |
| `/produits/catalogue/categories/[categoryId]`       | Detail    | Détail catégorie        |
| `/produits/catalogue/subcategories/[subcategoryId]` | Detail    | Détail sous-catégorie   |
| `/produits/catalogue/collections`                   | List      | Collections             |
| `/produits/catalogue/collections/[collectionId]`    | Detail    | Détail collection       |
| `/produits/catalogue/families/[familyId]`           | Detail    | Détail famille          |
| `/produits/catalogue/variantes`                     | List      | Groupes variantes       |
| `/produits/catalogue/variantes/[groupId]`           | Detail    | Détail groupe variante  |

---

### 3. STOCKS (14 pages)

| Route                        | Type      | Description                               |
| ---------------------------- | --------- | ----------------------------------------- |
| `/stocks`                    | Hub       | Dashboard stocks avec alertes             |
| `/stocks/inventaire`         | List      | Inventaire complet                        |
| `/stocks/mouvements`         | List      | Historique mouvements                     |
| `/stocks/alertes`            | List      | Alertes stock (rupture, critique, faible) |
| `/stocks/produits`           | List      | Produits par localisation                 |
| `/stocks/stockage`           | Detail    | Map stockage                              |
| `/stocks/entrees`            | List      | Entrées stock                             |
| `/stocks/receptions`         | List      | Réceptions fournisseurs                   |
| `/stocks/sorties`            | List      | Sorties stock                             |
| `/stocks/expeditions`        | List      | Expéditions clients                       |
| `/stocks/ajustements`        | List      | Ajustements                               |
| `/stocks/ajustements/create` | Form      | Créer ajustement                          |
| `/stocks/analytics`          | Analytics | Analytics avancées                        |
| `/stocks/previsionnel`       | Analytics | Prévisions/forecasting                    |

---

### 4. COMMANDES (4 pages)

| Route                     | Type   | Description                     |
| ------------------------- | ------ | ------------------------------- |
| `/commandes`              | Hub    | Hub commandes                   |
| `/commandes/clients`      | List   | Commandes clients (ventes)      |
| `/commandes/clients/[id]` | Detail | Détail commande client          |
| `/commandes/fournisseurs` | List   | Commandes fournisseurs (achats) |

---

### 5. CONTACTS & ORGANISATIONS (13 pages)

| Route                                            | Type   | Description         |
| ------------------------------------------------ | ------ | ------------------- |
| `/contacts-organisations`                        | Hub    | Hub CRM             |
| `/contacts-organisations/[id]`                   | Detail | Détail organisation |
| `/contacts-organisations/contacts`               | List   | Tous contacts       |
| `/contacts-organisations/contacts/[contactId]`   | Detail | Détail contact      |
| `/contacts-organisations/customers`              | List   | Clients B2B         |
| `/contacts-organisations/customers/[customerId]` | Detail | Détail client       |
| `/contacts-organisations/enseignes`              | List   | Enseignes           |
| `/contacts-organisations/enseignes/[id]`         | Detail | Détail enseigne     |
| `/contacts-organisations/partners`               | List   | Partenaires         |
| `/contacts-organisations/partners/[partnerId]`   | Detail | Détail partenaire   |
| `/contacts-organisations/suppliers`              | List   | Fournisseurs        |
| `/contacts-organisations/suppliers/[supplierId]` | Detail | Détail fournisseur  |
| `/contacts-organisations/clients-particuliers`   | List   | Clients B2C         |

---

### 6. LINKME / CANAUX DE VENTE (37 pages)

| Route                                                                    | Type      | Description          |
| ------------------------------------------------------------------------ | --------- | -------------------- |
| `/canaux-vente`                                                          | Hub       | Hub canaux de vente  |
| `/canaux-vente/prix-clients`                                             | Settings  | Prix personnalisés   |
| `/canaux-vente/google-merchant`                                          | Settings  | Intégration GMC      |
| `/canaux-vente/site-internet`                                            | Settings  | Site e-commerce      |
| `/canaux-vente/linkme`                                                   | Hub       | Hub LinkMe           |
| `/canaux-vente/linkme/catalogue`                                         | List      | Catalogue LinkMe     |
| `/canaux-vente/linkme/catalogue/[id]`                                    | Detail    | Détail produit       |
| `/canaux-vente/linkme/catalogue/configuration`                           | Settings  | Config catalogue     |
| `/canaux-vente/linkme/commandes`                                         | List      | Commandes LinkMe     |
| `/canaux-vente/linkme/commandes/[id]`                                    | Detail    | Détail commande      |
| `/canaux-vente/linkme/commandes/a-traiter`                               | List      | Queue traitement     |
| `/canaux-vente/linkme/commandes/all`                                     | List      | Toutes commandes     |
| `/canaux-vente/linkme/commandes/preview`                                 | Detail    | Aperçu commande      |
| `/canaux-vente/linkme/selections`                                        | List      | Sélections affiliés  |
| `/canaux-vente/linkme/selections/new`                                    | Form      | Créer sélection      |
| `/canaux-vente/linkme/selections/[id]`                                   | Detail    | Détail sélection     |
| `/canaux-vente/linkme/commissions`                                       | Analytics | Commissions affiliés |
| `/canaux-vente/linkme/utilisateurs`                                      | List      | Utilisateurs         |
| `/canaux-vente/linkme/utilisateurs/[id]`                                 | Detail    | Détail utilisateur   |
| `/canaux-vente/linkme/enseignes`                                         | List      | Enseignes            |
| `/canaux-vente/linkme/enseignes/[id]`                                    | Detail    | Détail enseigne      |
| `/canaux-vente/linkme/organisations`                                     | List      | Organisations        |
| `/canaux-vente/linkme/organisations/[id]`                                | Detail    | Détail organisation  |
| `/canaux-vente/linkme/stockage`                                          | List      | Stockage affiliés    |
| `/canaux-vente/linkme/stockage/[id]`                                     | Detail    | Détail stockage      |
| `/canaux-vente/linkme/approbations`                                      | List      | Approbations         |
| `/canaux-vente/linkme/demandes-paiement`                                 | List      | Demandes paiement    |
| `/canaux-vente/linkme/messages`                                          | Messaging | Messagerie           |
| `/canaux-vente/linkme/analytics`                                         | Hub       | Hub analytics        |
| `/canaux-vente/linkme/analytics/page`                                    | Analytics | Dashboard            |
| `/canaux-vente/linkme/analytics/rapports`                                | Analytics | Rapports             |
| `/canaux-vente/linkme/analytics/performance`                             | Analytics | Performance          |
| `/canaux-vente/linkme/analytics/performance/[affiliateId]`               | Detail    | Perf affilié         |
| `/canaux-vente/linkme/analytics/performance/[affiliateId]/[selectionId]` | Detail    | Perf sélection       |
| `/canaux-vente/linkme/configuration`                                     | Hub       | Hub config           |
| `/canaux-vente/linkme/configuration/commissions`                         | Settings  | Config commissions   |
| `/canaux-vente/linkme/configuration/integrations`                        | Settings  | Intégrations         |

---

### 7. FINANCE (9 pages)

| Route                      | Type      | Description            |
| -------------------------- | --------- | ---------------------- |
| `/finance`                 | Hub       | Hub comptabilité       |
| `/finance/depenses`        | List      | Dépenses               |
| `/finance/depenses/[id]`   | Detail    | Détail dépense         |
| `/finance/depenses/regles` | Settings  | Règles catégorisation  |
| `/finance/transactions`    | List      | Transactions bancaires |
| `/finance/justificatifs`   | List      | Justificatifs          |
| `/finance/livres`          | Analytics | Livres comptables      |
| `/finance/admin/reset`     | Admin     | Réinitialisation       |

---

### 8. FACTURES (4 pages)

| Route                 | Type     | Description       |
| --------------------- | -------- | ----------------- |
| `/factures`           | List     | Factures          |
| `/factures/[id]`      | Detail   | Détail facture    |
| `/factures/[id]/edit` | Form     | Éditer facture    |
| `/factures/qonto`     | Settings | Intégration Qonto |

---

### 9. CONSULTATIONS (3 pages)

| Route                             | Type   | Description         |
| --------------------------------- | ------ | ------------------- |
| `/consultations`                  | List   | Liste consultations |
| `/consultations/create`           | Form   | Créer consultation  |
| `/consultations/[consultationId]` | Detail | Détail consultation |

---

### 10. PARAMÈTRES (8 pages)

| Route                            | Type     | Description          |
| -------------------------------- | -------- | -------------------- |
| `/parametres`                    | Hub      | Hub paramètres       |
| `/parametres/emails`             | List     | Templates email      |
| `/parametres/emails/[slug]/edit` | Form     | Éditer template      |
| `/parametres/webhooks`           | List     | Webhooks             |
| `/parametres/webhooks/new`       | Form     | Créer webhook        |
| `/parametres/webhooks/[id]/edit` | Form     | Éditer webhook       |
| `/parametres/notifications`      | Settings | Config notifications |
| `/parametres/[...autres]`        | Settings | Autres paramètres    |

---

### 11. ADMIN (3 pages)

| Route                          | Type      | Description        |
| ------------------------------ | --------- | ------------------ |
| `/admin/users`                 | List      | Utilisateurs       |
| `/admin/users/[id]`            | Detail    | Détail utilisateur |
| `/admin/activite-utilisateurs` | Analytics | Journal activité   |

---

### 12. AUTRES MODULES (13 pages)

| Module                | Route                   | Type      | Description             |
| --------------------- | ----------------------- | --------- | ----------------------- |
| **Organisation**      | `/organisation`         | Hub       | Paramètres organisation |
|                       | `/organisation/profile` | Settings  | Profil org              |
|                       | `/organisation/members` | List      | Membres                 |
| **Notifications**     | `/notifications`        | Hub       | Centre notifications    |
| **Profile**           | `/profile`              | Settings  | Profil utilisateur      |
| **Livraisons**        | `/livraisons`           | List      | Livraisons              |
|                       | `/livraisons/[id]`      | Detail    | Détail livraison        |
| **Prises de Contact** | `/prises-contact`       | List      | Leads/prospects         |
|                       | `/prises-contact/[id]`  | Detail    | Détail lead             |
| **Avoirs**            | `/avoirs`               | List      | Avoirs                  |
|                       | `/avoirs/[id]`          | Detail    | Détail avoir            |
| **Devis**             | `/devis`                | List      | Devis                   |
|                       | `/devis/[id]`           | Detail    | Détail devis            |
| **Trésorerie**        | `/tresorerie`           | Dashboard | Tableau trésorerie      |
| **Ventes**            | `/ventes`               | Dashboard | Dashboard ventes        |

---

### 13. PAGES PUBLIQUES (9 pages)

| Route                                   | Type   | Description           |
| --------------------------------------- | ------ | --------------------- |
| `/`                                     | Public | Redirection login     |
| `/login`                                | Public | Authentification      |
| `/demo-stock-ui`                        | Demo   | UI stocks             |
| `/demo-universal-selector`              | Demo   | Sélecteur universel   |
| `/test-purchase-order`                  | Test   | Commandes fournisseur |
| `/test-components/button-unified`       | Test   | Button unifié         |
| `/test-client-enseigne-selector`        | Test   | Sélecteur client      |
| `/test-client-enseigne-selector-simple` | Test   | Sélecteur simplifié   |
| `/module-inactive`                      | Info   | Module désactivé      |

---

## 📈 Distribution par Module

```
canaux-vente/linkme:    37 pages ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (26.8%)
produits:               18 pages ▓▓▓▓▓▓▓▓▓ (13.1%)
stocks:                 14 pages ▓▓▓▓▓▓▓ (10.1%)
contacts-organisations: 13 pages ▓▓▓▓▓▓▓ (9.4%)
finance:                 9 pages ▓▓▓▓▓ (6.5%)
parametres:              8 pages ▓▓▓▓ (5.8%)
commandes:               4 pages ▓▓ (2.9%)
factures:                4 pages ▓▓ (2.9%)
admin:                   3 pages ▓▓ (2.2%)
consultations:           3 pages ▓▓ (2.2%)
organisation:            3 pages ▓▓ (2.2%)
livraisons:              2 pages ▓ (1.4%)
prises-contact:          2 pages ▓ (1.4%)
avoirs:                  2 pages ▓ (1.4%)
devis:                   2 pages ▓ (1.4%)
dashboard:               1 page  (0.7%)
notifications:           1 page  (0.7%)
profile:                 1 page  (0.7%)
tresorerie:              1 page  (0.7%)
ventes:                  1 page  (0.7%)
public/test:             9 pages ▓▓▓▓▓ (6.5%)
```

---

## 🔗 Workflows Métier Principaux

### Workflow Produit

```
/produits → /produits/sourcing → /produits/sourcing/produits/create
                              → /produits/sourcing/produits/[id]
         → /produits/catalogue → /produits/catalogue/nouveau
                              → /produits/catalogue/[productId]
                              → /produits/catalogue/categories
                              → /produits/catalogue/variantes
```

### Workflow Stock

```
/stocks → /stocks/inventaire
       → /stocks/alertes
       → /stocks/receptions (entrées)
       → /stocks/expeditions (sorties)
       → /stocks/previsionnel
```

### Workflow Commandes

```
/commandes → /commandes/clients → /commandes/clients/[id]
          → /commandes/fournisseurs
```

### Workflow LinkMe

```
/canaux-vente/linkme → /catalogue → /selections → /commandes
                    → /analytics/performance
                    → /demandes-paiement
```

---

## ⚠️ Observations

1. **Module LinkMe** représente 26.8% des pages (très complet)
2. **Profondeur max** : 5 niveaux (LinkMe analytics)
3. **Pattern cohérent** : Hub → List → Detail → Form
4. **Admin isolé** : `/admin` séparé pour sécurité
5. **Tests/Demos** : 8 pages à archiver éventuellement

---

**Dernière mise à jour** : 2026-01-23 par Claude
