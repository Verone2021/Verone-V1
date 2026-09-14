'use client';

import { BulkPriceEditDialog } from './modals/BulkPriceEditDialog';
import { BulkStatusDialog } from './modals/BulkStatusDialog';
import type { useCataloguePage } from './use-catalogue-page';

interface CatalogueBulkDialogsProps {
  ctx: ReturnType<typeof useCataloguePage>;
}

/** Fenêtres des actions groupées prix et statut (SI-PROD-001). */
export function CatalogueBulkDialogs({ ctx }: CatalogueBulkDialogsProps) {
  return (
    <>
      <BulkPriceEditDialog
        open={ctx.bulkPriceOpen}
        count={ctx.bulkSelection.selectedCount}
        busy={ctx.bulkActions.busy}
        onClose={() => ctx.setBulkPriceOpen(false)}
        onApplyFlat={price => {
          void ctx.bulkActions
            .setPriceFlat(Array.from(ctx.bulkSelection.selectedIds), price)
            .finally(() => ctx.setBulkPriceOpen(false));
        }}
        onApplyPercent={percent => {
          void ctx.bulkActions
            .adjustPriceByPercent(
              Array.from(ctx.bulkSelection.selectedIds),
              percent
            )
            .finally(() => ctx.setBulkPriceOpen(false));
        }}
      />

      <BulkStatusDialog
        open={ctx.bulkStatusOpen}
        count={ctx.bulkSelection.selectedCount}
        busy={ctx.bulkActions.busy}
        onClose={() => ctx.setBulkStatusOpen(false)}
        onApply={status => {
          void ctx.bulkActions
            .setStatus(Array.from(ctx.bulkSelection.selectedIds), status)
            .finally(() => ctx.setBulkStatusOpen(false));
        }}
      />
    </>
  );
}
