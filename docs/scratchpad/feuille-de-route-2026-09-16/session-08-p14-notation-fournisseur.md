# Session 08 — P14 : notation fournisseur par événement (4 critères sur 5)

Accord base (« OK P14 »). Une PR. Décision Roméo 13/09 : grilles simples, 3-4 critères, pas plus. Distinct de la grille
produit P4b (en production).

```
[PRÉAMBULE V1→V9 du README]

═══ LECTURE ═══
  ~/Documents/Workspace/verone/_outputs/verone/audit-back-office-2026-09-11/2026-09-11-complement-consultations-frais-notation-sync-win.md, § 2
  docs/scratchpad/audit-2026-09-12/AUDIT-SOURCING-2026-09-12.md, Q4 (sources pro 2026)
  packages/@verone/organisations/src/components/sections/PerformanceEditSection.tsx (note manuelle actuelle)
  tables purchase_orders, purchase_order_receptions, consultation_products (lecture)

═══ MODÈLE ═══
supplier_evaluations (id, supplier_id FK organisations NOT NULL, product_id FK products NULL,
  source_type text NOT NULL CHECK IN ('reception','consultation','sample','manual'), source_id uuid NULL,
  score_quality smallint CHECK 1..5, score_delay smallint CHECK 1..5 (CALCULÉ : ≤ 0 j de retard = 5, 1-3 = 4, 4-7 = 3,
  8-14 = 2, > 14 = 1, depuis purchase_orders.expected_delivery_date vs purchase_order_receptions.received_at — vérifier
  les noms réels de colonnes), score_communication smallint CHECK 1..5, score_pricing smallint CHECK 1..5,
  comment text (obligatoire si une note ≤ 2, contrôlé à l'écran et par CHECK), evaluated_by DEFAULT auth.uid(),
  evaluated_at DEFAULT now(), UNIQUE (source_type, source_id, product_id))
  -- RLS is_backoffice_user() TO authenticated ; aucun droit anon
VIEW supplier_scores (security_invoker) : par fournisseur, 12 mois glissants : moyenne simple des critères notés,
  nombre d'évaluations, moyenne par critère, dernière date.
organisations.rating → colonne CALCULÉE (miroir de supplier_scores, rafraîchie par la RPC d'évaluation) ;
supplier_reliability_score déprécié (commentaire), preferred_supplier reste manuel.

═══ AUTOMATISME ═══
Créées par la RPC métier dans la même transaction, jamais par trigger : à chaque réception de commande fournisseur
(`reception`, délai calculé, autres NULL, « à compléter ») ; à chaque option de consultation passée `approved`
(`consultation`, pré-remplie prix = 3) ; à chaque évaluation d'échantillon P4b (`sample`, qualité = moyenne des 3
critères produit). Pastille « à compléter » : dérivée, sans polling.

═══ ÉCRANS ═══
Fiche fournisseur : bloc « Évaluations » (score, tendance 12 mois, liste, formulaire 4 étoiles + commentaire) ; score
affiché dans le sélecteur de fournisseur en sourcing et en consultation. Responsive, < 400 lignes.
Preuves : essai annulé (RLS, anon refusé, CHECK), test unitaire du délai calculé, Playwright sur le fournisseur Opjet
(lecture) et un fournisseur de test désigné par Roméo pour l'écriture. Compte rendu, ACTIVE.md.
```
