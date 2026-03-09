'use client';

import React, { useState } from 'react';

import { Download, Filter, ArrowLeft, X } from 'lucide-react';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { useToast } from '@verone/common/hooks';
import { ABCAnalysisView } from '../../components/reports/ABCAnalysisView';
import { AgingReportView } from '../../components/reports/AgingReportView';
import { HistoriqueReportView } from '../../components/reports/HistoriqueReportView';
import { ValorisationReportView } from '../../components/reports/ValorisationReportView';

interface ReportConfigModalProps {
  reportId: string;
  reportName: string;
  onBack: () => void;
  onClose: () => void;
  onViewModeChange?: (isViewing: boolean) => void;
}

export function ReportConfigModal({
  reportId,
  reportName,
  onBack,
  onClose,
  onViewModeChange,
}: ReportConfigModalProps) {
  const { toast } = useToast();
  const [showReport, setShowReport] = useState(false);

  // Config state with default 30-day period
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [config, setConfig] = useState({
    dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
    dateTo: today.toISOString().split('T')[0],
    preset: '30j',
    format: 'pdf' as const,
  });

  const handlePresetChange = (preset: string) => {
    const now = new Date();
    const dateFrom = new Date();

    if (preset === 'custom') {
      setConfig(prev => ({ ...prev, preset }));
      return;
    }

    switch (preset) {
      case '7j':
        dateFrom.setDate(now.getDate() - 7);
        break;
      case '30j':
        dateFrom.setDate(now.getDate() - 30);
        break;
      case '90j':
        dateFrom.setDate(now.getDate() - 90);
        break;
    }

    setConfig(prev => ({
      ...prev,
      preset,
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: now.toISOString().split('T')[0],
    }));
  };

  const handleGenerateReport = () => {
    setShowReport(true);
    onViewModeChange?.(true);
    toast({
      title: 'Rapport genere',
      description: `Le rapport ${reportName} a ete genere avec succes.`,
    });
  };

  const handleClose = () => {
    setShowReport(false);
    onClose();
  };

  const renderReportView = () => {
    switch (reportId) {
      case 'aging':
        return (
          <AgingReportView dateFrom={config.dateFrom} dateTo={config.dateTo} />
        );
      case 'valorisation':
        return <ValorisationReportView />;
      case 'mouvements':
        return (
          <HistoriqueReportView
            dateFrom={config.dateFrom}
            dateTo={config.dateTo}
          />
        );
      case 'abc-xyz':
        return <ABCAnalysisView />;
      default:
        return (
          <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
            Ce rapport n&apos;est pas encore disponible.
          </div>
        );
    }
  };

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={
                showReport
                  ? () => {
                      setShowReport(false);
                      onViewModeChange?.(false);
                    }
                  : onBack
              }
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-bold">{reportName}</h2>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!showReport ? (
          /* Step 1: Configuration */
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-black flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                Configuration du rapport
              </h3>

              <div className="space-y-4">
                {/* Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Periode d&apos;analyse
                    </Label>
                    <Select
                      value={config.preset}
                      onValueChange={handlePresetChange}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7j">7 derniers jours</SelectItem>
                        <SelectItem value="30j">30 derniers jours</SelectItem>
                        <SelectItem value="90j">90 derniers jours</SelectItem>
                        <SelectItem value="custom">
                          Periode personnalisee
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Format d&apos;export
                    </Label>
                    <div className="flex items-center h-9 px-3 text-sm border rounded-md bg-gray-50 text-gray-700">
                      PDF
                    </div>
                  </div>
                </div>

                {/* Custom dates */}
                {config.preset === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">
                        Date debut
                      </Label>
                      <Input
                        type="date"
                        value={config.dateFrom}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            dateFrom: e.target.value,
                          }))
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Date fin</Label>
                      <Input
                        type="date"
                        value={config.dateTo}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            dateTo: e.target.value,
                          }))
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Config summary */}
                <div className="bg-white border border-blue-200 rounded p-3 space-y-1">
                  <p className="text-xs font-semibold text-gray-700">
                    Apercu de la configuration
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="bg-blue-50">
                      {config.preset === 'custom'
                        ? 'Personnalisee'
                        : config.preset}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50">
                      {config.format.toUpperCase()}
                    </Badge>
                    {config.dateFrom && config.dateTo && (
                      <Badge variant="outline" className="bg-blue-50">
                        {new Date(config.dateFrom).toLocaleDateString('fr-FR')}{' '}
                        → {new Date(config.dateTo).toLocaleDateString('fr-FR')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={handleGenerateReport}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generer le rapport
                </Button>
                <Button variant="outline" onClick={onBack}>
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Report view */
          <div>{renderReportView()}</div>
        )}
      </div>
    </>
  );
}
