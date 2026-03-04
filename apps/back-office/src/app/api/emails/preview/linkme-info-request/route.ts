/**
 * GET /api/emails/preview/linkme-info-request
 * Returns the HTML email template with sample data for visual inspection.
 * No authentication required — preview only.
 */

import { buildEmailHtml } from '../../_shared/email-template';

const CATEGORY_LABELS: Record<string, string> = {
  responsable: 'Responsable',
  billing: 'Facturation',
  delivery: 'Livraison',
  organisation: 'Entreprise',
};

interface SampleField {
  key: string;
  label: string;
  category: string;
  inputType: string;
}

export async function GET() {
  const sampleFields: SampleField[] = [
    {
      key: 'billing_company',
      label: 'Raison sociale',
      category: 'billing',
      inputType: 'text',
    },
    {
      key: 'billing_address',
      label: 'Adresse de facturation',
      category: 'billing',
      inputType: 'text',
    },
    {
      key: 'delivery_contact_name',
      label: 'Contact livraison',
      category: 'delivery',
      inputType: 'text',
    },
    {
      key: 'delivery_contact_phone',
      label: 'Téléphone livraison',
      category: 'delivery',
      inputType: 'tel',
    },
    {
      key: 'siret',
      label: 'SIRET',
      category: 'organisation',
      inputType: 'text',
    },
  ];

  const fieldsByCategory: Record<string, SampleField[]> = {};
  for (const field of sampleFields) {
    if (!fieldsByCategory[field.category])
      fieldsByCategory[field.category] = [];
    fieldsByCategory[field.category].push(field);
  }

  const fieldsHtml = Object.entries(fieldsByCategory)
    .map(([category, fields]) => {
      const catLabel = CATEGORY_LABELS[category] ?? category;
      const fieldsList = fields
        .map(f => `<li style="margin: 4px 0; font-size: 14px;">${f.label}</li>`)
        .join('');
      return `
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0; color: #78350f; font-weight: bold; font-size: 13px;">${catLabel}</p>
          <ul style="margin: 0; padding-left: 20px; color: #1f2937;">${fieldsList}</ul>
        </div>`;
    })
    .join('');

  const customMessageHtml = `
    <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 3px solid #f59e0b;">
      <p style="margin: 0 0 4px 0; color: #78350f; font-weight: bold; font-size: 14px;">Message de notre &eacute;quipe :</p>
      <p style="margin: 0; color: #1f2937;">Merci de compl&eacute;ter ces informations le plus rapidement possible afin que nous puissions traiter votre commande.</p>
    </div>`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">
      Concernant votre commande <strong>BO-2026-0042</strong> pour <strong>Restaurant Le Central</strong>
      d&rsquo;un montant de <strong>1&nbsp;240,00&nbsp;&euro;</strong>,
      nous avons besoin d&rsquo;informations compl&eacute;mentaires pour pouvoir la traiter.
    </p>
    <div style="background-color: #fff7ed; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #fed7aa;">
      <p style="margin: 0 0 8px 0; color: #9a3412; font-weight: bold; font-size: 14px;">Informations manquantes :</p>
      ${fieldsHtml}
    </div>
    ${customMessageHtml}`;

  const previewToken = '00000000-0000-0000-0000-000000000000';
  const linkmeUrl =
    process.env.LINKME_PUBLIC_URL ?? 'https://linkme-blue.vercel.app';

  const emailHtml = buildEmailHtml({
    title: 'Informations compl\u00e9mentaires requises',
    recipientName: 'Marie Dupont',
    accentColor: 'orange',
    bodyHtml,
    ctaUrl: `${linkmeUrl}/complete-info/${previewToken}`,
    ctaLabel: 'Compl\u00e9ter les informations',
    footerNote: 'Ce lien est valable 30 jours. &mdash; <em>PREVIEW ONLY</em>',
  });

  return new Response(emailHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
