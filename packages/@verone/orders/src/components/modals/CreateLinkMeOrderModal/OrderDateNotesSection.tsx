'use client';

interface OrderDateNotesSectionProps {
  orderDate: string;
  onOrderDateChange: (v: string) => void;
  internalNotes: string;
  onInternalNotesChange: (v: string) => void;
}

export function OrderDateNotesSection({
  orderDate,
  onOrderDateChange,
  internalNotes,
  onInternalNotesChange,
}: OrderDateNotesSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Date de commande
        </label>
        <input
          type="date"
          value={orderDate}
          onChange={e => onOrderDateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Notes internes (optionnel)
        </label>
        <textarea
          value={internalNotes}
          onChange={e => onInternalNotesChange(e.target.value)}
          placeholder="Notes visibles uniquement par l'équipe..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>
    </>
  );
}
