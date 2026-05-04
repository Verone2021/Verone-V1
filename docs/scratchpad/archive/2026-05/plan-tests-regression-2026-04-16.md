# Plan de Tests de Régression - Back Office Vérone

**Date** : 2026-04-16
**Auteur** : Claude (coordinateur) sur demande de Romeo
**Contexte** : Post-refactoring max-lines ayant introduit des bugs silencieux
**Sources** : `INDEX-PAGES-BACK-OFFICE.md` + vérification code réel

---

## 📊 Résumé

- **139 pages** réellement présentes dans le code (vérifié via `find`)
- **22 modules** dont 1 non-documenté (`/canaux-vente/meta`)
- **5 workflows critiques** à tester en priorité
- **Approche** : Tests de régression par module, du plus critique au moins critique

---

## 🔥 PRIORITÉ 1 — TESTS CRITIQUES (à faire EN PREMIER)

Ces tests couvrent les workflows métier où un bug silencieux impacte directement le business.

### P1.1 — Workflow Stock & Expéditions ⚠️ LE PLUS CRITIQUE

**Pourquoi** : C'est le workflow qui aurait détecté le bug du ShipmentWizard.

| Étape | Page à tester         | Action                                      | Vérification                           |
| ----- | --------------------- | ------------------------------------------- | -------------------------------------- |
| 1     | `/stocks`             | Charger le dashboard                        | KPIs s'affichent, pas d'erreur console |
| 2     | `/stocks/inventaire`  | Lister l'inventaire                         | Table se remplit                       |
| 3     | `/stocks/mouvements`  | Consulter l'historique                      | Table chronologique visible            |
| 4     | `/stocks/alertes`     | Vérifier les alertes                        | Types rupture/critique/faible affichés |
| 5     | `/stocks/receptions`  | Liste des réceptions                        | Table OK                               |
| 6     | `/stocks/expeditions` | Liste des expéditions                       | Table OK                               |
| 7     | `/stocks/expeditions` | Cliquer "Expédier" sur une commande validée | **LE MODAL S'OUVRE** (test critique)   |
| 8     | Modal ShipmentWizard  | Parcourir les 7 étapes                      | Chaque step accessible                 |
| 9     | Modal                 | Fermer avec Escape                          | Revient à l'état initial               |
| 10    | `/stocks/ajustements` | Liste des ajustements                       | Table OK                               |
| 11    | `/stocks/analytics`   | Analytics avancées                          | Graphiques rendus                      |

### P1.2 — Workflow Produits (Sourcing → Catalogue)

| Étape | Page                                 | Action              | Vérification            |
| ----- | ------------------------------------ | ------------------- | ----------------------- |
| 1     | `/produits`                          | Hub produits        | 4 KPIs + navigation     |
| 2     | `/produits/sourcing`                 | Liste sourcing      | Table OK                |
| 3     | `/produits/sourcing/produits/create` | Formulaire création | Tous champs interactifs |
| 4     | `/produits/sourcing/produits/[id]`   | Détail produit      | Données chargées        |
| 5     | `/produits/sourcing/echantillons`    | Liste échantillons  | Table OK                |
| 6     | `/produits/catalogue`                | Catalogue complet   | Pagination fonctionne   |
| 7     | `/produits/catalogue/nouveau`        | Formulaire création | Interactif              |
| 8     | `/produits/catalogue/[productId]`    | Détail produit      | Onglets accessibles     |
| 9     | `/produits/catalogue/archived`       | Produits archivés   | Table OK                |
| 10    | `/produits/catalogue/categories`     | Liste catégories    | Arborescence OK         |
| 11    | `/produits/catalogue/collections`    | Collections         | Table OK                |
| 12    | `/produits/catalogue/variantes`      | Groupes variantes   | Table OK                |

### P1.3 — Workflow Finance & Facturation

Module le plus dense (23 pages réelles). À tester avec attention.

**Sous-parcours Finance (hub + analytics)** :

- `/finance` (hub)
- `/finance/depenses` + `/finance/depenses/[id]` + `/finance/depenses/regles`
- `/finance/transactions`
- `/finance/rapprochement`
- `/finance/tresorerie`
- `/finance/tva`
- `/finance/bilan`
- `/finance/grand-livre`
- `/finance/echeancier`
- `/finance/immobilisations`

**Sous-parcours Documents Comptables** :

- `/finance/documents` (hub)
- `/finance/documents/achats`
- `/finance/documents/recettes`
- `/finance/documents/bilan`
- `/finance/documents/compte-resultat`
- `/finance/documents/grand-livre`
- `/finance/documents/resultats`
- `/finance/documents/tva`
- `/finance/documents/annexe`

**Sous-parcours Factures/Devis** :

- `/factures` + `/factures/nouvelle` + `/factures/[id]` + `/factures/[id]/edit`
- `/factures/devis/[id]`
- `/factures/qonto` ⚠️ **Route API interdite à modifier** selon CLAUDE.md
- `/devis` + `/devis/nouveau`

**Sous-parcours Admin Finance** (owner only) :

- `/finance/admin/cloture`
- `/finance/admin/reset`

### P1.4 — Workflow LinkMe (canal de vente principal)

31 pages à tester. Workflow complet :

**Hub & Catalogue** :

- `/canaux-vente` + `/canaux-vente/linkme`
- `/canaux-vente/linkme/catalogue` + `/[id]` + `/configuration` + `/fournisseurs` + `/vedettes`

**Commandes & Commissions** :

- `/canaux-vente/linkme/commandes` + `/[id]` + `/[id]/details`
- `/canaux-vente/linkme/commissions`
- `/canaux-vente/linkme/demandes-paiement`

**Sélections (drag & drop)** :

- `/canaux-vente/linkme/selections` + `/new` + `/[id]`

**Acteurs (enseignes, organisations, utilisateurs)** :

- `/canaux-vente/linkme/enseignes` + `/[id]`
- `/canaux-vente/linkme/organisations` + `/[id]`
- `/canaux-vente/linkme/utilisateurs` + `/[id]`

**Analytics (drill-down)** :

- `/canaux-vente/linkme/analytics` + `/rapports` + `/performance`
- `/canaux-vente/linkme/analytics/performance/[affiliateId]`
- `/canaux-vente/linkme/analytics/performance/[affiliateId]/[selectionId]`

**Stockage (drill-down)** :

- `/canaux-vente/linkme/stockage` + `/[id]` + `/[id]/produit/[allocationId]`

**Configuration & Support** :

- `/canaux-vente/linkme/configuration` + `/commissions` + `/integrations`
- `/canaux-vente/linkme/approbations`
- `/canaux-vente/linkme/messages`

### P1.5 — Workflow Commandes (Ventes & Achats)

- `/ventes` (dashboard)
- `/achats`
- `/commandes/clients`
- `/commandes/fournisseurs`

---

## 🟡 PRIORITÉ 2 — TESTS STANDARDS

### P2.1 — Contacts & Organisations (12 pages)

Hub + 6 types d'acteurs (clients B2B/B2C, contacts, enseignes, partners, suppliers) avec liste + détail pour chaque.

### P2.2 — Autres Canaux de Vente (5 pages)

- `/canaux-vente/google-merchant` ⚠️ Route API interdite à modifier
- `/canaux-vente/meta` ⚠️ **Page non documentée dans l'index** — à investiguer
- `/canaux-vente/site-internet` + `/produits/[id]`
- `/canaux-vente/prix-clients`

### P2.3 — Consultations & Prises de Contact (5 pages)

- `/consultations` + `/create` + `/[consultationId]`
- `/prises-contact/[id]` (⚠️ liste `/prises-contact` annoncée mais ABSENTE)

### P2.4 — Messagerie & Notifications (3 pages)

- `/messages` + `/messages/[categorie]`
- `/notifications`

---

## 🟢 PRIORITÉ 3 — TESTS DE CONFIG & ADMIN

### P3.1 — Paramètres (7 pages)

- `/parametres` (hub)
- `/parametres/emails` + `/[slug]/edit` + `/[slug]/preview`
- `/parametres/webhooks` + `/new` + `/[id]/edit`
- `/parametres/notifications`

### P3.2 — Admin (3 pages, owner only)

- `/admin/users` + `/admin/users/[id]`
- `/admin/activite-utilisateurs`

### P3.3 — Pages publiques (4 pages)

- `/` (redirect login)
- `/login`
- `/unauthorized`
- `/module-inactive`

---

## 📋 CHECKLIST DE VÉRIFICATION PAR PAGE

Pour **chaque page testée**, vérifier :

- [ ] **Chargement** : page charge en < 10 secondes
- [ ] **Console** : zéro erreur JavaScript dans la console
- [ ] **Réseau** : aucun appel API en erreur 4xx/5xx
- [ ] **Affichage** : composants principaux visibles (tableau, formulaire, KPIs)
- [ ] **Données** : si table/liste, données présentes (pas vide sans raison)
- [ ] **Interactivité** : boutons/liens cliquables, formulaires actifs
- [ ] **Screenshot** : capture d'écran sauvegardée pour preuve

## 🐛 CAS SPÉCIFIQUES POST-REFACTORING MAX-LINES

Zones à surveiller spécialement (hypothèse : c'est là où le découpage a cassé des choses) :

1. **Modals & Wizards multi-étapes** → ShipmentWizard (expéditions), création facture, création produit
2. **Formulaires complexes** → tout `/produits/catalogue/nouveau`, `/factures/nouvelle`
3. **Drill-downs analytics** → LinkMe analytics avec `[affiliateId]` puis `[selectionId]`
4. **Drag & drop** → `/canaux-vente/linkme/selections/new`
5. **Tables avec filtres avancés** → tous les `/finance/*` et `/stocks/*`

---

## 📈 STRATÉGIE D'EXÉCUTION RECOMMANDÉE

### Ordre chronologique suggéré

1. **Jour 1** : Smoke test toutes pages (139 pages, juste "charge sans erreur")
   → Détecte les plantages évidents en ~2h
2. **Jour 2** : P1.1 (Stock & Expéditions) — test critique
3. **Jour 3** : P1.2 (Produits) + P1.5 (Commandes)
4. **Jour 4** : P1.3 (Finance) — plus long car 23 pages
5. **Jour 5** : P1.4 (LinkMe) — plus long car 31 pages
6. **Jour 6** : P2 + P3 (tests secondaires)

### Critères d'arrêt

- **Si smoke test échoue > 10% des pages** → stop, diagnostic global avant de continuer
- **Si P1.1 échoue** → stop, fix immédiat (c'est le workflow expédition critique)

---

## ⚠️ ÉCARTS CONNUS INDEX vs CODE

Pages listées dans `INDEX-PAGES-BACK-OFFICE.md` mais **absentes du code** (à ne PAS tester) :

- `/organisation`, `/organisation/all`, `/organisation/contacts`
- `/livraisons`, `/livraisons/[id]`
- `/avoirs`, `/avoirs/[id]`
- `/prises-contact` (liste — seul `/[id]` existe)
- `/devis/[id]`
- `/produits/catalogue/stocks`
- `/stocks/produits`
- `/demo-stock-ui`, `/demo-universal-selector`
- `/test-purchase-order`, `/test-components/*`, `/test-client-enseigne-selector*`
- `/parametres/[...autres]`

Pages présentes dans le code mais **absentes de l'index** :

- `/canaux-vente/meta` (à ajouter dans une resync future)

---

**Fin du plan de tests**
