-- =============================================================================
-- Migration: Create cms_pages table for editable legal/info pages
-- Date: 2026-04-12
-- Description:
--   Stores editable content pages (CGV, mentions legales, FAQ, livraison, retours, etc.)
--   Content is stored as Markdown, rendered on the site-internet.
--   Editable from the back-office CMS section.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);

COMMENT ON TABLE cms_pages IS 'Editable content pages (legal, FAQ, etc.) managed from back-office. Content is Markdown.';

-- RLS
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;

-- Public can read published pages
CREATE POLICY "public_read_published_cms_pages"
  ON cms_pages FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Staff full access
CREATE POLICY "staff_full_access_cms_pages"
  ON cms_pages FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Seed with existing page content
INSERT INTO cms_pages (slug, title, content, meta_title, meta_description) VALUES
('cgv', 'Conditions Generales de Vente',
'## Article 1 - Objet

Les presentes conditions generales de vente (CGV) regissent les relations contractuelles entre la societe Verone SAS et tout client effectuant un achat sur le site verone.fr. Toute commande implique l''acceptation sans reserve des presentes CGV.

## Article 2 - Prix

Les prix sont indiques en euros toutes taxes comprises (TTC), incluant la TVA francaise applicable au jour de la commande. Les frais de livraison sont indiques separement avant la validation de la commande.

## Article 3 - Commande

Toute commande passee sur le site verone.fr constitue un contrat conclu a distance. Le client reconnait avoir pris connaissance des presentes CGV avant de passer commande.

## Article 4 - Paiement

Le paiement s''effectue en ligne par carte bancaire via notre prestataire securise Stripe. Le debit est effectue au moment de la validation de la commande.

## Article 5 - Livraison

Les delais de livraison sont indiques lors de la commande. Verone s''engage a expedier les produits dans les meilleurs delais. En cas de retard, le client sera informe par email.

## Article 6 - Droit de retractation

Conformement a l''article L.221-18 du Code de la consommation, le client dispose d''un delai de 14 jours a compter de la reception pour exercer son droit de retractation sans avoir a justifier de motifs.

## Article 7 - Garanties

Tous les produits beneficient de la garantie legale de conformite et de la garantie contre les vices caches.

## Article 8 - Donnees personnelles

Les donnees personnelles collectees sont traitees conformement a notre politique de confidentialite et au RGPD.',
'Conditions Generales de Vente - Verone',
'CGV Verone : conditions de commande, paiement, livraison, droit de retractation et garanties.'
),
('mentions-legales', 'Mentions Legales',
'## Editeur du site

**Verone SAS**
Societe par actions simplifiee
Capital social : en cours de constitution
Siege social : France

## Hebergement

Le site est heberge par **Vercel Inc.**
440 N Barranca Ave, Covina, CA 91723, USA

## Directeur de publication

Romeo Dos Santos, President

## Contact

Email : contact@veronecollections.fr',
'Mentions Legales - Verone',
'Mentions legales du site Verone : editeur, hebergeur, directeur de publication.'
),
('faq', 'Questions Frequentes',
'## Comment passer commande ?

Parcourez notre catalogue, ajoutez les produits souhaites a votre panier, puis procedez au paiement securise par carte bancaire.

## Quels sont les delais de livraison ?

Les delais varient selon les produits. La livraison standard est de 5 a 7 jours ouvrables. Les delais precis sont indiques lors de la commande.

## Comment suivre ma commande ?

Vous recevrez un email de confirmation avec un numero de suivi des que votre commande sera expediee. Vous pouvez egalement suivre votre commande depuis votre espace client.

## Puis-je retourner un produit ?

Oui, vous disposez de 14 jours apres reception pour retourner un produit. Consultez notre page Retours pour les details.

## Comment contacter le service client ?

Par email a contact@veronecollections.fr ou via notre formulaire de contact.',
'FAQ - Verone',
'Questions frequentes sur les commandes, livraisons, retours et service client Verone.'
),
('livraison', 'Livraison',
'## Zones de livraison

Nous livrons actuellement en France metropolitaine.

## Modes de livraison

**Livraison standard** : 5 a 7 jours ouvrables
**Livraison express** : 2 a 3 jours ouvrables (si disponible)

## Frais de livraison

Les frais de livraison sont calcules en fonction du poids et du volume de votre commande. La livraison est offerte a partir d''un certain montant d''achat (voir les conditions en vigueur au moment de votre commande).

## Suivi de commande

Un email de confirmation avec le numero de suivi vous sera envoye des l''expedition de votre commande.

## Probleme de livraison

En cas de colis endommage ou non recu, contactez-nous dans les 48h suivant la date de livraison prevue.',
'Livraison - Verone',
'Informations livraison Verone : zones, delais, frais et suivi de commande.'
),
('retours', 'Retours et Echanges',
'## Droit de retractation

Vous disposez de 14 jours calendaires a compter de la reception de votre commande pour nous retourner un article, conformement a l''article L.221-18 du Code de la consommation.

## Conditions de retour

- Le produit doit etre retourne dans son emballage d''origine
- Le produit ne doit pas avoir ete utilise, lave ou endommage
- Le retour doit etre effectue dans les 14 jours suivant la reception

## Procedure de retour

1. Contactez-nous par email a contact@veronecollections.fr
2. Nous vous enverrons un bon de retour
3. Emballez soigneusement le produit
4. Deposez le colis au point de depot indique

## Remboursement

Le remboursement sera effectue sous 14 jours apres reception et verification du produit retourne, par le meme moyen de paiement que celui utilise lors de la commande.',
'Retours et Echanges - Verone',
'Politique de retour Verone : droit de retractation, conditions, procedure et remboursement.'
);
