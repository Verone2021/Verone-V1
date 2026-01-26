import { redirect } from 'next/navigation';

interface SelectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SelectionPage({ params }: SelectionPageProps) {
  const { id } = await params;
  redirect(`/s/${id}/catalogue`);
}
