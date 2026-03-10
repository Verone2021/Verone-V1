'use client';

import { useState, useRef, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common/hooks';
import { Button } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Upload,
  Link,
  Package,
  ArrowRight,
  Loader2,
  Euro,
  X,
} from 'lucide-react';

import { useSourcingProducts } from '@verone/products/hooks';

import { ClientOrEnseigneSelector } from './ClientOrEnseigneSelector';
import { ConsultationSuggestions } from './consultation-suggestions';
import { SupplierSelector } from './supplier-selector';

interface SourcingQuickFormProps {
  onSuccess?: (draftId: string) => void;
  onCancel?: () => void;
  className?: string;
  showHeader?: boolean; // Afficher le header (défaut: true)
}

export function SourcingQuickForm({
  onSuccess,
  onCancel,
  className,
  showHeader = true,
}: SourcingQuickFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { createSourcingProduct } = useSourcingProducts({});

  // États du formulaire - Simplifié pour la nouvelle logique
  const [formData, setFormData] = useState({
    name: '',
    supplier_page_url: '',
    cost_price: 0, // Prix d'achat fournisseur HT - OBLIGATOIRE
    supplier_id: '', // Facultatif - fournisseur assigné
    assigned_client_id: '', // Facultatif - détermine automatiquement le type de sourcing
    enseigne_id: '', // Facultatif - enseigne pour sourcing groupe de magasins
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Référence pour l'input file (pattern React 2024)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion upload images (multi)
  const handleImagesSelect = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        toast({
          title: 'Format invalide',
          description: 'Seules les images sont acceptées',
          variant: 'destructive',
        });
        return;
      }

      setSelectedImages(prev => [...prev, ...imageFiles]);

      // Créer previews
      for (const file of imageFiles) {
        const reader = new FileReader();
        reader.onload = e => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }

      // Effacer erreur image
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    },
    [errors.image, toast]
  );

  // Supprimer une image par index
  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Gestion drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    handleImagesSelect(files);
  };

  // Validation formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est obligatoire';
    }

    // Validation format URL uniquement si renseignée
    if (formData.supplier_page_url.trim()) {
      try {
        new URL(formData.supplier_page_url);
      } catch {
        newErrors.supplier_page_url = "Format d'URL invalide";
      }
    }

    // Validation prix si renseigné (doit être > 0)
    if (formData.cost_price && formData.cost_price < 0) {
      newErrors.cost_price = "Le prix d'achat doit être positif";
    }

    // 🔥 FIX: Image facultative (BD accepte image_url NULL)
    // L'image peut être ajoutée plus tard via édition
    // if (!selectedImage) {
    //   newErrors.image = 'Une image est obligatoire'
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erreurs de validation',
        description: 'Veuillez corriger les erreurs avant de continuer',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        supplier_page_url: formData.supplier_page_url || undefined,
        cost_price: formData.cost_price || undefined,
        supplier_id: formData.supplier_id || undefined,
        assigned_client_id: formData.assigned_client_id || undefined,
        enseigne_id: formData.enseigne_id || undefined,
        imageFiles: selectedImages.length > 0 ? selectedImages : undefined,
      };

      const newProduct = await createSourcingProduct(productData);

      if (newProduct) {
        toast({
          title: 'Sourcing enregistré',
          description: 'Le produit a été ajouté au sourcing',
        });

        // Callback ou redirection
        if (onSuccess) {
          onSuccess(newProduct.id);
        } else {
          router.push('/produits/sourcing/produits');
        }
      }
    } catch (error) {
      console.error('Erreur création sourcing:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de créer le sourcing',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('bg-white', className)}>
      {/* Header */}
      {showHeader && (
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Sourcing Rapide</h1>
              <p className="text-gray-600 mt-1">
                Ajoutez rapidement un produit à sourcer pour le catalogue
                général ou pour un client spécifique
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Package className="h-4 w-4 mr-2" />
              Mode Sourcing
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 1. UPLOAD IMAGES - Facultatif, multi */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Images du produit (facultatif)
          </Label>

          {/* Grille des images sélectionnées */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Image ${index + 1}`}
                    className={cn(
                      'h-24 w-full object-cover rounded-lg border-2',
                      index === 0 ? 'border-green-400' : 'border-gray-200'
                    )}
                  />
                  {index === 0 && (
                    <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Principale
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="text-[10px] text-gray-500 truncate mt-1">
                    {selectedImages[index]?.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              selectedImages.length > 0
                ? 'border-green-300 bg-green-50'
                : errors.image
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-3">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-gray-600">
                  {selectedImages.length > 0
                    ? 'Glissez-déposez pour ajouter des images ou'
                    : 'Glissez-déposez des images ou'}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-black hover:underline p-0 h-auto font-normal"
                >
                  cliquez pour sélectionner
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) handleImagesSelect(files);
                    // Reset input pour permettre re-sélection même fichier
                    e.target.value = '';
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP jusqu&apos;à 10MB — La 1ère image sera
                l&apos;image principale
              </p>
            </div>
          </div>

          {errors.image && (
            <p className="text-sm text-red-600">{errors.image}</p>
          )}
        </div>

        {/* 2. NOM PRODUIT - Obligatoire */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nom du produit *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => {
              setFormData(prev => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }}
            placeholder="Ex: Fauteuil design scandinave..."
            className={cn(
              'transition-colors',
              errors.name && 'border-red-300 focus:border-red-500'
            )}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* 3. URL FOURNISSEUR - Facultatif */}
        <div className="space-y-2">
          <Label htmlFor="supplier_url" className="text-sm font-medium">
            URL de la page fournisseur (facultatif)
          </Label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="supplier_url"
              type="url"
              value={formData.supplier_page_url}
              onChange={e => {
                setFormData(prev => ({
                  ...prev,
                  supplier_page_url: e.target.value,
                }));
                if (errors.supplier_page_url)
                  setErrors(prev => ({ ...prev, supplier_page_url: '' }));
              }}
              placeholder="https://fournisseur.com/produit/123"
              className={cn(
                'pl-10 transition-colors',
                errors.supplier_page_url &&
                  'border-red-300 focus:border-red-500'
              )}
            />
          </div>
          {errors.supplier_page_url && (
            <p className="text-sm text-red-600">{errors.supplier_page_url}</p>
          )}
          <p className="text-xs text-gray-500">
            Lien vers la fiche produit chez le fournisseur
          </p>
        </div>

        {/* 4. PRIX FOURNISSEUR - Facultatif */}
        <div className="space-y-2">
          <Label htmlFor="cost_price" className="text-sm font-medium">
            Prix d&apos;achat fournisseur HT (€) (facultatif)
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price || ''}
              onChange={e => {
                const value = parseFloat(e.target.value) || 0;
                setFormData(prev => ({ ...prev, cost_price: value }));
                if (errors.cost_price)
                  setErrors(prev => ({ ...prev, cost_price: '' }));
              }}
              placeholder="250.00"
              className={cn(
                'pl-10 transition-colors',
                errors.cost_price && 'border-red-300 focus:border-red-500'
              )}
            />
          </div>
          {errors.cost_price && (
            <p className="text-sm text-red-600">{errors.cost_price}</p>
          )}
          <p className="text-xs text-gray-500">
            Prix d&apos;achat HT chez le fournisseur (requis pour validation
            sourcing, peut être ajouté plus tard)
          </p>
        </div>

        {/* 5. FOURNISSEUR - Facultatif */}
        <div className="space-y-2">
          <SupplierSelector
            selectedSupplierId={formData.supplier_id || null}
            onSupplierChange={supplierId => {
              setFormData(prev => ({ ...prev, supplier_id: supplierId || '' }));
            }}
            label="Fournisseur (facultatif)"
            placeholder="Sélectionner un fournisseur..."
            required={false}
          />
          <p className="text-xs text-gray-500">
            Assignez un fournisseur pour activer le lien "détail fournisseur"
            dans la liste
          </p>
        </div>

        {/* 6. CLIENT DESTINATAIRE (ENSEIGNE OU ORGANISATION) - Facultatif */}
        <div className="space-y-2">
          <ClientOrEnseigneSelector
            enseigneId={formData.enseigne_id || null}
            organisationId={formData.assigned_client_id || null}
            onEnseigneChange={(enseigneId, _enseigneName, parentOrgId) => {
              // Quand enseigne sélectionnée → assigned_client_id = société mère
              setFormData(prev => ({
                ...prev,
                enseigne_id: enseigneId || '',
                assigned_client_id: parentOrgId || '',
              }));
            }}
            onOrganisationChange={(organisationId, _organisationName) => {
              // Quand organisation sélectionnée → enseigne_id = null
              setFormData(prev => ({
                ...prev,
                assigned_client_id: organisationId || '',
                enseigne_id: '',
              }));
            }}
            label="Client destinataire (facultatif)"
            required={false}
          />
          <p className="text-xs text-gray-500">
            <strong>Sourcing interne :</strong> Catalogue général (sans client
            assigné)
            <br />
            <strong>Sourcing client :</strong> Pour un client spécifique
            (enseigne ou organisation)
          </p>
        </div>

        {/* Suggestions de consultations si client assigné */}
        {formData.assigned_client_id && (
          <ConsultationSuggestions
            clientId={formData.assigned_client_id}
            onLinkToConsultation={consultationId => {
              console.log('Suggestion consultation:', consultationId);
              // TODO: Stocker l'association pour après création du produit
            }}
            className="bg-blue-50 border-blue-200"
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">* Champs obligatoires</div>

          <div className="flex items-center space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  Valider
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
