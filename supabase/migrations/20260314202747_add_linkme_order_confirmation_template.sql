-- Add email template for LinkMe order confirmation
INSERT INTO public.email_templates (name, slug, subject, html_body, variables, category)
VALUES (
  'Confirmation Commande LinkMe',
  'linkme-order-confirmation',
  'Confirmation de votre commande {{orderNumber}}',
  '<p>Bonjour {{requesterName}},</p><p>Nous avons bien recu votre commande <strong>{{orderNumber}}</strong>.</p><p>Restaurant : {{restaurantName}}<br>Selection : {{selectionName}}<br>Articles : {{itemsCount}}<br>Total HT : {{totalHT}}<br>Total TTC : {{totalTTC}}</p><p>Un devis detaille incluant les frais de transport vous sera adresse prochainement.</p><p>Notre equipe va etudier votre commande et vous recontactera sous 48h.</p>',
  '["orderNumber","requesterName","restaurantName","selectionName","itemsCount","totalHT","totalTTC"]',
  'linkme'
);
