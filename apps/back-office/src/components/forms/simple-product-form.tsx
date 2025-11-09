'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

import { createClient } from '@verone/utils/supabase/client';

interface SimpleProductFormProps {
  onSuccess?: (product: any) => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  supplier_page_url: string;
  imageFile: File | null;
}

export function SimpleProductForm({
  onSuccess,
  onCancel,
}: SimpleProductFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    supplier_page_url: '',
    imageFile: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const supabase = createClient();

  // Gérer la sélection d'image
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner un fichier image valide');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5MB");
        return;
      }

      setFormData(prev => ({ ...prev, imageFile: file }));

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Valider le formulaire
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Le nom du produit est obligatoire');
      return false;
    }

    if (!formData.supplier_page_url.trim()) {
      setError('Le lien du produit est obligatoire');
      return false;
    }

    // Valider l'URL
    try {
      new URL(formData.supplier_page_url);
    } catch {
      setError('Veuillez entrer un lien valide');
      return false;
    }

    if (!formData.imageFile) {
      setError('Une image est obligatoire');
      return false;
    }

    return true;
  };

  // Soumettre le formulaire
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Créer le produit dans la table products
      const productData = {
        name: formData.name.trim(),
        supplier_page_url: formData.supplier_page_url.trim(),
        status: 'in_stock',
        product_type: 'standard',
        creation_mode: 'complete',
        // Required fields with defaults
        price_ht: 0.01, // Will be set later from product detail page
        cost_price: 0.01, // Will be set later from product detail page (must be > 0)
      };

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(productData as any)
        .select()
        .single();

      if (productError) throw productError;

      // 2. Uploader l'image
      if (formData.imageFile && newProduct) {
        // Générer un nom de fichier unique
        const fileExt = formData.imageFile.name.split('.').pop()?.toLowerCase();
        const fileName = `product-${newProduct.id}-${Date.now()}.${fileExt}`;

        // Upload vers Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, formData.imageFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Créer l'entrée dans product_images
        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: newProduct.id,
            storage_path: uploadData.path,
            is_primary: true,
            image_type: 'primary',
            alt_text: formData.name,
            file_size: formData.imageFile.size,
            format: fileExt || 'jpg',
            display_order: 0,
          });

        if (dbError) {
          // Nettoyer le fichier uploadé en cas d'erreur DB
          await supabase.storage
            .from('product-images')
            .remove([uploadData.path]);
          throw dbError;
        }
      }

      console.log('✅ Produit créé avec succès:', newProduct.sku);

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        supplier_page_url: '',
        imageFile: null,
      });
      setImagePreview(null);

      // Appeler le callback de succès
      if (onSuccess) {
        onSuccess(newProduct);
      }
    } catch (error) {
      console.error('❌ Erreur création produit:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la création du produit'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-black p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black">Nouveau Produit</h2>
        <p className="text-sm text-gray-600 mt-1">
          Créez un nouveau produit avec les informations essentielles. Vous
          pourrez le compléter plus tard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom du produit */}
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-black">
            Nom du produit *
          </Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={e =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ex: Canapé scandinave 3 places"
            className="mt-1"
            disabled={loading}
          />
        </div>

        {/* Lien du produit */}
        <div>
          <Label
            htmlFor="supplier_page_url"
            className="text-sm font-medium text-black"
          >
            Lien du produit *
          </Label>
          <Input
            id="supplier_page_url"
            type="url"
            value={formData.supplier_page_url}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                supplier_page_url: e.target.value,
              }))
            }
            placeholder="https://fournisseur.com/produit"
            className="mt-1"
            disabled={loading}
          />
        </div>

        {/* Image du produit */}
        <div>
          <Label htmlFor="image" className="text-sm font-medium text-black">
            Image du produit *
          </Label>
          <div className="mt-1">
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={loading}
            />

            <div className="space-y-3">
              {/* Zone de upload */}
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 hover:border-black cursor-pointer transition-colors"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Cliquez pour sélectionner une image
                </span>
                <span className="text-xs text-gray-500">
                  JPG, PNG (max 5MB)
                </span>
              </label>

              {/* Aperçu de l'image */}
              {imagePreview && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="h-12 w-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">
                      {formData.imageFile?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.imageFile &&
                        (formData.imageFile.size / 1024 / 1024).toFixed(2)}{' '}
                      MB
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-700">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Annuler
            </ButtonV2>
          )}

          <ButtonV2
            type="submit"
            disabled={loading}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              'Créer le produit'
            )}
          </ButtonV2>
        </div>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>Note :</strong> Après la création, vous pourrez compléter les
          informations du produit (prix, catégorie, description, etc.) depuis la
          page détail du produit.
        </p>
      </div>
    </div>
  );
}
