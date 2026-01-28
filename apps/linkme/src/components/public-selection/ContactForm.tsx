'use client';

import { useState } from 'react';

import { Check, Loader2, Mail, Send } from 'lucide-react';

interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

interface IContactFormProps {
  selectionId: string;
  selectionName: string;
  branding: IBranding;
}

interface IFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  phone: string;
  message: string;
}

const initialFormData: IFormData = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  role: '',
  phone: '',
  message: '',
};

export function ContactForm({
  selectionId,
  selectionName,
  branding,
}: IContactFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<IFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Call the new form submission API
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'selection_inquiry',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company || undefined,
          role: formData.role || undefined,
          subject: `Contact depuis la sélection "${selectionName}"`,
          message: formData.message,
          source: 'linkme',
          priority: 'medium',
          metadata: {
            selection_id: selectionId,
            selection_name: selectionName,
          },
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Erreur lors de l'envoi");
      }

      // Success: show confirmation and reset form
      setIsSubmitted(true);
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="contact-section" className="bg-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center py-12">
            <div
              className="inline-flex items-center justify-center h-16 w-16 rounded-full mb-6"
              style={{ backgroundColor: `${branding.primary_color}15` }}
            >
              <Check
                className="h-8 w-8"
                style={{ color: branding.primary_color }}
              />
            </div>
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: branding.text_color }}
            >
              Message envoyé !
            </h3>
            <p className="text-gray-600 mb-6">
              Merci pour votre message. Notre équipe vous répondra dans les plus
              brefs délais.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-sm font-medium hover:underline"
              style={{ color: branding.primary_color }}
            >
              Envoyer un autre message
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact-section" className="bg-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4"
            style={{ backgroundColor: `${branding.primary_color}15` }}
          >
            <Mail
              className="h-6 w-6"
              style={{ color: branding.primary_color }}
            />
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: branding.text_color }}
          >
            Nous contacter
          </h2>
          <p className="text-gray-600">
            Une question sur la sélection "{selectionName}" ? Écrivez-nous.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={e => {
            void handleSubmit(e).catch(error => {
              console.error('[ContactForm] Submit failed:', error);
            });
          }}
          className="space-y-6"
        >
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                style={
                  {
                    '--tw-ring-color': branding.primary_color,
                  } as React.CSSProperties
                }
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                style={
                  {
                    '--tw-ring-color': branding.primary_color,
                  } as React.CSSProperties
                }
                placeholder="Votre nom"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
              style={
                {
                  '--tw-ring-color': branding.primary_color,
                } as React.CSSProperties
              }
              placeholder="votre@email.com"
            />
          </div>

          {/* Company and Role Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Entreprise
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                style={
                  {
                    '--tw-ring-color': branding.primary_color,
                  } as React.CSSProperties
                }
                placeholder="Nom de votre entreprise"
              />
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fonction
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                style={
                  {
                    '--tw-ring-color': branding.primary_color,
                  } as React.CSSProperties
                }
                placeholder="Votre fonction"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
              style={
                {
                  '--tw-ring-color': branding.primary_color,
                } as React.CSSProperties
              }
              placeholder="06 12 34 56 78"
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
              style={
                {
                  '--tw-ring-color': branding.primary_color,
                } as React.CSSProperties
              }
              placeholder="Décrivez votre demande..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: branding.primary_color }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Envoyer le message
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            En soumettant ce formulaire, vous acceptez que vos données soient
            traitées pour répondre à votre demande.
          </p>
        </form>
      </div>
    </section>
  );
}
