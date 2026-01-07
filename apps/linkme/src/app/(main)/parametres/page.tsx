'use client';

import { Settings } from 'lucide-react';

export default function ParametresPage(): JSX.Element {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
      </div>
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">Page en construction</p>
      </div>
    </div>
  );
}
