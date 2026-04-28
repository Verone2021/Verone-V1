'use client';

/**
 * AdminMetadataCard — bloc compact "Métadonnées admin" dans l'onglet Général.
 *
 * Champs : requires_sample (boolean) + article_type (enum).
 * Sauvegarde immédiate via onProductUpdate sur chaque changement.
 * Touch targets : 44px mobile / 36px desktop (règle responsive).
 */

import { useCallback } from 'react';

import {
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { FlaskConical } from 'lucide-react';

import type { ProductRow } from '../types';

type ArticleType = 'vente_de_marchandises' | 'prestations_de_services';

const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  vente_de_marchandises: 'Vente de marchandises',
  prestations_de_services: 'Prestation de services',
};

interface AdminMetadataCardProps {
  requiresSample: boolean | null;
  articleType: ArticleType;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

export function AdminMetadataCard({
  requiresSample,
  articleType,
  onProductUpdate,
}: AdminMetadataCardProps) {
  const handleSampleChange = useCallback(
    (checked: boolean) => {
      void onProductUpdate({ requires_sample: checked }).catch(err => {
        console.error('[AdminMetadataCard] save requires_sample failed:', err);
      });
    },
    [onProductUpdate]
  );

  const handleArticleTypeChange = useCallback(
    (value: string) => {
      const typed = value as ArticleType;
      void onProductUpdate({ article_type: typed }).catch(err => {
        console.error('[AdminMetadataCard] save article_type failed:', err);
      });
    },
    [onProductUpdate]
  );

  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="h-4 w-4 text-neutral-400" />
        <h3 className="text-sm font-semibold text-neutral-900">
          Métadonnées admin
        </h3>
      </div>

      <div className="space-y-3">
        {/* requires_sample — toggle */}
        <div className="flex items-center justify-between gap-3">
          <Label
            htmlFor="requires-sample"
            className="text-xs text-neutral-600 font-normal cursor-pointer"
          >
            Nécessite un échantillon avant production
          </Label>
          {/* Wrapper 44px touch target sur mobile, auto sur desktop */}
          <div className="flex items-center justify-center h-11 w-11 md:h-auto md:w-auto shrink-0">
            <Switch
              id="requires-sample"
              checked={requiresSample ?? false}
              onCheckedChange={handleSampleChange}
              switchSize="sm"
              aria-label="Nécessite un échantillon avant production"
            />
          </div>
        </div>

        {/* article_type — select */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="article-type"
            className="text-xs text-neutral-600 font-normal"
          >
            Type d&apos;article (comptabilité)
          </Label>
          <Select value={articleType} onValueChange={handleArticleTypeChange}>
            <SelectTrigger
              id="article-type"
              selectSize="sm"
              className="h-8 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(ARTICLE_TYPE_LABELS) as [ArticleType, string][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
