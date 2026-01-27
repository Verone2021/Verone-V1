'use client';

import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileBarChart,
  Plus,
  Loader2,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'monthly' | 'quarterly' | 'custom';
  format: 'pdf' | 'excel';
  icon: typeof FileText;
}

interface GeneratedReport {
  id: string;
  name: string;
  templateName: string;
  generatedAt: string;
  period: string;
  format: 'pdf' | 'excel';
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: '1',
    name: 'Rapport mensuel',
    description: 'Synthèse des ventes, commissions et performances du mois',
    type: 'monthly',
    format: 'pdf',
    icon: FileBarChart,
  },
  {
    id: '2',
    name: 'Export commissions',
    description: 'Liste détaillée de toutes les commissions du mois',
    type: 'monthly',
    format: 'excel',
    icon: FileSpreadsheet,
  },
  {
    id: '3',
    name: 'Rapport trimestriel',
    description: 'Analyse complète des performances sur 3 mois',
    type: 'quarterly',
    format: 'pdf',
    icon: FileBarChart,
  },
  {
    id: '4',
    name: 'Export affiliés',
    description: 'Liste des affiliés avec leurs statistiques',
    type: 'custom',
    format: 'excel',
    icon: FileSpreadsheet,
  },
];

const GENERATED_REPORTS: GeneratedReport[] = [
  {
    id: '1',
    name: 'rapport_mensuel_novembre_2025.pdf',
    templateName: 'Rapport mensuel',
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    period: 'Novembre 2025',
    format: 'pdf',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '2',
    name: 'commissions_novembre_2025.xlsx',
    templateName: 'Export commissions',
    generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    period: 'Novembre 2025',
    format: 'excel',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '3',
    name: 'rapport_mensuel_octobre_2025.pdf',
    templateName: 'Rapport mensuel',
    generatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    period: 'Octobre 2025',
    format: 'pdf',
    status: 'completed',
    downloadUrl: '#',
  },
];

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Template Card
// ============================================================================

interface TemplateCardProps {
  template: ReportTemplate;
  onGenerate: (templateId: string) => void;
  isGenerating: boolean;
}

function TemplateCard({
  template,
  onGenerate,
  isGenerating,
}: TemplateCardProps) {
  const Icon = template.icon;

  return (
    <Card className="hover:border-gray-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${
              template.format === 'pdf' ? 'bg-red-100' : 'bg-emerald-100'
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                template.format === 'pdf' ? 'text-red-600' : 'text-emerald-600'
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {template.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {template.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase ${
                  template.format === 'pdf'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {template.format}
              </span>
              <span className="text-[10px] text-gray-400">
                {template.type === 'monthly'
                  ? 'Mensuel'
                  : template.type === 'quarterly'
                    ? 'Trimestriel'
                    : 'Personnalisé'}
              </span>
            </div>
          </div>
          <ButtonV2
            size="sm"
            variant="outline"
            onClick={() => onGenerate(template.id)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </ButtonV2>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Report Row
// ============================================================================

interface ReportRowProps {
  report: GeneratedReport;
}

function ReportRow({ report }: ReportRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div
        className={`p-2 rounded-lg ${
          report.format === 'pdf' ? 'bg-red-100' : 'bg-emerald-100'
        }`}
      >
        {report.format === 'pdf' ? (
          <FileBarChart
            className={`h-4 w-4 ${
              report.format === 'pdf' ? 'text-red-600' : 'text-emerald-600'
            }`}
          />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {report.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{report.period}</span>
          <span className="text-gray-300">•</span>
          <span className="text-xs text-gray-400">{report.templateName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {report.status === 'completed' ? (
          <>
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs">Prêt</span>
            </div>
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Télécharger"
            >
              <Download className="h-4 w-4" />
            </button>
          </>
        ) : report.status === 'processing' ? (
          <div className="flex items-center gap-1 text-amber-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">Génération...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Erreur</span>
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-400">
          {formatDate(report.generatedAt)}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function RapportsPage() {
  const [templates] = useState<ReportTemplate[]>(REPORT_TEMPLATES);
  const [reports] = useState<GeneratedReport[]>(GENERATED_REPORTS);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleGenerate = async (templateId: string) => {
    setGeneratingId(templateId);
    // Simuler la génération
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGeneratingId(null);
    // TODO: Implémenter la vraie génération
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-sm text-gray-500">
            Génération et export de rapports d&apos;analyse
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-4 w-4" />
            Période
          </button>
        </div>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Templates de rapport</CardTitle>
              <CardDescription>
                Générez un nouveau rapport à partir d&apos;un template
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onGenerate={id => {
                  void handleGenerate(id).catch(error => {
                    console.error(
                      '[RapportsPage] Report generation failed:',
                      error
                    );
                  });
                }}
                isGenerating={generatingId === template.id}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Rapports générés</CardTitle>
              <CardDescription>Historique des rapports générés</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun rapport généré</p>
              <p className="text-sm text-gray-400">
                Utilisez un template ci-dessus pour générer votre premier
                rapport
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map(report => (
                <ReportRow key={report.id} report={report} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Fonctionnalité en développement</p>
          <p className="text-amber-700 mt-1">
            La génération automatique de rapports PDF/Excel sera disponible dans
            une prochaine version. Pour l&apos;instant, utilisez l&apos;export
            CSV depuis la page Analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
