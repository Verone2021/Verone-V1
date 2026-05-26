'use client';

import { useEffect, useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import { PdfPreviewModalDynamic } from '@verone/finance';
import { FileText } from 'lucide-react';

import { SourcingReportPdf } from './SourcingReportPdf';
import { useSourcingReport } from './use-sourcing-report';

export function SourcingReportButton() {
  const { report, loading, generateReport } = useSourcingReport();
  const [showPreview, setShowPreview] = useState(false);

  // Préparer le rapport en arrière-plan dès le montage : clic = ouverture immédiate
  useEffect(() => {
    if (!report && !loading) {
      void generateReport();
    }
  }, [report, loading, generateReport]);

  const handleOpen = () => {
    if (!report) {
      void generateReport().then(() => setShowPreview(true));
    } else {
      setShowPreview(true);
    }
  };

  return (
    <>
      <ButtonV2
        variant="secondary"
        icon={FileText}
        onClick={handleOpen}
        disabled={loading}
      >
        {loading ? 'Génération...' : 'Rapport PDF'}
      </ButtonV2>

      {showPreview && report && (
        <PdfPreviewModalDynamic
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          document={<SourcingReportPdf report={report} />}
          title="Rapport Sourcing"
          filename={`rapport-sourcing-${new Date().toISOString().split('T')[0]}.pdf`}
        />
      )}
    </>
  );
}
