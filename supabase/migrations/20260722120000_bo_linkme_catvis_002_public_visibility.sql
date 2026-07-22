-- BO-LINKME-CATVIS-002 — Filtrage visibilité catalogue côté PUBLIC (visiteurs sans compte)
--
-- Contexte : CATVIS-001 a ajouté products.is_visible_in_linkme_catalog + le toggle
-- back-office + le filtrage côté affilié CONNECTÉ (use-linkme-catalog.ts). Mais les
-- surfaces PUBLIQUES (vitrine page d'accueil LinkMe + pages de sélection publiques /s/…)
-- n'appliquaient pas ce drapeau : un produit masqué restait visible aux visiteurs sans
-- compte. Décision Roméo (2026-07-20) : masquage GLOBAL — un produit masqué disparaît
-- de TOUTES les surfaces publiques.
--
-- Cette migration ajoute DEUX garde-fous côté public à :
--   1. la vue `linkme_public_products` (vitrine d'accueil)
--   2. get_public_selection(uuid)                 — page sélection publique
--   3. get_public_selection(text, text)           — page sélection publique (slug + token)
--   4. get_public_selection_by_slug(text)         — page sélection publique (slug)
--
-- Garde-fou 1 — visibilité : `is_visible_in_linkme_catalog = true`.
-- Garde-fou 2 — pas de produit sur-mesure/réservé au public (décision Roméo 2026-07-22) :
--   `assigned_client_id IS NULL AND enseigne_id IS NULL AND created_by_affiliate IS NULL`.
--   Un produit « public général » = exactement la définition de la logique affilié
--   (apps/linkme/src/lib/hooks/use-linkme-catalog.ts). Vérifié en base : 4 produits
--   réservés apparaissaient dans la vitrine, 6 dans des sélections publiées — ils
--   disparaissent avec ce filtre.
--
-- Non-régression : `is_visible` vaut `true` par défaut et les produits Vérone généraux
-- n'ont ni client, ni enseigne, ni affilié assigné → ils restent visibles (19 en vitrine).
-- Les objets sont recréés à l'identique (corps intégral) avec les seules clauses en plus ;
-- CREATE OR REPLACE préserve propriétaire et droits (anon SELECT sur la vue, EXECUTE des
-- fonctions).

-- 1) Vitrine page d'accueil publique -----------------------------------------
CREATE OR REPLACE VIEW public.linkme_public_products AS
 SELECT p.id::text AS id,
    p.name,
    p.slug,
    c.name AS category,
    pi.public_url AS image_url,
    cp.is_featured,
    cp.display_order
   FROM products p
     JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid AND cp.is_active = true AND cp.is_public_showcase = true
     JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true AND pi.public_url IS NOT NULL
     LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
     LEFT JOIN categories c ON c.id = sc.category_id
  WHERE p.product_status = 'active'::product_status_type
    AND p.is_visible_in_linkme_catalog = true
    AND p.assigned_client_id IS NULL
    AND p.enseigne_id IS NULL
    AND p.created_by_affiliate IS NULL
  ORDER BY cp.is_featured DESC, cp.display_order, p.name;

-- 2) Sélection publique par id -----------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_selection(p_selection_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_selection RECORD;
  v_items JSONB;
  v_branding JSONB;
  v_affiliate_info JSONB;
  v_organisations JSONB;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  SELECT ls.*, la.id as affiliate_id,
         la.primary_color, la.secondary_color, la.accent_color,
         la.text_color, la.background_color, la.logo_url
  INTO v_selection FROM linkme_selections ls
  JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  WHERE ls.id = p_selection_id AND ls.published_at IS NOT NULL AND ls.archived_at IS NULL AND la.status = 'active';

  IF v_selection IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selection non trouvee ou non publique');
  END IF;

  SELECT jsonb_agg(item_data ORDER BY is_featured_order DESC, item_created_at)
  INTO v_items FROM (
    SELECT jsonb_build_object(
        'id', lsi.id, 'product_id', p.id, 'product_name', p.name, 'product_sku', p.sku,
        'product_image', (SELECT pi.public_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1),
        'base_price_ht', lsi.base_price_ht,
        'selling_price_ht', lsi.selling_price_ht,
        'selling_price_ttc', lsi.selling_price_ht * 1.2,
        'margin_rate', lsi.margin_rate,
        'stock_quantity', COALESCE(p.stock_real, 0),
        'is_featured', COALESCE(cp.is_featured, false),
        'category_name', cat.name, 'subcategory_id', sc.id, 'subcategory_name', sc.name
      ) as item_data, lsi.created_at as item_created_at,
      CASE WHEN COALESCE(cp.is_featured, false) THEN 1 ELSE 0 END as is_featured_order
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    LEFT JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = v_linkme_channel_id
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
    LEFT JOIN categories cat ON cat.id = sc.category_id
    WHERE lsi.selection_id = p_selection_id AND lsi.is_hidden_by_staff = false
      AND (cp.is_active IS NULL OR cp.is_active = true)
      AND p.is_visible_in_linkme_catalog = true
      AND p.assigned_client_id IS NULL AND p.enseigne_id IS NULL AND p.created_by_affiliate IS NULL
  ) sub;

  v_branding := jsonb_build_object(
    'primary_color', COALESCE(v_selection.primary_color, '#5DBEBB'),
    'secondary_color', COALESCE(v_selection.secondary_color, '#3976BB'),
    'accent_color', COALESCE(v_selection.accent_color, '#7E84C0'),
    'text_color', COALESCE(v_selection.text_color, '#183559'),
    'background_color', COALESCE(v_selection.background_color, '#FFFFFF'),
    'logo_url', v_selection.logo_url
  );

  SELECT jsonb_build_object('affiliate_type', la.affiliate_type, 'enseigne_id', la.enseigne_id, 'enseigne_name', e.name)
  INTO v_affiliate_info FROM linkme_affiliates la LEFT JOIN enseignes e ON e.id = la.enseigne_id WHERE la.id = v_selection.affiliate_id;

  SELECT jsonb_agg(jsonb_build_object('id', o.id, 'name', COALESCE(o.trade_name, o.legal_name),
    'address', o.address_line1, 'city', o.city, 'postalCode', o.postal_code, 'country', o.country,
    'phone', o.phone, 'email', o.email, 'latitude', o.latitude, 'longitude', o.longitude))
  INTO v_organisations FROM organisations o
  WHERE o.enseigne_id = (SELECT enseigne_id FROM linkme_affiliates WHERE id = v_selection.affiliate_id) AND o.is_active = true;

  RETURN jsonb_build_object(
    'success', true,
    'selection', jsonb_build_object('id', v_selection.id, 'name', v_selection.name, 'description', v_selection.description,
      'image_url', v_selection.image_url, 'affiliate_id', v_selection.affiliate_id,
      'published_at', v_selection.published_at, 'created_at', v_selection.created_at,
      'price_display_mode', COALESCE(v_selection.price_display_mode, 'TTC')),
    'items', COALESCE(v_items, '[]'::jsonb), 'item_count', COALESCE(jsonb_array_length(v_items), 0),
    'branding', v_branding, 'affiliate_info', v_affiliate_info, 'organisations', COALESCE(v_organisations, '[]'::jsonb)
  );
END;
$function$;

-- 3) Sélection publique par slug + share token -------------------------------
CREATE OR REPLACE FUNCTION public.get_public_selection(p_slug text, p_share_token text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_selection_id uuid;
  v_affiliate_id uuid;
  v_result json;
BEGIN
  SELECT id, affiliate_id INTO v_selection_id, v_affiliate_id
  FROM linkme_selections WHERE slug = p_slug AND archived_at IS NULL
    AND (published_at IS NOT NULL OR share_token = p_share_token);

  IF v_selection_id IS NULL THEN RETURN json_build_object('error', 'Selection not found'); END IF;

  IF p_share_token IS NULL THEN
    UPDATE linkme_selections SET views_count = COALESCE(views_count, 0) + 1 WHERE id = v_selection_id;
  END IF;

  SELECT json_build_object(
    'id', s.id, 'name', s.name, 'slug', s.slug, 'description', s.description,
    'image_url', s.image_url, 'price_display_mode', COALESCE(s.price_display_mode, 'TTC'),
    'affiliate', json_build_object(
      'id', a.id, 'display_name', a.display_name, 'slug', a.slug, 'logo_url', a.logo_url,
      'primary_color', a.primary_color, 'secondary_color', a.secondary_color,
      'branding_description', a.branding_description, 'contact_email', a.contact_email, 'contact_phone', a.contact_phone
    ),
    'products', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', si.id, 'product_id', si.product_id, 'product_name', p.name, 'product_sku', p.sku,
          'product_description', p.description, 'selling_points', p.selling_points,
          'base_price_ht', si.base_price_ht, 'margin_rate', si.margin_rate,
          'selling_price_ht', si.selling_price_ht,
          'custom_description', si.custom_description,
          'is_featured', COALESCE(si.is_featured, false), 'display_order', si.display_order,
          'stock_real', p.stock_real, 'weight_kg', p.weight_kg, 'dimensions_cm', p.dimensions_cm,
          'category_name', sc.name, 'category_id', sc.id,
          'primary_image_url', (SELECT pi.public_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1),
          'images', (
            SELECT COALESCE(json_agg(
              json_build_object('id', pi.id, 'url', pi.public_url, 'alt', pi.alt_text, 'is_primary', pi.is_primary)
              ORDER BY pi.is_primary DESC, pi.display_order
            ), '[]'::json) FROM product_images pi WHERE pi.product_id = p.id
          )
        ) ORDER BY si.display_order NULLS LAST, si.created_at
      ), '[]'::json)
      FROM linkme_selection_items si
      JOIN products p ON p.id = si.product_id
      LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
      WHERE si.selection_id = s.id AND p.product_status = 'active'
        AND p.is_visible_in_linkme_catalog = true
        AND p.assigned_client_id IS NULL AND p.enseigne_id IS NULL AND p.created_by_affiliate IS NULL
    )
  ) INTO v_result FROM linkme_selections s
  JOIN linkme_affiliates a ON a.id = s.affiliate_id WHERE s.id = v_selection_id;

  RETURN v_result;
END;
$function$;

-- 4) Sélection publique par slug (variante jsonb) ----------------------------
CREATE OR REPLACE FUNCTION public.get_public_selection_by_slug(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_selection RECORD;
  v_items JSONB;
  v_branding JSONB;
  v_affiliate_info JSONB;
  v_organisations JSONB;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  SELECT ls.*, la.id as affiliate_id,
         la.primary_color, la.secondary_color, la.accent_color,
         la.text_color, la.background_color, la.logo_url
  INTO v_selection FROM linkme_selections ls
  JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  WHERE ls.slug = p_slug AND ls.published_at IS NOT NULL AND ls.archived_at IS NULL AND la.status = 'active';

  IF v_selection IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selection non trouvee ou non publique');
  END IF;

  SELECT jsonb_agg(item_data ORDER BY is_featured_order DESC, item_created_at)
  INTO v_items FROM (
    SELECT jsonb_build_object(
        'id', lsi.id, 'product_id', p.id, 'product_name', p.name, 'product_sku', p.sku,
        'product_image', (SELECT pi.public_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1),
        'base_price_ht', lsi.base_price_ht,
        'selling_price_ht', lsi.selling_price_ht,
        'selling_price_ttc', lsi.selling_price_ht * 1.2,
        'margin_rate', lsi.margin_rate,
        'stock_quantity', COALESCE(p.stock_real, 0),
        'is_featured', COALESCE(cp.is_featured, false),
        'category_name', cat.name, 'subcategory_id', sc.id, 'subcategory_name', sc.name
      ) as item_data, lsi.created_at as item_created_at,
      CASE WHEN COALESCE(cp.is_featured, false) THEN 1 ELSE 0 END as is_featured_order
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    LEFT JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = v_linkme_channel_id
    LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
    LEFT JOIN categories cat ON cat.id = sc.category_id
    WHERE lsi.selection_id = v_selection.id AND lsi.is_hidden_by_staff = false
      AND (cp.is_active IS NULL OR cp.is_active = true)
      AND p.is_visible_in_linkme_catalog = true
      AND p.assigned_client_id IS NULL AND p.enseigne_id IS NULL AND p.created_by_affiliate IS NULL
  ) sub;

  v_branding := jsonb_build_object(
    'primary_color', COALESCE(v_selection.primary_color, '#5DBEBB'),
    'secondary_color', COALESCE(v_selection.secondary_color, '#3976BB'),
    'accent_color', COALESCE(v_selection.accent_color, '#7E84C0'),
    'text_color', COALESCE(v_selection.text_color, '#183559'),
    'background_color', COALESCE(v_selection.background_color, '#FFFFFF'),
    'logo_url', v_selection.logo_url
  );

  SELECT jsonb_build_object('affiliate_type', la.affiliate_type, 'enseigne_id', la.enseigne_id, 'enseigne_name', e.name)
  INTO v_affiliate_info FROM linkme_affiliates la LEFT JOIN enseignes e ON e.id = la.enseigne_id WHERE la.id = v_selection.affiliate_id;

  SELECT jsonb_agg(jsonb_build_object('id', o.id, 'name', COALESCE(o.trade_name, o.legal_name),
    'address', o.address_line1, 'city', o.city, 'postalCode', o.postal_code, 'country', o.country,
    'phone', o.phone, 'email', o.email, 'latitude', o.latitude, 'longitude', o.longitude))
  INTO v_organisations FROM organisations o
  WHERE o.enseigne_id = (SELECT enseigne_id FROM linkme_affiliates WHERE id = v_selection.affiliate_id) AND o.is_active = true;

  RETURN jsonb_build_object(
    'success', true,
    'selection', jsonb_build_object('id', v_selection.id, 'name', v_selection.name, 'slug', v_selection.slug,
      'description', v_selection.description, 'image_url', v_selection.image_url,
      'affiliate_id', v_selection.affiliate_id, 'published_at', v_selection.published_at,
      'created_at', v_selection.created_at, 'price_display_mode', COALESCE(v_selection.price_display_mode, 'TTC')),
    'items', COALESCE(v_items, '[]'::jsonb), 'item_count', COALESCE(jsonb_array_length(v_items), 0),
    'branding', v_branding, 'affiliate_info', v_affiliate_info, 'organisations', COALESCE(v_organisations, '[]'::jsonb)
  );
END;
$function$;
