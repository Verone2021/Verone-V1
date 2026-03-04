import { redirect } from 'next/navigation';

/**
 * Tresorerie fusionnee dans le Pilotage (/finance).
 */
export default function TresorerieRedirect() {
  redirect('/finance');
}
