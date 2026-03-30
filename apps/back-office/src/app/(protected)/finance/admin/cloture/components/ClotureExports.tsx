'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
} from '@verone/ui';
import { Download, FileText, Shield, Loader2 } from 'lucide-react';

interface ClotureExportsProps {
  selectedYear: string;
  totalTransactions: number;
  withAttachments: number;
  exporting: string | null;
  onExportFec: () => void;
  onExportJustificatifs: () => void;
}

export function ClotureExports({
  selectedYear,
  totalTransactions,
  withAttachments,
  exporting,
  onExportFec,
  onExportJustificatifs,
}: ClotureExportsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exports pour l&apos;expert-comptable
        </CardTitle>
        <CardDescription>
          Générez les fichiers nécessaires à la clôture officielle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold">
                Fichier des Écritures Comptables (FEC)
              </h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Export normalisé Art. A.47 A-1 du Livre des Procédures Fiscales.
              18 colonnes obligatoires, format tab-séparé UTF-8.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>- {totalTransactions} écritures comptables</li>
              <li>- Format : SIREN + FEC + YYYYMMDD.txt</li>
              <li>- Obligatoire en cas de contrôle fiscal</li>
            </ul>
            <Button
              className="w-full gap-2"
              onClick={onExportFec}
              disabled={exporting !== null || totalTransactions === 0}
            >
              {exporting === 'fec' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Télécharger FEC {selectedYear}
            </Button>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">Archive justificatifs</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Archive ZIP de tous les justificatifs stockés pour l&apos;exercice{' '}
              {selectedYear}. Conservation obligatoire 10 ans.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>- {withAttachments} justificatifs disponibles</li>
              <li>- Format : ZIP (justificatifs-YYYY.zip)</li>
              <li>
                - Source : Supabase Storage bucket &quot;justificatifs&quot;
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onExportJustificatifs}
              disabled={exporting !== null}
            >
              {exporting === 'justificatifs' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Télécharger justificatifs {selectedYear}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
