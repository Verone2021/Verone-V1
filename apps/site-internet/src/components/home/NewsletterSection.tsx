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
      <div className="mx-auto flex max-w-[700px] flex-col items-center gap-8 text-center">
        <span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-or md:text-xs">
          Reste informé
        </span>

        <h2 className="font-bodoni text-[32px] font-black leading-[1.1] text-verone-white md:text-[44px]">
          Les pièces qui arrivent. En avant-première.
        </h2>

        <p className="max-w-[420px] font-montserrat text-[15px] font-light leading-[1.7] text-verone-pearl">
          Une à deux fois par mois. Les nouvelles trouvailles, et rien
          d&apos;autre.
        </p>

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
            className="mt-4 flex w-full max-w-[480px] flex-col gap-4 sm:flex-row sm:items-end"
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Ton email"
              required
              aria-label="Adresse email"
              className="flex-1 border-0 border-b border-verone-white/40 bg-transparent px-1 py-3 font-montserrat text-sm text-verone-white placeholder:text-verone-pearl focus:border-verone-or focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="border border-verone-white bg-verone-white px-8 py-3 font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-charbon transition-all duration-[180ms] ease-editorial hover:shadow-[inset_0_0_0_1px_#C9A961] disabled:opacity-50"
            >
              {status === 'loading' ? 'Envoi…' : "S'inscrire"}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="font-montserrat text-xs text-red-300">
            Une erreur est survenue. Réessaie dans un instant.
          </p>
        )}

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
