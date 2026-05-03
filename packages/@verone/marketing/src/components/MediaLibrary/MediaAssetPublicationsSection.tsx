'use client';

import * as React from 'react';

import { Button } from '@verone/ui/components/ui/button';
import { Badge } from '@verone/ui/components/ui/badge';
import { Input } from '@verone/ui/components/ui/input';
import { Label } from '@verone/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';
import { CheckCircle2, ExternalLink, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  useMediaAssetPublications,
  PUBLICATION_CHANNELS,
  type MediaAssetPublicationChannel,
} from '@verone/products';

interface MediaAssetPublicationsSectionProps {
  assetId: string;
}

export function MediaAssetPublicationsSection({
  assetId,
}: MediaAssetPublicationsSectionProps) {
  const {
    publications,
    loading,
    addPublication,
    unpublish,
    removePublication,
  } = useMediaAssetPublications(assetId);

  const [showAddForm, setShowAddForm] = React.useState(false);
  const [channel, setChannel] =
    React.useState<MediaAssetPublicationChannel>('site_verone');
  const [externalUrl, setExternalUrl] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const handleAdd = React.useCallback(async () => {
    try {
      setSaving(true);
      await addPublication({
        channel,
        externalUrl: externalUrl.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success('Publication enregistrée');
      setShowAddForm(false);
      setExternalUrl('');
      setNotes('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur enregistrement publication'
      );
    } finally {
      setSaving(false);
    }
  }, [addPublication, channel, externalUrl, notes]);

  const handleUnpublish = React.useCallback(
    async (id: string) => {
      try {
        await unpublish(id);
        toast.success('Marquée comme retirée');
      } catch {
        toast.error('Erreur lors du retrait');
      }
    },
    [unpublish]
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      try {
        await removePublication(id);
        toast.success('Publication supprimée');
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    },
    [removePublication]
  );

  const channelLabel = (value: string) =>
    PUBLICATION_CHANNELS.find(c => c.value === value)?.label ?? value;

  const activeCount = publications.filter(p => !p.unpublished_at).length;

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Publications{' '}
          <span className="text-xs font-normal text-muted-foreground">
            ({activeCount} active{activeCount !== 1 ? 's' : ''})
          </span>
        </Label>
        {!showAddForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="min-h-[36px]"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Marquer comme publié
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="space-y-2 rounded-md border border-dashed border-border p-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Canal</Label>
              <Select
                value={channel}
                onValueChange={v =>
                  setChannel(v as MediaAssetPublicationChannel)
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PUBLICATION_CHANNELS.map(c => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="text-xs"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL (optionnel)</Label>
              <Input
                value={externalUrl}
                onChange={e => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="h-9 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes (optionnel)</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contexte, légende, hashtags..."
              className="h-9 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(false)}
              disabled={saving}
              className="h-8 text-xs"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={() => {
                void handleAdd();
              }}
              disabled={saving}
              className="h-8 text-xs"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      )}

      {loading && <p className="text-xs text-muted-foreground">Chargement…</p>}

      {!loading && publications.length === 0 && !showAddForm && (
        <p className="text-xs text-muted-foreground">
          Cette photo n'a jamais été publiée. Marque-la comme publiée la
          première fois que tu la postes pour suivre son usage.
        </p>
      )}

      {publications.length > 0 && (
        <ul className="space-y-1.5">
          {publications.map(pub => {
            const active = !pub.unpublished_at;
            return (
              <li
                key={pub.id}
                className="flex items-start gap-2 rounded-md border border-border bg-card p-2 text-xs"
              >
                <CheckCircle2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    active ? 'text-emerald-600' : 'text-muted-foreground'
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">
                      {channelLabel(pub.channel)}
                    </span>
                    {!active && (
                      <Badge variant="secondary" className="text-[10px]">
                        Retirée
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      {new Date(pub.published_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {pub.external_url && (
                    <a
                      href={pub.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Voir
                    </a>
                  )}
                  {pub.notes && (
                    <p className="text-muted-foreground">{pub.notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {active && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleUnpublish(pub.id);
                      }}
                      className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Marquer comme retirée"
                    >
                      Retirer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void handleDelete(pub.id);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label="Supprimer cette ligne"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
