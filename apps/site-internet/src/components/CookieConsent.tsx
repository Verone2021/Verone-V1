'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'verone_cookie_consent';

type ConsentState = 'undecided' | 'accepted' | 'rejected';

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>('accepted');

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setConsent('undecided');
    } else {
      setConsent(stored as ConsentState);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setConsent('accepted');
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setConsent('rejected');
  };

  if (consent !== 'undecided') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-verone-black/95 backdrop-blur-sm text-verone-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm leading-relaxed">
            Nous utilisons des cookies essentiels pour le fonctionnement du site
            (panier, session). Des cookies analytiques optionnels nous aident à
            améliorer votre expérience.{' '}
            <Link
              href="/cookies"
              className="underline hover:text-verone-gray-300 transition-colors"
            >
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2 text-sm border border-verone-gray-500 rounded-lg hover:bg-verone-gray-800 transition-colors"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-verone-white text-verone-black rounded-lg font-medium hover:bg-verone-gray-200 transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
