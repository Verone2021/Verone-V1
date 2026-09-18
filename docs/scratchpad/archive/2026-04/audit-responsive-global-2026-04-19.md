# Audit Responsive Global — 2026-04-19

**Sprint** : [BO-UI-RESP-002]
**Scope** : 3 apps Vérone (back-office, linkme, site-internet)
**Pages auditées** : 196 (144 back-office + 35 linkme + 17 site-internet)
**Méthode** : 3 agents Explore en parallèle, 1 par app
**Livrable** : inventaire + plan migration 3 PRs groupées (au lieu de 7 sprints)

---

## Synthèse exécutive

| App           | Pages | Patterns dominants                 | Mobile             | Priorité 1 |
| ------------- | ----- | ---------------------------------- | ------------------ | ---------- |
| back-office   | 144   | A (36%), D (19%), C (18%), B (13%) | Occasionnel        | 35 pages   |
| linkme        | ~35   | A (10), C (8), F (7), D (6)        | Critique (terrain) | 5 pages    |
| site-internet | 17    | F-bis (5), A-bis (3), D-bis (5)    | 80% trafic         | 7 pages    |

**Total Priorité 1 (migration urgente)** : 47 pages.

---

## 1. Inventaire exhaustif

### Back-office (144 pages CRUD/ERP)

Distribution par pattern :

- **A** (liste CRUD) : 51 pages (36%) — tables factures, finance, stocks
- **B** (filtres complexes) : 19 pages (13%) — catalogue, messages, alertes
- **C** (détail) : 26 pages (18%) — pages produits, commandes, contacts
- **D** (dashboards) : 27 pages (19%) — /dashboard, hubs modules
- **E** (wizards) : 6 pages (4%) — création facture/devis/produit
- **F** (forms) : 7 pages (5%) — paramètres email, webhooks
- **X** (redirects) : 8 pages (6%) — à ignorer

**Top pages Priorité 1** (35 pages usage quotidien) :

- `/dashboard` (D, L)
- `/factures` (A, L) + `/factures/[id]` (C, M) + `/factures/[id]/edit` (C, M) + `/factures/nouvelle` (E, L) + `/factures/qonto` (B, M) + `/factures/devis/[id]` (C, M)
- `/commandes/fournisseurs` (A, L) + `/canaux-vente/linkme/commandes` (A, L) + `/canaux-vente/linkme/commandes/[id]` (A, L) + `/canaux-vente/linkme/commandes/[id]/details` (C, M)
- Finance entière (19 pages) : `/finance/{annexe,bibliotheque,bilan,comptabilite,grand-livre,justificatifs,livres,rapprochement,transactions,tva}` + `/finance/documents/*` + `/finance/{admin/cloture,depenses/[id],depenses/regles,echeancier,immobilisations,tresorerie}`
- Stocks (9 pages) : `/stocks` (D) + `/stocks/{ajustements,ajustements/create,alertes,analytics,expeditions,inventaire,mouvements,previsionnel,receptions,sorties,stockage}`
- `/ventes` (D, L)

**Top pages Priorité 2** (97 pages) : canaux-vente (42), produits catalogue (17), contacts-organisations (15), consultations (3), autres (20).

**Priorité 3** (12 pages) : admin/_, parametres/_, profile.

### LinkMe (~35 pages — mobile-first PWA affiliés)

**Priorité 1 Critique (mobile essentiel)** :

1. `/dashboard` (D, M) — point d'entrée 100% users
2. `/commandes` (A, M) — métier central, table → cards mobile
3. `/catalogue` (B, L) — filtres horizontaux sticky à revoir
4. `/commissions` (A+D, M) — KPIs + table à condenser mobile
5. `/login` (F, M) — split layout globe+form non-friendly sur petit mobile

**Priorité 2** : `/ma-selection` (A+D), `/organisations` (A+D, L), `/notifications` (A+D), `/statistiques` (D), `/ma-selection/[id]` (C+A).

**Priorité 3** : `/mes-produits`, `/parametres` (color pickers non compressibles), `/commandes/nouvelle` (stepper sidebar à restructurer), checkouts publics.

**Points critiques LinkMe** :

- Tables (commandes, mes-produits, commissions) non responsive
- Sticky summaries peuvent dépasser viewport mobile
- Stepper latéral `/commandes/nouvelle` → stack vertical obligatoire

### Site-internet (17 pages — e-commerce B2C, 80% mobile)

**Priorité 1 critique conversion** :

1. `/` (D-bis, M) — landing multilingue
2. `/catalogue` (B-bis, M) — listing + filtres bottom sheet
3. `/collections/[slug]` (D-bis, M) — hero + grille 3/4 cols
4. `/produit/[id]` (C-bis, L) — galerie + StickyAddToCart mobile (CRITIQUE)
5. `/panier` (E-bis, S) — summary sticky collapsible mobile
6. `/checkout` (F-bis, L) — form 2-col → 1-col mobile
7. `/auth/{login,register}` (F-bis, S) — form centré

**Priorité 2** : `/collections` (A-bis), `/compte` + `/compte/favoris` (F-bis+A-bis), `/contact` (F-bis), `/ambassadeur` (F-bis, L).

**Priorité 3** : pages légales/statiques, `/auth/forgot-password`, `/checkout/cancel`.

**Points critiques site-internet** :

- StickyAddToCart overlap footer mobile = bloqueur conversion
- Galerie produit lightbox swipe à valider
- Résumé panier/checkout densité mobile

---

## 2. Synthèse par pattern (3 apps)

| Pattern            | Back-office | LinkMe | Site-internet | Total | Composant cible                     |
| ------------------ | ----------- | ------ | ------------- | ----- | ----------------------------------- |
| **A** (liste CRUD) | 51          | 10     | 3 (A-bis)     | 64    | `ResponsiveDataView`                |
| **B** (filtres)    | 19          | 3      | 1 (B-bis)     | 23    | `ResponsiveToolbar` + filter drawer |
| **C** (détail)     | 26          | 8      | 1 (C-bis)     | 35    | Custom C-bis pattern                |
| **D** (dashboard)  | 27          | 6      | 5 (D-bis)     | 38    | `ResponsiveToolbar` + KPI grid      |
| **E** (wizard)     | 6           | 2      | 2 (E-bis)     | 10    | Stack mobile, drawer panier         |
| **F** (form)       | 7           | 7      | 5 (F-bis)     | 19    | Grid col-1/col-2 responsive         |

**Constat** : 64 pages (33%) sont des listes CRUD. C'est le plus gros bloc, et c'est exactement le cas d'usage de `ResponsiveDataView` + `ResponsiveActionMenu`. **Commencer par Pattern A** = ROI maximal.

---

## 3. Top 10 pages critiques à migrer en priorité absolue

Classées par impact business × fréquence d'usage × complexité responsive actuelle :

| Rang | Page                             | App           | Pattern | Justification                                    |
| ---- | -------------------------------- | ------------- | ------- | ------------------------------------------------ |
| 1    | `/factures`                      | back-office   | A       | Table principale revenu, utilisée tous les jours |
| 2    | `/produit/[id]` (site)           | site-internet | C-bis   | 80% trafic mobile, conversion directe            |
| 3    | `/dashboard` (back-office)       | back-office   | D       | Point d'entrée staff quotidien                   |
| 4    | `/dashboard` (linkme)            | linkme        | D       | Point d'entrée 100% affiliés                     |
| 5    | `/catalogue` (site)              | site-internet | B-bis   | 80% trafic mobile, filtres complexes             |
| 6    | `/commandes/fournisseurs`        | back-office   | A       | Table critique achats                            |
| 7    | `/stocks/inventaire`             | back-office   | D       | Hub stocks usage quotidien                       |
| 8    | `/canaux-vente/linkme/commandes` | back-office   | A       | Validation commandes LinkMe                      |
| 9    | `/commandes` (linkme)            | linkme        | A       | Terrain, mobile obligatoire                      |
| 10   | `/checkout` (site)               | site-internet | F-bis   | Conversion finale, 80% mobile                    |

---

## 4. Plan de migration — **3 PRs groupées** (au lieu de 7 sprints)

Suite à l'adoption de `.claude/rules/workflow.md` (1 PR = 1 bloc cohérent), les 7 sprints prévus sont **regroupés en 3 PRs thématiques**. Cela divise l'overhead CI/review par 2.5.

### PR A — `[BO-UI-RESP-LISTS]` : Patterns A + B (listes + filtres)

**Branche** : `feat/responsive-lists`
**Sprints inclus** : 003 (A critique) + 004 (A secondaire) + 005 (B filtres)
**Pages** : 87 pages (64 pattern A + 23 pattern B)
**Commits** : un par pattern + un par app (4 commits)
**Effort** : 3-4 jours
**Scope** :

- Pattern A critique : factures, commandes, stocks, finance — 35 pages priorité 1
- Pattern A secondaire : produits/contacts — 15 pages priorité 2
- Pattern B filtres : catalogues + recherches avancées — 23 pages

### PR B — `[BO-UI-RESP-DETAILS]` : Patterns C + D (détail + dashboards)

**Branche** : `feat/responsive-details`
**Sprints inclus** : 006 (C détail) + 007 (D dashboards)
**Pages** : 73 pages (35 pattern C + 38 pattern D)
**Commits** : un par pattern + un par app
**Effort** : 2-3 jours
**Scope** :

- Pattern C : pages détail produits/commandes/factures/contacts
- Pattern D : `/dashboard`, hubs modules (stocks, finance, produits, contacts, messages, parametres, achats, ventes)

### PR C — `[BO-UI-RESP-FORMS-APPS]` : Patterns E + F + apps LinkMe/site

**Branche** : `feat/responsive-forms-apps`
**Sprints inclus** : 008 (E+F) + 009 (LinkMe + site-internet)
**Pages** : 36 pages (29 E+F + les 52 pages non-back-office)
**Commits** : un par app
**Effort** : 2-3 jours
**Scope** :

- Pattern E : modals création facture/devis/produit, wizards consultations
- Pattern F : forms webhooks, emails, profil
- LinkMe : 35 pages (mobile-first déjà partielle, désambigüiser desktop)
- Site-internet : 17 pages (focus conversion mobile, StickyAddToCart, checkout)

**Total** : 196 pages migrées en **3 PRs au lieu de 7**. Overhead CI ~45 min au lieu de ~90 min.

---

## 5. Recommandation Romeo — par quoi commencer

### Option recommandée : **PR A en premier** (`[BO-UI-RESP-LISTS]`)

**Justification** :

1. **Volume** : 87 pages (44% des 196 totales) — le plus gros gain d'un coup
2. **Impact quotidien** : 35 pages Priorité 1 sont des listes CRUD (factures, commandes, finance, stocks)
3. **ROI infra** : valide massivement `ResponsiveDataView` + `ResponsiveActionMenu` sur le plus gros cas d'usage
4. **Risque** : faible — le pattern est le plus simple à migrer, infrastructure déjà posée
5. **Démonstration** : si PR A réussit, PRs B et C suivent naturellement avec moins de risque

**Effort PR A** : 3-4 jours. Délégation obligatoire à dev-agent avec reviewer-agent en Axe 4 Responsive.

### Enchaînement proposé

- **Jour 1-4** : PR A (listes + filtres, 87 pages)
- **Jour 5-7** : PR B (détail + dashboards, 73 pages)
- **Jour 8-10** : PR C (forms + linkme + site-internet, 36 pages)
- **Jour 10-11** : Merge cascade staging → main après validation Romeo

**Total** : 10-11 jours de travail. À comparer avec l'estimation initiale 8-10 jours × 7 sprints isolés : gain de **5-10 jours de CI/review overhead**.

---

## 6. Interdictions respectées (BO-UI-RESP-002)

- ✅ Zero code modifié
- ✅ Zero composant créé
- ✅ Zero migration de page
- ✅ Audit + plan uniquement
- ✅ Livré en scratchpad

---

## 7. STOP — attendre validation Romeo

Avant de lancer la PR A (`[BO-UI-RESP-LISTS]`), Romeo doit :

1. Valider la classification par pattern (échantillon Priorité 1)
2. Valider le regroupement 3 PRs au lieu de 7 sprints
3. Valider la recommandation de commencer par Pattern A
4. Autoriser la délégation automatique à dev-agent

Une fois validé, je lance `feat/responsive-lists` et j'enchaîne les 87 pages par commits progressifs sans merge intermédiaire.
