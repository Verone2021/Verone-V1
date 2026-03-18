'use client';

import { useState } from 'react';

import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (data.success) {
        setSubmitted(true);
      } else {
        setSubmitError(data.error ?? 'Une erreur est survenue');
      }
    } catch {
      setSubmitError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-verone-black mb-4">
          Contactez-nous
        </h1>
        <p className="text-verone-gray-500 max-w-2xl mx-auto leading-relaxed">
          Notre équipe est à votre disposition pour répondre à toutes vos
          questions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Contact info */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-playfair text-xl font-semibold text-verone-black mb-6">
              Nos coordonnées
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-verone-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-verone-black">Email</p>
                  <a
                    href="mailto:contact@verone.fr"
                    className="text-sm text-verone-gray-600 hover:text-verone-black transition-colors"
                  >
                    contact@verone.fr
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-verone-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-verone-black">
                    Téléphone
                  </p>
                  <a
                    href="tel:+33123456789"
                    className="text-sm text-verone-gray-600 hover:text-verone-black transition-colors"
                  >
                    +33 1 23 45 67 89
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-verone-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-verone-black">
                    Adresse
                  </p>
                  <p className="text-sm text-verone-gray-600">Paris, France</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-verone-gray-200 rounded-lg p-6">
            <h3 className="font-medium text-verone-black mb-2">
              Horaires du service client
            </h3>
            <div className="text-sm text-verone-gray-600 space-y-1">
              <p>Lundi - Vendredi : 9h00 - 18h00</p>
              <p>Samedi : 10h00 - 17h00</p>
              <p>Dimanche : Fermé</p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-3">
          {submitted ? (
            <div className="border border-green-200 bg-green-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Message envoyé
              </h3>
              <p className="text-sm text-green-700">
                Merci pour votre message. Notre équipe vous répondra dans les
                meilleurs délais.
              </p>
            </div>
          ) : (
            <form
              onSubmit={e => {
                void handleSubmit(e).catch(error => {
                  console.error('[Contact] Submit failed:', error);
                });
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                  >
                    Nom complet
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                >
                  Sujet
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                >
                  <option value="">Sélectionnez un sujet</option>
                  <option value="product">Question sur un produit</option>
                  <option value="order">Suivi de commande</option>
                  <option value="delivery">Livraison</option>
                  <option value="return">Retour ou échange</option>
                  <option value="project">Projet d&apos;aménagement</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm resize-none"
                />
              </div>
              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-verone-black text-verone-white py-3 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
