'use client';

import { cn } from '@verone/ui';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import { Input } from '@verone/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';
import { Switch } from '@verone/ui/components/ui/switch';
import { XCircle, Zap } from 'lucide-react';

import {
  TVA_RATES,
  calculateVAT,
  calculateTTC,
  type TvaRate,
} from '../../lib/tva';
import type { VatLine } from './types';

interface VatSectionProps {
  tvaRate: TvaRate;
  onTvaRateChange: (rate: TvaRate) => void;
  isVentilationMode: boolean;
  onVentilationModeChange: (mode: boolean) => void;
  vatLines: VatLine[];
  onVatLinesChange: (lines: VatLine[]) => void;
  htAmount: number;
  vatAmount: number;
  amount: number;
  ventilationTotals: {
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    targetTTC: number;
    isValid: boolean;
  };
  currentVatSource?: 'qonto_ocr' | 'manual' | null;
  formatAmount: (amt: number) => string;
}

export function VatSection({
  tvaRate,
  onTvaRateChange,
  isVentilationMode,
  onVentilationModeChange,
  vatLines,
  onVatLinesChange,
  htAmount,
  vatAmount,
  amount,
  ventilationTotals,
  currentVatSource,
  formatAmount,
}: VatSectionProps): React.ReactNode {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">
            Taux de TVA applicable
          </h3>
          {currentVatSource === 'qonto_ocr' && (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 text-xs"
            >
              <Zap size={12} className="mr-1" />
              Qonto OCR
            </Badge>
          )}
        </div>
        {/* Toggle ventilation */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch
            checked={isVentilationMode}
            onCheckedChange={onVentilationModeChange}
          />
          <span className="text-sm text-slate-600">
            Ventiler TVA (plusieurs taux)
          </span>
        </label>
      </div>

      {/* Mode simple: grille de taux */}
      {!isVentilationMode && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {TVA_RATES.map(rate => (
              <button
                key={rate.value}
                type="button"
                onClick={() => onTvaRateChange(rate.value)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all',
                  tvaRate === rate.value
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                )}
              >
                <span
                  className={cn(
                    'text-xl font-bold',
                    tvaRate === rate.value ? 'text-blue-700' : 'text-slate-700'
                  )}
                >
                  {rate.label}
                </span>
                <span className="text-xs text-slate-500 mt-1 text-center">
                  {rate.description}
                </span>
              </button>
            ))}
          </div>

          {/* Recap montants mode simple */}
          <div className="flex items-center justify-between rounded-xl bg-slate-100 p-5">
            <div className="flex gap-6">
              <div>
                <span className="text-sm text-slate-500">Montant HT</span>
                <div className="font-semibold text-lg">
                  {formatAmount(htAmount)}
                </div>
              </div>
              <div>
                <span className="text-sm text-slate-500">TVA</span>
                <div className="font-semibold text-lg">
                  {formatAmount(vatAmount)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-slate-500">Total TTC</span>
              <div className="font-bold text-xl text-slate-900">
                {formatAmount(Math.abs(amount))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mode ventile: lignes de ventilation */}
      {isVentilationMode && (
        <div className="space-y-4">
          {/* En-tetes */}
          <div className="grid grid-cols-13 gap-2 text-xs font-medium text-slate-500 px-1">
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-right">Montant HT</div>
            <div className="col-span-2 text-center">Taux</div>
            <div className="col-span-2 text-right">TVA</div>
            <div className="col-span-2 text-right">TTC</div>
            <div className="col-span-1" />
          </div>

          {/* Lignes de ventilation */}
          {vatLines.map((line, index) => {
            const lineTTC = calculateTTC(line.amount_ht || 0, line.tva_rate);
            const lineVAT = calculateVAT(lineTTC, line.tva_rate);
            return (
              <div
                key={line.id}
                className="grid grid-cols-13 gap-2 items-center"
              >
                <div className="col-span-4">
                  <Input
                    placeholder={`Ligne ${index + 1}`}
                    value={line.description}
                    onChange={e => {
                      const newLines = [...vatLines];
                      newLines[index] = {
                        ...line,
                        description: e.target.value,
                      };
                      onVatLinesChange(newLines);
                    }}
                    className="h-9"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={line.amount_ht || ''}
                    onChange={e => {
                      const newLines = [...vatLines];
                      newLines[index] = {
                        ...line,
                        amount_ht: parseFloat(e.target.value) || 0,
                      };
                      onVatLinesChange(newLines);
                    }}
                    className="h-9 text-right"
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    value={String(line.tva_rate)}
                    onValueChange={value => {
                      const newLines = [...vatLines];
                      newLines[index] = {
                        ...line,
                        tva_rate: parseFloat(value) as TvaRate,
                      };
                      onVatLinesChange(newLines);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TVA_RATES.map(rate => (
                        <SelectItem key={rate.value} value={String(rate.value)}>
                          {rate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 text-right text-sm font-medium">
                  {formatAmount(lineVAT)}
                </div>
                <div className="col-span-2 text-right text-sm font-semibold">
                  {formatAmount(lineTTC)}
                </div>
                <div className="col-span-1 flex justify-center">
                  {vatLines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onVatLinesChange(
                          vatLines.filter((_, i) => i !== index)
                        );
                      }}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                    >
                      <XCircle size={16} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Bouton ajouter ligne */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onVatLinesChange([
                ...vatLines,
                {
                  id: String(Date.now()),
                  description: '',
                  amount_ht: 0,
                  tva_rate: 20,
                },
              ]);
            }}
            className="w-full"
          >
            + Ajouter une ligne
          </Button>

          {/* Validation totaux */}
          <div
            className={cn(
              'flex items-center justify-between rounded-xl p-5',
              ventilationTotals.isValid
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            )}
          >
            <div className="flex gap-6">
              <div>
                <span className="text-sm text-slate-500">Total HT</span>
                <div className="font-semibold text-lg">
                  {formatAmount(ventilationTotals.totalHT)}
                </div>
              </div>
              <div>
                <span className="text-sm text-slate-500">Total TVA</span>
                <div className="font-semibold text-lg">
                  {formatAmount(ventilationTotals.totalVAT)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-slate-500">Total TTC</span>
              <div
                className={cn(
                  'font-bold text-xl',
                  ventilationTotals.isValid ? 'text-green-700' : 'text-red-700'
                )}
              >
                {formatAmount(ventilationTotals.totalTTC)} /{' '}
                {formatAmount(ventilationTotals.targetTTC)}
                {ventilationTotals.isValid ? ' \u2713' : ' \u26A0\uFE0F'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
