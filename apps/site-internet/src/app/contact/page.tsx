'use client';

import { useState } from 'react';

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
      setSubmitError('Erreur de connexion. Réessaie dans un instant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-verone-white pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-[640px] px-5 pt-24 text-center md:px-0 md:pt-32">
        <span className="mb-6 block font-dm-sans text-[11px] font-light uppercase tracking-[0.3em] text-verone-or">
          Contact
        </span>
        <h1 className="font-bodoni text-[36px] font-black leading-[1.1] text-verone-charbon md:text-[56px]">
          Une question.
          <br />
          Une commande sur mesure.
          <br />
          Autre chose.
        </h1>
        <p className="mt-8 font-montserrat text-base text-verone-pearl">
          On répond vite. Et en humain.
        </p>
      </section>

      {/* Form */}
      <section className="mx-auto mt-16 max-w-[640px] px-5 md:px-0">
        {submitted ? (
          <div className="border border-verone-or/40 bg-verone-pearl-soft/30 p-10 text-center">
            <h3 className="font-bodoni text-[28px] font-black text-verone-charbon">
              C&apos;est noté.
            </h3>
            <p className="mt-4 font-montserrat text-sm text-verone-pearl">
              On t&apos;a bien reçu. On revient vers toi dans les 48 h.
            </p>
          </div>
        ) : (
          <form
            onSubmit={e => {
              void handleSubmit(e).catch(error => {
                console.error('[Contact] Submit failed:', error);
              });
            }}
            className="flex flex-col gap-8"
          >
            {/* Nom */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="font-dm-sans text-[10px] font-light uppercase tracking-[0.2em] text-verone-pearl"
              >
                Ton prénom
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full border-0 border-b border-verone-charbon/30 bg-transparent px-0 py-3 font-montserrat text-base text-verone-charbon transition-colors duration-300 placeholder:text-verone-pearl/40 focus:border-verone-charbon focus:outline-none focus:ring-0"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="font-dm-sans text-[10px] font-light uppercase tracking-[0.2em] text-verone-pearl"
              >
                Ton adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border-0 border-b border-verone-charbon/30 bg-transparent px-0 py-3 font-montserrat text-base text-verone-charbon transition-colors duration-300 placeholder:text-verone-pearl/40 focus:border-verone-charbon focus:outline-none focus:ring-0"
              />
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="subject"
                className="font-dm-sans text-[10px] font-light uppercase tracking-[0.2em] text-verone-pearl"
              >
                De quoi s&apos;agit-il&nbsp;?
              </label>
              <select
                id="subject"
                name="subject"
                required
                defaultValue=""
                className="w-full cursor-pointer appearance-none border-0 border-b border-verone-charbon/30 bg-transparent px-0 py-3 font-montserrat text-base text-verone-charbon transition-colors duration-300 focus:border-verone-charbon focus:outline-none focus:ring-0"
              >
                <option value="" disabled>
                  Sélectionne une option
                </option>
                <option value="product">Une question sur un produit</option>
                <option value="order">Une commande ou un devis</option>
                <option value="return">Un retour ou un problème</option>
                <option value="other">Autre chose</option>
              </select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="message"
                className="font-dm-sans text-[10px] font-light uppercase tracking-[0.2em] text-verone-pearl"
              >
                Ton message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                className="w-full resize-none border-0 border-b border-verone-charbon/30 bg-transparent px-0 py-3 font-montserrat text-base text-verone-charbon transition-colors duration-300 placeholder:text-verone-pearl/40 focus:border-verone-charbon focus:outline-none focus:ring-0"
              />
            </div>

            {submitError && (
              <p className="font-montserrat text-xs text-red-600">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex h-[52px] w-full items-center justify-center bg-verone-charbon font-montserrat text-xs font-medium uppercase tracking-[0.2em] text-verone-white transition-colors duration-500 hover:bg-verone-or disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        )}
      </section>

      {/* Filet décoratif or */}
      <section className="mx-auto mt-24 max-w-7xl px-5 md:px-16">
        <hr className="border-t border-verone-or opacity-50" />
      </section>

      {/* Informations complémentaires */}
      <section className="mx-auto mt-12 max-w-[640px] px-5 text-center md:px-0">
        <p className="font-dm-sans text-[11px] font-light uppercase tracking-[0.3em] text-verone-pearl">
          Email direct
        </p>
        <a
          href="mailto:contact@veronecollections.fr"
          className="mt-3 inline-block font-montserrat text-base text-verone-charbon underline decoration-verone-or decoration-1 underline-offset-[6px] transition-colors duration-300 hover:text-verone-or"
        >
          contact@veronecollections.fr
        </a>
        <p className="mt-6 font-montserrat text-xs text-verone-pearl">
          Réponse sous 48 h en semaine.
        </p>
      </section>
    </main>
  );
}
