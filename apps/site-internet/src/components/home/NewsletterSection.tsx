'use client';

import { useState } from 'react';

import Link from 'next/link';

import { createClient as createBrowserClient } from '@supabase/supabase-js';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    const supabase = getSupabase();

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, source: 'site-internet' });

    if (error) {
      if (error.code === '23505') {
        setStatus('success');
      } else {
        console.error('[Newsletter] Subscribe failed:', error);
        setStatus('error');
      }
    } else {
      setStatus('success');
    }

    setEmail('');
  };

  return (
    <section className="bg-verone-charbon px-6 py-24 md:px-16 md:py-24">
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-10 text-center">
        <span className="font-dm-sans text-[12px] font-medium uppercase tracking-[0.32em] text-verone-or">
          Reste informé
        </span>

        <h2 className="font-bodoni text-[40px] font-black leading-[1.04] text-verone-white md:text-[52px]">
          Les pièces qui arrivent. En avant-première.
        </h2>

        {status === 'success' ? (
          <p className="font-montserrat text-sm text-verone-or">
            Merci, c&apos;est noté. Surveille ta boîte mail.
          </p>
        ) : (
          <form
            onSubmit={e => {
              void handleSubmit(e).catch(err => {
                console.error('[Newsletter] Error:', err);
                setStatus('error');
              });
            }}
            className="flex w-full max-w-[400px] flex-col items-center gap-8"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Ton adresse email
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Ton adresse email"
              required
              className="w-full border-0 border-b border-verone-white bg-transparent px-0 py-3 text-center font-montserrat text-base text-verone-white placeholder:text-verone-pearl focus:border-verone-or focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-verone-white px-8 py-4 font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-charbon transition-all duration-[180ms] ease-editorial hover:shadow-[inset_0_0_0_1px_#C9A961] disabled:opacity-50"
            >
              {status === 'loading' ? 'Envoi…' : 'Rejoindre la liste'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="font-montserrat text-xs text-red-300">
            Une erreur est survenue. Réessaie dans un instant.
          </p>
        )}

        <p className="font-montserrat text-[12px] text-verone-pearl">
          Pas de spam. Une sélection, quand elle est prête.
        </p>

        <p className="font-montserrat text-xs text-verone-pearl">
          En t&apos;inscrivant, tu acceptes notre{' '}
          <Link
            href="/confidentialite"
            className="underline decoration-verone-or decoration-1 underline-offset-2 transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
