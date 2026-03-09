'use client';

import React, { useState } from 'react';

import {
  FileText,
  TrendingUp,
  Clock,
  RotateCw,
  AlertTriangle,
  Package,
  Users,
  BarChart3,
  Download,
  Calendar,
  ArrowLeft,
  X,
} from 'lucide-react';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { ReportConfigModal } from './ReportConfigModal';
import { ABCAnalysisView } from '../reports/ABCAnalysisView';
import { ValorisationReportView } from '../reports/ValorisationReportView';

interface StockReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Catalogue des 8 rapports essentiels (basé sur manifests/features/SYSTEME-RAPPORTS-STOCK-COMPLET.md)
const AVAILABLE_REPORTS = [
  {
    id: 'aging',
    name: 'Aging Inventaire',
    description: 'Identifier les stocks anciens et optimiser liquidité',
    icon: Clock,
    priority: 'high',
    status: 'available',
    metrics: [
      'Age moyen',
      '% stock >90j',
      'Valeur immobilisée',
      'Top 20 anciens',
    ],
    visualizations: ['Histogramme empilé', 'Heatmap'],
    filters: ['Période', 'Catégorie', 'Fournisseur'],
    exports: ['PDF'],
  },
  {
    id: 'rotation',
    name: 'Rotation des Stocks',
    description:
      'Analyser turnover ratio et identifier produits à faible rotation',
    icon: RotateCw,
    priority: 'high',
    status: 'coming_soon',
    metrics: ['Turnover Ratio', 'Jours moyen rotation', 'Classification FSN'],
    visualizations: ['Graphique rotation', 'Matrice ABC/FSN'],
    filters: ['Période', 'Catégorie'],
    exports: ['PDF'],
  },
  {
    id: 'valorisation',
    name: 'Valorisation Stock',
    description: "Vue financière complète de l'inventaire",
    icon: TrendingUp,
    priority: 'medium',
    status: 'available',
    metrics: ['Valeur totale', 'Valeur par catégorie', 'Coût unitaire moyen'],
    visualizations: ['Secteurs', 'Barres Top 10'],
    filters: ['Date snapshot', 'Catégorie', 'Fournisseur'],
    exports: ['PDF'],
  },
  {
    id: 'niveaux',
    name: 'Niveaux de Stock',
    description: 'Stock actuel vs seuils (min/max/sécurité)',
    icon: BarChart3,
    priority: 'medium',
    status: 'coming_soon',
    metrics: ['Stock actuel', 'Stock sécurité', 'Jours couverture'],
    visualizations: ['Barres comparatives', 'Jauge'],
    filters: ['Catégorie', 'Emplacement'],
    exports: ['PDF'],
  },
  {
    id: 'mouvements',
    name: 'Historique Mouvements',
    description: 'Analyse détaillée IN/OUT/ADJUST par période',
    icon: Package,
    priority: 'low',
    status: 'available',
    metrics: ['Total IN', 'Total OUT', 'Total ADJUST', 'Net change'],
    visualizations: ['Timeline', 'Courbes tendances'],
    filters: ['Période', 'Type mouvement', 'Produit'],
    exports: ['PDF'],
  },
  {
    id: 'out-of-stock',
    name: 'Ruptures de Stock',
    description: 'Produits en rupture ou risque de rupture',
    icon: AlertTriangle,
    priority: 'high',
    status: 'coming_soon',
    metrics: ['Produits en rupture', 'Risque <7j', 'Perte CA estimée'],
    visualizations: ['Tableau urgence', 'Historique ruptures'],
    filters: ['Catégorie', 'Seuil jours'],
    exports: ['PDF'],
  },
  {
    id: 'fournisseurs',
    name: 'Performance Fournisseurs',
    description: 'Analyse qualité et délais par fournisseur',
    icon: Users,
    priority: 'low',
    status: 'coming_soon',
    metrics: ['Délai moyen', 'Taux conformité', 'Quality Index'],
    visualizations: ['Tableau scoring', 'Graphique délais'],
    filters: ['Fournisseur', 'Période'],
    exports: ['PDF', 'Excel'],
  },
  {
    id: 'abc-xyz',
    name: 'Classification ABC/XYZ',
    description: 'Matrice valeur × variabilité pour stratégie stock',
    icon: FileText,
    priority: 'medium',
    status: 'available',
    metrics: ['% valeur cumulée', 'Coefficient variation', 'Classe ABC'],
    visualizations: ['Matrice 9 cases', 'Courbe Pareto'],
    filters: ['Période analyse'],
    exports: ['CSV'],
  },
];

// Reports that don't need date config — bypass ReportConfigModal
const DIRECT_REPORT_IDS = new Set(['valorisation', 'abc-xyz']);

export function StockReportsModal({ isOpen, onClose }: StockReportsModalProps) {
  const [pdfReportId, setPdfReportId] = useState<string | null>(null);
  const [directReportId, setDirectReportId] = useState<string | null>(null);
  const [isViewingReport, setIsViewingReport] = useState(false);

  const selectedReportData = pdfReportId
    ? AVAILABLE_REPORTS.find(r => r.id === pdfReportId)
    : null;

  const directReportData = directReportId
    ? AVAILABLE_REPORTS.find(r => r.id === directReportId)
    : null;

  const handleReportClick = (reportId: string) => {
    if (DIRECT_REPORT_IDS.has(reportId)) {
      setDirectReportId(reportId);
    } else {
      setPdfReportId(reportId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'P0 - Prioritaire';
      case 'medium':
        return 'P1 - Standard';
      case 'low':
        return 'P2 - Optionnel';
      default:
        return priority;
    }
  };

  const activeReportId = pdfReportId || directReportId;

  const handleCloseAll = () => {
    setPdfReportId(null);
    setDirectReportId(null);
    setIsViewingReport(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseAll}>
      <DialogContent
        dialogSize={
          isViewingReport || directReportId
            ? 'full'
            : pdfReportId
              ? 'lg'
              : undefined
        }
        hideCloseButton={!!activeReportId}
        className={
          isViewingReport || directReportId
            ? 'flex flex-col !p-0 !h-[90vh]'
            : pdfReportId
              ? 'flex flex-col !p-0'
              : 'max-w-7xl max-h-[90vh] overflow-y-auto'
        }
      >
        {directReportId && directReportData ? (
          <>
            {/* Header for direct reports (no config) */}
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDirectReportId(null)}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-bold">{directReportData.name}</h2>
                </div>
                <Button
                  onClick={handleCloseAll}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Direct report content */}
            <div className="flex-1 overflow-y-auto p-6">
              {directReportId === 'valorisation' && <ValorisationReportView />}
              {directReportId === 'abc-xyz' && <ABCAnalysisView />}
            </div>
          </>
        ) : pdfReportId && selectedReportData ? (
          <ReportConfigModal
            reportId={selectedReportData.id}
            reportName={selectedReportData.name}
            onBack={() => {
              setPdfReportId(null);
              setIsViewingReport(false);
            }}
            onClose={handleCloseAll}
            onViewModeChange={setIsViewingReport}
          />
        ) : (
          <>
            <DialogHeader className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-black" />
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      Rapports de Stock
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600 mt-1">
                      Sélectionnez un rapport pour analyser vos données de stock
                    </DialogDescription>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {
                    AVAILABLE_REPORTS.filter(r => r.status === 'available')
                      .length
                  }
                  /8 disponibles
                </Badge>
              </div>
            </DialogHeader>

            {/* Grille des rapports */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {AVAILABLE_REPORTS.map(report => {
                const Icon = report.icon;
                const isComingSoon = report.status === 'coming_soon';

                return (
                  <Card
                    key={report.id}
                    className={`cursor-pointer transition-all border-gray-200 hover:border-gray-400 hover:shadow-md ${isComingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() =>
                      !isComingSoon && handleReportClick(report.id)
                    }
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                              {report.name}
                              {isComingSoon && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200"
                                >
                                  Bientôt
                                </Badge>
                              )}
                            </CardTitle>
                            <Badge
                              className={`${getPriorityColor(report.priority)} text-xs mt-1`}
                            >
                              {getPriorityLabel(report.priority)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {report.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      {/* Métriques */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Métriques clés
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {report.metrics.slice(0, 3).map((metric, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {metric}
                            </Badge>
                          ))}
                          {report.metrics.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-gray-50 text-gray-600"
                            >
                              +{report.metrics.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Exports */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          Export
                        </p>
                        <div className="flex gap-1">
                          {report.exports.map((format, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Footer informatif */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <strong>
                      {
                        AVAILABLE_REPORTS.filter(r => r.status === 'available')
                          .length
                      }{' '}
                      rapports
                    </strong>{' '}
                    disponibles immédiatement
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <strong>
                      {
                        AVAILABLE_REPORTS.filter(
                          r => r.status === 'coming_soon'
                        ).length
                      }{' '}
                      rapports
                    </strong>{' '}
                    en développement
                  </span>
                </div>
                <span className="text-gray-500 italic">
                  Basé sur Odoo, ERPNext, SAP best practices
                </span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
