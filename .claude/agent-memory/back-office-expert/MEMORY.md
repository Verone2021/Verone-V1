# Back-Office Expert — Memoire Persistante

## Architecture globale

- CRM/ERP modulaire : 165 pages, 22 modules, 78+ tables DB
- Auth via layout (protected) + RLS — PAS de middleware (7 echecs, INTERDIT)
- 26 packages partages @verone/ (ui, orders, products, stock, customers, types, utils)
- eslint.ignoreDuringBuilds = true (531 warnings, crash SIGTRAP si active)

## Modules et pages cles

- **Dashboard** : KPIs actionables (marge brute 44%, CA par canal, top 5 produits, valeur stock 25k, cliquables)
- **Produits** : catalogue 231 produits, alertes "A traiter", KPIs compacts, grille 2x2
- **Stock** : pas de table stock_levels — tout calcule via 12 triggers PostgreSQL interdependants
- **Commandes** : SO (vente) + PO (achat), cycle Consultation → Devis → Commande → Expedition → Facture
- **Finance** : double table invoices (legacy Abby 23 lignes) + financial_documents (Qonto STI)
- **Contacts** : 5 KPIs (Total, Fournisseurs, Clients Pro, Prestataires, Enseignes), banniere alertes
- **Ventes** : hub avec liens rapides, KPIs, grille 2 colonnes
- **Achats** : hub identique design Ventes

## Regles metier stock (source de verite)

- stock_real : UNIQUEMENT sur reception/expedition physique
- stock_forecasted : sur confirmation/reception commande
- stock_previsionnel = stock_real - forecasted_out + forecasted_in
- Alertes : ROUGE (bas/rupture), VERT (PO valide), DISPARU (recu/expedie)
- Backorders autorises (stock negatif = unites en attente reapprovisionnement)
- Tracabilite : "Manual - [Name]" vs "Commande [ID] - [Name]"

## Regles metier commandes

- Annulation SO : INTERDITE si payee (protection financiere absolue)
- Devalidation obligatoire avant annulation (workflow 2 etapes)
- PO : draft (rouge) → valide (vert, stock_forecasted_in) → recu (stock_real)
- 13 notifications automatiques (5 ventes + 5 achats + 3 expeditions)
- Adresse auto-remplie depuis organisation (isolation : modif commande ≠ modif org)

## Finance et Qonto

- Qonto = source PRIMAIRE pour devis (API), DB = copie secondaire
- autoFinalize: false TOUJOURS (incident 7 jan 2026 : facture 0.2% TVA irreversible)
- financial_documents = factures UNIQUEMENT (clients + fournisseurs)
- Rapprochement via transaction_document_links (102 liens : 87 ventes + 15 achats)
- 3 systemes paiement coexistent : Qonto, manual_payment, order_payments

## API INTERDIT DE MODIFIER

- Routes Qonto, adresses, emails, webhooks — casse systematiquement production
- Commit 4d81a1e2 a casse l'affichage devis en remplacant API Qonto par DB locale

## Bugs recurrents

- parseInt NaN : 28 occurrences identifiees, 15 fichiers (stashed)
- Middleware back-office : MIDDLEWARE_INVOCATION_FAILED (7 tentatives, INTERDIT)
- select("\*") sans limit : 55+ occurrences

## Decisions architecturales

- 1 entite = 1 page detail (jamais de doublons entre canaux)
- Sidebar : items parent naviguent + expandent (chevron seul = toggle)
- Fichier > 400 lignes = refactoring obligatoire

## Documentation de reference

- `docs/current/INDEX-BACK-OFFICE-COMPLET.md` — index master
- `docs/current/INDEX-PAGES-BACK-OFFICE.md` — 165 pages
- `docs/current/back-office-entities-index.md` — inventaire entites
- `docs/current/MAPPING-PAGES-TABLES.md` — mapping pages → tables
- `docs/business-rules/06-stocks/` — regles stock detaillees (restaurees)
- `docs/business-rules/07-commandes/` — workflows commandes (restaurees)
- `docs/current/modules/orders-workflow-reference.md` — statuts SO/PO
- `docs/current/modules/stock-module-reference.md` — architecture stock
