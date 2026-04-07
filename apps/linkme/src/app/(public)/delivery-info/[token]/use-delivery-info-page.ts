'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import { validateToken } from './delivery-info.fetcher';
import type { DeliveryFormState, TokenValidation } from './delivery-info.types';

export function useDeliveryInfoPage(token: string) {
  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<DeliveryFormState>({
    receptionName: '',
    receptionEmail: '',
    receptionPhone: '',
    confirmedDate: '',
    desiredDeliveryDate: '',
    mallFormRequired: false,
    mallFormEmail: '',
  });

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      setIsLoading(true);
      const supabase = createClient();
      try {
        const result = await validateToken(supabase, token);
        setValidation(result);

        // Pre-fill form from existing data
        if (result.valid && result.order) {
          const d = result.order.linkmeDetails;
          setForm(prev => ({
            ...prev,
            receptionName: d.reception_contact_name ?? '',
            receptionEmail: d.reception_contact_email ?? '',
            receptionPhone: d.reception_contact_phone ?? '',
            confirmedDate:
              d.confirmed_delivery_date ?? d.desired_delivery_date ?? '',
          }));
        }
      } catch (err) {
        console.error('Error validating token:', err);
        setValidation({
          valid: false,
          expired: false,
          alreadyCompleted: false,
          order: null,
          error: 'Erreur de validation',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void run().catch(error => {
      console.error('[DeliveryInfo] Validation failed:', error);
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation?.order) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('sales_order_linkme_details')
        .update({
          reception_contact_name: form.receptionName,
          reception_contact_email: form.receptionEmail,
          reception_contact_phone: form.receptionPhone || null,
          confirmed_delivery_date: form.confirmedDate || null,
          desired_delivery_date: form.desiredDeliveryDate || null,
          mall_form_required: form.mallFormRequired,
          mall_form_email: form.mallFormRequired ? form.mallFormEmail : null,
          step4_completed_at: new Date().toISOString(),
        })
        .eq('id', validation.order.linkmeDetails.id);

      if (error) throw new Error(error.message);

      setSubmitSuccess(true);

      try {
        await fetch('/api/emails/step4-confirmed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            salesOrderId: validation.order.id,
            orderNumber: validation.order.order_number,
            requesterEmail: validation.order.linkmeDetails.requester_email,
            requesterName: validation.order.linkmeDetails.requester_name,
            organisationName:
              validation.order.organisation?.trade_name ??
              validation.order.organisation?.legal_name ??
              null,
            receptionContactName: form.receptionName,
            receptionContactEmail: form.receptionEmail,
            receptionContactPhone: form.receptionPhone || null,
            desiredDeliveryDate: form.desiredDeliveryDate || null,
          }),
        });
      } catch (emailError) {
        console.error('[DeliveryInfo] Confirmation email failed:', emailError);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Erreur lors de la soumission'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    validation,
    isLoading,
    isSubmitting,
    submitSuccess,
    submitError,
    form,
    setForm,
    handleSubmit,
  };
}
