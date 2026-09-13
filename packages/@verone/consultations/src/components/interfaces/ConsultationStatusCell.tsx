'use client';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Attente',
  approved: 'OK',
  rejected: 'Refus',
  ordered: 'Cmdé',
};

interface ConsultationStatusCellProps {
  itemId: string;
  status: string;
  onChangeStatus: (itemId: string, status: string) => void;
}

/** Cellule « Statut » avec segmented control (OK / Non) ou badge Cmdé. */
export function ConsultationStatusCell({
  itemId,
  status,
  onChangeStatus,
}: ConsultationStatusCellProps) {
  return (
    <td className="px-3 py-0 h-10">
      {status === 'ordered' ? (
        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded">
          {STATUS_LABELS['ordered']}
        </span>
      ) : (
        <div className="flex bg-zinc-100 p-0.5 rounded text-[9px] font-bold gap-0.5">
          <button
            type="button"
            onClick={() =>
              void onChangeStatus(
                itemId,
                status === 'pending' ? 'approved' : 'pending'
              )
            }
            className={`px-1.5 py-0.5 rounded transition-all ${
              status === 'approved'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            OK
          </button>
          <button
            type="button"
            onClick={() =>
              void onChangeStatus(
                itemId,
                status === 'pending' ? 'rejected' : 'pending'
              )
            }
            className={`px-1.5 py-0.5 rounded transition-all ${
              status === 'rejected'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Non
          </button>
        </div>
      )}
    </td>
  );
}
