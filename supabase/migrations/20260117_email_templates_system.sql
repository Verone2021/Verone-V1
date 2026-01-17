-- ============================================================================
-- Migration: Email Templates Management System
-- Date: 2026-01-17
-- Description: Create email_templates table and populate with existing templates
-- ============================================================================

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  subject text NOT NULL,
  html_body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(active);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated users can read templates
CREATE POLICY "Authenticated users can read email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only authenticated users can update templates
CREATE POLICY "Authenticated users can update email templates"
  ON email_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Only authenticated users can insert templates
CREATE POLICY "Authenticated users can insert email templates"
  ON email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- ============================================================================
-- Populate with existing templates
-- ============================================================================

-- 1. LinkMe Order Approved
INSERT INTO email_templates (name, slug, subject, html_body, variables, category) VALUES (
  'Commande LinkMe Approuvée',
  'linkme-order-approved',
  'Votre commande {{orderNumber}} a été approuvée - Action requise',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ecfdf5; padding: 30px; border-radius: 8px; border-left: 4px solid #10b981;">
    <h1 style="color: #065f46; font-size: 22px; margin: 0 0 20px 0;">
      Commande approuvée
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour {{ownerName}},
    </p>

    <p style="margin-bottom: 20px;">
      Votre commande <strong>{{orderNumber}}</strong>{{#if organisationName}} pour {{organisationName}}{{/if}} a été approuvée.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #666;">Numéro de commande</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold;">{{orderNumber}}</td>
        </tr>
        {{#if organisationName}}
        <tr>
          <td style="padding: 10px 0; color: #666;">Restaurant</td>
          <td style="padding: 10px 0; text-align: right;">{{organisationName}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666;">Montant TTC</td>
          <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #059669;">
            {{totalTtc}}
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-weight: bold;">
        Action requise
      </p>
      <p style="margin: 10px 0 0 0; color: #78350f;">
        Veuillez compléter les informations de livraison en cliquant sur le bouton ci-dessous.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{step4Url}}"
         style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Compléter les informations de livraison
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">
      Ce lien est valable 30 jours. Si vous avez des questions, n''hésitez pas à nous contacter.
    </p>

    <hr style="border: none; border-top: 1px solid #a7f3d0; margin: 30px 0;">

    <p style="color: #065f46; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d''intérieur
    </p>
  </div>
</body>
</html>',
  '["orderNumber", "ownerEmail", "ownerName", "step4Token", "organisationName", "totalTtc", "step4Url"]'::jsonb,
  'linkme'
);

-- 2. LinkMe Order Rejected
INSERT INTO email_templates (name, slug, subject, html_body, variables, category) VALUES (
  'Commande LinkMe Rejetée',
  'linkme-order-rejected',
  'Votre commande {{orderNumber}} ne peut pas être traitée',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef2f2; padding: 30px; border-radius: 8px; border-left: 4px solid #ef4444;">
    <h1 style="color: #991b1b; font-size: 22px; margin: 0 0 20px 0;">
      Commande non approuvée
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour {{ownerName}},
    </p>

    <p style="margin-bottom: 20px;">
      Nous sommes désolés de vous informer que votre commande <strong>{{orderNumber}}</strong> n''a pas pu être approuvée.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #666; font-weight: bold;">Raison du rejet:</p>
      <p style="margin: 10px 0 0 0;">{{reason}}</p>
    </div>

    <p style="color: #666; font-size: 14px;">
      Si vous avez des questions, n''hésitez pas à nous contacter.
    </p>

    <hr style="border: none; border-top: 1px solid #fecaca; margin: 30px 0;">

    <p style="color: #991b1b; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d''intérieur
    </p>
  </div>
</body>
</html>',
  '["orderNumber", "ownerEmail", "ownerName", "reason"]'::jsonb,
  'linkme'
);

-- 3. LinkMe Order Request Info
INSERT INTO email_templates (name, slug, subject, html_body, variables, category) VALUES (
  'Informations complémentaires requises',
  'linkme-order-request-info',
  'Informations complémentaires nécessaires pour votre commande {{orderNumber}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fffbeb; padding: 30px; border-radius: 8px; border-left: 4px solid #f59e0b;">
    <h1 style="color: #92400e; font-size: 22px; margin: 0 0 20px 0;">
      Informations complémentaires requises
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour {{ownerName}},
    </p>

    <p style="margin-bottom: 20px;">
      Nous traitons actuellement votre commande <strong>{{orderNumber}}</strong> et avons besoin d''informations complémentaires pour finaliser le processus.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #666; font-weight: bold;">Informations demandées:</p>
      <p style="margin: 10px 0 0 0;">{{requestedInfo}}</p>
    </div>

    <p style="color: #666; font-size: 14px;">
      Merci de nous fournir ces informations dans les plus brefs délais.
    </p>

    <hr style="border: none; border-top: 1px solid #fde68a; margin: 30px 0;">

    <p style="color: #92400e; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d''intérieur
    </p>
  </div>
</body>
</html>',
  '["orderNumber", "ownerEmail", "ownerName", "requestedInfo"]'::jsonb,
  'linkme'
);

-- 4. LinkMe Product Approved
INSERT INTO email_templates (name, slug, subject, html_body, variables, category) VALUES (
  'Produit Affilié Approuvé',
  'linkme-product-approved',
  'Votre produit {{productName}} a été approuvé',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ecfdf5; padding: 30px; border-radius: 8px; border-left: 4px solid #10b981;">
    <h1 style="color: #065f46; font-size: 22px; margin: 0 0 20px 0;">
      Produit approuvé
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour,
    </p>

    <p style="margin-bottom: 20px;">
      Votre produit affilié <strong>{{productName}}</strong> a été approuvé et est maintenant disponible à la vente.
    </p>

    <hr style="border: none; border-top: 1px solid #a7f3d0; margin: 30px 0;">

    <p style="color: #065f46; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d''intérieur
    </p>
  </div>
</body>
</html>',
  '["productName", "sellerEmail"]'::jsonb,
  'linkme'
);

-- 5. LinkMe Product Rejected
INSERT INTO email_templates (name, slug, subject, html_body, variables, category) VALUES (
  'Produit Affilié Rejeté',
  'linkme-product-rejected',
  'Votre produit {{productName}} n''a pas été approuvé',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef2f2; padding: 30px; border-radius: 8px; border-left: 4px solid #ef4444;">
    <h1 style="color: #991b1b; font-size: 22px; margin: 0 0 20px 0;">
      Produit non approuvé
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour,
    </p>

    <p style="margin-bottom: 20px;">
      Votre produit affilié <strong>{{productName}}</strong> n''a pas été approuvé.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #666; font-weight: bold;">Raison:</p>
      <p style="margin: 10px 0 0 0;">{{reason}}</p>
    </div>

    <hr style="border: none; border-top: 1px solid #fecaca; margin: 30px 0;">

    <p style="color: #991b1b; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d''intérieur
    </p>
  </div>
</body>
</html>',
  '["productName", "sellerEmail", "reason"]'::jsonb,
  'linkme'
);

-- 6. Organisation Created
INSERT INTO email_templates (name, slug, subject, html_body, variables, category) VALUES (
  'Organisation Créée',
  'linkme-organisation-created',
  'Votre organisation {{organisationName}} a été créée',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ecfdf5; padding: 30px; border-radius: 8px; border-left: 4px solid #10b981;">
    <h1 style="color: #065f46; font-size: 22px; margin: 0 0 20px 0;">
      Organisation créée
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour,
    </p>

    <p style="margin-bottom: 20px;">
      Votre organisation <strong>{{organisationName}}</strong> (SIRET: {{siret}}) a été créée avec succès.
    </p>

    <hr style="border: none; border-top: 1px solid #a7f3d0; margin: 30px 0;">

    <p style="color: #065f46; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d''intérieur
    </p>
  </div>
</body>
</html>',
  '["organisationName", "ownerEmail", "siret"]'::jsonb,
  'linkme'
);

-- 7. Contact Form Received
INSERT INTO email_templates (name, slug, subject, html_body, variables, category) VALUES (
  'Accusé Réception Formulaire Contact',
  'contact-form-received',
  'Nous avons bien reçu votre message',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f0f9ff; padding: 30px; border-radius: 8px; border-left: 4px solid #0284c7;">
    <h1 style="color: #0c4a6e; font-size: 22px; margin: 0 0 20px 0;">
      Message bien reçu
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour {{name}},
    </p>

    <p style="margin-bottom: 20px;">
      Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #666; font-weight: bold;">Votre message:</p>
      <p style="margin: 10px 0 0 0;">{{message}}</p>
    </div>

    <hr style="border: none; border-top: 1px solid #bae6fd; margin: 30px 0;">

    <p style="color: #0c4a6e; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d''intérieur
    </p>
  </div>
</body>
</html>',
  '["name", "email", "message"]'::jsonb,
  'general'
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON email_templates TO authenticated;

-- Comment
COMMENT ON TABLE email_templates IS 'Email templates for automated and manual email sending';
COMMENT ON COLUMN email_templates.slug IS 'Unique identifier for template lookup in code';
COMMENT ON COLUMN email_templates.variables IS 'JSON array of variable names available in template';
COMMENT ON COLUMN email_templates.category IS 'Category for organizing templates (linkme, general, etc.)';
