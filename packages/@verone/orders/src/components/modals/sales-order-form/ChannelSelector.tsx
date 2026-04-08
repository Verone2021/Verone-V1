'use client';

import { Store, Users, ChevronRight } from 'lucide-react';

type SalesChannelType = 'manual' | 'site-internet' | 'linkme';

interface ChannelSelectorProps {
  onChannelSelect: (channel: SalesChannelType) => void;
  onLinkMeClick?: () => void;
  onClose: () => void;
}

export function ChannelSelector({
  onChannelSelect,
  onLinkMeClick,
  onClose,
}: ChannelSelectorProps) {
  return (
    <div className="py-6">
      <div className="grid grid-cols-1 gap-4">
        {/* Option: Commande Manuelle */}
        <button
          type="button"
          onClick={() => onChannelSelect('manual')}
          className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
            <Store className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Commande Manuelle</h3>
            <p className="text-sm text-gray-500">
              Saisie directe avec prix modifiables librement
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
        </button>

        {/* Option: LinkMe */}
        <button
          type="button"
          onClick={() => {
            if (onLinkMeClick) {
              onClose();
              onLinkMeClick();
            } else {
              onChannelSelect('linkme');
            }
          }}
          className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">LinkMe</h3>
            <p className="text-sm text-gray-500">
              Commande réseau apporteurs (prix sélection, remises uniquement)
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500" />
        </button>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Note :</strong> Seules les commandes manuelles permettent de
          modifier librement les prix. Les commandes LinkMe utilisent les prix
          definis dans les selections.
        </p>
      </div>
    </div>
  );
}
