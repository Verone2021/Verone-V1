# `[SI-CHECKOUT-PRICE-001]` — le prix encaissé vient de la base, plus du navigateur

Branche `fix/SI-CHECKOUT-PRICE-001-prix-serveur`. Aucune migration.
**La boutique n'est pas rouverte** : ce sprint corrige, il n'ouvre rien.

---

## Le trou, tel qu'il était

`apps/site-internet/src/app/api/checkout/helpers/types.ts:6` validait
`price_ttc: z.number().min(0)` et `route.ts:132-151` envoyait cette valeur
telle quelle à Stripe. Le prix, l'éco-participation et le prix du montage
venaient tous les trois du navigateur du client.

Conséquence : requête modifiée = prix choisi par l'acheteur, paiement Stripe
valide, commande enregistrée.

Le code promo, lui, était déjà revérifié côté serveur (`route.ts:36`,
« NEVER trust frontend discount_amount »). Ce sprint applique le même principe
au prix du produit.

---

## Ce qui a été fait

### 1. Prix relus en base — `src/lib/checkout/`

- `catalog-prices.ts` — lit les prix via **`get_site_internet_products`**,
  exactement la fonction qui alimente la fiche produit et le catalogue.
  Même source des deux côtés = le prix affiché et le prix encaissé ne peuvent
  pas diverger. La fonction ne renvoie que les produits vendables en ligne :
  un produit dépublié en disparaît, donc il est refusé sans code supplémentaire.
  Projection et filtre `product_id=in.(…)` posés côté serveur : une seule
  requête, payload réduit aux 6 colonnes utiles.
- `resolve-cart.ts` — fonction **pure** qui reconstruit chaque ligne :
  montant unitaire, sous-total, et **libellé Stripe** viennent de la base.
  Les valeurs du navigateur ne servent plus qu'à une chose : être comparées.

Trois motifs de refus, jamais de correction silencieuse :

| Motif                  | Déclenché quand                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| `produit_indisponible` | `product_id` inconnu, dépublié, sans prix ou sans image                  |
| `montage_indisponible` | montage demandé sur un produit qui n'en propose pas                      |
| `prix_modifie`         | écart d'au moins **1 centime** entre annoncé et réel, dans les deux sens |

Chaque refus est journalisé `[Checkout][PANIER_REFUSE] <motif> — <détail>`.
PostHog n'est pas branché sur le site internet (seulement sur le back-office) :
la trace part dans les journaux Vercel. À rebrancher le jour où PostHog couvrira
le site.

### 2. Plus de repli dangereux

Si la base est injoignable, la route répondait avant en créant quand même une
session Stripe avec les prix du navigateur. Elle répond maintenant **503**.

### 3. Frais de port

`fetchMaxProductShippingCents` et `buildShippingOptions` lisaient déjà tout en
base, sauf le sous-total qui servait au seuil de franco. Ce sous-total vient
désormais de `resolveCartItems`, donc de la base.

### 4. Bug trouvé en chemin — **toute commande avec code promo était refusée**

Le navigateur envoyait `{ code, amount }`, le schéma exigeait
`{ discount_id, code, discount_type, discount_value, discount_amount }`.
Résultat : `400 Données invalides` sur **toute** commande avec un code promo.
Vérifié en exécutant le schéma réel (`CheckoutSchema.safeParse`).

Corrigé dans le même lot, dans le sens du sprint : le navigateur n'envoie plus
que le **code**, le montant est recalculé côté serveur comme les prix.

### 5. Message visible pour le client

Un refus se voyait uniquement dans la console. Un bandeau rouge (`role="alert"`)
affiche maintenant le motif au-dessus du bouton de paiement — sans quoi un
client dont le prix a bougé resterait devant un bouton muet.

### 6. Formulaire de contact — limitation de débit

`src/lib/rate-limit.ts` : fenêtre glissante en mémoire, **3 envois par quart
d'heure et par adresse**, réponse `429` + `Retry-After`.
Portée honnête et documentée dans le fichier : la mémoire est celle d'une
instance Vercel, donc la limite réelle est un multiple. C'est assez pour couper
un remplissage en boucle sans ajouter Redis ni écriture en base.

---

## Vérifications

### Contrôles

`type-check` ✅ · `lint` ✅ · `type-coverage` **98,49 %** (seuil 98,12) ✅

### Tests unitaires — le vrai livrable

```
npx tsx apps/site-internet/src/lib/__tests__/resolve-cart.test.ts   → 14/14
npx tsx apps/site-internet/src/lib/__tests__/rate-limit.test.ts     →  6/6
```

Couvre : bon prix, prix minoré (le canapé à 1 centime), prix majoré,
éco-participation minorée, écart d'un seul centime, produit inconnu, produit
dépublié, montage au prix de la base, montage minoré, montage non proposé,
quantité, panier mixte dont une seule ligne triche, panier vide.

### Essais réels, serveur local, contre la base de production

| Cas                                             | Réponse                                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| Table à manger à **0,01 €** au lieu de 682,20 € | **400** `prix_modifie`                                                     |
| Même table à 9 999 €                            | **400** `prix_modifie`                                                     |
| Montage demandé sur un produit sans montage     | **400** `montage_indisponible`                                             |
| `product_id` inconnu (bien formé)               | **400** `produit_indisponible`                                             |
| Produit non publié (`Sac jute GM`)              | **400** `produit_indisponible`                                             |
| Code promo inexistant                           | **400** « Code promo invalide » — preuve que le contrat promo passe enfin  |
| **Panier au bon prix**                          | **200**, session Stripe `cs_test_…`, commande `VER-SI-1012` à **682,20 €** |
| Formulaire de contact, 4 envois d'affilée       | 200, 200, 200, **429**                                                     |

Lecture seule contre la base réelle (`fetchCatalogPrices` + `resolveCartItems`) :
1 produit sur 2 retrouvé (le dépublié est bien absent), prix 682,20 €, libellé
« Table à manger ovale natura », total 2 × = 136 440 centimes.

### Données d'essai — relevées, signalées, supprimées

Empreinte avant : **10** commandes site, dernière `VER-SI-1011`.
L'essai complet a créé `VER-SI-1012` (brouillon, 682,20 €) + 1 client d'essai

- 3 messages de contact.

Effets de bord vérifiés **avant** suppression : 0 mouvement de stock,
prévisionnel sortant du produit à 0, 0 attribution ambassadeur.

Après nettoyage : **10** commandes, dernière `VER-SI-1011`, 0 client d'essai,
0 message d'essai (5 vrais messages intacts), stock réel du produit inchangé (1).
**Base strictement dans son état d'avant.**

⚠️ Les 3 messages de contact d'essai ont déclenché l'envoi réel de
3 notifications vers `contact@veronecollections.fr` (objet « Essai limite »)
et 3 accusés vers une adresse `example.com` qui rebondiront. À ignorer.

---

## Trouvé, pas corrigé (hors périmètre, signalé)

- **L'adresse de facturation est envoyée par le navigateur et ignorée.**
  `checkout/page.tsx` envoie `billing` quand elle diffère de la livraison ;
  le schéma ne la déclare pas, Zod la retire, et `createDraftOrder` n'écrit
  jamais `billing_address`. Perte de donnée silencieuse, pas un trou d'argent.
- `unit_price_ht` des lignes de commande ignore l'éco-participation et le
  montage, alors que `total_ttc` les inclut. Comportement antérieur, inchangé.
- Le flux Google par API calcule encore un prix depuis `product.price_ht`,
  colonne inexistante (déjà au backlog).

---

## Réouverture

**Pas dans ce sprint.** Le geste reste : retirer `SITE_MAINTENANCE` des
variables Vercel du projet `veronecollections-fr`, puis remettre en ligne.
À faire sur ordre de Roméo, jamais d'initiative.
