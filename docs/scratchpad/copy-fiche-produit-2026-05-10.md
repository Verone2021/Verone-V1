# Copy — Fiche Produit veronecollections.fr

**Date :** 2026-05-10
**App :** `apps/site-internet`
**À lire avec :** `dev-plan-2026-05-10-site-fiche-produit.md` · `copy-seo-2026-05-10.md`

---

## Labels UI — invariants

```
BOUTON PRINCIPAL (fond charbon #1d1d1b)
AJOUTER AU PANIER

BOUTON SECONDAIRE (bordure or #C9A961)
POSER UNE QUESTION → ouvre formulaire contact pré-rempli avec le nom du produit

LIVRAISON
Livraison en France — délai affiché depuis le champ livraison en DB

RETOUR
Retour accepté sous 14 jours — pièce non utilisée

PARTAGER
Partager cette pièce

LABEL RUPTURE
Cette pièce n'est plus disponible.
→ CTA sous le label : Voir des pièces similaires → /catalogue?category=[categorie]

LABEL ÉPUISÉ TEMPORAIREMENT
Épuisé pour le moment.
→ CTA : M'alerter quand c'est disponible → formulaire email simple
```

---

## Template description produit — structure en 3 blocs

### Bloc 1 — L'accroche (1-2 phrases max)

**Règle :** Dit ce que la pièce FAIT à l'espace, pas ce qu'elle EST.
Pas de liste. Pas d'adjectif empilé. Un verbe fort.

```
✅ Exemples bons :
"Ce vase change une table rien qu'en y étant posé."
"Cette lampe tient le mur sans avoir besoin d'un tableau."
"Un bout de tissu qui donne chaud rien qu'à le regarder."

❌ Exemples mauvais :
"Magnifique vase en céramique de haute qualité, élégant et raffiné."
"Belle lampe design aux finitions soignées pour un intérieur contemporain."
```

### Bloc 2 — Les caractéristiques (prose courte, pas de bullet points)

**Règle :** 2-4 phrases. Matière → dimension → origine si notable → entretien si pertinent.
Les dimensions sont visibles dans la fiche technique — ne pas les répéter sauf si elles définissent la pièce.

```
✅ Exemple :
"Céramique émaillée, teinte nervurée à la main — chaque pièce est légèrement
différente. Fond plat, stable. Convient aux fleurs coupées courtes ou aux
branches sèches."

❌ Exemple mauvais :
"Dimensions : H 28 cm × Ø 14 cm. Poids : 680g. Matière : céramique.
Couleur : beige. Marque : Opjet. Référence : VZ-4821."
→ Ces données vont dans la fiche technique, pas dans la description.
```

### Bloc 3 — Pourquoi elle est entrée (facultatif, 1 phrase)

**Règle :** Optionnel. Ajouter uniquement si la pièce a une histoire d'entrée forte.
C'est la voix de Vérone — la raison du choix.

```
✅ Exemple :
"On a dit oui à celle-là parce qu'elle tient la lumière différemment selon
l'heure — ce n'est pas courant dans sa gamme de prix."

"Sur dix vases de cette marque, deux entraient. C'est celui-là."
```

---

## Exemples complets — 3 types de produits

### Vase (petit objet)

```
ACCROCHE
Ce vase change une table rien qu'en y étant posé.

CARACTÉRISTIQUES
Céramique émaillée à la main, teinte lin nervurée. Chaque pièce porte
les traces de sa fabrication — c'est voulu. Stable, fond plat, ouverture
adaptée aux fleurs coupées ou aux branches sèches.

POURQUOI IL EST ENTRÉ
Sur dix vases de cette gamme, deux méritaient d'entrer. C'est celui-là.
```

### Lampe (pièce structurante)

```
ACCROCHE
Cette lampe tient le mur sans avoir besoin d'un tableau.

CARACTÉRISTIQUES
Pied laiton brossé, abat-jour en lin épais. La lumière passe à travers
sans être froide — ce n'est pas évident dans cette catégorie de prix.
Câble tissu, interrupteur sur le cordon. Ampoule E27 fournie.

POURQUOI ELLE EST ENTRÉE
On cherchait un laiton qui ne vieillisse pas trop vite. Celui-là tient.
```

### Textile (coussin, plaid)

```
ACCROCHE
Un bout de tissu qui donne chaud rien qu'à le regarder.

CARACTÉRISTIQUES
Lin lavé 100% naturel, teint en cuve — la couleur reste sans s'uniformiser.
Toucher légèrement texturé, pas doux comme du velours : c'est ce qu'on
cherchait. Lavable à 30°.
```

---

## Guide de ton pour les descriptions — règles absolues

| Règle            | ✅ Faire                                 | ❌ Ne pas faire                              |
| ---------------- | ---------------------------------------- | -------------------------------------------- |
| Verbe d'action   | "change", "tient", "donne", "transforme" | "est", "possède", "dispose de"               |
| Adjectifs        | 1 max par phrase, choisi                 | "magnifique", "élégant", "raffiné", "soigné" |
| Longueur         | 40-80 mots au total                      | > 120 mots                                   |
| Bullet points    | Jamais dans la description               | "• Matière : céramique • Couleur : beige"    |
| Dimensions       | Fiche technique uniquement               | Dans la description prose                    |
| "Vous" / "votre" | Jamais                                   | "Pour votre intérieur"                       |
| Superlatifs      | Jamais                                   | "l'un des meilleurs", "de haute qualité"     |

---

## Fiche technique — structure (séparée de la description)

```
INFORMATIONS PRODUIT
Dimensions : H × l × P en cm
Poids : en kg
Matière : [matière principale]
Couleur : [couleur exacte ou référence]
Marque : [nom marque]
Référence Vérone : [SKU]
Entretien : [si pertinent]
Origine : [pays si notable]
```
