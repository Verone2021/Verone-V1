/**
 * SubcategoryForm - Formulaire pour sous-categories
 */

'use client';

import { useState, useEffect } from 'react';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Save, Loader2 } from 'lucide-react';

import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

import { SubcategoryImageUpload } from './subcategory-image-upload';
import type {
  SubcategoryFormProps,
  SubcategoryFormData,
  Subcategory,
} from './subcategory-form-types';

export function SubcategoryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  mode,
  categories,
}: SubcategoryFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState<SubcategoryFormData>({
    parent_id: initialData?.category_id ?? '',
    family_id: '',
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    image_url: initialData?.image_url ?? '',
    display_order: initialData?.display_order ?? 1,
    is_active: initialData?.is_active ?? true,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        parent_id: initialData?.category_id ?? '',
        family_id: '',
        name: initialData?.name ?? '',
        description: initialData?.description ?? '',
        image_url: initialData?.image_url ?? '',
        display_order: initialData?.display_order ?? 1,
        is_active: initialData?.is_active ?? true,
      });
    }
  }, [isOpen, initialData]);

  const handleCategoryChange = async (categoryId: string) => {
    setFormData(prev => ({ ...prev, parent_id: categoryId }));
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('family_id')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      setFormData(prev => ({ ...prev, family_id: data.family_id ?? '' }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Erreur recuperation family_id categorie:', message);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Le nom de la sous-categorie est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.parent_id) {
      toast({
        title: 'Categorie requise',
        description: 'Vous devez selectionner une categorie parent',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const slug = generateSlug(formData.name);
      let result;

      if (mode === 'create') {
        const { data, error } = await supabase
          .from('subcategories')
          .insert([
            {
              category_id: formData.parent_id,
              name: formData.name,
              slug,
              description: formData.description,
              image_url: formData.image_url,
              display_order: formData.display_order,
              is_active: formData.is_active,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: 'Sous-categorie creee',
          description: `La sous-categorie "${formData.name}" a ete creee`,
        });
      } else {
        const { data, error } = await supabase
          .from('subcategories')
          .update({
            name: formData.name,
            description: formData.description,
            image_url: formData.image_url,
            display_order: formData.display_order,
            is_active: formData.is_active,
            slug,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData!.id)
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: 'Sous-categorie modifiee',
          description: `La sous-categorie "${formData.name}" a ete mise a jour`,
        });
      }

      onSubmit(result as Subcategory);
      onClose();
    } catch (error: unknown) {
      let errorMessage = 'Une erreur est survenue';
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        errorMessage =
          'Une sous-categorie avec ce nom existe deja dans cette categorie.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'create'
      ? 'Nouvelle sous-categorie'
      : 'Modifier la sous-categorie';
  const selectedCategory = categories.find(c => c.id === formData.parent_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">{title}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Creer une nouvelle sous-categorie dans une categorie existante'
              : 'Modifier les informations de cette sous-categorie'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            void handleSubmit(e).catch(error => {
              console.error('[SubcategoryForm] handleSubmit failed:', error);
            });
          }}
          className="space-y-6"
        >
          {/* Categorie parent */}
          <div className="space-y-2">
            <Label className="text-black">Categorie parent*</Label>
            {(mode === 'edit' ||
              (mode === 'create' && initialData?.category_id)) &&
            selectedCategory ? (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm font-medium text-gray-900">
                  {selectedCategory.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Famille: {selectedCategory.family_name}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La categorie parent ne peut pas etre modifiee.
                </p>
              </div>
            ) : (
              <Select
                value={formData.parent_id}
                onValueChange={value => {
                  void handleCategoryChange(value).catch(error => {
                    console.error(
                      '[SubcategoryForm] handleCategoryChange failed:',
                      error
                    );
                  });
                }}
                required
              >
                <SelectTrigger className="border-gray-300 focus:border-black">
                  <SelectValue placeholder="Selectionnez une categorie..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-gray-500">
                          Famille: {category.family_name}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-black">
              Nom de la sous-categorie*
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ex: Chaises de bureau, Tables basses..."
              className="border-gray-300 focus:border-black"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-black">
              Description de la sous-categorie
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Description de cette sous-categorie"
              className="border-gray-300 focus:border-black resize-none"
              rows={3}
            />
          </div>

          {/* Image */}
          <SubcategoryImageUpload
            imageUrl={formData.image_url}
            uploadingImage={uploadingImage}
            setUploadingImage={setUploadingImage}
            onImageChange={url =>
              setFormData(prev => ({ ...prev, image_url: url }))
            }
            onImageRemove={() =>
              setFormData(prev => ({ ...prev, image_url: '' }))
            }
          />

          {/* Ordre d'affichage */}
          <div className="space-y-2">
            <Label htmlFor="display_order" className="text-black">
              Ordre d'affichage
            </Label>
            <Input
              id="display_order"
              type="number"
              min="1"
              value={formData.display_order}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  display_order: parseInt(e.target.value) || 1,
                }))
              }
              className="border-gray-300 focus:border-black"
            />
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label className="text-black">Statut</Label>
            <Select
              value={formData.is_active ? 'active' : 'inactive'}
              onValueChange={value =>
                setFormData(prev => ({
                  ...prev,
                  is_active: value === 'active',
                }))
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-50"
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={loading || uploadingImage}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {mode === 'create' ? 'Creer' : 'Modifier'}
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
