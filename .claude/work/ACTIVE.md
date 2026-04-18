# ACTIVE TASKS

## Regles de gestion ACTIVE.md

- Chaque tache terminee et mergee → SUPPRIMER de ce fichier
- Chaque tache = un Task ID unique format `[APP-DOMAIN-NNN]`
- Workflow standard : `/search` → `/plan` → `/implement` → verify → commit → PR → attendre validation Vercel
- Actions destructrices (force push, merge main, delete branches, migrations DB) = STOP + confirmer
- PR = toujours vers staging, jamais vers main directement

---

# ⭐ PRIORITE IMMEDIATE — Sprints Responsive (2026-04-18)

**Infrastructure responsive posee manuellement par Romeo la nuit du 18/04.**
Voir `docs/current/RESPONSIVE-SETUP-RECAP.md` pour la liste complete.

### [BO-UI-RESP-001] Infrastructure responsive + validation build

**Priorite** : URGENT (premier sprint a faire)
**Status** : infrastructure creee en local, a committer + tester + merger
**Branche** : a creer `feat/BO-UI-RESP-001-infrastructure`

**Fichiers ajoutes** :
- `CLAUDE.md` (racine) + section STANDARDS RESPONSIVE
- `.claude/rules/responsive.md`
- `apps/back-office/CLAUDE.md` (nouveau)
- `apps/linkme/CLAUDE.md` (nouveau)
- `apps/site-internet/CLAUDE.md` (nouveau)
- `docs/current/GUIDE-RESPONSIVE.md`
- `docs/current/RESPONSIVE-SETUP-RECAP.md`
- `.claude/templates/sprint-responsive-template.md`
- `.claude/scripts/check-responsive-violations.sh`
- `.claude/agents/reviewer-agent.md` (mis a jour, Axe 4)
- `.claude/agents/dev-agent.md` (mis a jour)
- `packages/@verone/hooks/src/use-breakpoint.ts` (hook)
- `packages/@verone/hooks/src/index.ts` (exports)
- `packages/@verone/ui/src/components/ui/responsive-action-menu.tsx`
- `packages/@verone/ui/src/components/ui/responsive-data-view.tsx`
- `packages/@verone/ui/src/components/ui/responsive-toolbar.tsx`
- `packages/@verone/ui/src/components/ui/index.ts` (exports)
- `tests/fixtures/responsive.ts`

**Actions agent** :
- [ ] `pnpm install` (si besoin)
- [ ] `pnpm --filter @verone/hooks build` PASS
- [ ] `pnpm --filter @verone/ui build` PASS
- [ ] `pnpm --filter @verone/back-office type-check` PASS
- [ ] `pnpm --filter @verone/linkme type-check` PASS
- [ ] `pnpm --filter @verone/site-internet type-check` PASS
- [ ] `chmod +x .claude/scripts/check-responsive-violations.sh`
- [ ] Commit + PR staging + merge squash
- [ ] ZERO modification de page existante dans ce sprint

### [BO-UI-RESP-002] Audit global responsive des 3 apps

**Priorite** : HAUTE (apres merge de 001)
**Status** : a planifier

**Mission** : audit exhaustif des 147+ pages (back-office) + LinkMe + site-internet.

**Livrable** : `docs/scratchpad/audit-responsive-global-2026-04-19.md` avec :
- Classification de chaque page par pattern (A/B/C/D/E/F)
- Colonnes a masquer par breakpoint
- Actions a mettre en dropdown
- Effort estime (S/M/L)
- Priorite (1-3)
- Plan de decoupage en sprints 003-009

**INTERDICTIONS** : zero code modifie. Audit + plan uniquement.

### [BO-UI-RESP-003] a [BO-UI-RESP-009] Migration progressive

Sprints de migration par pattern, 1 sprint = 1 PR = 5-15 pages similaires.

**Planning prevu apres audit** :
- 003 : Pattern A pages critiques (factures, commandes, stocks)
- 004 : Pattern A pages secondaires
- 005 : Pattern B (listes + filtres)
- 006 : Pattern C (pages detail)
- 007 : Pattern D (dashboards)
- 008 : Pattern E + F (modals + forms)
- 009 : Couverture LinkMe + site-internet

Chaque sprint :
- Copie `.claude/templates/sprint-responsive-template.md`
- Applique les 3 composants standards (ResponsiveDataView, ResponsiveActionMenu, ResponsiveToolbar)
- Tests Playwright 5 tailles obligatoires
- Screenshots joints en PR
- Reviewer-agent verifie les 5 techniques (Axe 4)

Estimation totale : 8-10 jours de travail pour migration complete.

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

**Discussion 1** : Finance (close apres rollback BO-UI-001 + PR #645/#646)
**Discussion 2** : Rollback responsive (en cours, PR staging merge)
**Discussion 3** : Audit devis commande (en attente decisions Romeo)

Prochaine session prioritaire : **[BO-UI-RESP-001]** infrastructure responsive.

---

# A FAIRE — Taches finance restantes (non bloquantes)

## [BO-FIN-018] Fix formule avgVat multi-taux dans saveQuoteToLocalDb

**Contexte** : `apps/back-office/src/app/api/qonto/quotes/route.context.ts` fonction `saveQuoteToLocalDb` (lignes 281-354) avec formule `avgVat = sum(vatRate) / items.length` puis `tva = totalHt * avgVat`. Sans ROUND.

**Action** :
- [ ] Reecrire le calcul : somme par ligne des `ROUND(line_ht * vatRate, 2)` puis SUM.
- [ ] Migration test : verifier qu'aucun devis en DB ne viole actuellement la contrainte.
- [ ] Backfill devis drafts si delta detecte.

**Priorite** : MOYENNE (bug latent, pas encore declenche en production avec paniers multi-taux).

## [BO-FIN-020] Documenter procedure rollback Phase 1

**Priorite** : BASSE (documentation, pas de bug actif).
- [ ] Ajouter dans `docs/current/database/triggers-finance-reference.md` une section "Rollback BO-FIN-009 Phase 1"
- [ ] Documenter qu'aucun rollback automatique n'est possible sur les 18 SO backfillees
- [ ] Preciser que l'impact est minimal (delta -0.01 a +0.02 EUR max)

---

## BO-FIN-017 — RESOLU (2026-04-17)

Proforma F-2026-017-PROFORMA soft-deleted par Romeo le 2026-04-17 20:24 UTC.

## BO-FIN-019 — RESOLU (2026-04-18 PR #644)

Fonction `create_purchase_order` droppee via migration (dead code confirme).

## BO-FIN-021 — REMPLACE par BO-FIN-022 (PR #643)

Alignement 4 financial_documents -> 19/19 delta 0 EUR confirme.

## Regression "client depuis une commande" — A INVESTIGUER

**Contexte** : quand on genere un devis ou facture DEPUIS UNE COMMANDE, on ne recupere plus le nom organisation, ni adresse facturation, ni adresse livraison. C'etait corrige il y a quelques jours, un commit recent l'a ecrase.

**Audit git identifie** : commit `4f060e570 [BO-PROD-001] refactor QuoteCreateFromOrderModal 1007->376 lignes` (2026-04-14).

**Action** : audit git complet, identifier le diff exact qui a disparu, proposer fix.

**Priorite** : HAUTE (bug bloquant pour generation devis/factures depuis commandes).

---

## Regles sprint devis commande — EN ATTENTE decisions Romeo

Besoins exprimes :
1. Selectionner une organisation DIFFERENTE pour la livraison (orga sans SIRET OK)
2. Adresse facturation auto-remplie avec maison mere (SIRET)
3. Ajouter champ commentaire libre sur le devis

Audit : `docs/scratchpad/audit-devis-commande-2026-04-18.md`

Status : 6 decisions produit en attente de validation par Romeo.

---

# SPRINT BO-ORG — Corrections formulaires organisation (archive)

## [BO-ORG-006] GenericOrganisationFormModal — FAIT (2026-04-09)
## [BO-ORG-002] Migration page commandes LinkMe — FAIT (2026-04-09)
## [BO-ORG-003] Bouton "Creer une organisation" enseigne detail — FAIT (2026-04-09)
## [BO-ORG-004] SupplierFormModal — persistence billing/shipping — FAIT (2026-04-09)
## [BO-ORG-005] PartnerFormModal — FAIT (2026-04-09)

## [BO-AUDIT-001] Audit formulaires dupliques — PRIORITE BASSE

**Livrable** : `docs/current/AUDIT-FORMULAIRES-DOUBLONS.md`

Segments :
- [ ] Formulaires Produit
- [ ] Formulaires Contact
- [ ] Formulaires Commande
- [ ] Formulaires Finance (doublons Qonto/local)
- [ ] Formulaires Adresse (AddressAutocomplete)
- [ ] Formulaires Client Particulier

---

## Backlog priorite MOYENNE / BASSE

### BO-RAPPROCHEMENT-001
Indicateur "non rapprochee" factures fournisseurs. **PREMATURE** (0 supplier_invoice en DB). Reporter.

### BO-ANALYTICS-001
Page Analytique Commandes. A definir avec Romeo.

### BO-ORD-003
UX formulaire commande client — prix achat / revient / min vente. Voir archive session 17 avril.

---

## FUTURS (sessions dediees)

### PLAN 4 : Module Compta Avance

**Phase 1 (FAIT 2026-04-09)** : Drop ancienne `mark_payment_received(3 args)`.
**Phase 2 (FAIT 2026-04-16)** : Drop 10 colonnes `manual_payment_*` + 3 triggers.
**Phase 3 (FAIT 2026-04-16)** : Vue SQL `v_all_payments` creee.

---

# ARCHIVE (sprints cloturees)

Voir `.claude/work/ARCHIVE.md` pour l'historique complet (deplace pour alleger ACTIVE.md).

Sprints mergees :
- Session 17 avril : 11 PRs STOCK + SHIPMENT (#621-#631)
- Session nocturne 18 avril : 4 PRs STOCK + FIN (#632-#635)
- Session finance 18 avril : 7 PRs (#637-#644)
- Revert BO-UI-001 : PR #645 + #646
