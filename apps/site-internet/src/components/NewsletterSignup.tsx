'use client';

import { useState } from 'react';

import { Send } from 'lucide-react';

import { createClient as createBrowserClient } from '@supabase/supabase-js';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function NewsletterSignup() {
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
        // Already subscribed
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
    <div>
      <h4 className="text-verone-white text-xs font-semibold mb-4 uppercase tracking-widest">
        Newsletter
      </h4>
      <p className="text-sm text-verone-gray-400 mb-4">
        Recevez nos nouveautés et offres exclusives
      </p>
      {status === 'success' ? (
        <p className="text-sm text-green-400">Merci pour votre inscription !</p>
      ) : (
        <form
          onSubmit={e => {
            void handleSubmit(e).catch(err => {
              console.error('[Newsletter] Error:', err);
              setStatus('error');
            });
          }}
          className="flex gap-2"
        >
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            className="flex-1 px-3 py-2 bg-verone-gray-800 border border-verone-gray-700 text-verone-white text-sm rounded-none placeholder:text-verone-gray-500 focus:outline-none focus:border-verone-gray-500"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-3 py-2 bg-verone-white text-verone-black text-sm font-medium hover:bg-verone-gray-200 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400 mt-2">
          Une erreur est survenue. Réessayez.
        </p>
      )}
    </div>
  );
}
