# Database Architect — Memoire Persistante

## Architecture DB Verone

- 78+ tables, 158+ triggers, 239+ RLS policies, 180+ migrations
- 1 SEULE base Supabase (dev = preview = production) — decision non-negociable
- Helper functions RLS : `is_backoffice_user()`, `is_back_office_admin()` (SECURITY DEFINER)
- Migrations : TOUJOURS psql avec $DATABASE_URL, JAMAIS Dashboard Supabase
- Types generes dans `packages/@verone/types/src/supabase.ts`

## Tables critiques par domaine

- **Auth** : user_app_roles (app + role + enseigne_id/organisation_id), user_profiles
- **Catalogue** : products (TABLE CENTRALE — jamais dupliquer dans tables canal), categories, product_images, product_variants, families
- **Stock** : stock_movements (affects_forecast, quantity_change NEGATIF pour sorties), stock_alert_tracking
- **Ventes** : sales_orders, sales_order_items, sales_shipments, sales_shipment_items
- **Achats** : purchase_orders, purchase_order_items, purchase_order_receptions
- **Finance** : financial_documents (Qonto STI), invoices (legacy Abby — 23 lignes), bank_transactions, transaction_document_links
- **LinkMe** : linkme_affiliates, linkme_selections, linkme_selection_items, linkme_commissions, channel_pricing

## Triggers critiques (ne JAMAIS modifier sans audit complet)

- Stock : 12 triggers interdependants (stock_real, stock_forecasted_in/out, alertes)
- Commandes : recalculate_sales_order_totals + trg_update_affiliate_totals (DOUBLON — 2 UPDATE par ligne)
- Produits : 14 triggers sur table products — risque cascade
- Notifications : 13 triggers actifs (5 ventes + 5 achats + 3 expeditions)

## Bugs DB connus

- Double UPDATE sales_orders par sales_order_items : 2 triggers font le meme calcul → fusionner
- user_app_roles : 67M seq_scan (99.6%) — RLS policy force seq_scan malgre 10 index
- user_profiles : 32M seq_scan (100%) — auth.uid() non wrappe dans policy
- RPC get_activity_stats : timeout sur audit_logs (89k lignes, JSONB sans index)

## Regles stock (source de verite)

- stock_real : modifie UNIQUEMENT sur reception/expedition physique
- stock_forecasted : modifie sur confirmation/reception commande
- stock_previsionnel = stock_real - forecasted_out + forecasted_in
- Alertes 3 etats : ROUGE (bas/rupture), VERT (PO valide), DISPARU (recu/expedie)
- Priorite alertes : stock_ratio 0% = P3, <30% = P2, <70% = P1
- Backorders autorises (stock negatif = unites en attente reapprovisionnement)

## Regles commandes

- Annulation SO : INTERDITE si payee, devalidation obligatoire avant (workflow 2 etapes)
- Annulation SO : BLOQUEE si livree
- Annulation draft : pas d'impact stock
- PO workflow : draft (alerte rouge) → valide (vert, stock_forecasted_in) → recu (stock_real)
- Reception partielle : algo differentiel (quantite recue vs attendue)

## Qonto (INTERDIT de modifier)

- autoFinalize: false TOUJOURS (incident 7 jan 2026 : facture 0.2% TVA irreversible)
- financial_documents = factures uniquement, devis = API Qonto (source primaire)
- JAMAIS finaliser via code — uniquement par UI utilisateur

## RLS patterns obligatoires

- Staff back-office : `is_backoffice_user()` pour acces complet
- LinkMe affilies : isolation enseigne_id XOR organisation_id
- Site-internet : lecture anonyme selections publiees
- auth.uid() TOUJOURS wrappe dans (SELECT auth.uid()) pour performance
- SECURITY DEFINER + SET row_security = off sur fonctions helper

## Fonctions helper existantes

- get_user_role(), get_user_organisation_id(), has_scope(), update_updated_at()
- is_backoffice_user(), is_back_office_admin()
- calculate_retrocession (attention bug branche affilie : divise taux deja decimal par 100)

## Documentation de reference

- `docs/current/database/database.md` — schema global
- `docs/current/database/triggers-stock-reference.md` — 48 triggers documentes
- `docs/business-rules/06-stocks/` — regles metier stock (restaurees)
- `docs/business-rules/07-commandes/` — workflows commandes (restaurees)
- `docs/current/serena/database-implementation.md` — architecture 78 tables
- `docs/current/serena/stock-orders-logic.md` — logique stock/commandes
