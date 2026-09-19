# Prompt 1 — rouvrir la boutique, sans se faire voler

`[SI-CHECKOUT-PRICE-001]` — une seule demande vers `staging`. Aucune migration.

## Pourquoi c'est la priorité

**La boutique `veronecollections.fr` est fermée depuis le 19/09 au matin.** Chaque jour de
fermeture est du chiffre d'affaires en moins. Elle a été fermée pour une raison précise, et tant
que cette raison tient, on ne rouvre pas.

La raison, vérifiée dans le code :

`apps/site-internet/src/app/api/checkout/helpers/types.ts:6`

```ts
price_ttc: z.number().min(0),
```

Le prix de chaque article **arrive du navigateur du client**. Il est contrôlé comme « un nombre
positif », rien de plus. Puis il sert directement de montant à payer :

`apps/site-internet/src/app/api/checkout/route.ts:132-151`

```ts
const unitAmount = Math.round(
  (item.price_ttc +
    item.eco_participation +
    (item.include_assembly ? item.assembly_price : 0)) *
    100
);
// … unit_amount: unitAmount → envoyé tel quel à Stripe
```

**Conséquence** : un client qui modifie la requête paie le prix qu'il choisit. Un canapé à
1 centime part avec un paiement Stripe valide, une commande enregistrée et un stock décrémenté.

Le code prouve d'ailleurs que l'équipe connaît le principe — le code promo, lui, **est** revérifié
côté serveur (`route.ts:36`, commentaire « NEVER trust frontend discount_amount »). C'est le prix du
produit qui a été oublié.

## Ce que tu ne fais pas

- Aucune migration, aucune écriture en base.
- Tu ne touches pas à `/api/webhooks/stripe` (paiements en cours).
- Tu ne rouvres **pas** la boutique toi-même : tu prépares tout, Roméo donne l'ordre.
- Tu ne refais pas le tunnel d'achat. Une correction ciblée, pas une refonte.

## Lecture préalable

- `apps/site-internet/src/app/api/checkout/route.ts` en entier
- `apps/site-internet/src/app/api/checkout/helpers/create-order.ts`
- `apps/site-internet/src/app/api/checkout/helpers/validate-promo.ts` — **le modèle à copier** :
  c'est exactement la démarche « ne fais pas confiance au navigateur », déjà appliquée aux promos
- `apps/site-internet/src/lib/maintenance.ts` — l'interrupteur de fermeture
- `.claude/rules/non-regression.md`

## À faire

### 1. Le prix vient de la base, jamais du navigateur

Le navigateur continue d'envoyer `product_id` et `quantity`. **Tout le reste se recalcule côté
serveur** : prix, écoparticipation, prix du montage.

- Lire les prix réels en base à partir des `product_id` reçus, en une seule requête.
- Construire les montants Stripe **uniquement** à partir de ces valeurs.
- Si un `product_id` est inconnu, ou si le produit n'est pas publié sur le site → refuser la
  commande (400), ne pas « corriger en silence ».
- **Comparer** le prix reçu au prix réel. En cas d'écart, refuser **et** enregistrer l'écart
  (`console.error` + remontée PostHog) : un écart est soit un bug d'affichage, soit une tentative.
  Les deux méritent d'être vus.

Attention : les prix du site vivent dans `channel_pricing` (canal site internet), pas dans
`products`. Vérifie le chemin réel avant d'écrire quoi que ce soit — lis le schéma, ne devine pas.

### 2. Les frais de port aussi

Même principe pour `fetchMaxProductShippingCents` et `buildShippingOptions` : les montants de
livraison ne doivent pas dépendre de ce que le navigateur annonce.

### 3. Un contrôle qui verrouille la règle

Un test autonome sur le modèle de `apps/site-internet/src/lib/__tests__/maintenance.test.ts` :

- un panier avec le bon prix passe ;
- **un panier avec un prix minoré est refusé** ;
- un `product_id` inconnu est refusé ;
- un produit non publié est refusé.

Ce test est le vrai livrable : il empêche la régression dans six mois.

### 4. Pendant que tu y es — mais dans la même demande, pas une autre

`apps/site-internet/src/app/api/contact/route.ts` écrit en base **sans aucune garde et sans
limitation de débit**. Formulaire public : n'importe qui peut remplir la table. Pose une limite
simple (par adresse IP, fenêtre courte). C'est cohérent avec le sujet « le site accepte n'importe
quoi », donc ça va dans la même demande.

## Vérification

- `type-check`, `lint`, `type-coverage` verts sur `@verone/site-internet` (seuil 98,12).
- Le test ci-dessus passe, **y compris le cas du prix minoré**.
- **Essai réel en local**, avec l'interrupteur de fermeture retiré : un achat complet au bon prix
  aboutit ; le même achat avec un prix modifié dans la requête est **refusé**.
- Aucune régression sur le code promo (il était déjà correct).

## Quand la boutique rouvre

**Pas avant l'ordre de Roméo.** Le geste est : retirer `SITE_MAINTENANCE` des variables Vercel du
projet `veronecollections-fr`, puis remettre en ligne. Deux minutes, aucun code.

Vérifier juste après : page d'accueil en 200, une fiche produit, un ajout au panier, et le webhook
Stripe toujours joignable.

## Ce que Roméo doit décider

Rien, sauf le moment de la réouverture. Si l'audit révèle un **deuxième** trou d'argent sur le
tunnel d'achat, tu t'arrêtes et tu le lui dis avant de continuer.
