-- [SITE-RECTIF-001] Corrections de contenu éditorial du site veronecollections.fr
--
-- Contexte : audit pré-promotion du site public. Les pages légales et les
-- contenus d'accueil ont été saisis SANS accents (problème de donnée, pas
-- d'encodage : l'éditeur CMS du back-office ne supprime pas les accents).
-- Les CGV pointaient vers l'ancien domaine « verone.fr », les délais de
-- livraison étaient incohérents (5-7 j vs 10-14 j) et une « livraison express »
-- inexistante était annoncée.
--
-- Décisions Roméo : retours = 14 jours partout · délai livraison = 10 à 14 jours
-- ouvrés · livraison express = retirée · collection de test = supprimée.
--
-- Aucun changement de schéma → aucune régénération de types.
-- NB : les mentions légales restent incomplètes (SIRET, capital, adresse du
-- siège, TVA intra, RCS) : ces informations doivent être fournies par Roméo
-- (interdiction de donnée fantôme). Ici on corrige uniquement les accents.

-- ===========================================================================
-- 1) Pages légales (cms_pages) — accents + domaine + délais
-- ===========================================================================

UPDATE cms_pages
SET title = $t$Conditions Générales de Vente$t$,
    content = $md$## Article 1 - Objet

Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre la société Vérone SAS et tout client effectuant un achat sur le site veronecollections.fr. Toute commande implique l'acceptation sans réserve des présentes CGV.

## Article 2 - Prix

Les prix sont indiqués en euros toutes taxes comprises (TTC), incluant la TVA française applicable au jour de la commande. Les frais de livraison sont indiqués séparément avant la validation de la commande.

## Article 3 - Commande

Toute commande passée sur le site veronecollections.fr constitue un contrat conclu à distance. Le client reconnaît avoir pris connaissance des présentes CGV avant de passer commande.

## Article 4 - Paiement

Le paiement s'effectue en ligne par carte bancaire via notre prestataire sécurisé Stripe. Le débit est effectué au moment de la validation de la commande.

## Article 5 - Livraison

Les délais de livraison sont indiqués lors de la commande. Vérone s'engage à expédier les produits dans les meilleurs délais. En cas de retard, le client sera informé par email.

## Article 6 - Droit de rétractation

Conformément à l'article L.221-18 du Code de la consommation, le client dispose d'un délai de 14 jours à compter de la réception pour exercer son droit de rétractation sans avoir à justifier de motifs.

## Article 7 - Garanties

Tous les produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés.

## Article 8 - Données personnelles

Les données personnelles collectées sont traitées conformément à notre politique de confidentialité et au RGPD.$md$
WHERE slug = 'cgv';

UPDATE cms_pages
SET title = $t$Questions Fréquentes$t$,
    content = $md$## Comment passer commande ?

Parcourez notre catalogue, ajoutez les produits souhaités à votre panier, puis procédez au paiement sécurisé par carte bancaire.

## Quels sont les délais de livraison ?

Les délais varient selon les produits. La livraison standard est de 10 à 14 jours ouvrés.

## Comment suivre ma commande ?

Vous recevrez un email avec un numéro de suivi dès que votre commande sera expédiée.

## Puis-je retourner un produit ?

Oui, vous disposez de 14 jours après réception pour retourner un produit.

## Comment contacter le service client ?

Par email à contact@veronecollections.fr ou via notre formulaire de contact.$md$
WHERE slug = 'faq';

UPDATE cms_pages
SET title = $t$Livraison$t$,
    content = $md$## Zones de livraison

Nous livrons actuellement en France métropolitaine.

## Modes de livraison

**Livraison standard** : 10 à 14 jours ouvrés

## Frais de livraison

Les frais sont calculés en fonction de votre commande. La livraison est offerte à partir d'un certain montant.

## Suivi de commande

Un email avec le numéro de suivi vous sera envoyé dès l'expédition.$md$
WHERE slug = 'livraison';

UPDATE cms_pages
SET title = $t$Mentions Légales$t$,
    content = $md$## Éditeur du site

**Vérone SAS**
Société par actions simplifiée
Capital social : en cours de constitution
Siège social : France

## Hébergement

Le site est hébergé par **Vercel Inc.**
440 N Barranca Ave, Covina, CA 91723, USA

## Directeur de publication

Roméo Dos Santos, Président

## Contact

Email : contact@veronecollections.fr$md$
WHERE slug = 'mentions-legales';

UPDATE cms_pages
SET title = $t$Retours et Échanges$t$,
    content = $md$## Droit de rétractation

Vous disposez de 14 jours calendaires à compter de la réception pour retourner un article.

## Conditions de retour

- Le produit doit être retourné dans son emballage d'origine
- Le produit ne doit pas avoir été utilisé ou endommagé
- Le retour doit être effectué dans les 14 jours

## Procédure de retour

1. Contactez-nous par email à contact@veronecollections.fr
2. Nous vous enverrons un bon de retour
3. Emballez soigneusement le produit
4. Déposez le colis au point de dépôt indiqué

## Remboursement

Le remboursement sera effectué sous 14 jours après réception et vérification du produit retourné.$md$
WHERE slug = 'retours';

-- ===========================================================================
-- 2) Contenus d'accueil (site_content) — accents
-- ===========================================================================

-- Hero : seul cta_text était sans accents ; image_url et le reste préservés.
UPDATE site_content
SET content_value = $json${
  "title": "Des trouvailles qui changent tout",
  "cta_link": "/catalogue",
  "cta_text": "Découvrir la sélection",
  "subtitle": "Concept store en ligne — décoration et mobilier sourcés avec soin",
  "image_url": "https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/verone/marketing/instagram/2026-05-10-02-hero-banc-lize/public"
}$json$::jsonb
WHERE content_key = 'hero';

-- Bandeau de réassurance : titres et descriptions ré-accentués.
UPDATE site_content
SET content_value = $json${
  "items": [
    {
      "title": "Sourcing créatif",
      "description": "On chine, on déniche, on sélectionne : chaque pièce est choisie pour son originalité et sa qualité."
    },
    {
      "title": "Qualité-prix",
      "description": "Des produits de qualité à des prix justes, sans les marges excessives du circuit traditionnel."
    },
    {
      "title": "Sélection tournante",
      "description": "Notre catalogue évolue au fil de nos trouvailles. Revenez souvent, il y a toujours du nouveau."
    }
  ]
}$json$::jsonb
WHERE content_key = 'reassurance';

-- ===========================================================================
-- 3) Suppression de la collection de test visible en production
--    « Collection Bohème Salon 2025 » (description de test « démonstration
--    inline edit pattern 2025 »). 3 produits liés (junction seulement, les
--    produits restent), 1 image de collection, 0 partage.
--    Suppression de donnée métier validée par Roméo (GO au merge).
-- ===========================================================================

DELETE FROM collection_products WHERE collection_id = 'c4ed5ee4-315f-452a-a847-809c5c7bb790';
DELETE FROM collection_images   WHERE collection_id = 'c4ed5ee4-315f-452a-a847-809c5c7bb790';
DELETE FROM collection_shares   WHERE collection_id = 'c4ed5ee4-315f-452a-a847-809c5c7bb790';
DELETE FROM collections         WHERE id = 'c4ed5ee4-315f-452a-a847-809c5c7bb790';
