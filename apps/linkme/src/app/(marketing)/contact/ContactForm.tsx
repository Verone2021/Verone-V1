'use client';

/**
 * Composant formulaire de contact - LinkMe
 *
 * Design moderne 2026 avec layout équilibré et espacement aéré
 *
 * @module ContactForm
 * @since 2026-01-23
 * @updated 2026-02-04 - Refonte design moderne cohérent avec landing pages
 */

import { useState } from 'react';

import {
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

interface IFormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

const INITIAL_FORM: IFormData = {
  name: '',
  email: '',
  company: '',
  subject: '',
  message: '',
};

const SUBJECTS = [
  'Devenir affilié',
  'Partenariat enseigne',
  'Question sur la plateforme',
  'Support technique',
  'Autre',
];

// Contact info data
const CONTACT_INFO = [
  {
    icon: Mail,
    label: 'Email',
    value: 'contact@verone.io',
    href: 'mailto:contact@verone.io',
  },
  {
    icon: MapPin,
    label: 'Localisation',
    value: 'France',
    href: null,
  },
  {
    icon: Clock,
    label: 'Disponibilité',
    value: 'Lun - Ven: 9h - 18h',
    href: null,
  },
];

export function ContactForm(): JSX.Element {
  const [form, setForm] = useState<IFormData>(INITIAL_FORM);
  const [status, setStatus] = useState<FormStatus>('idle');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error('Erreur lors de l envoi');

      setStatus('success');
      setForm(INITIAL_FORM);
    } catch (error) {
      console.error('Erreur contact form:', error);
      setStatus('error');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="py-16 lg:py-24 bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#183559] mb-4">
            Contactez{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
              notre équipe
            </span>
          </h1>
          <p className="text-lg text-[#183559]/60 max-w-2xl mx-auto">
            Une question sur LinkMe ? Envie de devenir partenaire ? Nous sommes
            là pour vous accompagner.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Info - Compact & Modern */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#183559] to-[#183559]/95 text-white rounded-2xl p-6 lg:p-8">
              <h2 className="text-xl font-semibold mb-6">Nos coordonnées</h2>
              <div className="space-y-4">
                {CONTACT_INFO.map(info => (
                  <div key={info.label} className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/60 mb-1">
                        {info.label}
                      </p>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-white hover:text-[#5DBEBB] transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-white">{info.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-[#183559] mb-3">
                Temps de réponse
              </h3>
              <p className="text-[#183559]/60 text-sm leading-relaxed">
                Notre équipe s&apos;engage à vous répondre sous{' '}
                <span className="font-semibold text-[#5DBEBB]">24 heures</span>{' '}
                maximum (jours ouvrés).
              </p>
            </div>
          </div>

          {/* Form - Modern & Spacious */}
          <div>
            {status === 'success' ? (
              <div className="bg-white rounded-2xl p-6 lg:p-8 border border-green-200 shadow-sm">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    Message envoyé !
                  </h3>
                  <p className="text-green-700 mb-6">
                    Nous avons bien reçu votre message et vous répondrons dans
                    les plus brefs délais.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={e => void handleSubmit(e)}
                className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100"
              >
                {status === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 text-sm">
                        Erreur lors de l&apos;envoi
                      </p>
                      <p className="text-sm text-red-700">
                        Veuillez réessayer ou nous contacter par email.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-[#183559] mb-2"
                    >
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-[#183559] mb-2"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors"
                      placeholder="jean@entreprise.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-[#183559] mb-2"
                    >
                      Entreprise
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors"
                      placeholder="Ma Société"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-[#183559] mb-2"
                    >
                      Sujet *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors bg-white"
                    >
                      <option value="">Sélectionnez un sujet</option>
                      {SUBJECTS.map(subject => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-[#183559] mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]/50 focus:border-[#5DBEBB] transition-colors resize-none"
                    placeholder="Décrivez votre projet ou votre question..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/90 text-white font-semibold rounded-xl hover:from-[#4CA9A6] hover:to-[#4CA9A6]/90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {status === 'loading' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
