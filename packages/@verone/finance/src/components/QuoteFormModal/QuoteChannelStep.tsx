'use client';

import { ButtonV2 } from '@verone/ui';
import {
  Store,
  Globe,
  Link2,
  Briefcase,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

import type { QuoteChannelType } from './types';

interface QuoteChannelStepProps {
  onSelect: (channel: QuoteChannelType) => void;
  onBack?: () => void;
}

export function QuoteChannelStep({ onSelect, onBack }: QuoteChannelStepProps) {
  return (
    <div className="py-6">
      {onBack && (
        <div className="mb-4">
          <ButtonV2
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </ButtonV2>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {/* Manuel */}
        <button
          type="button"
          onClick={() => onSelect('manual')}
          className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
            <Store className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Manuel</h3>
            <p className="text-sm text-gray-500">
              Produits du catalogue, prix modifiables librement
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
        </button>

        {/* Site Internet */}
        <button
          type="button"
          onClick={() => onSelect('site-internet')}
          className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
            <Globe className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Site Internet</h3>
            <p className="text-sm text-gray-500">
              Produits du catalogue, prix site internet
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-500" />
        </button>

        {/* LinkMe */}
        <button
          type="button"
          onClick={() => onSelect('linkme')}
          className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
            <Link2 className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">LinkMe</h3>
            <p className="text-sm text-gray-500">
              Produits avec pricing affilié depuis sélections
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500" />
        </button>

        {/* Service */}
        <button
          type="button"
          onClick={() => onSelect('service')}
          className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200">
            <Briefcase className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Service</h3>
            <p className="text-sm text-gray-500">
              Lignes libres : titre, description, quantité, prix, TVA
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-amber-500" />
        </button>
      </div>
    </div>
  );
}
