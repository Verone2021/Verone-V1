import { redirect } from 'next/navigation';

/**
 * Page principale de sélection
 *
 * Redirige automatiquement vers /catalogue
 *
 * @module SelectionPage
 * @since 2026-01-12
 */
export default async function SelectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/s/${id}/catalogue`);
}
