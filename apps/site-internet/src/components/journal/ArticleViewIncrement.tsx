'use client';

import { useEffect } from 'react';

import { createClient } from '@supabase/supabase-js';

interface ArticleViewIncrementProps {
  slug: string;
}

const SESSION_KEY_PREFIX = 'verone_article_viewed_';

export function ArticleViewIncrement({ slug }: ArticleViewIncrementProps) {
  useEffect(() => {
    const sessionKey = `${SESSION_KEY_PREFIX}${slug}`;

    // Idempotent : on ne compte pas à chaque refresh de page
    if (sessionStorage.getItem(sessionKey)) return;

    // Client non typé : increment_article_view RPC absente des types générés (table articles récente)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    void supabase
      .rpc('increment_article_view', { p_slug: slug })
      .then(({ error }) => {
        if (!error) {
          sessionStorage.setItem(sessionKey, '1');
        } else {
          console.error('[ArticleViewIncrement] rpc error:', error);
        }
      });
  }, [slug]);

  return null;
}
