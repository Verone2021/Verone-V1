'use client';

import { useCallback, useState } from 'react';

import { Button } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useAddOrderInternalNote,
  useOrderInternalNotes,
} from '../../hooks/use-order-internal-notes';

interface Props {
  salesOrderId: string;
}

export function OrderInternalNotesTimeline({ salesOrderId }: Props) {
  const [noteContent, setNoteContent] = useState('');
  const { data: notes, isLoading } = useOrderInternalNotes(salesOrderId);
  const { mutate: addNote, isPending: isAdding } =
    useAddOrderInternalNote(salesOrderId);

  const handleSubmit = useCallback(() => {
    const trimmed = noteContent.trim();
    if (!trimmed) return;

    addNote(trimmed, {
      onSuccess: () => {
        setNoteContent('');
        toast.success('Note ajoutée');
      },
      onError: () => {
        toast.error("Erreur lors de l'ajout de la note");
      },
    });
  }, [noteContent, addNote]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+Entrée ou Cmd+Entrée pour soumettre
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="space-y-4">
      {/* Formulaire ajout de note */}
      <div className="space-y-2">
        <Textarea
          placeholder="Ajouter une note interne... (Ctrl+Entrée pour valider)"
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="resize-none text-sm"
          disabled={isAdding}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!noteContent.trim() || isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" />
            )}
            Ajouter
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : !notes || notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 space-y-2">
          <MessageSquare className="h-8 w-8 opacity-40" />
          <p className="text-sm">Aucune note interne pour cette commande.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="rounded-lg border bg-gray-50 p-3 space-y-1.5"
            >
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {note.metadata?.content ?? '—'}
              </p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(note.created_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
