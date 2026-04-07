'use client';

import type React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Textarea,
} from '@verone/ui';
import { Info } from 'lucide-react';

import type { BrowserInfo, ErrorReport } from './error-report-modal.types';

interface ErrorReportTabTechnicalProps {
  formData: Partial<ErrorReport>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ErrorReport>>>;
  browserInfo: BrowserInfo;
}

export function ErrorReportTabTechnical({
  formData,
  setFormData,
  browserInfo,
}: ErrorReportTabTechnicalProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="codeSnippet">Code d'erreur / Console</Label>
        <Textarea
          id="codeSnippet"
          value={formData.codeSnippet}
          onChange={e =>
            setFormData(prev => ({ ...prev, codeSnippet: e.target.value }))
          }
          placeholder="Coller le code d'erreur de la console JavaScript..."
          className="font-mono text-sm min-h-[120px]"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Informations du navigateur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label className="text-xs text-gray-600">User Agent</Label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {browserInfo.userAgent}
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-600">URL</Label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {browserInfo.url}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-600">Résolution</Label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {browserInfo.viewport}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Timestamp</Label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {new Date(browserInfo.timestamp).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
