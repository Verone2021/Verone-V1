'use client';

import { useState } from 'react';

import { Card, CardContent } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';

interface NoteEntry {
  date: string;
  type: string;
  categories: string[];
  fieldCount: number;
}

function parseNotes(raw: string): NoteEntry[] {
  const regex =
    /\[(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})\] ([^:]+):\s*([\s\S]*?)(?=\[\d{2}\/\d{2}\/\d{4}|$)/g;
  const entries: NoteEntry[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    const body = (match[3] ?? '').trim();
    const categories: string[] = [];
    const catRegex = /(Contact [^:]+|Contact & adresse [^:]+)\s*:/g;
    let catMatch: RegExpExecArray | null;
    while ((catMatch = catRegex.exec(body)) !== null) {
      categories.push((catMatch[1] ?? '').trim());
    }
    const fieldsMatch = body.match(/\[Champs: ([^\]]+)\]/);
    const fieldCount = fieldsMatch?.[1] ? fieldsMatch[1].split(',').length : 0;
    entries.push({
      date: match[1] ?? '',
      type: (match[2] ?? '').trim(),
      categories,
      fieldCount,
    });
  }
  return entries;
}

function NotesCondensed({ notes }: { notes: string }) {
  const [expanded, setExpanded] = useState(false);
  const entries = parseNotes(notes);

  if (entries.length === 0) {
    return <p className="text-xs text-gray-600 whitespace-pre-line">{notes}</p>;
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {entries.length} demande{entries.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
        >
          {expanded ? (
            <>
              <ChevronDown className="h-3 w-3" /> Masquer
            </>
          ) : (
            <>
              <ChevronRight className="h-3 w-3" /> Detail
            </>
          )}
        </button>
      </div>
      {entries.map((entry, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
          <MessageSquare className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-gray-400">{entry.date.slice(0, 10)}</span>
            <span className="mx-1">·</span>
            <span className="font-medium">
              {entry.categories.length > 0
                ? entry.categories.join(', ')
                : entry.type}
            </span>
            {entry.fieldCount > 0 && (
              <span className="text-gray-400">
                {' '}
                ({entry.fieldCount} champs)
              </span>
            )}
          </div>
        </div>
      ))}
      {expanded && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500 whitespace-pre-line max-h-40 overflow-y-auto">
          {notes}
        </div>
      )}
    </div>
  );
}

interface TotalsSectionProps {
  totalHt: number;
  totalTtc: number;
  notes: string | null;
}

export function TotalsSection({
  totalHt,
  totalTtc,
  notes,
}: TotalsSectionProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Total HT</span>
          <span className="text-sm font-medium">{formatCurrency(totalHt)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-200">
          <span className="font-bold">Total TTC</span>
          <span className="font-bold text-lg">{formatCurrency(totalTtc)}</span>
        </div>
        {notes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Notes
            </p>
            <NotesCondensed notes={notes} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
