'use client';

import { Plus, Store } from 'lucide-react';

interface Props {
  onExistingRestaurant: () => void;
  onNewRestaurant: () => void;
  onClose: () => void;
}

export function QuestionInitiale({
  onExistingRestaurant,
  onNewRestaurant,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-semibold text-white">
              Nouvelle commande
            </h2>
            <p className="text-blue-100 text-sm">
              Pour qui est cette commande ?
            </p>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-600 text-center mb-6">
              Cette commande est pour...
            </p>

            <button
              onClick={onExistingRestaurant}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  Restaurant existant
                </p>
                <p className="text-sm text-gray-500">
                  Un de mes restaurants déjà enregistrés
                </p>
              </div>
            </button>

            <button
              onClick={onNewRestaurant}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  Nouveau restaurant
                </p>
                <p className="text-sm text-gray-500">
                  Ouverture ou première commande
                </p>
              </div>
            </button>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
