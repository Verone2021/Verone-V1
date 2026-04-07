'use client';

import { useState } from 'react';

import {
  ButtonV2,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { AlertTriangle, CheckCircle, Send } from 'lucide-react';

import type {
  ErrorReport,
  ErrorReportModalProps,
} from './error-report-modal.types';
import { useBrowserInfo } from './error-report-modal.types';
import { ErrorReportTabDetails } from './ErrorReportTabDetails';
import { ErrorReportTabMedia } from './ErrorReportTabMedia';
import { ErrorReportTabTechnical } from './ErrorReportTabTechnical';
import { ErrorReportTabWorkflow } from './ErrorReportTabWorkflow';

export type {
  ErrorType,
  ErrorSeverity,
  ReportStatus,
} from './error-report-modal.types';
export type { ErrorReport };

export function ErrorReportModal({
  testId,
  testTitle,
  isOpen,
  onClose,
  onSubmit,
  existingReport,
  children,
}: ErrorReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('details');
  const browserInfo = useBrowserInfo();

  const [formData, setFormData] = useState<Partial<ErrorReport>>({
    testId,
    title: existingReport?.title ?? '',
    description: existingReport?.description ?? '',
    errorType: existingReport?.errorType ?? 'ui_bug',
    severity: existingReport?.severity ?? 'medium',
    status: existingReport?.status ?? 'open',
    screenshots: existingReport?.screenshots ?? [],
    codeSnippet: existingReport?.codeSnippet ?? '',
    steps: existingReport?.steps ?? [],
    expectedBehavior: existingReport?.expectedBehavior ?? '',
    actualBehavior: existingReport?.actualBehavior ?? '',
    browserInfo,
    createdAt: existingReport?.createdAt ?? new Date(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setIsSubmitting(true);

    try {
      const report: ErrorReport = {
        ...formData,
        id: existingReport?.id ?? `error_${Date.now()}`,
        updatedAt: new Date(),
      } as ErrorReport;

      await onSubmit(report);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-black" />
            Rapport d'Erreur - {testTitle}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => {
            void handleSubmit(e);
          }}
          className="h-full"
        >
          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className="h-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="media">Captures</TabsTrigger>
              <TabsTrigger value="technical">Technique</TabsTrigger>
              <TabsTrigger value="workflow">Reproduction</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <ErrorReportTabDetails
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <ErrorReportTabMedia
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <ErrorReportTabTechnical
                formData={formData}
                setFormData={setFormData}
                browserInfo={browserInfo}
              />
            </TabsContent>

            <TabsContent value="workflow" className="space-y-4">
              <ErrorReportTabWorkflow
                formData={formData}
                setFormData={setFormData}
              />
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4" />
              Test ID: {testId}
            </div>

            <div className="flex gap-2">
              <ButtonV2
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </ButtonV2>

              <ButtonV2
                type="submit"
                disabled={
                  isSubmitting || !formData.title || !formData.description
                }
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {existingReport ? 'Mettre à jour' : 'Créer le rapport'}
                  </>
                )}
              </ButtonV2>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Bouton rapide pour ouvrir le modal
interface QuickErrorReportProps {
  testId: string;
  testTitle: string;
  onSubmit: (report: ErrorReport) => Promise<void>;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QuickErrorReport({
  testId,
  testTitle,
  onSubmit,
  variant = 'button',
  size = 'sm',
  className,
}: QuickErrorReportProps) {
  const [isOpen, setIsOpen] = useState(false);

  const trigger =
    variant === 'icon' ? (
      <ButtonV2
        variant="ghost"
        size="sm"
        className={cn('h-8 w-8 p-0', className)}
        title="Signaler une erreur"
      >
        <AlertTriangle className="h-4 w-4 text-black" />
      </ButtonV2>
    ) : (
      <ButtonV2
        variant="outline"
        size={size}
        className={cn('text-black border-gray-300 hover:bg-gray-50', className)}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Signaler erreur
      </ButtonV2>
    );

  return (
    <ErrorReportModal
      testId={testId}
      testTitle={testTitle}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSubmit={onSubmit}
    >
      {trigger}
    </ErrorReportModal>
  );
}
