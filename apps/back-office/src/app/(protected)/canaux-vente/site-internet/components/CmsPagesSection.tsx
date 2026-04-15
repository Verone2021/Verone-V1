/**
 * CmsPagesSection - Edit CMS pages (CGV, FAQ, etc.) from back-office
 *
 * Reads/writes cms_pages table. Content is Markdown.
 * Features: toggle publication, create, edit, delete, updated_by tracking.
 */

'use client';

import { useCallback, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { CmsPageFormModal } from './CmsPageFormModal';

import type { PageForm } from './CmsPageFormModal';

const supabase = createClient();

const SYSTEM_SLUGS = ['cgv', 'mentions-legales', 'faq', 'livraison', 'retours'];
const LEGAL_SLUGS = ['cgv', 'mentions-legales'];

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

async function getStaffId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_FORM: PageForm = {
  title: '',
  slug: '',
  content: '',
  meta_title: '',
  meta_description: '',
  is_published: false,
};

export function CmsPagesSection() {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading } = useCmsPages();
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<PageForm>(EMPTY_FORM);

  const dialogOpen = !!editingPage || isCreating;

  const openEdit = useCallback((page: CmsPage) => {
    setEditingPage(page);
    setIsCreating(false);
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content,
      meta_title: page.meta_title ?? '',
      meta_description: page.meta_description ?? '',
      is_published: page.is_published,
    });
  }, []);

  const openCreate = useCallback(() => {
    setEditingPage(null);
    setIsCreating(true);
    setForm(EMPTY_FORM);
  }, []);

  const closeDialog = useCallback(() => {
    setEditingPage(null);
    setIsCreating(false);
  }, []);

  const togglePublish = useMutation({
    mutationFn: async ({
      pageId,
      published,
      slug,
    }: {
      pageId: string;
      published: boolean;
      slug: string;
    }) => {
      if (!published && LEGAL_SLUGS.includes(slug)) {
        toast.warning(
          'Attention : cette page est legalement obligatoire en France'
        );
      }
      const staffId = await getStaffId();
      const { error } = await supabase
        .from('cms_pages')
        .update({
          is_published: published,
          updated_by: staffId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur : ' + error.message);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const staffId = await getStaffId();
      if (isCreating) {
        const slug = form.slug || slugify(form.title);
        if (!slug) throw new Error('Le slug est requis');
        const { error } = await supabase.from('cms_pages').insert({
          slug,
          title: form.title,
          content: form.content,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
          is_published: form.is_published,
          updated_by: staffId,
        });
        if (error) throw error;
      } else if (editingPage) {
        const { error } = await supabase
          .from('cms_pages')
          .update({
            title: form.title,
            content: form.content,
            meta_title: form.meta_title || null,
            meta_description: form.meta_description || null,
            is_published: form.is_published,
            updated_by: staffId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPage.id);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      closeDialog();
      toast.success(isCreating ? 'Page creee' : 'Page mise a jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur : ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from('cms_pages')
        .delete()
        .eq('id', pageId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      toast.success('Page supprimee');
    },
    onError: (error: Error) => {
      toast.error('Erreur : ' + error.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pages editables
            </CardTitle>
            <CardDescription>
              Contenu des pages legales et informatives du site (CGV, FAQ, etc.)
            </CardDescription>
          </div>
          <ButtonV2 size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle page
          </ButtonV2>
        </div>
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
                <div className="flex items-center gap-3">
                  <Switch
                    checked={page.is_published}
                    onCheckedChange={checked => {
                      void togglePublish
                        .mutateAsync({
                          pageId: page.id,
                          published: checked,
                          slug: page.slug,
                        })
                        .catch((error: unknown) => {
                          console.error('[CmsPages] Mutation failed:', error);
                        });
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{page.title}</p>
                    <p className="text-xs text-gray-500">/{page.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(page)}
                  >
                    <Pencil className="h-4 w-4" />
                  </ButtonV2>
                  {!SYSTEM_SLUGS.includes(page.slug) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <ButtonV2 variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </ButtonV2>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Supprimer la page /{page.slug} ?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irreversible. La page sera
                            definitivement supprimee du site.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                              void deleteMutation
                                .mutateAsync(page.id)
                                .catch((error: unknown) => {
                                  console.error(
                                    '[CmsPages] Mutation failed:',
                                    error
                                  );
                                });
                            }}
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <CmsPageFormModal
          open={dialogOpen}
          onClose={closeDialog}
          form={form}
          onFormChange={setForm}
          onSave={() => {
            void saveMutation.mutateAsync().catch((error: unknown) => {
              console.error('[CmsPages] Mutation failed:', error);
            });
          }}
          isSaving={saveMutation.isPending}
          isCreating={isCreating}
          editingPage={editingPage}
        />
      </CardContent>
    </Card>
  );
}
