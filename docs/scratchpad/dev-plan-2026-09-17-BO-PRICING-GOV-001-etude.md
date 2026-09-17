# Étude du chantier prix — `[BO-PRICING-GOV-001]`

**Pour qui** : Roméo, qui valide avant que quoi que ce soit d'autre soit codé.
**Demandée le** : 2026-09-17, après la remarque « tout fonctionnait, j'ai envie que tout continue
à fonctionner comme avant ».
**Règle de ce document** : chaque changement a sa mesure avant, sa mesure après, et sa commande de
retour arrière. Aucun changement n'est décrit sans son retour arrière.

---

## 0. Comment lire ce document

Chaque étape suit le même gabarit :

| Rubrique                   | Ce qu'elle dit                                       |
| -------------------------- | ---------------------------------------------------- |
| **But**                    | ce que ça apporte à Roméo                            |
| **Ce que ça touche**       | la table, la fonction ou l'écran exact               |
| **Ce qui pourrait casser** | le risque réel, nommé, pas « aucun risque »          |
| **Mesure avant / après**   | la requête d'empreinte du § 1, jouée des deux côtés  |
| **Retour arrière**         | la commande exacte, testée, qui remet l'état d'avant |

Deux mots à retenir :

- **Changement additif** : on ajoute quelque chose que rien ne lit encore. Le logiciel qui tourne
  aujourd'hui ne le voit pas. Retour arrière = supprimer ce qu'on a ajouté.
- **Changement de comportement** : on modifie ce que le logiciel fait déjà. C'est là qu'on peut
  casser quelque chose. Il n'y en a que **deux** dans tout le chantier, et ils sont en dernier.

---

## 1. L'empreinte de référence

Cette requête est jouée **avant et après chaque étape**. Tout écart non prévu = on arrête et on
revient en arrière.

```sql
select
 (select count(*) from get_site_internet_products())                     as produits_en_ligne_site,
 (select round(sum(price_ht),0) from get_site_internet_products())       as valeur_catalogue_ht,
 (select count(*) from get_site_internet_products()
    where price_source='channel_pricing')                                as prix_de_canal,
 (select count(*) from get_site_internet_products()
    where price_source='base_price')                                     as prix_de_repli,
 (select count(*) from products where archived_at is null)               as produits,
 (select count(*) from stock_movements)                                  as mouvements_stock,
 (select count(*) from stock_alert_tracking)                             as alertes,
 (select coalesce(sum(stock_real),0) from products)                      as stock_reel_total,
 (select coalesce(sum(stock_forecasted_out),0) from products)            as previsionnel_sortant,
 (select coalesce(sum(stock_forecasted_in),0) from products)             as previsionnel_entrant,
 (select count(*) from channel_pricing where is_active)                  as prix_canal_actifs,
 (select count(*) from channel_pricing where custom_price_ht is not null) as prix_canal_saisis,
 (select count(*) from price_list_items where is_active)                 as lignes_liste_base,
 (select count(*) from sales_orders)                                     as commandes_clients,
 (select count(*) from linkme_selection_items)                           as lignes_selections_linkme;
```

**Valeur de référence, relevée le 2026-09-17 à 19 h 45 UTC** (identique à celle d'avant le premier
changement du chantier) :

| Mesure                         |          Valeur |
| ------------------------------ | --------------: |
| Produits en ligne sur le site  |         **125** |
| Valeur catalogue affichée      | **13 845 € HT** |
| dont à prix de canal           |              29 |
| dont au prix de repli          |              96 |
| Produits non archivés          |             224 |
| Mouvements de stock            |             402 |
| Alertes stock                  |               1 |
| Stock réel total               |           2 707 |
| Prévisionnel sortant / entrant |         147 / 0 |
| Prix de canal actifs / saisis  |       107 / 100 |
| Lignes de la liste de base     |             207 |
| Commandes clients              |             192 |
| Lignes de sélections LinkMe    |              45 |

---

## 2. Ce qui est DÉJÀ fait (et comment tout annuler)

Sept changements, **tous additifs**. Aucun prix modifié, aucun produit modifié, aucune commande,
aucun stock, aucun déclencheur. Empreinte identique avant et après, vérifiée.

| #   | Changement                                                     | Rempli ?     | Lu par le logiciel en ligne ? |
| --- | -------------------------------------------------------------- | ------------ | ----------------------------- |
| 1   | `products` : 3 colonnes (prix de revient à la main)            | vides        | non                           |
| 2   | `categories` : 2 colonnes coefficients                         | 8 catégories | non                           |
| 3   | `families` : 2 colonnes coefficients                           | 1 famille    | non                           |
| 4   | `subcategories` : 2 colonnes coefficients                      | vides        | non                           |
| 5   | `channel_pricing` : 2 colonnes + 1 index                       | vides        | non                           |
| 6   | `app_settings` : 1 ligne de réglage                            | oui          | non                           |
| 7   | `get_categories_with_real_counts` : renvoie 2 colonnes de plus | —            | **oui**                       |

**Le n° 7 est le seul qui touche quelque chose qui tourne.** Ajouter une colonne au résultat d'une
fonction ne casse pas un lecteur existant — il lit les colonnes qu'il connaît et ignore le reste —
mais c'est le seul point du chantier qui mérite d'être nommé.

### Retour arrière complet des sept changements

À jouer d'un bloc. Remet la base exactement dans son état du 2026-09-17 au matin.

```sql
-- 1 à 5 : retrait des colonnes ajoutées (leurs contraintes et index partent avec)
alter table public.products
  drop column if exists cost_net_manual,
  drop column if exists cost_net_manual_at,
  drop column if exists cost_net_manual_by;

alter table public.categories
  drop column if exists retail_coefficient,
  drop column if exists wholesale_coefficient;

alter table public.families
  drop column if exists retail_coefficient,
  drop column if exists wholesale_coefficient;

alter table public.subcategories
  drop column if exists retail_coefficient,
  drop column if exists wholesale_coefficient;

alter table public.channel_pricing
  drop column if exists price_validated_at,
  drop column if exists price_validated_by;

-- 6 : retrait du réglage
delete from public.app_settings where setting_key = 'pricing_default_coefficients';

-- 7 : fonction remise dans sa définition d'origine, mot pour mot
drop function if exists public.get_categories_with_real_counts();

create function public.get_categories_with_real_counts()
returns table (
  id uuid, name character varying, slug character varying, description text,
  level integer, display_order integer, family_id uuid, google_category_id integer,
  facebook_category character varying, image_url text, is_active boolean,
  created_at timestamp with time zone, updated_at timestamp with time zone,
  subcategory_count bigint
)
language plpgsql security definer set search_path to 'public'
as $function$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.slug, c.description, c.level, c.display_order, c.family_id,
    c.google_category_id, c.facebook_category, c.image_url, c.is_active,
    c.created_at, c.updated_at, COUNT(s.id) as subcategory_count
  FROM categories c
  LEFT JOIN subcategories s ON s.category_id = c.id
  GROUP BY c.id, c.name, c.slug, c.description, c.level, c.display_order, c.family_id,
    c.google_category_id, c.facebook_category, c.image_url, c.is_active,
    c.created_at, c.updated_at
  ORDER BY c.level, c.display_order;
END;
$function$;

revoke execute on function public.get_categories_with_real_counts() from public, anon;
grant execute on function public.get_categories_with_real_counts() to authenticated, service_role;
```

**Ce retour arrière a été essayé pour de vrai le 2026-09-17 à 20 h 05 UTC**, joué d'un bloc dans une
transaction ensuite annulée. Résultat constaté à l'intérieur de la transaction : 0 colonne restante,
réglage retiré, fonction d'origine opérationnelle (12 catégories lues), et **125 produits toujours en
ligne**. Puis annulation, et état revérifié après : 11 colonnes en place, réglage présent, 125
produits, 13 845 € HT, 402 mouvements de stock, 2 707 en stock réel. Rien n'a bougé.

Côté code : deux enregistrements sur la branche `feat/BO-PRICING-GOV-001-prix-valide-coefficients`,
**jamais envoyés, jamais fusionnés**. Le back-office en ligne ne les a pas. Retour arrière =
abandonner la branche.

---

## 3. Les étapes qui restent

### Étape A — Écrans de réglage des coefficients _(additif)_

- **But** : Roméo ajuste ses coefficients lui-même, sur Famille, Catégorie ou Sous-catégorie. Le plus
  précis l'emporte ; un niveau laissé vide hérite du niveau au-dessus.
- **Ce que ça touche** : les fiches `produits/catalogue/families/[id]`, `categories/[id]`,
  `subcategories/[id]`. Deux champs par fiche.
- **Ce qui pourrait casser** : ces fiches servent déjà à renommer et réorganiser l'arborescence. Un
  champ mal branché pourrait empêcher l'enregistrement du reste de la fiche.
- **Mesure avant / après** : empreinte + nombre de familles, catégories et sous-catégories
  (inchangé), et un renommage d'essai sur une entrée, remis à l'identique.
- **Retour arrière** : retirer les champs des trois fiches. Aucune donnée touchée.

### Étape B — Filtres et tri sur les nouvelles colonnes _(additif)_

- **But** : « montre-moi les 96 produits au prix de repli », « ceux sous le coefficient conseillé ».
- **Ce que ça touche** : la barre de filtres du catalogue, en lecture seule.
- **Ce qui pourrait casser** : les filtres existants (famille, fournisseur, statut) passent par le
  même état d'écran ; un filtre mal ajouté peut en neutraliser un autre.
- **Mesure avant / après** : nombre de produits retournés par chaque filtre existant, avant et après.
- **Retour arrière** : retirer les filtres ajoutés.

### Étape C — Correction du prix depuis la ligne _(écriture, mais une à la fois)_

- **But** : corriger un prix sans ouvrir la fiche. C'est le principal défaut de ce que j'ai livré.
- **Ce que ça touche** : écriture dans `channel_pricing` via la route existante
  `api/channel-pricing/upsert` — **route non modifiée**, on l'appelle, c'est tout.
- **Ce qui pourrait casser** : un prix écrasé par mégarde. Parade : `Échap` annule sans rien écrire,
  la valeur d'avant est affichée jusqu'à confirmation, et chaque écriture est historisée dans
  `channel_pricing_history`, qui existe déjà.
- **Mesure avant / après** : le prix du produit d'essai relevé avant, remis à l'identique après, et
  revérifié en base. Essai fait sur **un produit choisi avec Roméo**, jamais au hasard.
- **Retour arrière** : `update channel_pricing set custom_price_ht = <valeur relevée> where id = <id>`.

### Étape D — Reprise groupée des 96 prix _(écriture en masse — validation Roméo obligatoire)_

- **But** : reprendre les 96 prix de repli sans les faire un par un.
- **Ce que ça touche** : `channel_pricing`, jusqu'à 96 lignes.
- **Ce qui pourrait casser** : c'est **le** moment où une erreur se voit sur la boutique. Parades :
  l'écran affiche le prix proposé à côté du prix actuel, Roméo décoche ce qu'il veut, **rien n'est
  écrit sans son clic**, et l'opération se fait par lots de 10 avec l'empreinte rejouée entre chaque.
- **Mesure avant / après** : la liste complète des 96 prix relevée et enregistrée dans un fichier
  avant l'opération, puis comparée ligne à ligne après.
- **Retour arrière** : le fichier des 96 prix d'avant permet de tout remettre, un `update` par ligne.

### Étape E — Rapport « Prix & marges » _(additif, lecture seule)_

- **But** : le bouton demandé. Tous les produits, leurs prix par canal, ceux sous la marge conseillée.
- **Ce que ça touche** : un nouvel écran. Il ne fait que lire.
- **Ce qui pourrait casser** : rien en écriture. Risque réel : une requête trop lourde qui ralentit la
  base, comme l'incident du 15/09.
- **Mesure avant / après** : temps de réponse de la requête du rapport, mesuré sur les 224 produits.
  Au-delà de 2 secondes, on pagine avant de livrer.
- **Retour arrière** : retirer la page et le bouton.

### Étape F — Cohérence LinkMe / site _(changement de comportement — 1er des deux)_

- **But** : refuser un prix LinkMe qui ne serait pas au moins 5 % sous le prix du site.
- **Ce que ça touche** : la route `api/channel-pricing/upsert`, qui est **aujourd'hui utilisée** par
  la fiche produit et l'écran LinkMe.
- **Ce qui pourrait casser** : un enregistrement de prix légitime refusé à tort. Parades : le refus
  est accompagné du prix maximum autorisé, Roméo peut forcer avec un motif, et le motif est historisé.
- **Mesure avant / après** : un jeu d'essai de 5 cas joués contre la route (prix conforme, prix sous
  le plancher, prix forcé, produit sans prix site, produit sans prix de revient), et l'empreinte.
- **Retour arrière** : retirer la vérification de la route. Un enregistrement de code à annuler.

### Étape G — Plus de prix public non décidé _(changement de comportement — 2e et dernier)_

- **But** : ce que Roméo a demandé — plus aucun produit en ligne à un prix que personne n'a décidé.
- **Ce que ça touche** : `get_site_internet_products`, **la fonction qui décide ce que le site
  affiche**. C'est le changement le plus sensible de tout le chantier.
- **Ce qui pourrait casser** : **la boutique passe de 125 à 30 produits.** Ce n'est pas un effet de
  bord, c'est l'effet voulu, décidé par Roméo le 17/09 (« on coupe tout de suite, je valide au fil de
  l'eau »). Mais il doit être fait **les yeux ouverts** : un soir, hors heures de bureau, après
  l'étape D si Roméo veut éviter le creux.
- **Mesure avant / après** : l'empreinte, plus la liste nominative des produits qui sortent, fournie
  à Roméo avant de lancer.
- **Retour arrière** : la définition actuelle de la fonction est enregistrée mot pour mot dans la
  migration ; un `create or replace` la remet, et les 125 produits reviennent en moins d'une seconde.

---

## 4. Ordre proposé et points d'arrêt

```
A  réglages coefficients      additif      ─┐
B  filtres et tri             additif       │ aucun risque pour la boutique
E  rapport prix & marges      additif      ─┘
C  correction depuis la ligne écriture 1/1   → essai sur 1 produit choisi avec Roméo
F  règle des 5 % LinkMe       comportement  → jeu d'essai de 5 cas
D  reprise des 96 prix        écriture masse → GO Roméo, par lots de 10
G  plus de prix non décidé    comportement  → GO Roméo, le soir, liste fournie avant
```

**Trois points d'arrêt où j'attends un GO explicite** : avant C (choix du produit d'essai), avant D
(reprise des 96 prix) et avant G (la boutique passe à 30 produits).

Le reste, j'avance sans demander : c'est additif et rien en ligne ne le lit.

---

## 5. Ce que ce chantier ne fera pas

- Aucune modification d'un déclencheur de stock (`.claude/rules/stock-triggers-protected.md`).
- Aucune modification d'une route Qonto.
- Aucune touche à la mécanique LinkMe : prix figés sur les lignes, commissions, déclencheurs de
  propagation. Lecture seule.
- Aucune activation des 4 listes de prix par canal vides (`Wholesale`, `B2B`, `E-Commerce`,
  `Retail`) : deux systèmes de prix en parallèle, c'est la dérive garantie.

---

## 6. Deux défauts trouvés pendant l'audit, hors de ce chantier

Ils ne sont pas traités ici, et ils ne doivent pas se perdre.

1. **Le site ne revérifie pas le prix au moment du paiement.** Le prix vient du navigateur du client
   et sert tel quel pour Stripe et pour la commande enregistrée
   (`apps/site-internet/src/app/api/checkout/helpers/create-order.ts:156`). Sujet argent, PR dédiée.
2. **Le flux Google par l'API calcule un prix qui n'existe pas** (`product.price_ht`, colonne absente
   de `products`). Sans effet aujourd'hui — Google et Meta lisent le flux du site, qui est juste —
   mais c'est du code mort prêt à diverger.
