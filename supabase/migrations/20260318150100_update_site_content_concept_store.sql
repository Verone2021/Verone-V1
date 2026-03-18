-- Repositionnement Verone : concept store pop-up
-- Mise a jour des contenus CMS (hero, reassurance, banner)

UPDATE site_content
SET content_value = jsonb_build_object(
  'title', 'Des trouvailles qui changent tout',
  'subtitle', 'Concept store en ligne — produits originaux, sources avec soin, au juste prix',
  'cta_text', 'Decouvrir la selection',
  'cta_link', '/catalogue',
  'image_url', NULL
)
WHERE content_key = 'hero';

UPDATE site_content
SET content_value = jsonb_build_object(
  'items', jsonb_build_array(
    jsonb_build_object(
      'title', 'Sourcing creatif',
      'description', 'On chine, on deniche, on selectionne : chaque piece est choisie pour son originalite et sa qualite.'
    ),
    jsonb_build_object(
      'title', 'Qualite-prix',
      'description', 'Des produits de qualite a des prix justes, sans les marges excessives du circuit traditionnel.'
    ),
    jsonb_build_object(
      'title', 'Selection tournante',
      'description', 'Notre catalogue evolue au fil de nos trouvailles. Revenez souvent, il y a toujours du nouveau.'
    )
  )
)
WHERE content_key = 'reassurance';

UPDATE site_content
SET content_value = jsonb_build_object(
  'enabled', true,
  'text', 'Livraison offerte des 200 € — Code bienvenue : NEWCLIENT',
  'link', NULL,
  'bg_color', '#000000',
  'text_color', '#ffffff'
)
WHERE content_key = 'banner';
