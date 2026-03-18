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
    <section className="bg-verone-black py-24">
      <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-4">
          Newsletter
        </p>
        <h2 className="font-playfair text-3xl md:text-4xl font-bold text-verone-white mb-4">
          Rejoignez l&apos;univers Vérone
        </h2>
        <p className="text-sm text-verone-gray-400 mb-8">
          Recevez en exclusivité nos nouvelles trouvailles, inspirations et
          offres.
        </p>

        {status === 'success' ? (
          <p className="text-green-400 text-sm font-medium">
            Merci pour votre inscription !
          </p>
        ) : (
          <form
            onSubmit={e => {
              void handleSubmit(e).catch(err => {
                console.error('[Newsletter] Error:', err);
                setStatus('error');
              });
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Votre email"
              required
              className="flex-1 px-4 py-3.5 bg-verone-gray-800 border border-verone-gray-700 text-verone-white text-sm placeholder:text-verone-gray-500 focus:outline-none focus:border-verone-gray-500"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-3.5 bg-amber-700 text-verone-white text-sm font-semibold uppercase tracking-wide hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              S&apos;abonner
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-xs text-red-400 mt-3">
            Une erreur est survenue. Réessayez.
          </p>
        )}

        <p className="text-xs text-verone-gray-500 mt-4">
          En vous inscrivant, vous acceptez notre{' '}
          <Link
            href="/confidentialite"
            className="underline hover:text-verone-gray-300 transition-colors"
          >
            politique de confidentialité
          </Link>
        </p>
      </div>
    </section>
  );
}
