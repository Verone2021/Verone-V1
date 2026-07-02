# RECTIV — Corrections avant promotion du site veronecollections.fr

**Date : 1er juillet 2026**
**Suite à ton audit du site (note 5,5/10).**

Ce document liste, en français simple, tout ce que j'ai corrigé et les
quelques informations que j'attends de toi pour finir. Les corrections
seront visibles en ligne dès que tu me donnes le feu vert pour la mise
en ligne.

---

## ✅ Corrigé (visible en ligne après ta validation)

### Contenu du site

1. **Collection de test retirée** — la « Collection Bohème Salon 2025 »
   (qui affichait « Collection de test pour démonstration… ») est
   supprimée. Les 3 produits qui y étaient rattachés ne sont pas
   supprimés, ils restent dans le catalogue.
2. **Accents remis partout** — les pages Livraison, Retours, FAQ, CGV,
   Mentions légales et les textes de la page d'accueil (bandeau
   « Sourcing créatif / Qualité-prix / Sélection tournante » et le bouton
   « Découvrir la sélection ») étaient écrits sans accents. Tout est
   corrigé.
3. **Bon nom de domaine dans les CGV** — les CGV parlaient de
   « verone.fr ». Remplacé par « veronecollections.fr ». Même correction
   sur les adresses de contact des pages Confidentialité et Cookies
   (« contact@veronecollections.fr »).
4. **Retours : 14 jours partout** — la promesse « 30 jours » (barre de
   confiance, fiche produit, panier, e-mail de livraison) est alignée sur
   les 14 jours de tes conditions de vente. Une seule vérité désormais.
5. **Délai de livraison : 10 à 14 jours ouvrés partout** — la page
   Livraison et la FAQ disaient « 5 à 7 jours ». Harmonisé sur « 10 à 14
   jours ouvrés », comme la fiche produit. La faute « jours ouvres » (sans
   accent) est corrigée en « jours ouvrés ».
6. **« Livraison express 2-3 jours » retirée** — elle était annoncée sur
   la page Livraison mais n'existait pas dans le tunnel d'achat. Supprimée.

### Fiche produit

7. **Image d'accueil (hero) affichée** — la grande image du haut de la
   page d'accueil existait en base mais n'était jamais affichée (d'où le
   grand vide blanc). Elle s'affiche maintenant sous les boutons.
8. **Description produit visible** — la fiche produit n'affichait la
   description que pour 6 produits sur 178. Elle s'affiche maintenant pour
   157 produits (le texte rédigé était bien là, mais le site regardait au
   mauvais endroit).
9. **Dimensions correctes** — la fiche n'affichait que le poids. Les
   vraies dimensions (Longueur × largeur × Hauteur, ou Ø diamètre pour les
   pièces rondes comme les miroirs) s'affichent maintenant dès qu'elles
   sont renseignées (120 produits en ont).
10. **Recommandations pertinentes** — la section « Vous aimerez aussi »
    (avant : « Les clients ont également consulté ») montrait les 6
    produits les plus récents, sans rapport. Elle propose maintenant en
    priorité des produits de la même catégorie et du même style.

### Vérifié — rien à corriger

11. **Images du panier / recherche : pas un bug.** J'ai testé en direct
    sur le site : quand on ajoute un produit au panier aujourd'hui, sa
    vignette s'affiche parfaitement. Les images grises que tu as vues
    venaient d'un ancien panier gardé en mémoire par ton navigateur
    (produits ajoutés avant qu'on change le système d'images). Pour un
    nouveau visiteur, tout s'affiche. Rien à changer dans le code.

---

## ⏳ J'ai besoin de toi (je ne peux pas inventer ces informations)

### C1 — Mentions légales complètes (obligatoire en France)

La page Mentions légales dit encore « Capital social : en cours de
constitution » et « Siège social : France ». C'est incomplet et
juridiquement insuffisant. J'ai remis les accents mais je n'invente pas
tes informations d'entreprise. Peux-tu me donner :

- Raison sociale exacte et forme juridique (SAS ?)
- Capital social (montant en euros)
- Adresse complète du siège social
- Numéro SIRET
- Numéro RCS (ville + numéro)
- Numéro de TVA intracommunautaire

Dès que tu me les donnes, je complète la page.

### C2 — Images du Journal (blog)

Les 5 articles publiés n'ont pas d'image de couverture (d'où les zones
grises). Le code fonctionne, il manque juste les images. Tu peux les
ajouter depuis le back-office (gestion du Journal), ou me les envoyer et
je m'en occupe.

### C3 — Image de collection

Une collection restante n'a pas d'image. Même chose : à ajouter depuis le
back-office ou à m'envoyer.

### C4 — Compléter quelques fiches produit

- Environ 21 produits n'ont aucune description.
- Environ 58 produits n'ont pas de dimensions renseignées.

Ce n'est pas bloquant (les 157 autres sont complets), mais pour un
catalogue impeccable, il faudra compléter ces fiches depuis le
back-office. On peut le faire ensemble plus tard.

---

## 🎨 Correction logo — à faire dans Claude Code

Le logo dans le header n'utilise pas la bonne typographie. La Bodoni
(calligraphie Vérone) est présente dans le footer, mais le header affiche
un fichier PNG mal dimensionné qui donne "VERONE" en minuscules lettres.
Sur mobile, aucun logo n'est affiché dans le menu.

Le prompt précis à copier-coller dans Claude Code est ici :
`docs/scratchpad/prompt-claude-code-logo-site-internet.md`

En résumé : remplacer le PNG par `font-bodoni text-2xl font-black tracking-tight`
dans `Header.tsx` et `MobileNav.tsx`, comme c'est déjà fait dans `Footer.tsx`.

---

## Comment ça se met en ligne

Toutes ces corrections sont regroupées dans une seule demande de mise en
ligne. Deux d'entre elles touchent la base de données (le retrait de la
collection de test et la correction des textes des pages légales) : elles
s'appliqueront automatiquement au moment de la mise en ligne, quand tu me
donnes le feu vert.
