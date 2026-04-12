/**
 * CmsPagesSection - Edit CMS pages (CGV, FAQ, etc.) from back-office
 *
 * Reads/writes cms_pages table. Content is Markdown.
 */

'use client';

import { useCallback, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { FileText, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const supabase = createClient();

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  updated_at: string | null;
}

function useCmsPages() {
  return useQuery({
    queryKey: ['cms-pages'],
    queryFn: async (): Promise<CmsPage[]> => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select(
          'id, slug, title, content, meta_title, meta_description, is_published, updated_at'
        )
        .order('title');
      if (error) throw error;
      return (data ?? []) as CmsPage[];
    },
    staleTime: 60_000,
  });
}

interface EditForm {
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
}

export function CmsPagesSection() {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading } = useCmsPages();
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [form, setForm] = useState<EditForm>({
    title: '',
    content: '',
    meta_title: '',
    meta_description: '',
  });

  const openEdit = useCallback((page: CmsPage) => {
    setEditingPage(page);
    setForm({
      title: page.title,
      content: page.content,
      meta_title: page.meta_title ?? '',
      meta_description: page.meta_description ?? '',
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editingPage) return;
      const { error } = await supabase
        .from('cms_pages')
        .update({
          title: form.title,
          content: form.content,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPage.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      setEditingPage(null);
      toast.success('Page mise a jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur : ' + error.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pages editables
        </CardTitle>
        <CardDescription>
          Contenu des pages legales et informatives du site (CGV, FAQ, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : pages.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            Aucune page CMS configuree.
          </p>
        ) : (
          <div className="space-y-2">
            {pages.map(page => (
              <div
                key={page.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">{page.title}</p>
                  <p className="text-xs text-gray-500">/{page.slug}</p>
                </div>
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(page)}
                >
                  <Pencil className="h-4 w-4" />
                </ButtonV2>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={!!editingPage}
          onOpenChange={open => !open && setEditingPage(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier : {editingPage?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Titre de la page</Label>
                <Input
                  value={form.title}
                  onChange={e =>
                    setForm(prev => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Contenu (Markdown)</Label>
                <Textarea
                  value={form.content}
                  onChange={e =>
                    setForm(prev => ({ ...prev, content: e.target.value }))
                  }
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meta Title (SEO)</Label>
                  <Input
                    value={form.meta_title}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        meta_title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Meta Description (SEO)</Label>
                  <Input
                    value={form.meta_description}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        meta_description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <ButtonV2 variant="outline" onClick={() => setEditingPage(null)}>
                Annuler
              </ButtonV2>
              <ButtonV2
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </ButtonV2>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
