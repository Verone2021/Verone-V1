import { redirect } from 'next/navigation';

// Redirection permanente : /analytics → /statistiques
export default function AnalyticsRedirect(): never {
  redirect('/statistiques');
}
