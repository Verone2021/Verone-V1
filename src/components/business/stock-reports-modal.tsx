'use client'

import React, { useState } from 'react'
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
  Filter,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { AgingReportView } from '@/components/business/aging-report-view'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface StockReportsModalProps {
  isOpen: boolean
  onClose: () => void
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
    metrics: ['Age moyen', '% stock >90j', 'Valeur immobilisée', 'Top 20 anciens'],
    visualizations: ['Histogramme empilé', 'Heatmap'],
    filters: ['Période', 'Catégorie', 'Fournisseur'],
    exports: ['PDF', 'Excel', 'CSV']
  },
  {
    id: 'rotation',
    name: 'Rotation des Stocks',
    description: 'Analyser turnover ratio et identifier produits à faible rotation',
    icon: RotateCw,
    priority: 'high',
    status: 'available',
    metrics: ['Turnover Ratio', 'Jours moyen rotation', 'Classification FSN'],
    visualizations: ['Graphique rotation', 'Matrice ABC/FSN'],
    filters: ['Période', 'Catégorie'],
    exports: ['PDF', 'Excel', 'CSV']
  },
  {
    id: 'valorisation',
    name: 'Valorisation Stock',
    description: 'Vue financière complète de l\'inventaire',
    icon: TrendingUp,
    priority: 'medium',
    status: 'available',
    metrics: ['Valeur totale', 'Valeur par catégorie', 'Coût unitaire moyen'],
    visualizations: ['Secteurs', 'Barres Top 10'],
    filters: ['Date snapshot', 'Catégorie', 'Fournisseur'],
    exports: ['PDF', 'Excel', 'CSV']
  },
  {
    id: 'niveaux',
    name: 'Niveaux de Stock',
    description: 'Stock actuel vs seuils (min/max/sécurité)',
    icon: BarChart3,
    priority: 'medium',
    status: 'available',
    metrics: ['Stock actuel', 'Stock sécurité', 'Jours couverture'],
    visualizations: ['Barres comparatives', 'Jauge'],
    filters: ['Catégorie', 'Emplacement'],
    exports: ['PDF', 'Excel', 'CSV']
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
    exports: ['PDF', 'Excel', 'CSV']
  },
  {
    id: 'out-of-stock',
    name: 'Ruptures de Stock',
    description: 'Produits en rupture ou risque de rupture',
    icon: AlertTriangle,
    priority: 'high',
    status: 'available',
    metrics: ['Produits en rupture', 'Risque <7j', 'Perte CA estimée'],
    visualizations: ['Tableau urgence', 'Historique ruptures'],
    filters: ['Catégorie', 'Seuil jours'],
    exports: ['PDF', 'Excel', 'CSV']
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
    exports: ['PDF', 'Excel']
  },
  {
    id: 'abc-xyz',
    name: 'Classification ABC/XYZ',
    description: 'Matrice valeur × variabilité pour stratégie stock',
    icon: FileText,
    priority: 'medium',
    status: 'coming_soon',
    metrics: ['% valeur cumulée', 'Coefficient variation', 'Classe ABC'],
    visualizations: ['Matrice 9 cases', 'Courbe Pareto'],
    filters: ['Période analyse'],
    exports: ['PDF', 'Excel']
  }
]

export function StockReportsModal({ isOpen, onClose }: StockReportsModalProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [config, setConfig] = useState({
    dateFrom: '',
    dateTo: '',
    preset: '30j',
    format: 'pdf' as 'pdf' | 'excel' | 'csv',
    category: '',
    supplier: ''
  })
  const [showReport, setShowReport] = useState(false)
  const { toast } = useToast()

  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId)
    setShowReport(false) // Reset l'affichage du rapport

    // Configuration par défaut selon le type de rapport
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    setConfig({
      preset: '30j',
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      format: 'pdf'
    })
  }

  const handleGenerateReport = () => {
    setShowReport(true)
    const reportName = AVAILABLE_REPORTS.find(r => r.id === selectedReport)?.name
    toast({
      title: "Rapport généré",
      description: `Le rapport ${reportName} a été généré avec succès.`
    })
  }

  const handlePresetChange = (preset: string) => {
    const today = new Date()
    let dateFrom = new Date()

    if (preset === 'custom') {
      // Pour période personnalisée, on met à jour le preset mais garde les dates actuelles
      setConfig(prev => ({ ...prev, preset }))
      return
    }

    switch(preset) {
      case '7j':
        dateFrom.setDate(today.getDate() - 7)
        break
      case '30j':
        dateFrom.setDate(today.getDate() - 30)
        break
      case '90j':
        dateFrom.setDate(today.getDate() - 90)
        break
    }

    setConfig(prev => ({
      ...prev,
      preset,
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    }))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'P0 - Prioritaire'
      case 'medium': return 'P1 - Standard'
      case 'low': return 'P2 - Optionnel'
      default: return priority
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-black" />
              <div>
                <DialogTitle className="text-2xl font-bold">Rapports de Stock</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Sélectionnez un rapport pour analyser vos données de stock
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {AVAILABLE_REPORTS.filter(r => r.status === 'available').length}/8 disponibles
            </Badge>
          </div>
        </DialogHeader>

        {/* Grille des rapports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {AVAILABLE_REPORTS.map((report) => {
            const Icon = report.icon
            const isSelected = selectedReport === report.id
            const isComingSoon = report.status === 'coming_soon'

            return (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-black border-2 shadow-lg'
                    : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                } ${isComingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => !isComingSoon && handleReportSelect(report.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          {report.name}
                          {isComingSoon && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200">
                              Bientôt
                            </Badge>
                          )}
                        </CardTitle>
                        <Badge className={`${getPriorityColor(report.priority)} text-xs mt-1`}>
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
                        <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {metric}
                        </Badge>
                      ))}
                      {report.metrics.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
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
                        <Badge key={idx} variant="outline" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Panel de configuration (affiché si rapport sélectionné) */}
        {selectedReport && (
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-black flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Configuration du rapport
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>{AVAILABLE_REPORTS.find(r => r.id === selectedReport)?.name}</strong>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Formulaire de configuration */}
              <div className="space-y-4">
                {/* Période */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Période d'analyse</Label>
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
                        <SelectItem value="custom">Période personnalisée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Format d'export</Label>
                    <Select
                      value={config.format}
                      onValueChange={(value: 'pdf' | 'excel' | 'csv') => setConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates personnalisées (si preset = custom) */}
                {config.preset === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Date début</Label>
                      <Input
                        type="date"
                        value={config.dateFrom}
                        onChange={(e) => setConfig(prev => ({ ...prev, dateFrom: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Date fin</Label>
                      <Input
                        type="date"
                        value={config.dateTo}
                        onChange={(e) => setConfig(prev => ({ ...prev, dateTo: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Résumé configuration */}
                <div className="bg-white border border-blue-200 rounded p-3 space-y-1">
                  <p className="text-xs font-semibold text-gray-700">Aperçu de la configuration</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="bg-blue-50">
                      📅 {config.preset === 'custom' ? 'Personnalisée' : config.preset}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50">
                      📄 {config.format.toUpperCase()}
                    </Badge>
                    {config.dateFrom && config.dateTo && (
                      <Badge variant="outline" className="bg-blue-50">
                        {new Date(config.dateFrom).toLocaleDateString('fr-FR')} → {new Date(config.dateTo).toLocaleDateString('fr-FR')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleGenerateReport}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Générer le rapport
                </Button>
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  Annuler
                </Button>
              </div>
            </div>

            {/* Affichage du rapport (si généré et aging) */}
            {showReport && selectedReport === 'aging' && (
              <div className="mt-4">
                <AgingReportView dateFrom={config.dateFrom} dateTo={config.dateTo} />
              </div>
            )}
          </div>
        )}

        {/* Footer informatif */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <strong>{AVAILABLE_REPORTS.filter(r => r.status === 'available').length} rapports</strong> disponibles immédiatement
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <strong>{AVAILABLE_REPORTS.filter(r => r.status === 'coming_soon').length} rapports</strong> en développement
              </span>
            </div>
            <span className="text-gray-500 italic">
              Basé sur Odoo, ERPNext, SAP best practices
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
