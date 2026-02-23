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
  answer: React.ReactNode;
}

interface IFAQSectionProps {
  branding: IBranding;
  contactInfo: IContactInfo;
  selectionName: string;
}

// Static FAQ items - same for all selections
const FAQ_ITEMS: IFAQItem[] = [
  {
    question: 'Comment passer commande ?',
    answer:
      'Parcourez le catalogue et ajoutez les produits souhaités à votre panier. Validez ensuite votre commande via le formulaire en renseignant les informations de votre établissement, un contact responsable, les coordonnées de facturation et l\u2019adresse de livraison. Votre commande sera examinée par notre équipe avant confirmation.',
  },
  {
    question: 'Quelles informations préparer avant de commander ?',
    answer: (
      <>
        Pour faciliter le traitement de votre commande, munissez-vous de :
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Le nom et l&apos;adresse de votre établissement</li>
          <li>Si franchise : la raison sociale et le SIRET de votre société</li>
          <li>Les coordonnées du responsable (nom, email, téléphone)</li>
          <li>
            L&apos;adresse de livraison et l&apos;accessibilité du site
            (semi-remorque, centre commercial)
          </li>
        </ul>
        <p className="mt-2">
          En cas d&apos;informations manquantes, notre équipe vous contactera
          par email pour les compléter.
        </p>
      </>
    ),
  },
  {
    question: 'Comment se passe la livraison ?',
    answer: (
      <>
        La livraison est assurée par transporteur professionnel. Merci de bien
        renseigner lors de votre commande :
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>Accessibilité semi-remorque</strong> : si votre site
            n&apos;est pas accessible en semi-remorque, des frais
            supplémentaires peuvent s&apos;appliquer.
          </li>
          <li>
            <strong>Centre commercial</strong> : l&apos;email du gestionnaire
            sera requis pour coordonner l&apos;accès.
          </li>
        </ul>
        <p className="mt-2">
          Les délais vous seront communiqués lors de la confirmation de
          commande.
        </p>
      </>
    ),
  },
  {
    question: 'Puis-je modifier ou annuler ma commande ?',
    answer:
      'Vous pouvez demander une modification ou une annulation tant que votre commande n\u2019a pas été expédiée. Pensez à bien noter votre numéro de commande lors de la confirmation, puis rendez-vous sur la page Contact pour soumettre votre demande via le formulaire.',
  },
  {
    question: 'Comment effectuer un retour ?',
    answer:
      'Contactez directement notre équipe via les coordonnées disponibles sur cette page. Nous organiserons ensemble les modalités de retour.',
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
                  <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">
                    {item.answer}
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
