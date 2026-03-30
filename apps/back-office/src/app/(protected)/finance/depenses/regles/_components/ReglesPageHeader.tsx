'use client';

import Link from 'next/link';

import { Button } from '@verone/ui';
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react';

interface ReglesPageHeaderProps {
  isLoading: boolean;
  hasRules: boolean;
  onRefresh: () => void;
  onApplyAll: () => void;
}

export function ReglesPageHeader({
  isLoading,
  hasRules,
  onRefresh,
  onApplyAll,
}: ReglesPageHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/depenses">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Retour aux dépenses
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Règles de Classification
            </h1>
            <p className="text-sm text-slate-600">
              Associez vos libellés à des organisations pour classifier
              automatiquement vos dépenses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Actualiser
          </Button>
          <Button onClick={onApplyAll} disabled={!hasRules}>
            <Zap size={16} className="mr-2" />
            Appliquer toutes les règles
          </Button>
        </div>
      </div>
    </div>
  );
}
