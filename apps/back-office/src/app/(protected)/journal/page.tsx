import type { Metadata } from 'next';

import { ArticlesManagementTable } from './_components/ArticlesManagementTable';

export const metadata: Metadata = {
  title: 'Journal — Gestion des articles',
};

export default function JournalAdminPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Journal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérer les articles du blog /journal
        </p>
      </div>

      <ArticlesManagementTable />
    </div>
  );
}
