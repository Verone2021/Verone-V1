/**
 * ⚡ QuickVariantForm - Formulaire minimaliste pour créer un produit variante
 *
 * Création rapide de produit dans un groupe de variantes
 * Nom auto-généré + données minimales comme demandé
 */

'use client';

import { useState, useEffect } from 'react';

import { useToast } from '@verone/common';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
// FIXME: DynamicColorSelector component doesn't exist in @verone/ui
// import { DynamicColorSelector } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Upload,
  X,
  Save,
  Loader2,
  Palette,
  Ruler,
  Layers,
  Euro,
} from 'lucide-react';

interface QuickVariantFormData {
  color: string;
  size: string;
  material: string;
  pattern: string;
  cost_price: number;
  image_url: string;
}

interface QuickVariantFormProps {
  isOpen: boolean;
  onClose: () => void;
  variantGroupId: string;
  baseProductId: string;
  groupName: string;
  variantType: 'color' | 'size' | 'material' | 'pattern';
  onProductCreated: (product: any) => void;
}

export function QuickVariantForm({
  isOpen,
  onClose,
  variantGroupId,
  baseProductId,
  groupName,
  variantType,
  onProductCreated,
}: QuickVariantFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // État du formulaire minimaliste
  const [formData, setFormData] = useState<QuickVariantFormData>({
    color: '',
    size: '',
    material: '',
    pattern: '',
    cost_price: 0,
    image_url: '',
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        color: '',
        size: '',
        material: '',
        pattern: '',
        cost_price: 0,
        image_url: '',
      });
    }
  }, [isOpen]);

  // Upload d'image vers Supabase Storage
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `variant-${Date.now()}.${fileExt}`;
      const filePath = `variant-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('family-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('family-images').getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));

      toast({
        title: '✅ Image téléchargée',
        description: "L'image a été uploadée avec succès",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: '❌ Erreur upload',
        description: "Impossible de télécharger l'image",
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Suppression d'image
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  // Génération automatique du nom produit à partir des attributs
  const generateProductName = (): string => {
    const attributes: string[] = [];
    if (formData.color) attributes.push(formData.color);
    if (formData.size) attributes.push(formData.size);
    if (formData.material) attributes.push(formData.material);
    if (formData.pattern) attributes.push(formData.pattern);

    return attributes.length > 0
      ? `${groupName} - ${attributes.join(' ')}`
      : groupName;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation : au moins un attribut de variante
    const hasVariantAttribute =
      formData.color || formData.size || formData.material || formData.pattern;
    if (!hasVariantAttribute) {
      toast({
        title: '❌ Attribut requis',
        description: 'Vous devez renseigner au moins un attribut de variante',
        variant: 'destructive',
      });
      return;
    }

    // Validation : prix d'achat
    if (formData.cost_price <= 0) {
      toast({
        title: '❌ Prix requis',
        description: "Le prix d'achat doit être supérieur à 0",
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Récupérer les informations du produit de base
      const { data: baseProduct, error: baseError } = await supabase
        .from('products')
        .select(
          'sku, subcategory_id, supplier_id, brand, description, technical_description'
        )
        .eq('id', baseProductId)
        .single();

      if (baseError || !baseProduct) {
        throw new Error('Produit de base introuvable');
      }

      // Déterminer la position du nouveau produit
      const { data: maxPositionData } = await supabase
        .from('products')
        .select('variant_position')
        .eq('variant_group_id', variantGroupId)
        .order('variant_position', { ascending: false })
        .limit(1);

      const nextPosition = (maxPositionData?.[0]?.variant_position || 0) + 1;

      // Générer un SKU unique basé sur le SKU de base
      const variantSuffix = [
        formData.color,
        formData.size,
        formData.material,
        formData.pattern,
      ]
        .filter(Boolean)
        .map(attr => attr.substring(0, 3).toUpperCase())
        .join('-');

      const newSku = `${baseProduct.sku}-${variantSuffix}`;
      const productName = generateProductName();

      // Prix de vente avec marge de 50% par défaut
      const sellingPrice = formData.cost_price * 1.5;

      // Créer le nouveau produit
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert([
          {
            sku: newSku,
            name: productName,
            price_ht: sellingPrice,
            cost_price: formData.cost_price,
            status: 'in_stock',
            variant_attributes: {
              color: formData.color || null,
              size: formData.size || null,
              material: formData.material || null,
              pattern: formData.pattern || null,
            },
            variant_group_id: variantGroupId,
            variant_position: nextPosition,
            is_variant_parent: false,
            stock_quantity: 0,
            subcategory_id: baseProduct.subcategory_id,
            supplier_id: baseProduct.supplier_id,
            brand: baseProduct.brand,
            description: baseProduct.description,
            technical_description: baseProduct.technical_description,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      // Ajouter l'image si fournie
      if (formData.image_url && newProduct) {
        await supabase.from('product_images').insert([
          {
            product_id: newProduct.id,
            image_url: formData.image_url,
            is_primary: true,
            display_order: 1,
          },
        ] as any);
      }

      toast({
        title: '✅ Produit variante créé',
        description: `"${productName}" a été créé avec succès`,
      });

      onProductCreated(newProduct);
      onClose();
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Options prédéfinies par type de variante
  const getVariantOptions = (type: string) => {
    switch (type) {
      case 'color':
        return [
          'Blanc',
          'Noir',
          'Gris',
          'Rouge',
          'Bleu',
          'Vert',
          'Jaune',
          'Orange',
          'Violet',
          'Rose',
          'Marron',
          'Beige',
          'Crème',
          'Doré',
          'Argenté',
        ];
      case 'size':
        return [
          'XS',
          'S',
          'M',
          'L',
          'XL',
          'XXL',
          '30x30cm',
          '40x40cm',
          '50x50cm',
          '60x60cm',
          '80x80cm',
          '100x100cm',
          '120x80cm',
          '160x90cm',
          '200x100cm',
          '240x120cm',
        ];
      case 'material':
        return [
          'Bois massif',
          'Métal',
          'Plastique',
          'Verre',
          'Cuir',
          'Tissu',
          'Rotin',
          'Osier',
          'Marbre',
          'Céramique',
          'Résine',
          'Bambou',
        ];
      case 'pattern':
        return [
          'Uni',
          'Rayé',
          'Carreaux',
          'Fleuri',
          'Géométrique',
          'Abstrait',
          'Vintage',
          'Moderne',
          'Classique',
          'Rustique',
        ];
      default:
        return [];
    }
  };

  const renderVariantField = (
    type: string,
    value: string,
    onChange: (value: string) => void
  ) => {
    const options = getVariantOptions(type);
    const icons = {
      color: <Palette className="h-4 w-4" />,
      size: <Ruler className="h-4 w-4" />,
      material: <Layers className="h-4 w-4" />,
      pattern: <Layers className="h-4 w-4" />,
    };

    return (
      <div className="space-y-2">
        <Label className="text-black flex items-center space-x-2">
          {icons[type as keyof typeof icons]}
          <span className="capitalize">{type}</span>
          {type === variantType && <span className="text-red-500">*</span>}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="border-gray-300 focus:border-black">
            <SelectValue placeholder={`Choisir ${type}...`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">
            Créer une variante rapide
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Groupe: <strong>{groupName}</strong> • Type principal:{' '}
            <strong className="capitalize">{variantType}</strong>
          </p>
        </DialogHeader>

        <form
          onSubmit={e => {
            void handleSubmit(e).catch(error => {
              console.error('[QuickVariantForm] handleSubmit failed:', error);
            });
          }}
          className="space-y-6"
        >
          {/* Aperçu nom produit auto-généré */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Label className="text-blue-900 text-sm font-medium">
              Nom du produit (auto-généré)
            </Label>
            <p className="text-blue-700 mt-1">{generateProductName()}</p>
          </div>

          {/* Attributs de variante */}
          <div className="space-y-4">
            {/* Couleur avec système dynamique */}
            {/* FIXME: DynamicColorSelector component doesn't exist in @verone/ui
            <DynamicColorSelector
              value={formData.color}
              onChange={value =>
                setFormData(prev => ({ ...prev, color: value }))
              }
              required={variantType === 'color'}
              placeholder="Rechercher ou créer une couleur..."
            />
            */}
            <div>
              <Label>Couleur</Label>
              <Input
                value={formData.color}
                onChange={e =>
                  setFormData(prev => ({ ...prev, color: e.target.value }))
                }
                placeholder="Rechercher ou créer une couleur..."
              />
            </div>

            {/* Autres attributs avec select statique */}
            <div className="grid grid-cols-2 gap-4">
              {renderVariantField('size', formData.size, value =>
                setFormData(prev => ({ ...prev, size: value }))
              )}
              {renderVariantField('material', formData.material, value =>
                setFormData(prev => ({ ...prev, material: value }))
              )}
              {renderVariantField('pattern', formData.pattern, value =>
                setFormData(prev => ({ ...prev, pattern: value }))
              )}
            </div>
          </div>

          {/* Prix d'achat */}
          <div className="space-y-2">
            <Label
              htmlFor="cost_price"
              className="text-black flex items-center space-x-2"
            >
              <Euro className="h-4 w-4" />
              <span>Prix d'achat*</span>
            </Label>
            <Input
              id="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  cost_price: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="0.00"
              className="border-gray-300 focus:border-black"
              required
            />
            {formData.cost_price > 0 && (
              <p className="text-xs text-gray-500">
                Prix de vente estimé (marge 50%):{' '}
                {(formData.cost_price * 1.5).toFixed(2)}€ HT
              </p>
            )}
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label className="text-black">Image du produit</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {formData.image_url ? (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <ButtonV2
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </ButtonV2>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="imageUpload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Cliquez ou glissez une image
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        JPG, PNG, WebP (max 5MB)
                      </span>
                    </Label>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.size <= 5 * 1024 * 1024) {
                          void handleImageUpload(file).catch(error => {
                            console.error(
                              '[QuickVariantForm] handleImageUpload failed:',
                              error
                            );
                          });
                        } else {
                          toast({
                            title: '❌ Fichier trop volumineux',
                            description: "L'image doit faire moins de 5MB",
                            variant: 'destructive',
                          });
                        }
                      }}
                      disabled={uploadingImage}
                    />
                  </div>
                </div>
              )}
            </div>
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
              Créer la variante
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
