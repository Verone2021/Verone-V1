# Copy — Page Catalogue veronecollections.fr

**Date :** 2026-05-10 (réécriture complète)
**App :** `apps/site-internet`
**À lire avec :** `dev-plan-2026-05-10-site-catalogue.md` (specs layout + filtres)
**Keywords cibles :** "catalogue déco en ligne", "sélection déco design", "boutique déco design", "achat déco intérieur"

Règles copy non négociables :

- Tutoiement strict : tu, ton, tes — jamais vous
- Phrases courtes, fragments assumés
- Pas d'adjectifs creux (unique, exceptionnel, magnifique, etc.)

---

## SEO — Balises page

```
title (55 car.) :
"Catalogue déco design en ligne — Sélection Vérone"

meta description (148 car.) :
"Sélection déco et mobilier design : chaque pièce vue, pesée, retenue.
Filtre par univers, matière ou budget. Livraison France."

H1 (invisible visuellement, crawl only — dans le DOM, pas affiché) :
"Catalogue déco en ligne — sélection Vérone"

Canonical : https://veronecollections.fr/catalogue
```

---

## Header page

```
EYEBROW (DM Sans Light, 13px, UPPERCASE, tracking 0.32em, #9B9B98)
CATALOGUE

COMPTEUR (Montserrat 400, 14px, #9B9B98)
[N] pièces     ← valeur dynamique Supabase, ex: "47 pièces"
```

Note : pas de H2 visible ici — le compteur suffit. L'H1 est dans le DOM pour le SEO mais affiché `sr-only`.

---

## Sidebar filtres — Labels

```
HEADER SIDEBAR (DM Sans Light, 11px, UPPERCASE, #9B9B98, tracking 0.32em)
FILTRES

GROUPE : CATÉGORIE
  Vases
  Luminaires
  Textiles
  Mobilier
  Objets

GROUPE : PIÈCE
  Salon
  Chambre
  Salle à manger
  Extérieur

GROUPE : PRIX
  Moins de 50 €
  50 – 150 €
  150 – 400 €
  400 € et plus

LIEN reset (visible uniquement si ≥ 1 filtre actif, Montserrat 400, 13px, #9B9B98, underline)
Tout effacer
```

---

## Tri — Select dropdown (en-tête grille, côté droit)

```
LABEL du select (Montserrat 500, 13px, UPPERCASE, charbon)
TRIER PAR

OPTIONS
  Nouveautés       ← tri par défaut
  Prix croissant
  Prix décroissant
```

---

## Chips filtres actifs

```
Chip (fond charbon, texte blanc, Montserrat 500, 12px) :
[label filtre] ×

Lien si ≥ 2 filtres actifs (à droite des chips, Montserrat 400, 13px, underline) :
Tout effacer
```

---

## Bouton filtres — Mobile uniquement

```
CTA mobile (fond charbon, texte blanc, Montserrat 500, 12px, UPPERCASE)
FILTRES [N]     ← [N] = nombre de filtres actifs, ex: "FILTRES 2"
                   Affiché seulement si N > 0

Sans filtre actif :
FILTRES
```

---

## ProductCard — Labels

```
BADGE NOUVEAUTÉ (optionnel, coin supérieur gauche)
(fond blanc, texte charbon, Montserrat 500, 11px, UPPERCASE)
NOUVEAU

BADGE RUPTURE (si stock = 0, overlay photo)
(fond charbon/70%, texte blanc, Montserrat 400, 13px, centré)
Épuisé

NOM PRODUIT (Montserrat 500, 14px, charbon)
[Nom du produit]

PRIX (Montserrat 400, 14px, charbon)
[N] €

CTA hover — action rapide (visible au survol card)
VOIR LA PIÈCE
```

---

## États vides et chargement

```
ÉTAT VIDE — aucun résultat correspondant aux filtres
(Bodoni Moda italic, 24px, charbon, centré)
Rien ici.

(Montserrat 400, 15px, #9B9B98, centré, max-width 360px)
Ces filtres ne correspondent à aucune pièce
de notre sélection actuelle.

Lien (Montserrat 400, 13px, underline)
Tout effacer → reset des params URL

---

ÉTAT VIDE — catalogue vide (aucun produit du tout, improbable en prod)
(Bodoni Moda italic, 24px, charbon, centré)
La sélection se prépare.

(Montserrat 400, 15px, #9B9B98)
Reviens bientôt.

---

CHARGEMENT — skeleton card
Pas de spinner visible. Fond #F5F5F4, animation pulse douce (opacity 0.5 → 1, 1.2s ease).

---

CTA pagination / "charger plus" (centré sous la grille, Montserrat 500, 12px, UPPERCASE, fond transparent, border charbon)
VOIR PLUS DE PIÈCES

Quand tout est chargé, afficher (Montserrat 400, 13px, #9B9B98, centré) :
Tu as tout vu.
```

---

## Prix — Conventions d'affichage

```
Prix entier : 149 €     (pas 149,00 €)
Prix décimal : 149,50 €  (virgule, pas point)
Prix promo : ~~199 €~~ → 149 €  (texte barré + prix réduit)
Gratuit : Offerte (pour frais de port offerts)
```

---

## Breadcrumb

```
Accueil → Catalogue
Accueil → Catalogue → [Catégorie]

Séparateur : /   (charbon, opacité 40%)
Dernier élément : charbon, pas de lien
Éléments parents : #9B9B98, lien underline au hover
```
