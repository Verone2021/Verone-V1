'use client';

import { useState } from 'react';

import { ChevronDown, HelpCircle, Mail, Phone, User } from 'lucide-react';

interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

interface IContactInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface IFAQItem {
  question: string;
  answer: string;
}

interface IFAQSectionProps {
  branding: IBranding;
  contactInfo: IContactInfo;
  selectionName: string;
}

// Static FAQ items - same for all selections
const FAQ_ITEMS: IFAQItem[] = [
  {
    question: 'Comment passer une commande ?',
    answer:
      'Parcourez notre catalogue, ajoutez les produits souhaités à votre panier, puis cliquez sur le bouton Panier pour finaliser votre commande. Vous pourrez renseigner vos informations de livraison et valider votre commande en quelques clics.',
  },
  {
    question: 'Quels sont les délais de livraison ?',
    answer:
      'Les délais de livraison varient selon les produits et votre localisation. En général, comptez entre 2 et 4 semaines pour les articles en stock. Pour les articles sur-mesure ou en pré-commande, les délais peuvent être plus longs. Vous serez informé du délai exact lors de la confirmation de votre commande.',
  },
  {
    question: 'Comment fonctionne le paiement ?',
    answer:
      "Le paiement s'effectue à la livraison ou selon les modalités convenues avec notre équipe. Nous acceptons les virements bancaires et les paiements par carte. Une facture détaillée vous sera envoyée avec votre commande.",
  },
  {
    question: 'Puis-je modifier ou annuler ma commande ?',
    answer:
      "Vous pouvez modifier ou annuler votre commande tant qu'elle n'a pas été expédiée. Contactez-nous rapidement après votre commande pour toute modification. Une fois la commande expédiée, les modifications ne sont plus possibles.",
  },
  {
    question: 'Les produits sont-ils garantis ?',
    answer:
      'Tous nos produits bénéficient de la garantie légale de conformité. De plus, la plupart de nos articles sont couverts par une garantie fabricant. Les détails de garantie sont précisés dans la fiche produit.',
  },
  {
    question: 'Comment retourner un produit ?',
    answer:
      "Si vous n'êtes pas satisfait de votre achat, vous disposez d'un délai de 14 jours pour nous le signaler. Contactez notre équipe pour organiser le retour. Le produit doit être retourné dans son emballage d'origine, en parfait état.",
  },
];

export function FAQSection({
  branding,
  contactInfo,
  selectionName,
}: IFAQSectionProps): React.JSX.Element {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number): void => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const hasContact =
    Boolean(contactInfo.name) ||
    Boolean(contactInfo.email) ||
    Boolean(contactInfo.phone);

  return (
    <section id="faq-section" className="bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4"
            style={{ backgroundColor: `${branding.primary_color}15` }}
          >
            <HelpCircle
              className="h-6 w-6"
              style={{ color: branding.primary_color }}
            />
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: branding.text_color }}
          >
            Questions fréquentes
          </h2>
          <p className="text-gray-600">
            Tout ce que vous devez savoir pour commander
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* FAQ Accordion */}
          <div className="md:col-span-2 space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="font-medium pr-4"
                    style={{ color: branding.text_color }}
                  >
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                      openItems.has(index) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openItems.has(index) && (
                  <div className="px-5 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Card */}
          <div className="md:col-span-1">
            <div
              className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24"
              style={{
                borderTop: `3px solid ${branding.primary_color}`,
              }}
            >
              <h3
                className="font-semibold mb-4"
                style={{ color: branding.text_color }}
              >
                Une question ?
              </h3>

              {hasContact ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Notre équipe est à votre disposition pour répondre à vos
                    questions sur la sélection "{selectionName}".
                  </p>

                  {contactInfo.name && (
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${branding.primary_color}15`,
                        }}
                      >
                        <User
                          className="h-4 w-4"
                          style={{ color: branding.primary_color }}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Contact</p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: branding.text_color }}
                        >
                          {contactInfo.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {contactInfo.email && (
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="flex items-center gap-3 group"
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center transition-colors group-hover:opacity-80"
                        style={{
                          backgroundColor: `${branding.primary_color}15`,
                        }}
                      >
                        <Mail
                          className="h-4 w-4"
                          style={{ color: branding.primary_color }}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p
                          className="text-sm font-medium group-hover:underline"
                          style={{ color: branding.primary_color }}
                        >
                          {contactInfo.email}
                        </p>
                      </div>
                    </a>
                  )}

                  {contactInfo.phone && (
                    <a
                      href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 group"
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center transition-colors group-hover:opacity-80"
                        style={{
                          backgroundColor: `${branding.primary_color}15`,
                        }}
                      >
                        <Phone
                          className="h-4 w-4"
                          style={{ color: branding.primary_color }}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Téléphone</p>
                        <p
                          className="text-sm font-medium group-hover:underline"
                          style={{ color: branding.primary_color }}
                        >
                          {contactInfo.phone}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Pour toute question concernant cette sélection, n'hésitez pas
                  à nous contacter via le formulaire ci-dessous.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
