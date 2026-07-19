# Audit complet des rapports PDF — 2026-05-27

**Périmètre** : tous les PDFs générés depuis le back-office.
**Méthode** : MCP Playwright en session admin (`veronebyromeo@gmail.com`) + lecture code + cross-check DB.

---

## TL;DR

| Rapport                          | Statut         | Données   | Améliorations               |
| -------------------------------- | -------------- | --------- | --------------------------- |
| Stock — Aging Inventaire         | ✅ Marche      | Réelles   | UX et chart                 |
| Stock — Valorisation             | ✅ Marche      | Réelles   | Filtres temporels manquants |
| Stock — Historique Mouvements    | ⚪ À tester    | À valider | Inconnu                     |
| Stock — Rotation                 | 🟡 Coming soon | —         | —                           |
| Stock — Niveaux                  | 🟡 Coming soon | —         | —                           |
| Stock — Ruptures                 | 🟡 Coming soon | —         | —                           |
| Stock — Performance Fournisseurs | 🟡 Coming soon | —         | —                           |
| Stock — Classification ABC/XYZ   | 🟡 Coming soon | —         | —                           |
| Consultation — Summary           | ⚠️ À ouvrir    | À valider | Header client, branding     |
| Consultation — Margin Report     | ⚠️ À ouvrir    | À valider | À auditer                   |

**Conclusion fonctionnelle** : aucun rapport « cassé ». Roméo signalait que « les stocks PDF ne fonctionnent pas » — vérifié : ils fonctionnent. La probable cause de sa frustration : **les badges « PDF » sur les cartes du modal `Rapports de Stock` ne sont pas cliquables** (juste des labels visuels). Il faut cliquer toute la carte pour ouvrir la modal de configuration, puis « Générer le rapport », puis « Voir PDF ». UX cachée, 3 niveaux d'imbrication avant d'arriver au PDF.

---

## Stack technique confirmée

- `@react-pdf/renderer` côté client (pas de Puppeteer serveur)
- Trigger DB `generate_product_image_url` génère `public_url` depuis `cloudflare_image_id` (cf. fix BO-IMG-CF-002)
- Templates : `packages/@verone/finance/src/pdf-templates/{Aging,Valorisation,Historique}ReportPdf.tsx` (252/241/236 lignes)
- Hooks data : `use-aging-report.ts`, `use-valorisation-report.ts`
- Templates consultation : `packages/@verone/consultations/src/pdf-templates/{ConsultationSummary,ConsultationMarginReport}Pdf.tsx`

---

## 1. STOCK — Aging Inventaire ✅

**Test live (Vercel prod)** : 186 produits analysés, 81 265 € valeur totale, âge moyen 30j, stock vieilli 0% (cohérent avec les données — dernier mouvement DB il y a 28 jours).

**Rendu PDF** (capture `stocks-aging-pdf-render.png`) :

- Page 1 : header VÉRONE by Roméo + bandeau orange en haut, titre rouge « Rapport Aging Inventaire », date génération, 4 cartes métriques (Produits, Valeur totale, Âge moyen, Stock vieilli), donut chart répartition par tranche, valeur par tranche
- Page 2 : tableau détail produits par tranche

**Améliorations proposées** :

1. **Mention « by Roméo » sous le logo VÉRONE** dans le PDF — pas adapté pour un rapport interne ou destiné à un partenaire. Soit on enlève, soit on remplace par « Back Office » ou la date.
2. **Donut chart pauvre** quand un seul segment couvre 100 % (tout le stock < 30j). Soit on cache le donut dans ce cas (juste tranche dominante en KPI), soit on garde 5 tranches affichées toujours pour la stabilité visuelle, soit on permet à l'utilisateur de choisir la profondeur d'analyse (au-delà des 30 jours par défaut).
3. **Période d'analyse 30 jours par défaut** vs **tranches affichées 0–30 / 31–60 / 61–90 / 91–180 / 180+** : incohérent. Si l'utilisateur choisit 30j de période, les tranches 31+ seront forcément vides. Aligner : période = profondeur max des tranches.
4. **« Stock vieilli » défini comme `> 90j`** dans le PDF, mais l'UI ne le montre nulle part. Rajouter une légende ou tooltip.
5. **Pas de filtre par marque / catégorie / fournisseur** dans la configuration du rapport. Utile pour Vérone (rapport par marque Boêmia/Solar/Flos).

---

## 2. STOCK — Valorisation ✅

**Test live** : Valeur totale (coût revient) 82 057 €, Valeur (prix d'achat HT) 81 265 €, 186 produits, coût moyen 441 €. Répartition par sous-catégorie OK (Suspension 20.7 %, Banc 13.1 %, Table 12.7 %, etc.).

**Améliorations proposées** :

1. **Filtre temporel absent** : le hook `useValorisationReport` ne prend pas de `dateFrom`/`dateTo`. Roméo ne peut pas faire « Valorisation au 31/12/2025 » — c'est toujours un snapshot à `now()`. C'est un manque pour un usage comptable de fin d'exercice.
2. **Pas de répartition par marque** : seulement par sous-catégorie. À ajouter (vu qu'on a `brand_ids` sur produits).
3. **Différence coût revient (82 057) vs prix achat HT (81 265)** : 792 € d'écart. C'est `cost_net_avg` (moyenne pondérée LPP) vs `cost_price`. Le PDF n'explique pas la différence. Ajouter une note de bas de page.

---

## 3. STOCK — Historique Mouvements ⚪

**À tester** — Layout : `HistoriqueReportPdf.tsx` (236 lignes). Hook : pas confirmé. Métriques attendues : Total IN, Total OUT, Total ADJUST, +1.

---

## 4. STOCK — Modal `Rapports de Stock` : UX

**BUG D'INTERACTION CONFIRMÉ** :

- Le modal affiche 8 cartes de rapports avec un badge « PDF » et un libellé « Export » sous chaque
- **Les badges « PDF » ne sont PAS cliquables** (DOM : `<div>`, `onclick: false`, pas de role button)
- C'est la **carte entière** qui doit être cliquée pour ouvrir la modal de configuration
- 3 niveaux : Modal Rapports → Modal Configuration → Vue rapport → Bouton « Voir PDF » → ouverture PDF
- **Très probable que Roméo pensait que ça ne marche pas** — il a cliqué le badge « PDF » sans effet, et n'a pas réalisé que toute la carte est un bouton

**Fix proposé** :

- Soit faire que le badge « PDF » devienne un vrai bouton qui short-cut vers la génération (skip la modal configuration avec defaults)
- Soit ajouter un état visuel hover explicite sur toute la carte avec un message « Cliquer pour ouvrir »
- Soit remplacer « PDF / Export » par un vrai bouton « Générer le PDF » sur chaque carte

---

## 5. CONSULTATION — Summary / Margin ⚠️

**Audit URL direct échoue** : l'ID `c05a3a64-7d89-43a4-9b0f-d1495f4b0802` (Black & White Burger, depuis DB `client_consultations`) renvoie **« Consultation non trouvée »** sur `/consultations/[id]`.

Cause probable : un filtre RLS, un statut, ou une jointure manquante dans le hook côté front. À investiguer.

**Liste consultations OK** : la page `/consultations` affiche bien les 2 consultations (Black & White Burger 10/04, Pokawa 09/03).

**Améliorations proposées** (pré-identifiées par l'exploration code initiale) :

1. **Header PDF manque le client** : nom, email, raison sociale, adresse — pour faire un PDF directement envoyable
2. **Branding Vérone** à harmoniser : couleur or #C9A961 + charbon #1d1d1b + Bodoni Moda 900 titres + Montserrat body (cf. `docs/brand/DESIGN-SYSTEM-VERONE.md`). Actuellement le Aging PDF utilise un orange/rouge qui n'est pas la charte.
3. **Tutoiement strict** dans tous les textes du PDF (cf. brand foundation)
4. **Numérotation des consultations** : afficher un identifiant lisible (C-2026-001) plutôt que l'UUID

---

## 6. SOURCING — PDF inexistant

**Confirmé** : aucun rapport PDF côté sourcing aujourd'hui. À créer en **Phase 4** (BO-PDF-SOURCING-001 dans ACTIVE.md).

Recommandations pour le futur rapport :

- Hook `useSourcingReport()` qui agrège : produits en sourcing par statut, fournisseurs candidats avec cotations, prix moyen négocié vs target, délais moyens
- Template `SourcingReportPdf.tsx` dans `packages/@verone/products/src/pdf-templates/`
- Bouton déclencheur sur `/produits/sourcing` (toolbar, à côté de « Nouveau Sourcing ») et `/produits/sourcing/produits/[id]` (pour rapport fiche unique)

---

## Recommandations finales

**Priorité 1 (UX bloquant)** :

- Fix UX `StockReportsModal` : rendre les cartes clairement cliquables (CTA visible) ou ajouter un vrai bouton « Générer PDF » par carte.

**Priorité 2 (amélioration qualité)** :

- Header consultation PDF avec infos client complètes
- Branding Vérone homogène sur tous les PDFs (or + charbon + typos)
- Filtre temporel sur Valorisation

**Priorité 3 (nouveau)** :

- Création du rapport PDF sourcing (Phase 4)

**Priorité 4 (audit)** :

- Investiguer pourquoi `/consultations/[id]` renvoie « non trouvée » sur des IDs valides en DB (RLS ? filtre status ?)

---

## Captures

- `.playwright-mcp/screenshots/20260526/stocks-reports-modal-open.png` — modal Rapports de Stock (8 cartes, 4/8 disponibles)
- `.playwright-mcp/screenshots/20260526/stocks-aging-view-1.png` — modal Configuration Aging
- `.playwright-mcp/screenshots/20260526/stocks-aging-after-generate.png` — vue rapport Aging (186 produits, 81 265 €)
- `.playwright-mcp/screenshots/20260526/stocks-aging-pdf-render.png` — PDF Aging dans le viewer Chrome
- `.playwright-mcp/screenshots/20260526/stocks-valorisation-view.png` — vue rapport Valorisation (82 057 €)
- `.playwright-mcp/screenshots/20260526/consultations-list.png` — liste consultations (2 rows)
- `.playwright-mcp/screenshots/20260526/consultation-detail.png` — détail consultation : « non trouvée » (bug d'accès)
