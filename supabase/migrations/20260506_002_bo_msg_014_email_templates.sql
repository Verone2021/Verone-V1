-- BO-MSG-014 : enrichissement de la table email_templates pour la composition
-- de mails depuis le BO (sprint compose/reply).
--
-- Ajoute :
-- - brand : marque destinataire ('verone' | 'linkme' | 'all')
-- - default_alias : alias d'envoi par défaut ('contact' | 'commandes')
-- - body_text : version texte fallback (Gmail apprécie un text/plain)
-- - tags : array text pour filtres rapides

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS brand text NULL
    CHECK (brand IS NULL OR brand IN ('verone', 'linkme', 'all')),
  ADD COLUMN IF NOT EXISTS default_alias text NULL
    CHECK (default_alias IS NULL OR default_alias IN ('contact', 'commandes')),
  ADD COLUMN IF NOT EXISTS body_text text NULL,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE INDEX IF NOT EXISTS idx_email_templates_brand
  ON public.email_templates(brand)
  WHERE brand IS NOT NULL AND active = true;
CREATE INDEX IF NOT EXISTS idx_email_templates_category
  ON public.email_templates(category)
  WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_email_templates_tags
  ON public.email_templates USING GIN (tags)
  WHERE active = true;

COMMENT ON COLUMN public.email_templates.brand IS
  'Marque destinataire (verone, linkme, all). NULL = compatible toutes marques.';
COMMENT ON COLUMN public.email_templates.default_alias IS
  'Alias par defaut (contact ou commandes). Pre-remplit le from de la compose modal.';
COMMENT ON COLUMN public.email_templates.body_text IS
  'Version texte fallback. Si NULL, le compose modal generera depuis html_body via strip-tags.';
COMMENT ON COLUMN public.email_templates.tags IS
  'Tags libres pour filtrage (relance, devis, facture, etc.).';
