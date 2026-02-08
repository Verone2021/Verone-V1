/**
 * 🏠 Page d'accueil Vérone - Redirection Dashboard
 *
 * Redirection serveur immédiate vers /dashboard.
 * Évite les erreurs console et le blocage utilisateur.
 *
 * @since 2026-02-08 - Fix [BO-PROD-001] spinner infini
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
}
