import { redirect } from 'next/navigation';

export default function PrisesContactRedirect() {
  redirect('/messages?onglet=formulaires');
}
