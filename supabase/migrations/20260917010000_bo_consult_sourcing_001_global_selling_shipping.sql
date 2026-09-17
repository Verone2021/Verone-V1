-- [BO-CONSULT-SOURCING-001] Livraison facturée au client, au niveau de la consultation
--
-- Demande Roméo (17/09/2026) : la livraison refacturée au client s'estime soit
-- ligne par ligne, soit une fois pour toute la consultation — « l'un ou l'autre,
-- on ne peut pas mettre les deux en même temps, sinon ça crée des bugs ».
-- Cette colonne porte le montant global ; l'écran verrouille l'un dès que l'autre
-- est saisi.
--
-- Simulation uniquement : comme le reste de la consultation, ce montant ne sort
-- pas vers les documents ni vers les moyennes produit.

ALTER TABLE public.client_consultations
  ADD COLUMN IF NOT EXISTS selling_shipping_cost_ht NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.client_consultations
  DROP CONSTRAINT IF EXISTS client_consultations_selling_shipping_positive;

ALTER TABLE public.client_consultations
  ADD CONSTRAINT client_consultations_selling_shipping_positive
  CHECK (selling_shipping_cost_ht >= 0);

COMMENT ON COLUMN public.client_consultations.selling_shipping_cost_ht IS
  'Livraison HT refacturée au client pour toute la consultation. Exclusive de sales_order-like consultation_products.selling_shipping_cost (par ligne) : l''écran interdit les deux à la fois. [BO-CONSULT-SOURCING-001]';
