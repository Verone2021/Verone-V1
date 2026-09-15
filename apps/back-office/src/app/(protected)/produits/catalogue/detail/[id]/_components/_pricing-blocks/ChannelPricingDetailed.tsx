'use client';

/**
 * ChannelPricingDetailed — tableau prix par canal pour l'onglet Tarification.
 * Colonnes : Canal / Prix HT / Écart vs min / Marge brute % / Commission /
 * Marge nette / Statut / Actions.
 * Ligne LinkMe : expandable avec breakdown commission + marge nette.
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { Badge, ConfirmDialog, ResponsiveDataView } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { RefreshCw } from 'lucide-react';

import { ChannelPricingCard } from './ChannelPricingCard';
import { ChannelPricingTableRow } from './ChannelPricingRow';
import { useChannelPricingEditor } from './use-channel-pricing-editor';
import type { ComputedChannelRow } from './channel-pricing-helpers';

interface ChannelPricingDetailedProps {
  productId: string;
  minimumSellingPrice: number;
  landedCost: number | null;
}

export function ChannelPricingDetailed({
  productId,
  minimumSellingPrice,
  landedCost,
}: ChannelPricingDetailedProps) {
  const {
    isLoading,
    editingId,
    draftPrice,
    expandedId,
    overrideConfirm,
    rows,
    isPending,
    startEdit,
    setEditingId,
    setDraftPrice,
    setOverrideConfirm,
    toggleExpand,
    persist,
    save,
    fillWithMinimum,
  } = useChannelPricingEditor({ productId, minimumSellingPrice, landedCost });

  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-neutral-900">
          Prix par canal — détail
        </h3>
        <div className="flex items-center gap-2">
          {minimumSellingPrice > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-green-50 border-green-200 text-green-700"
            >
              Min vente HT {formatPrice(minimumSellingPrice)}
            </Badge>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs border border-neutral-200 rounded px-2 py-1 hover:bg-neutral-50 text-neutral-600"
            title="Bientôt : mise à jour groupée des prix canal"
          >
            <RefreshCw className="h-3 w-3" />
            Mise à jour groupée
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-sm text-neutral-400 py-4">Chargement…</div>
      )}

      {!isLoading && rows.length > 0 && (
        <ResponsiveDataView
          data={rows}
          breakpoint="md"
          emptyMessage="Aucun canal configuré."
          renderTable={(tableRows: ComputedChannelRow[]) => (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-neutral-500 border-b border-neutral-100">
                    <th
                      className="text-left py-2 pl-2 w-5 font-medium"
                      aria-label="Expand"
                    />
                    <th className="text-left py-2 font-medium">Canal</th>
                    <th className="text-right py-2 font-medium">Prix HT</th>
                    <th className="text-right py-2 font-medium hidden lg:table-cell">
                      Écart vs min
                    </th>
                    <th className="text-right py-2 font-medium hidden lg:table-cell">
                      Marge brute %
                    </th>
                    <th className="text-right py-2 font-medium hidden xl:table-cell">
                      Commission
                    </th>
                    <th className="text-right py-2 font-medium hidden xl:table-cell">
                      Marge nette %
                    </th>
                    <th className="text-left py-2 pl-3 font-medium hidden md:table-cell">
                      Statut
                    </th>
                    <th className="text-right py-2 pr-2 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(row => {
                    const canExpand =
                      row.channel_code === 'linkme' &&
                      row.commissionRate != null &&
                      row.commissionRate > 0 &&
                      row.effectivePrice != null;
                    return (
                      <ChannelPricingTableRow
                        key={row.channel_id}
                        row={row}
                        isEditing={editingId === row.channel_id}
                        isExpanded={expandedId === row.channel_id}
                        canExpand={canExpand}
                        draftPrice={draftPrice}
                        minimumSellingPrice={minimumSellingPrice}
                        isPending={isPending}
                        onToggleExpand={toggleExpand}
                        onStartEdit={startEdit}
                        onDraftChange={setDraftPrice}
                        onSave={(channelId, channelName) => {
                          void save(channelId, channelName);
                        }}
                        onCancel={() => setEditingId(null)}
                        onFillMin={fillWithMinimum}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          renderCard={(row: ComputedChannelRow) => (
            <ChannelPricingCard
              key={row.channel_id}
              row={row}
              isEditing={editingId === row.channel_id}
              draftPrice={draftPrice}
              minimumSellingPrice={minimumSellingPrice}
              isPending={isPending}
              onStartEdit={startEdit}
              onDraftChange={setDraftPrice}
              onSave={(channelId, channelName) => {
                void save(channelId, channelName);
              }}
              onCancel={() => setEditingId(null)}
              onFillMin={fillWithMinimum}
            />
          )}
        />
      )}

      <ConfirmDialog
        open={overrideConfirm !== null}
        onOpenChange={open => {
          if (!open) setOverrideConfirm(null);
        }}
        variant="destructive"
        title="Prix sous le minimum vente"
        description={
          overrideConfirm
            ? `Le prix saisi pour ${overrideConfirm.channelName} (${formatPrice(overrideConfirm.price)}) est inférieur au prix minimum vente (${formatPrice(minimumSellingPrice)}). Confirmer cette dérogation ?`
            : ''
        }
        confirmText="Forcer ce prix"
        cancelText="Annuler"
        loading={isPending}
        onConfirm={async () => {
          if (overrideConfirm) {
            await persist(
              overrideConfirm.channelId,
              overrideConfirm.price,
              true
            );
          }
        }}
      />
    </section>
  );
}
