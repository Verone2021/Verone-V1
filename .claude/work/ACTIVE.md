# ACTIVE TASKS

## Regles de gestion ACTIVE.md

- Chaque tache terminee et mergee → SUPPRIMER de ce fichier
- Chaque tache = un Task ID unique format `[APP-DOMAIN-NNN]`
- Workflow standard : `/search` → `/plan` → `/implement` → verify → commit → PR → attendre validation Vercel
- Actions destructrices (force push, merge main, delete branches, migrations DB) = STOP + confirmer
- PR = toujours vers staging, jamais vers main directement

---

# FAIT — En attente de merge

## [SI-AMB-001] Systeme Ambassadeurs Site-Internet — PR #583

**Branche** : `feat/SI-AMB-001-systeme-ambassadeurs`
**PR** : Verone2021/Verone-V1#583
**Status** : Teste et fonctionnel, en attente de merge

## [BO-PROD-001] Simulateur marges consultations + Sourcing multi-vues — PR #602

**Branche** : `feat/BO-PROD-001-sourcing-notebook-audit`
**PR** : Verone2021/Verone-V1#602
**Status** : 3 commits, pousse, en attente de merge vers staging
**Date** : 2026-04-15

**Livraisons :**
- [x] Migration DB : shipping_cost, cost_price_override, is_sample, tva_rate sur consultation_products
- [x] Simulateur marges dans tableau consultation (prix achat, transport, marge, 5 KPIs)
- [x] Edition inline prix achat, transport, echantillon par ligne
- [x] Statut par ligne (accepter/refuser) avec badges colores
- [x] Dialog Commander (choix SO ou PO) avec stock reel affiche
- [x] QuickPurchaseOrderModal pre-rempli (queue multi-produits par fournisseur)
- [x] Rapport marges PDF (KPIs + tableau detaille + analyse)
- [x] PDF client avec TVA (Total HT + TVA + Total TTC)
- [x] Formulaire wizard 3 etapes (Client, Demande, Confirmation) + notes internes
- [x] Layout 2 colonnes page consultation detail
- [x] Sourcing 3 vues (Liste, Kanban, Carte) avec toggle
- [x] Sourcing redesign tableau propre + filtres compacts
- [x] Consultation liste redesign tableau + filtres compacts
- [x] assigned_to resolu (nom utilisateur au lieu UUID)
- [x] 14 designs Stitch generes (reference visuelle)

---

# ROADMAP SITE-INTERNET — Sprints a venir (audit 2026-04-13)

## Sprint SI-SEO-001 : Quick wins SEO + contenu (1 session)
- [ ] Schema.org BreadcrumbList (composant JSON-LD)
- [ ] Alt text images dans l'editeur produit BO
- [ ] Noindex/nofollow toggle par page CMS
- [ ] Preview SERP (Google snippet) dans le modal produit
- [ ] Bouton "Dupliquer" un produit

## Sprint SI-AI-001 : Generation IA fiches produit (1-2 sessions)
- [ ] Migration SQL : short_description, materials, care_instructions, ai_generated_at, ai_generation_model
- [ ] API route /api/ai/generate-description (Claude API Sonnet)
- [ ] Bouton "Generer par IA" dans ProductDescriptionsModal
- [ ] Bulk generation pour les 30 produits sans description
- [ ] ATTENTE : que les produits soient finalises dans le BO

## Sprint SI-CMS-001 : CMS + Branding (1 session)
- [ ] Upload images Supabase Storage (hero, collections, bannieres)
- [ ] Reseaux sociaux editables depuis ConfigurationSection
- [ ] Feature flags UI (wishlist, reviews activables)
- [ ] Refactoring ConfigurationSection (680 lignes → sous-composants)

## Sprint SI-ANALYTICS-001 : Analytics + Export (1 session)
- [ ] Graphique CA 12 mois dans Dashboard (comparaison periode)
- [ ] Top 5 produits par CA et par marge
- [ ] KPI panier moyen + conversion
- [ ] Export CSV commandes/produits/clients
- [ ] Commandes abandonnees visibles dans le BO

## Sprint SI-PROD-001 : Ameliorations produit (1 session)
- [ ] Bulk editing produits (prix, stock, statut en masse)
- [ ] Import CSV produits
- [ ] Cross-sell/upsell configurables dans l'editeur produit
- [ ] Duplication produit
- [ ] Actions en masse (publier/depublier selection)
- [ ] Pagination + tri sur table produits

## Sprint SI-ORDER-001 : Ameliorations commandes (1 session)
- [ ] Remboursement Stripe depuis le BO
- [ ] Filtres avances commandes (statut, date)
- [ ] Notes internes sur commande (timeline)
- [ ] Export CSV commandes site
- [ ] Generation facture PDF

## Sprint SI-CLIENT-001 : Ameliorations clients (1 session)
- [ ] KPIs clients (total, actifs, LTV moyenne, panier moyen)
- [ ] Segmentation (VIP, inactifs, nouveaux)
- [ ] Notes internes client
- [ ] Export CSV clients (RGPD)
- [ ] Pagination + tri

## Sprint SI-AMB-002 : Ameliorations ambassadeurs (1 session)
- [ ] Page detail ambassadeur /ambassadeurs/[id]
- [ ] Workflow paiement primes (marquer comme paye)
- [ ] Vue "attributions en attente de validation"
- [ ] Fix positionnement popover QR code

## Backlog (priorite basse)
- [ ] Redirections 301/302 (table + middleware)
- [ ] SEO par categorie (meta tags par niveau)
- [ ] Editeur WYSIWYG pour pages CMS (remplacement Markdown)
- [ ] Programme fidelite / points
- [ ] Carte cadeau
- [ ] Bundle pricing
- [ ] Pop-ups marketing
- [ ] Templates emails editables depuis le BO
- [ ] Gestion medias centralisee (bibliotheque images)

## Problemes techniques a corriger
- [ ] ConfigurationSection.tsx 680 lignes → refactoriser
- [ ] ReviewsSection inline hooks → deplacer dans hooks/
- [ ] ClientsSection inline hook → deplacer dans hooks/
- [ ] select("*") dans ReviewsSection → colonnes explicites
- [ ] NewsletterSection limit(500) hardcode → pagination

---

# EN COURS

Aucune tache en cours. Prochaine session : choisir un sprint dans la roadmap ci-dessus.

---

# ARCHIVE — Sprint Ambassadeurs (termine, PR #583)

**Branche** : `feat/BO-SI-001-site-internet-sprint1-3`
**Date** : 2026-04-12
**Status** : TERMINE, PR #583 en attente merge

### Contexte (archive)

Verone veut un programme d'ambassadeurs pour le site-internet (B2C). Des personnes physiques recoivent un code promo unique + QR code. Quand un client utilise le code, l'ambassadeur touche une prime promotionnelle (% configurable). C'est le modele iGraal — prime de parrainage, pas de SIRET requis sous 305 EUR/an (art. 92 CGI, tolerance administrative).

**INDEPENDANT de LinkMe.** Domaine 100% site-internet.

### Observations

- Table `order_discounts` (24 cols) existe — systeme promo generique, pas lie a un ambassadeur
- Table `sales_orders` a deja `applied_discount_id`, `applied_discount_code`, `applied_discount_amount`
- API `/api/promo/validate` valide les codes depuis `order_discounts` — a etendre pour detecter les codes ambassadeur
- API `/api/checkout` cree la commande + Stripe session — a etendre pour creer l'attribution ambassadeur
- Le back-office a `/canaux-vente/site-internet/` (1 page produits) — ajouter sous-section ambassadeurs
- Aucune table ambassadeur n'existe en DB
- `user_app_roles.app` enum = `back-office | site-internet | linkme` — le role site-internet existe deja
- `individual_customers` a `source_type` et `source_affiliate_id` — piste de tracking existante

### Implementation Plan

**Approche** : Creer un domaine ambassadeurs autonome dans le site-internet. 3 nouvelles tables DB (site_ambassadors, ambassador_codes, ambassador_attributions). Le staff cree les ambassadeurs dans le back-office. Chaque ambassadeur a un code promo unique qui fonctionne dans le systeme `order_discounts` existant (pas de table promo parallele). L'attribution ambassadeur → commande se fait au webhook Stripe. Le dashboard ambassadeur est une page non-indexee separee du site principal. QR code genere cote client (librairie JS).

**Qualification juridique** : "Prime promotionnelle de parrainage" (PAS "commission"). Termes CGU conformes art. 92 CGI.

**Fichiers a creer** :

- `supabase/migrations/YYYYMMDD_site_ambassadors.sql` — 3 tables + RLS + triggers
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/ambassadeurs/page.tsx` — Liste ambassadeurs BO
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/ambassadeurs/[id]/page.tsx` — Detail ambassadeur BO
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/ambassadeurs/hooks/` — Hooks CRUD
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/ambassadeurs/components/` — Modal creation + QR code
- `apps/site-internet/src/app/ambassadeur/` — Dashboard ambassadeur (page non-indexee, auth requise)
- `apps/site-internet/src/app/ambassadeur/components/` — Stats, CGU modal, QR download
- `apps/site-internet/src/middleware.ts` — Ajouter detection `?ref=CODE` → cookie 30j

**Fichiers a modifier** :

- `apps/site-internet/src/app/api/checkout/route.ts` — Apres creation commande, creer attribution si code ambassadeur
- `apps/site-internet/src/app/api/promo/validate/route.ts` — Ajouter flag `is_ambassador_code` dans la reponse
- `apps/site-internet/src/contexts/CartContext.tsx` — Lire `?ref=CODE` depuis URL/cookie, pre-remplir le code promo
- `apps/site-internet/src/app/robots.ts` — Ajouter `/ambassadeur` au disallow
- `apps/back-office/src/app/(protected)/canaux-vente/page.tsx` — Ajouter stats ambassadeurs dans la card Site Internet
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/` — Ajouter lien navigation ambassadeurs

**Schema DB** :

```sql
-- Table 1 : Ambassadeurs (personnes physiques)
CREATE TABLE site_ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identite
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  -- Auth (lie a un compte site-internet)
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),
  -- Coordonnees bancaires (optionnel, pour palier 2 > 305 EUR/an)
  iban TEXT,
  bic TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  siret TEXT, -- requis si > 305 EUR/an
  -- Configuration
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- % prime sur vente HT
  discount_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- % reduction client
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- CGU
  cgu_accepted_at TIMESTAMPTZ, -- NULL = pas encore accepte
  cgu_version TEXT, -- version des CGU acceptees
  -- Tracking
  total_sales_generated NUMERIC(12,2) DEFAULT 0,
  total_primes_earned NUMERIC(12,2) DEFAULT 0,
  total_primes_paid NUMERIC(12,2) DEFAULT 0,
  current_balance NUMERIC(12,2) DEFAULT 0, -- solde cagnotte disponible
  -- Palier
  annual_earnings_ytd NUMERIC(12,2) DEFAULT 0, -- cumul primes annee en cours
  siret_required BOOLEAN DEFAULT false, -- true si > 305 EUR/an
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2 : Codes promo ambassadeur (1 ambassadeur = 1+ codes)
CREATE TABLE ambassador_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES site_ambassadors(id) ON DELETE CASCADE,
  discount_id UUID NOT NULL REFERENCES order_discounts(id), -- lien vers le systeme promo existant
  code TEXT NOT NULL UNIQUE, -- ex: MARIE10
  qr_code_url TEXT, -- URL encodee dans le QR code
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3 : Attributions vente → ambassadeur
CREATE TABLE ambassador_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES sales_orders(id),
  ambassador_id UUID NOT NULL REFERENCES site_ambassadors(id),
  code_id UUID REFERENCES ambassador_codes(id),
  -- Montants figes au moment de la commande
  order_total_ht NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL, -- taux fige
  prime_amount NUMERIC(12,2) NOT NULL, -- montant prime calcule
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending', -- pending | validated | cancelled | paid
  validation_date TIMESTAMPTZ, -- date prevue validation (commande + 30j)
  validated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  -- Metadata
  attribution_method TEXT NOT NULL DEFAULT 'coupon_code', -- coupon_code | referral_link
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Etapes** :

- [ ] Etape 1 : Migration SQL — creer les 3 tables + enum + RLS (staff full access, ambassadeur voit ses propres donnees) + triggers updated_at + index
- [ ] Etape 2 : Regenerer doc DB (`python3 scripts/generate-docs.py --db`)
- [ ] Etape 3 : Back-office — page liste ambassadeurs (`/canaux-vente/site-internet/ambassadeurs`)
- [ ] Etape 4 : Back-office — modal creation ambassadeur (form + generation auto code promo dans `order_discounts` + `ambassador_codes`)
- [ ] Etape 5 : Back-office — page detail ambassadeur (stats, ventes, primes, QR code telechargeable, edition)
- [ ] Etape 6 : Site-internet — middleware detection `?ref=CODE` → cookie first-party `verone_ref` (30 jours)
- [ ] Etape 7 : Site-internet — CartContext lit le cookie `verone_ref` et pre-remplit le code promo
- [ ] Etape 8 : Site-internet — API checkout : apres creation commande, si code ambassadeur → creer `ambassador_attributions` (status: pending, validation_date: +30j)
- [ ] Etape 9 : Site-internet — page dashboard ambassadeur (`/ambassadeur`) avec auth + modal CGU premiere connexion
- [ ] Etape 10 : Site-internet — composants dashboard (stats, historique ventes, cagnotte, telechargement QR code)
- [ ] Etape 11 : robots.ts — ajouter `/ambassadeur` au disallow
- [ ] Etape 12 : Type-check + build back-office + site-internet
- [ ] Etape 13 : Test E2E Playwright — creer ambassadeur BO → utiliser code sur site → verifier attribution

**Risques identifies** :

- Risque 1 : Le checkout webhook Stripe est critique (cree les commandes). Modification minimale : ajouter un INSERT dans `ambassador_attributions` APRES la creation de commande, pas avant. Si l'insert echoue, la commande est quand meme creee (pas de rollback).
- Risque 2 : Le middleware site-internet est minimaliste (refresh session). Ajouter la detection `?ref=` ne doit PAS impacter la session auth. Cookie separe `verone_ref`, domaine first-party.
- Risque 3 : Le systeme `order_discounts` est utilise pour les promos classiques ET les codes ambassadeur. Distinction via `ambassador_codes.discount_id` (FK). Les promos classiques n'ont pas de ligne dans `ambassador_codes`.

**Criteres de validation** :

- [ ] Staff peut creer un ambassadeur dans le BO avec code promo + QR code
- [ ] Client scanne QR code → arrive sur le site avec code pre-rempli
- [ ] Client utilise code au checkout → commande creee + attribution ambassadeur
- [ ] Ambassadeur se connecte sur `/ambassadeur` → voit ses stats + cagnotte
- [ ] Modal CGU s'affiche a la premiere connexion
- [ ] Attribution en status "pending" pendant 30j
- [ ] Build back-office + site-internet sans erreur
- [ ] Console zero erreur sur toutes les pages touchees

---

# A FAIRE — Taches restantes

## PRIORITE HAUTE — Domaine Finance (audit 2026-04-16)

Regles metier de reference : `.claude/rules/finance.md` (R1 a R7).
Audit cause racine : `docs/scratchpad/audit-arrondi-totaux-2026-04-16.md`.

### [BO-FIN-009] Alignement arrondi DB <-> Qonto + verrouillages devis/facture

**Objectif** : appliquer R1 (zero discordance) + R2/R3/R5/R6 (verrouillages metier).
**Impact** : 134/160 commandes (84%) + 7 proformas actuelles touchees par le bug d'arrondi.
**Risque** : eleve — backfill `tva_amount` peut impacter exports TVA historiques.

**Prerequis OBLIGATOIRE** : audit consommateurs `tva_amount` dans `docs/scratchpad/audit-consommateurs-tva-amount.md`. Identifier :
- Rapports TVA qui lisent `tva_amount`
- Exports comptables, dashboards finance
- Vues SQL dependant de `tva_amount`
Sans cet audit, Phase 1 interdite.

**6 phases, ordre strict** :
- [ ] Phase 1 (prio absolue) : round-per-line strict dans trigger DB `recalc_sales_order_on_charges_change` + code applicatif (route from-order + service). Recalcul correct de `total_ht` (items + frais) et `tva_amount` (vraie TVA).
- [ ] Phase 3 (prio apres P1) : verrouillage par statut commande (R6). Exempts : `notes`, `expected_delivery_date`, champs tracking (packlink, shipping_*), contacts (billing/delivery/responsable).
- [ ] Phase 2 : readonly prix items dans modals devis/facture lies (R2). `QuoteItemsTable.tsx`, `InvoiceItemsSection.tsx`. Exception : `customLines` restent editables.
- [ ] Phase 5 : route POST `/api/qonto/quotes` refuse `standalone` sauf `kind='service'` (R5). Ajout flag explicite dans le body.
- [ ] Phase 4 : modal regeneration (R3). Si commande a 1 devis + 1 facture draft -> regenerer LES DEUX en cascade.
- [ ] Phase 6 : badge alerte discordance — peut etre fait en parallele via BO-FIN-011 (filet de securite).

### [BO-FIN-010] Badges differenciation devis/facture : Commande vs Service

**Objectif** : distinguer visuellement les documents lies a une commande (`sales_order_id NOT NULL`) des documents libres / service (`sales_order_id IS NULL`).

**Implementation** (1h effort, pas de modif DB/API) :
- [ ] Creer `packages/@verone/finance/src/components/DocumentSourceBadge.tsx` (1 prop `sales_order_id: string | null`)
- [ ] Badge "Commande" bleu (`bg-blue-100 text-blue-700`, icone `ShoppingBag`)
- [ ] Badge "Service" ambre (`bg-amber-100 text-amber-700`, icone `Briefcase`)
- [ ] Integration 4 emplacements :
  - `apps/back-office/src/app/(protected)/factures/components/DevisTab.tsx`
  - `apps/back-office/src/app/(protected)/factures/components/InvoicesTable.tsx`
  - `apps/back-office/src/app/(protected)/factures/devis/[id]/DevisContent.tsx`
  - `apps/back-office/src/app/(protected)/factures/[id]/DocumentDetailHeader.tsx`
- [ ] Screenshots Playwright avant/apres + type-check

**Independant de BO-FIN-009**. Feature branch dediee `feat/BO-FIN-010-badges`.

### [BO-FIN-011] Badge alerte discordance total local vs Qonto

**Objectif** : filet de securite visuel en attendant Phase 1 de BO-FIN-009.

**Implementation** :
- [ ] Pastille orange `⚠ ecart X cents` si `|total_ttc_local - total_ttc_qonto| > 0.01`
- [ ] Enrichir le fetch factures pour ramener `total_ttc` Qonto en parallele
- [ ] Afficher dans `InvoicesTable.tsx` et `SalesOrderTableRow.tsx`

**Peut etre implemente AVANT BO-FIN-009** (standalone). Si BO-FIN-009 Phase 1 est deployee correctement, ce badge ne se declenchera plus (nominal zero ecart).

---

## PRIORITE URGENTE — Issues detectees post-BO-FIN-009 Phase 1 (audit 2026-04-18)

Regle cible : `.claude/rules/finance.md` R1 (zero discordance DB <-> Qonto).

### [BO-FIN-017] Regenerer proforma F-2026-017-PROFORMA corrompue — RESOLU (2026-04-17)

**Resolution** : proforma soft-deleted par Romeo le 2026-04-17 20:24 UTC.
`SELECT deleted_at FROM financial_documents WHERE document_number = 'F-2026-017-PROFORMA'` : `2026-04-17 20:24:15.218+00` ✓

Contexte historique (conserve pour trace) : la proforma `F-2026-017-PROFORMA` (id `18627a85`) liee a SO-2026-00124 avait 0 items locaux pour un total de 283.92 EUR alors que la SO avait 12 items pour 3639.40 EUR. Enregistrement corrompu pre-BO-FIN-014.

**Statut** : dossier clos. Aucun suivi Qonto necessaire (proforma non finalisee, status draft, soft-deleted propre).

### [BO-FIN-018] Fix formule avgVat multi-taux dans saveQuoteToLocalDb

**Contexte** : audit tva_amount a identifie `apps/back-office/src/app/api/qonto/quotes/route.context.ts` fonction `saveQuoteToLocalDb` (lignes 281-354) avec formule `avgVat = sum(vatRate) / items.length` puis `tva = totalHt * avgVat`. Sans ROUND.

**Probleme** : sur panier mixte (ex: item 5.5% + item 20%), la moyenne des taux ne correspond PAS a la TVA reelle ponderee. Viole potentiellement la contrainte `check_totals_coherent` DB (`abs(total_ttc - (total_ht + tva_amount)) < 0.01`).

**Action** :
- [ ] Reecrire le calcul : somme par ligne des `ROUND(line_ht * vatRate, 2)` puis SUM.
- [ ] Migration test : verifier qu'aucun devis en DB ne viole actuellement la contrainte.
- [ ] Backfill devis drafts si delta detecte.

**Priorite** : MOYENNE (bug latent, pas encore declenche en production avec paniers multi-taux).

### [BO-FIN-019] Fix reference tva_amount dans fonction DB create_purchase_order — RESOLU (2026-04-18)

**Resolution** : fonction droppee via migration `20260425_bo_fin_019_drop_create_purchase_order.sql`.

**Verifications pre-drop** :
- `pg_stat_user_functions WHERE funcname = 'create_purchase_order'` : aucune entree (0 calls)
- Grep applicatif apps/ + packages/ : **0 reference** (hors types auto-generes supabase.ts)
- 24 PO creees sur 90 derniers jours via d'autres chemins (UI directe) — la fonction n'etait pas le chemin actif

Dead code confirme, drop applique. La colonne `purchase_orders.tva_amount` n'existant pas, toute invocation aurait declenche une erreur SQL.

**Statut** : dossier clos.

### [BO-FIN-020] Documenter procedure rollback Phase 1

**Contexte** : la migration `20260423_bo_fin_009_phase1_round_per_line.sql` a modifie 18 SO de maniere irreversible (le backfill UPDATE ne peut pas etre rollback automatiquement). Le rollback fonctionnel necessite :
1. `CREATE OR REPLACE FUNCTION` avec ancienne formule round-per-total.
2. `UPDATE sales_orders SET total_ttc = ancien_total` — mais les anciens totaux ne sont plus en DB.

**Action** :
- [ ] Ajouter dans `docs/current/database/triggers-finance-reference.md` (ou creer) une section "Rollback BO-FIN-009 Phase 1".
- [ ] Documenter qu'aucun rollback automatique n'est possible sur les 18 SO backfillees.
- [ ] Preciser que l'impact est minimal (delta -0.01 a +0.02 EUR max 2 centimes).
- [ ] Option : snapshot des 18 anciens totaux dans un fichier scratchpad historique.

**Priorite** : BASSE (documentation, pas de bug actif).

---

## SPRINT BO-ORG — Corrections formulaires organisation (9 avril 2026)

### Contexte

Audit approfondi du 9 avril 2026 — les corrections BO-GOV-001 du 8 avril ont ete PARTIELLEMENT faites :
- CustomerOrganisationFormModal cree et exporte — OK
- Gouvernance CLAUDE.md ajoutee — OK
- Package @verone/orders CustomerSection migre — OK
- apps/linkme organisations page migree — OK
- MAIS : la page commandes LinkMe utilise encore le modal LOCAL obsolete
- MAIS : page enseigne detail n'a aucun bouton pour CREER une organisation
- MAIS : SupplierFormModal et PartnerFormModal ne persistent pas billing/shipping addresses

---

### [BO-ORG-006] GenericOrganisationFormModal — FAIT (2026-04-09)
### [BO-ORG-002] Migration page commandes LinkMe vers CreateLinkMeOrderModal package — FAIT (2026-04-09)
### [BO-ORG-003] Bouton "Creer une organisation" page enseigne detail — FAIT (2026-04-09)
### [BO-ORG-004] SupplierFormModal — persistence billing/shipping/GPS/siren — FAIT (2026-04-09)
### [BO-ORG-005] PartnerFormModal — meme correction que Supplier — FAIT (2026-04-09)

---

### TACHE 5 : Audit complet des autres formulaires dupliques (segment par segment)
**Task ID** : `[BO-AUDIT-001]`
**Priorite** : BASSE (reporter apres les 4 taches critiques)
**Objectif** : Identifier TOUS les autres doublons dans le repository, segment par segment.

**Segments a auditer :**
- [ ] Formulaires Produit : combien de wizards/modals de creation produit ? Lesquels sont des doublons ?
- [ ] Formulaires Contact : combien de formulaires pour creer un contact ? Source de verite unique ?
- [ ] Formulaires Commande : combien de modals de creation commande ? Sont-ils bien separes par canal ?
- [ ] Formulaires Finance : factures, devis — doublons entre Qonto et local ?
- [ ] Formulaires Adresse : combien de composants AddressAutocomplete ? Sont-ils unifies ?
- [ ] Formulaires Client Particulier : le `CreateIndividualCustomerModal` est-il le seul ?

**Livrable** : Rapport detaille dans `docs/current/AUDIT-FORMULAIRES-DOUBLONS.md` avec pour chaque segment : composants existants, lequel garder, lesquels supprimer, plan de migration.

---

### [BO-GOV-001] Gouvernance anti-duplication — FAIT (2026-04-08)
### [BO-FIN-004] Bouton "Lier a une commande" proformas orphelines — FAIT (2026-04-08)
### [BO-FIN-005] Pre-validation finalisation (bloquer sans commande) — FAIT (2026-04-08)
### [BO-FIN-006] Fix champs editables page edit facture — FAIT (2026-04-08)
### [BO-FIN-007] Conditions de paiement select + "Pre-payment requis" — FAIT (2026-04-08)
### [BO-FIN-008] Modal confirmation "Valider" commande — FAIT (2026-04-08)

---

## PRIORITE MOYENNE

### TASK BO-RAPPROCHEMENT-001 : Indicateur "non rapprochee" factures fournisseurs

**Constat** : Aucune facture fournisseur en DB (0 supplier_invoice dans financial_documents). Tache PREMATUREE — a reactiver quand les factures fournisseurs seront creees.
**Action** : Reporter a une session ulterieure.


---

## PRIORITE BASSE

### TASK BO-ANALYTICS-001 : Page Analytique Commandes

**Constat** : Pas de page analytics commandes. Seulement les tables basiques.
**Action** : A definir avec Romeo.

---

## FUTURS (sessions dediees)

### PLAN 4 : Module Compta Avance — Nettoyage dette paiements

**Audit 2026-04-09** : Les 3 mecanismes (manuel, Qonto, e-commerce) fonctionnent.
L'unification est DEJA faite via `recalculate_order_paid_amount()` (SUM order_payments + transaction_document_links).
Pas besoin de nouvelle table.

**Phase 1 (FAIT 2026-04-09)** : Drop ancienne `mark_payment_received(3 args)` + retrait double-ecritures legacy + nettoyage types.
**Phase 2 (FAIT 2026-04-16)** : Drop 10 colonnes `manual_payment_*` (5 SO + 5 PO), 3 triggers, 3 fonctions obsoletes, rewrite 5 fonctions actives, migration 8 avoirs orphelins. ENUM conserve pour `order_payments`.
**Phase 3 (FAIT 2026-04-16)** : Vue SQL `v_all_payments` creee (UNION order_payments + transaction_document_links). 126 paiements visibles. GRANT authenticated.
