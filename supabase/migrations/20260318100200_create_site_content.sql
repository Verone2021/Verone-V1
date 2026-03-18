-- CMS key-value content for site-internet
CREATE TABLE site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text NOT NULL UNIQUE,
  content_value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Public read access (site-internet needs to read content)
CREATE POLICY "public_read_site_content" ON site_content
  FOR SELECT TO anon, authenticated
  USING (true);

-- Staff can manage content
CREATE POLICY "staff_manage_site_content" ON site_content
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Seed default content
INSERT INTO site_content (content_key, content_value) VALUES
  ('hero', '{"title": "L''art de vivre à la française", "subtitle": "Mobilier & décoration d''intérieur haut de gamme", "cta_text": "Découvrir la collection", "cta_link": "/catalogue", "image_url": null}'),
  ('reassurance', '{"items": [{"title": "Livraison soignée", "description": "Chaque pièce est emballée avec soin et livrée à domicile avec prise de rendez-vous."}, {"title": "Qualité garantie", "description": "Des matériaux nobles sélectionnés auprès des meilleurs artisans et manufactures."}, {"title": "Conseil personnalisé", "description": "Notre équipe vous accompagne dans le choix de vos pièces de mobilier et décoration."}]}'),
  ('banner', '{"enabled": false, "text": "", "link": null, "bg_color": "#000000", "text_color": "#ffffff"}');
