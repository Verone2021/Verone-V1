'use client';

import { useState } from 'react';

import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const faqData: FaqSection[] = [
  {
    title: 'Commandes',
    items: [
      {
        question: 'Comment passer commande ?',
        answer:
          "Parcourez notre catalogue, ajoutez les articles souhaités à votre panier, puis suivez les étapes de commande. Vous pouvez créer un compte pour suivre vos commandes ou commander en tant qu'invité.",
      },
      {
        question: 'Puis-je modifier ou annuler ma commande ?',
        answer:
          "Vous pouvez modifier ou annuler votre commande dans les 24 heures suivant la confirmation, à condition qu'elle n'ait pas encore été expédiée. Contactez notre service client par email à contact@verone.fr.",
      },
      {
        question: 'Comment suivre ma commande ?',
        answer:
          "Un email de confirmation avec un numéro de suivi vous est envoyé dès l'expédition. Vous pouvez également suivre votre commande depuis votre espace client.",
      },
    ],
  },
  {
    title: 'Livraison',
    items: [
      {
        question: 'Quels sont les délais de livraison ?',
        answer:
          'Les articles en stock sont expédiés sous 3 à 5 jours ouvrés. Les articles sur commande nécessitent 2 à 8 semaines selon le fabricant. Le délai est précisé sur chaque fiche produit.',
      },
      {
        question: 'La livraison est-elle gratuite ?',
        answer:
          "La livraison standard est offerte dès 500 \u20ac d'achat en France métropolitaine. En dessous de ce montant, les frais de livraison s'élèvent à 49 \u20ac.",
      },
      {
        question: 'Livrez-vous en dehors de la France métropolitaine ?',
        answer:
          "Nous livrons principalement en France métropolitaine. Pour la Corse, les DOM-TOM ou l'international, contactez-nous pour obtenir un devis personnalisé.",
      },
      {
        question: 'Proposez-vous un service de montage ?',
        answer:
          "Oui, un service de montage professionnel à domicile est disponible pour la plupart de nos meubles. Le tarif est indiqué sur la fiche produit et peut être ajouté lors de l'ajout au panier.",
      },
    ],
  },
  {
    title: 'Paiement',
    items: [
      {
        question: 'Quels modes de paiement acceptez-vous ?',
        answer:
          'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via notre plateforme de paiement sécurisé Stripe.',
      },
      {
        question: 'Le paiement est-il sécurisé ?',
        answer:
          'Absolument. Tous les paiements sont traités par Stripe, leader mondial du paiement en ligne. Vos données bancaires ne transitent jamais par nos serveurs et sont protégées par un chiffrement SSL 256 bits.',
      },
    ],
  },
  {
    title: 'Produits',
    items: [
      {
        question: "D'où viennent vos produits ?",
        answer:
          "Nos produits sont sélectionnés auprès des meilleurs artisans et manufactures d'Europe. Chaque pièce est choisie pour sa qualité de fabrication, ses matériaux nobles et son design.",
      },
      {
        question: 'Proposez-vous des articles sur mesure ?',
        answer:
          "Certains de nos partenaires proposent des options de personnalisation (dimensions, tissus, finitions). Contactez notre équipe pour discuter de votre projet d'aménagement sur mesure.",
      },
      {
        question: 'Comment entretenir mon mobilier ?',
        answer:
          "Les conseils d'entretien spécifiques sont fournis avec chaque produit. De manière générale, nous recommandons un dépoussiérage régulier et l'utilisation de produits adaptés à chaque matériau (bois, tissu, cuir, métal).",
      },
    ],
  },
];

function Accordion({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-verone-gray-100">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-verone-black pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-verone-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-4">
          <p className="text-sm text-verone-gray-600 leading-relaxed">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-verone-black mb-4">
          Questions fréquentes
        </h1>
        <p className="text-verone-gray-500 max-w-2xl mx-auto leading-relaxed">
          Retrouvez les réponses à vos questions les plus courantes
        </p>
      </div>

      <div className="space-y-10">
        {faqData.map(section => (
          <section key={section.title}>
            <h2 className="font-playfair text-xl font-bold text-verone-black mb-4">
              {section.title}
            </h2>
            <div className="border-t border-verone-gray-200">
              {section.items.map((item, i) => (
                <Accordion key={i} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
