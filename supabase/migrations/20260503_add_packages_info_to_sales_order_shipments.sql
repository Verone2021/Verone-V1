-- BO-SHIP-UX-002 — Stocker les dimensions et poids des colis envoyés à Packlink
-- Permet d'afficher l'historique des colis dans le wizard d'expédition pour
-- que l'utilisateur puisse reproduire la config (commande de 60 articles
-- en 4 colis : voir le colis 1 pour préparer le colis 2/3/4).

ALTER TABLE public.sales_order_shipments
ADD COLUMN IF NOT EXISTS packages_info jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.sales_order_shipments.packages_info IS
  'Liste des colis envoyés à Packlink au moment de la création du shipment. '
  'Format : [{"weight": 5, "width": 30, "height": 30, "length": 30}]. '
  'Dimensions en cm, poids en kg. Permet l''affichage historique colis '
  'précédents dans le wizard d''expédition (BO-SHIP-UX-002). '
  'Identique pour toutes les rows d''un même shipment (groupé par shipped_at).';
