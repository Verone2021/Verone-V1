'use client';

import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@verone/ui';
import {
  Check,
  FileText,
  Loader2,
  Search,
  Tag,
  Link as LinkIcon,
} from 'lucide-react';

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount));
}

interface LabelItem {
  label: string;
  transaction_count: number;
  total_amount: number;
}

interface UnclassifiedLabelsListProps {
  labels: LabelItem[];
  isLoading: boolean;
  onClassify: (
    label: string,
    transactionCount: number,
    totalAmount: number
  ) => void;
  onLink: (
    label: string,
    transactionCount: number,
    totalAmount: number
  ) => void;
}

export function UnclassifiedLabelsList({
  labels,
  isLoading,
  onClassify,
  onLink,
}: UnclassifiedLabelsListProps) {
  const [labelsSearch, setLabelsSearch] = useState('');

  const filteredLabels = labels.filter(label =>
    label.label.toLowerCase().includes(labelsSearch.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText size={20} />
          Libellés non classés
          <Badge variant="secondary">{labels.length}</Badge>
        </CardTitle>
        <CardDescription>
          Cliquez sur "Lier" pour associer un libellé à une organisation
        </CardDescription>
        {labels.length > 0 && (
          <div className="relative mt-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Rechercher un libellé..."
              value={labelsSearch}
              onChange={e => setLabelsSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
            <p className="mt-2 text-slate-500">Chargement...</p>
          </div>
        ) : labels.length === 0 ? (
          <div className="py-8 text-center">
            <Check className="mx-auto h-12 w-12 text-green-500" />
            <p className="mt-2 text-slate-600">
              Toutes les dépenses sont classées !
            </p>
          </div>
        ) : filteredLabels.length === 0 ? (
          <div className="py-8 text-center">
            <Search className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-slate-600">
              Aucun libellé trouvé pour "{labelsSearch}"
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] space-y-2 overflow-y-auto">
            {filteredLabels.map(label => (
              <div
                key={label.label}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {label.label}
                  </p>
                  <p className="text-sm text-slate-500">
                    {label.transaction_count} transaction(s) •{' '}
                    {formatAmount(label.total_amount)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onClassify(
                        label.label,
                        label.transaction_count,
                        label.total_amount
                      )
                    }
                    title="Classifier (catégorie seule)"
                  >
                    <Tag size={14} className="mr-1" />
                    Classer
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      onLink(
                        label.label,
                        label.transaction_count,
                        label.total_amount
                      )
                    }
                    title="Lier à une organisation"
                  >
                    <LinkIcon size={14} className="mr-1" />
                    Lier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
