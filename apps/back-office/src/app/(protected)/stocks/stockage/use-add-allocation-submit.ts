'use client';

/**
 * Submit logic for AddAllocationDialog
 *
 * @module use-add-allocation-submit
 * @since 2025-12-20
 */

import { type AddAllocationFormState } from './use-add-allocation-form';

async function updateStartDateAfterCreation(
  updateStartDateMutation: AddAllocationFormState['updateStartDateMutation'],
  productId: string,
  ownerId: string,
  ownerType: string,
  date: Date
) {
  const supabase = (
    await import('@verone/utils/supabase/client')
  ).createClient();
  const { data: newAlloc } = await supabase
    .from('storage_allocations')
    .select('id')
    .eq('product_id', productId)
    .eq(
      ownerType === 'enseigne' ? 'owner_enseigne_id' : 'owner_organisation_id',
      ownerId
    )
    .single<{ id: string }>();
  if (newAlloc) {
    await updateStartDateMutation.mutateAsync({
      allocationId: newAlloc.id,
      startDate: date.toISOString().split('T')[0],
    });
  }
}

export async function handleAllocationSubmit(
  form: AddAllocationFormState,
  onSuccess: () => void
) {
  if (!form.selectedOwner || !form.selectedProduct || form.quantity <= 0)
    return;
  try {
    await form.createAllocation.mutateAsync({
      productId: form.selectedProduct.id,
      ownerType: form.selectedOwner.type,
      ownerId: form.selectedOwner.id,
      quantity: form.quantity,
      billable: form.billable,
    });
    if (form.storageStartDate) {
      await updateStartDateAfterCreation(
        form.updateStartDateMutation,
        form.selectedProduct.id,
        form.selectedOwner.id,
        form.selectedOwner.type,
        form.storageStartDate
      );
    }
    form.resetForm();
    onSuccess();
  } catch {
    alert('Erreur lors de la creation');
  }
}
