'use client';

interface OrderDateNotesSectionProps {
  orderDate: string;
  onDateChange: (date: string) => void;
  internalNotes: string;
  onNotesChange: (notes: string) => void;
}

export function OrderDateNotesSection({
  orderDate,
  onDateChange,
  internalNotes,
  onNotesChange,
}: OrderDateNotesSectionProps) {
  return (
    <>
      <div className="space-y-2 border-t pt-6">
        <label className="block text-sm font-medium text-gray-700">
          Date de commande <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={orderDate}
          onChange={e => onDateChange(e.target.value)}
          required
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="space-y-2 border-t pt-6">
        <label className="block text-sm font-medium text-gray-700">
          Notes internes (optionnel)
        </label>
        <textarea
          value={internalNotes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Notes visibles uniquement par l'équipe..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </>
  );
}
