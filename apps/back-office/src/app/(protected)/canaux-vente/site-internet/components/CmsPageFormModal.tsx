'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { toast } from 'sonner';

const LEGAL_SLUGS = ['cgv', 'mentions-legales'];

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
}

export interface PageForm {
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  form: PageForm;
  onFormChange: (form: PageForm) => void;
  onSave: () => void;
  isSaving: boolean;
  isCreating: boolean;
  editingPage: CmsPage | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CmsPageFormModal({
  open,
  onClose,
  form,
  onFormChange,
  onSave,
  isSaving,
  isCreating,
  editingPage,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Nouvelle page' : `Modifier : ${editingPage?.title}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isCreating && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Titre</Label>
                <Input
                  value={form.title}
                  onChange={e => {
                    const title = e.target.value;
                    onFormChange({
                      ...form,
                      title,
                      slug: slugify(title),
                    });
                  }}
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={e =>
                    onFormChange({ ...form, slug: e.target.value })
                  }
                  placeholder="auto-genere depuis le titre"
                />
              </div>
            </div>
          )}
          {!isCreating && (
            <div>
              <Label>Titre de la page</Label>
              <Input
                value={form.title}
                onChange={e => onFormChange({ ...form, title: e.target.value })}
              />
            </div>
          )}
          <div>
            <Label>Contenu (Markdown)</Label>
            <Textarea
              value={form.content}
              onChange={e => onFormChange({ ...form, content: e.target.value })}
              rows={16}
              className="font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Meta Title (SEO)</Label>
              <Input
                value={form.meta_title}
                onChange={e =>
                  onFormChange({ ...form, meta_title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Meta Description (SEO)</Label>
              <Input
                value={form.meta_description}
                onChange={e =>
                  onFormChange({
                    ...form,
                    meta_description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.is_published}
              onCheckedChange={checked => {
                if (
                  !checked &&
                  editingPage &&
                  LEGAL_SLUGS.includes(editingPage.slug)
                ) {
                  toast.warning(
                    'Attention : cette page est legalement obligatoire en France'
                  );
                }
                onFormChange({ ...form, is_published: checked });
              }}
            />
            <Label>
              {form.is_published ? 'Publiee sur le site' : 'Non publiee'}
            </Label>
          </div>
        </div>
        <DialogFooter>
          <ButtonV2 variant="outline" onClick={onClose}>
            Annuler
          </ButtonV2>
          <ButtonV2 onClick={onSave} disabled={isSaving || !form.title}>
            {isSaving
              ? 'Enregistrement...'
              : isCreating
                ? 'Creer la page'
                : 'Enregistrer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
