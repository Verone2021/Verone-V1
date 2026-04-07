'use client';

import type React from 'react';

import { Badge, ButtonV2, Textarea } from '@verone/ui';
import { FileText, Trash2 } from 'lucide-react';

import type { ErrorReport } from './error-report-modal.types';

interface ErrorReportTabWorkflowProps {
  formData: Partial<ErrorReport>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ErrorReport>>>;
}

export function ErrorReportTabWorkflow({
  formData,
  setFormData,
}: ErrorReportTabWorkflowProps) {
  const addStep = () => {
    setFormData(prev => ({ ...prev, steps: [...(prev.steps ?? []), ''] }));
  };

  const updateStep = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.map((step, i) => (i === index ? value : step)) ?? [],
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index) ?? [],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Étapes de reproduction
        </span>
        <ButtonV2 type="button" variant="outline" size="sm" onClick={addStep}>
          Ajouter étape
        </ButtonV2>
      </div>

      {formData.steps && formData.steps.length > 0 ? (
        <div className="space-y-3">
          {formData.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <Badge variant="outline" className="mt-2">
                {index + 1}
              </Badge>
              <div className="flex-1">
                <Textarea
                  value={step}
                  onChange={e => updateStep(index, e.target.value)}
                  placeholder={`Étape ${index + 1}: Décrire l'action...`}
                  className="min-h-[60px]"
                />
              </div>
              <ButtonV2
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStep(index)}
              >
                <Trash2 className="h-4 w-4" />
              </ButtonV2>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Aucune étape de reproduction ajoutée</p>
          <p className="text-sm">Cliquez sur "Ajouter étape" pour commencer</p>
        </div>
      )}
    </div>
  );
}
