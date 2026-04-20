# Prompt Stitch — Refonte onglet Tarification (fiche produit back-office)

**Date** : 2026-04-20
**Référence** : `docs/scratchpad/stitch-redesign-site-internet-prompt-2026-04-17.md` (modèle de structure)
**Cible** : `/produits/catalogue/[productId]` — onglet **Tarification**
**Sprint** : SI-PRICING-001

---

## 1. Contexte

**App** : back-office Vérone (CRM/ERP admin)
**Stack** : Next.js 15 App Router + React 18 + Tailwind + shadcn/ui (via `@verone/ui`)
**Port local** : 3000
**URL page cible** : `http://localhost:3000/produits/catalogue/[productId]` onglet "Tarification"
**Fichier principal** : `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/product-pricing-tab.tsx` → `UnifiedPricingPanel` (`packages/@verone/common/src/components/pricing/`)

**Public** : admin (Romeo), équipe achats, équipe ventes. Travaillent 8h/jour sur ce back-office → priorité à la **densité d'info** et à l'**édition rapide**, pas au wow-effect.

## 2. Audit de l'existant (2026-04-20)

Le panel actuel empile 4 grands blocs pleine largeur :

1. **Prix d'achat fournisseur** (carte rouge) — Coût HT 49,00 €
2. **Taux de marge** (carte bleue) — "Taux de marge non renseigné"
3. **Prix minimum de vente** (carte verte) — masqué si marge NULL
4. **Prix par canal** — 4 canaux empilés

### Données affichées aujourd'hui

| Source DB                                                                        | Champ                                   | Affichage actuel                                            |
| -------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `products.cost_price`                                                            | Prix d'achat manuel                     | Carte rouge pleine largeur                                  |
| `products.eco_tax_default`                                                       | Éco-taxe                                | Carte orange (si > 0)                                       |
| `products.margin_percentage`                                                     | % marge                                 | Carte bleue                                                 |
| `products.cost_price_avg/min/max/last/count`                                     | Stats achats depuis PO                  | Bloc "HISTORIQUE PRIX D'ACHAT" inline (masqué si tous NULL) |
| `products.cost_net_avg/min/max/last`                                             | Prix net livré                          | En sous-libellé de l'historique                             |
| `products.target_margin_percentage`                                              | Marge cible                             | Ligne dans historique                                       |
| `channel_pricing.custom_price_ht`                                                | Prix catalogue canal (source de vérité) | Prix principal par canal                                    |
| `channel_pricing.public_price_ht`                                                | Prix public indicatif                   | Sous-libellé                                                |
| `linkme_selection_items.selling_price_ht` (= `base_price_ht × (1+margin_rate%)`) | Prix effectif dans sélection LinkMe     | Liste sous le canal LinkMe                                  |

### Canaux supportés

1. **Site Internet Vérone** (`site_internet`) — éditable, prix publié sur veronecollections.fr
2. **LinkMe** (`linkme`) — éditable, prix catalogue B2B + prix par sélection en dessous
3. **Google Merchant** (`google_merchant`) — miroir du site-internet (lecture seule)
4. **Meta Commerce** (`meta_commerce`) — miroir du site-internet (lecture seule)

### Problèmes identifiés

1. **Perte d'espace horizontal** : sur desktop 1440px, chaque section mange toute la largeur alors qu'un "prix de 49 €" prend 80 px de texte → énorme whitespace à droite inutile.
2. **Densité faible** : pour voir "Prix par canal" il faut scroller → info cachée under-the-fold.
3. **Pas de vision comparative** : impossible de voir d'un coup prix d'achat + marge + min vente + prix canaux côte à côte.
4. **Bouton "Historique des achats"** retiré car cassait une modale. L'historique inline (`HISTORIQUE PRIX D'ACHAT`) n'apparaît que si le produit a des PO réceptionnées (`cost_price_avg != null`) — invisible pour les nouveaux produits.
5. **Statut canal noyé** : difficile de voir en un coup d'œil quels canaux sont Actifs/Inactifs/Sous-le-min.

## 3. Objectif Romeo

> « Je voudrais avoir des petits hooks dans chaque onglet, des trucs bien structurés. »

Traduction :

- **Grille compacte** (2-3 colonnes desktop, 1 colonne mobile)
- **Tuiles KPI** pour les valeurs clés (cost, marge, min, prix site, prix LinkMe) — type Stripe Dashboard
- **Tableau dense** pour les canaux avec édition inline (comme Linear issue list)
- **Historique achats inline et visible** (pas de modale qui casse)
- **Hiérarchie visuelle** : le plus important (prix de vente par canal) en haut / à gauche, le support (marge, eco-tax) en secondaire

## 4. Charte graphique back-office (à respecter)

```
COULEURS (différentes du site-internet)
- Fond principal      : #FAFAFA (neutral-50)
- Surface cartes      : #FFFFFF
- Bordure légère      : #E5E5E5 (neutral-200)
- Texte principal     : #0A0A0A (neutral-950)
- Texte secondaire    : #525252 (neutral-600)
- Texte muted         : #A3A3A3 (neutral-400)

ACCENTS (codes métier Vérone existants)
- Coût / achat        : red-50 / red-600 (bloc PRIX D'ACHAT existant)
- Marge / % bleu      : blue-50 / blue-600
- Prix vente / min    : green-50 / green-600
- Éco-taxe            : orange-50 / orange-600
- Warning sous-min    : red-100 / red-700
- Inactif             : neutral-100 / neutral-500

TYPOGRAPHIE
- Body & UI           : Inter (sans-serif) — DÉJÀ LA POLICE GLOBALE
- Prix (tabular)      : Inter tabular-nums, font-semibold
- Libellés / kickers  : Inter uppercase text-xs tracking-wide

RADIUS
- Cartes              : 8px (rounded-lg) — cohérent avec shadcn/ui existant
- Boutons             : 6px (rounded-md)

SHADOW
- Discret admin       : shadow-sm (0 1px 2px rgba(0,0,0,0.05))
- Jamais de "luxury shadow" (réservé au site)
```

## 5. Inspirations (admin dense B2B)

Obligatoires :

- **Stripe Dashboard** — cards KPI compactes, grille dense, indicateurs colorés minimalistes
- **Linear issue detail** — édition inline, hierarchie claire, pas de scroll
- **Vercel Dashboard** — bordures fines, tonalité neutre, chips colorés pour statut
- **Notion database view** — tableau dense avec édition cellule

Ne **pas** s'inspirer de :

- Site e-commerce Vérone (style éditorial, Playfair, serif → pas pour admin)
- Design hero westwing (c'était le projet site-internet)

## 6. Structure cible proposée (non imposée — Stitch peut proposer variantes)

### Layout desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Onglet "Tarification" — Coussin Blanc (COU-0007)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ GRILLE KPI (3 colonnes) ──────────────────────────────────────┐ │
│  │ [Coût HT]       [Taux de marge]    [Prix min de vente]        │ │
│  │  49,00 €         25 % (défaut)      61,25 €                    │ │
│  │  +éco-taxe 0€    — éditer            Marge brute 12,25 €       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─ GRILLE ACHATS (2 colonnes) ─────────────────────────────────┐  │
│  │ [Historique agrégé]           [Derniers PO]                   │  │
│  │ moy 48,10 € (48,20 net)       • 2026-03-15 PO-0012 · 49,00€  │  │
│  │ min 45,20 / max 52,30         • 2026-02-02 PO-0008 · 48,50€  │  │
│  │ 8 achats                      • 2026-01-10 PO-0003 · 47,00€  │  │
│  │ dernier 48,00 (47,80 net)     → Voir tout (inline expand)    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ PRIX PAR CANAL (tableau dense) ────────────────────────────┐    │
│  │ Canal              Prix HT  Source   Statut   Sélections    │    │
│  │ ──────────────────────────────────────────────────────────  │    │
│  │ 🌐 Site Internet    —       —        Inactif  —             │    │
│  │ 🔗 LinkMe           50,00€  override Actif    Pokawa 58,83€ │    │
│  │ 🛍️ Google Merchant  (site)  miroir   —        —             │    │
│  │ 📱 Meta Commerce    (site)  miroir   —        —             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout mobile (< 768px)

Tout empilé 1 colonne, même ordre. KPI en 2×2 grid (cost + marge / min + eco).

## 7. Prompt à donner à Stitch

> Rôle : designer senior d'interfaces admin B2B (SaaS pricing dashboards, ERP modernes). Tu designes un écran unique : **l'onglet "Tarification" d'une fiche produit dans un back-office e-commerce** (Vérone, concept store mobilier/déco).
>
> **Mission** : refondre cet onglet pour passer de 4 blocs pleine largeur empilés à une **grille dense à petites tuiles**, type tableau de bord Stripe + Linear issue detail. Garder la possibilité d'éditer chaque valeur inline (click-to-edit). Le public est un admin qui passe la journée dans ce back-office, donc densité > wow-effect.
>
> **Contexte métier** (à afficher tel quel dans l'écran) :
>
> Un produit physique (exemple : "Coussin Blanc", SKU COU-0007) a :
>
> 1. **Prix d'achat fournisseur** : 49,00 € (coût HT manuel)
> 2. **Éco-taxe** : 0,00 € (éco-participation)
> 3. **Taux de marge cible** : 25 % (affiché "(par défaut)" si pas défini en DB, sinon affiché tel quel)
> 4. **Prix minimum de vente calculé** : 61,25 € (= (49 + 0) × 1,25) avec marge brute 12,25 €
> 5. **Historique d'achats** (depuis réceptions fournisseurs) :
>    - Moyenne 48,10 € (net livré 48,20 €)
>    - Min 45,20 € — Max 52,30 €
>    - Nombre d'achats 8
>    - Dernier 48,00 € (net 47,80 €) le 2026-03-15 via PO-0012
>    - Liste des 3-5 derniers PO avec date + n° PO + fournisseur + prix unitaire + prix net
> 6. **Prix par canal de vente** — tableau éditable :
>    - 🌐 **Site Internet Vérone** (= source unique pour Google Merchant + Meta) : prix custom, ou "Aucun prix défini"
>    - 🔗 **LinkMe** (B2B affilié) : prix catalogue + en dessous liste des prix par sélection LinkMe (ex. "Collection Mobilier Pokawa" → 58,83 € = 50,00 € base × 1,1765 marge)
>    - 🛍️ **Google Merchant** : miroir en lecture seule du prix site-internet
>    - 📱 **Meta Commerce** : miroir en lecture seule du prix site-internet
>
>    Chaque ligne canal a : icône, nom, prix HT (format `51,00 €` tabular-nums), source ("override custom" | "prix public" | "miroir site" | "aucun"), statut (chip "Actif" vert | "Inactif" gris | "Sous le min" rouge), et si LinkMe, sous-tableau de ses prix sélection.
>
> **Contraintes de design** :
>
> - **Palette back-office neutre** (pas de gradient, pas de couleurs saturées autres que les accents métier) :
>   - Fond `#FAFAFA`, surfaces `#FFFFFF`, bordures `#E5E5E5`
>   - Texte principal `#0A0A0A`, secondaire `#525252`, muted `#A3A3A3`
>   - Accents uniquement sur les valeurs :
>     - Coût/achat = rouge terre `red-600` avec fond `red-50`
>     - Marge/pourcentage = bleu `blue-600`/`blue-50`
>     - Prix min vente = vert `green-600`/`green-50`
>     - Éco-taxe = orange `orange-600`/`orange-50`
>     - Sous-le-min = rouge `red-700` avec bord `red-300` + badge destructive
>   - Aucun amber, aucun serif, aucun style éditorial
> - **Typographie** : Inter partout. Prix en `tabular-nums` pour l'alignement vertical. Libellés en `uppercase tracking-wide text-xs` (kickers) et `text-sm font-medium` (labels).
> - **Radius** : 8 px sur cartes, 6 px sur boutons (shadcn/ui tokens).
> - **Shadow** : uniquement `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)), jamais plus.
> - **Spacing** : gap-3 entre tuiles, p-4 dans tuiles, p-5 dans section principale.
> - **Inline edit** : bouton crayon/texte "Modifier" discret top-right de chaque tuile. Au clic, la tuile se transforme en champ input avec Enregistrer/Annuler.
> - **Densité** : tout visible sans scroll vertical sur 1440×900. Pas de "page complète qui scrolle", c'est un **panel** dans un onglet.
> - **États vides** : si une valeur est NULL en DB, afficher "Non renseigné" en italique gris — PAS un fallback inventé (ex : si marge = NULL, on écrit "Non renseigné" et le prix minimum de vente devient "—").
>
> **Structure demandée** (3 zones empilées verticalement, chacune en grille interne) :
>
> ### Zone 1 — Synthèse (top)
>
> Grille 3 colonnes desktop, 2×2 mobile. 3 tuiles compactes :
>
> - Tuile A "Prix d'achat" : libellé + gros montant + sous-label éco-taxe
> - Tuile B "Taux de marge" : libellé + pourcentage en gros + sous-label "par défaut" | "défini"
> - Tuile C "Prix minimum de vente" : libellé + montant en gros + sous-label "marge brute X€"
>
> Chaque tuile ~160px de haut, clic pour éditer.
>
> ### Zone 2 — Achats (milieu)
>
> Grille 2 colonnes desktop, 1 mobile :
>
> - Colonne gauche "Agrégat PO" : 4 lignes compactes (moyenne, min/max, nb achats, dernier) avec la valeur unitaire + valeur nette entre parenthèses
> - Colonne droite "Derniers achats" : liste de 3-5 PO récentes (date courte, ref PO, prix). Lien "Voir tout l'historique" qui déplie en place (pas de modale).
>
> ### Zone 3 — Prix par canal (bottom, plus large)
>
> Tableau dense avec colonnes : Canal (icône + nom), Prix HT, Source, Statut, Sélections (LinkMe uniquement), Actions.
>
> - Lignes éditables inline (clic sur prix → input).
> - Chip statut compact.
> - Si "Sous le min" : bord rouge gauche 3px + chip rouge.
> - La ligne LinkMe a un sous-bloc déplié sous elle listant les sélections avec leur selling_price_ht.
> - Les miroirs (Google/Meta) ont une ligne grisée sans édition possible, tagguée "= site-internet".
>
> ### Responsive
>
> Tester 5 tailles : 375×667, 768×1024, 1024×768, 1440×900, 1920×1080. Mobile et tablette : toutes les grilles deviennent 1 colonne, le tableau canal devient une pile de cards.
>
> ### Ce qu'on ne veut PAS
>
> - Pas d'animation spectaculaire.
> - Pas de carte "Prix d'achat fournisseur" qui prend 100% de la largeur avec 80% de vide.
> - Pas de modale/drawer pour l'historique → inline uniquement.
> - Pas de couleur accentuée (pas d'amber, pas de violet, pas de dégradé).
> - Pas de Playfair / serif (c'est un admin, pas un site vitrine).
> - Pas de CTA plein écran ni de hero.

## 8. Étapes Stitch (à exécuter par l'agent)

1. `mcp__stitch__create_project` avec `title = "Vérone Back-Office — Onglet Tarification"`
2. `mcp__stitch__create_design_system` :
   - `displayName` : "Verone Admin Neutral"
   - `colorMode` : LIGHT
   - `headlineFont` : INTER
   - `bodyFont` : INTER
   - `customColor` : `#0A0A0A`
   - `roundness` : ROUND_EIGHT
3. `mcp__stitch__apply_design_system` sur le projet.
4. `mcp__stitch__generate_screen_from_text` pour **desktop 1440×900** avec le prompt de la section 7 ci-dessus.
5. `mcp__stitch__generate_screen_from_text` pour **mobile 390×844** avec le même prompt adapté "layout mobile 1 colonne, KPI en 2×2 grid, tableau canal en pile de cards".
6. `mcp__stitch__get_screen` pour récupérer les assets → capture d'écran / export code.
7. Sauvegarder les URLs/IDs dans ce scratchpad pour traçabilité.

## 9. Livrables attendus

- 2 écrans Stitch (desktop + mobile) visualisables par Romeo.
- ID projet Stitch + IDs écrans dans la section 10 ci-dessous.
- Décision Romeo avant implémentation code : "oui je prends / oui avec ajustements X / non refaire".
- Implémentation code = sprint suivant (pas ce sprint).

## 10. Traces exécution

_Rempli au fur et à mesure par l'agent._

- Project ID : _à venir_
- Design system asset ID : _à venir_
- Desktop screen ID : _à venir_
- Mobile screen ID : _à venir_
