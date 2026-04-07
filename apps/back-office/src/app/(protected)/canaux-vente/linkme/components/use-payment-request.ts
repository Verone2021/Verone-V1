'use client';

import { useState, useMemo, useCallback } from 'react';

import { formatPrice } from '@verone/utils';

import { useCreatePaymentRequestAdmin } from '../hooks/use-payment-requests-admin';

export type Step = 'recap' | 'template' | 'confirm';

export interface CommissionForModal {
  id: string;
  order_number: string | null;
  order_amount_ht: number;
  affiliate_commission: number;
  affiliate_commission_ttc: number | null;
  total_payout_ht: number | null;
  total_payout_ttc: number | null;
  affiliate?: {
    display_name: string;
    enseigne_id: string | null;
    organisation_id: string | null;
  } | null;
  sales_order?: {
    order_number: string;
    total_ht: number | null;
    total_ttc: number | null;
  } | null;
}

export const VERONE_LEGAL_INFO = {
  name: 'VERONE SAS',
  address: '229 Rue Saint-Honoré',
  postalCode: '75001',
  city: 'PARIS',
  siret: '914 588 785 00016',
  fullAddress: '229 Rue Saint-Honoré, 75001 PARIS',
};

interface UsePaymentRequestProps {
  selectedCommissions: CommissionForModal[];
  affiliateId: string;
  affiliateName: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export function usePaymentRequest({
  selectedCommissions,
  affiliateId,
  onSuccess,
  onClose,
}: UsePaymentRequestProps) {
  const [currentStep, setCurrentStep] = useState<Step>('recap');
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const createMutation = useCreatePaymentRequestAdmin();

  const totals = useMemo(() => {
    const totalHT = selectedCommissions.reduce(
      (sum, c) => sum + (c.total_payout_ht ?? c.affiliate_commission ?? 0),
      0
    );
    const totalTTC = selectedCommissions.reduce(
      (sum, c) => sum + (c.total_payout_ttc ?? c.affiliate_commission_ttc ?? 0),
      0
    );
    return { totalHT, totalTTC, count: selectedCommissions.length };
  }, [selectedCommissions]);

  const goToStep = useCallback((step: Step) => {
    setError(null);
    setCurrentStep(step);
  }, []);

  const handleSubmit = async () => {
    if (selectedCommissions.length === 0) {
      setError('Aucune commission sélectionnée');
      return;
    }

    try {
      setError(null);
      await createMutation.mutateAsync({
        affiliateId,
        commissionIds: selectedCommissions.map(c => c.id),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la création'
      );
    }
  };

  const handleClose = () => {
    setCurrentStep('recap');
    setError(null);
    onClose();
  };

  const handleCopyDestinataire = async () => {
    const lines = [
      VERONE_LEGAL_INFO.name,
      VERONE_LEGAL_INFO.address,
      `${VERONE_LEGAL_INFO.postalCode} ${VERONE_LEGAL_INFO.city}`,
      `SIRET : ${VERONE_LEGAL_INFO.siret}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedField('destinataire');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Erreur copie');
    }
  };

  const handleCopyDesignation = async () => {
    const lines = [
      "Commission sur ventes - Apport d'affaires",
      '',
      ...selectedCommissions.map(
        c =>
          `• Commande #${c.sales_order?.order_number ?? c.order_number ?? c.id.slice(0, 8)} : ${formatPrice(c.total_payout_ht ?? c.affiliate_commission)}`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedField('designation');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Erreur copie');
    }
  };

  const handleCopyMontant = async () => {
    try {
      await navigator.clipboard.writeText(formatPrice(totals.totalTTC));
      setCopiedField('montant');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Erreur copie');
    }
  };

  return {
    // State
    currentStep,
    error,
    copiedField,
    totals,
    createMutation,
    // Handlers
    goToStep,
    handleSubmit,
    handleClose,
    handleCopyDestinataire,
    handleCopyDesignation,
    handleCopyMontant,
  };
}
