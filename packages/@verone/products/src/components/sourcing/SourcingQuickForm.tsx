'use client';

import { useState, useRef, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common/hooks';
import { useOrganisations } from '@verone/organisations/hooks';
import { Button } from '@verone/ui';
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
import { Checkbox } from '@verone/ui';
import { CountrySelect } from '@verone/ui';
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

type SupplierMode = 'existing' | 'new';

interface SourcingQuickFormProps {
  onSuccess?: (draftId: string) => void;
  onCancel?: () => void;
  className?: string;
  showHeader?: boolean;
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
  const { createOrganisation } = useOrganisations();

  // Supplier mode
  const [supplierMode, setSupplierMode] = useState<SupplierMode>('existing');

  // New supplier form data
  const [newSupplier, setNewSupplier] = useState({
    legal_name: '',
    has_different_trade_name: false,
    trade_name: '',
    website: '',
    country: 'FR',
  });

  // Product form data
  const [formData, setFormData] = useState({
    name: '',
    supplier_page_url: '',
    cost_price: 0,
    supplier_reference: '',
    brand: '',
    description: '',
    supplier_moq: 0,
    sourcing_channel: '',
    supplier_id: '',
    assigned_client_id: '',
    enseigne_id: '',
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linkedConsultationId, setLinkedConsultationId] = useState<
    string | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image handling
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

      for (const file of imageFiles) {
        const reader = new FileReader();
        reader.onload = e => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }

      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    },
    [errors.image, toast]
  );

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

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

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Supplier validation
    if (supplierMode === 'new') {
      if (!newSupplier.legal_name.trim()) {
        newErrors.supplier_legal_name =
          'La dénomination sociale est obligatoire';
      }
      if (
        newSupplier.has_different_trade_name &&
        !newSupplier.trade_name.trim()
      ) {
        newErrors.supplier_trade_name =
          'Le nom commercial est obligatoire si coché';
      }
      if (!newSupplier.website.trim()) {
        newErrors.supplier_website = 'Le site web est obligatoire';
      } else {
        try {
          new URL(newSupplier.website);
        } catch {
          newErrors.supplier_website = "Format d'URL invalide";
        }
      }
    }

    // Product validation
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est obligatoire';
    }

    if (!formData.supplier_page_url.trim()) {
      newErrors.supplier_page_url =
        "L'URL de la page fournisseur est obligatoire";
    } else {
      try {
        new URL(formData.supplier_page_url);
      } catch {
        newErrors.supplier_page_url = "Format d'URL invalide";
      }
    }

    if (!formData.cost_price || formData.cost_price <= 0) {
      newErrors.cost_price = "Le prix d'achat est obligatoire et doit être > 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
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
      let supplierId = formData.supplier_id || undefined;

      // Create supplier first if "new" mode
      if (supplierMode === 'new') {
        const newOrg = await createOrganisation({
          legal_name: newSupplier.legal_name,
          trade_name: newSupplier.has_different_trade_name
            ? newSupplier.trade_name
            : null,
          has_different_trade_name: newSupplier.has_different_trade_name,
          type: 'supplier',
          is_active: true,
          website: newSupplier.website || null,
          country: newSupplier.country || 'FR',
        });

        if (!newOrg) {
          toast({
            title: 'Erreur',
            description: 'Impossible de créer le fournisseur',
            variant: 'destructive',
          });
          return;
        }

        supplierId = newOrg.id;
      }

      const productData = {
        name: formData.name,
        supplier_page_url: formData.supplier_page_url || undefined,
        cost_price: formData.cost_price || undefined,
        supplier_reference: formData.supplier_reference || undefined,
        brand: formData.brand || undefined,
        description: formData.description || undefined,
        supplier_moq: formData.supplier_moq || undefined,
        sourcing_channel: formData.sourcing_channel || undefined,
        supplier_id: supplierId,
        assigned_client_id: formData.assigned_client_id || undefined,
        enseigne_id: formData.enseigne_id || undefined,
        imageFiles: selectedImages.length > 0 ? selectedImages : undefined,
      };

      const newProduct = await createSourcingProduct(productData);

      if (newProduct) {
        // Si une consultation est liée, associer le produit
        if (linkedConsultationId) {
          try {
            const response = await fetch('/api/consultations/associations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                consultation_id: linkedConsultationId,
                product_id: newProduct.id,
                quantity: 1,
                proposed_price: null,
                is_free: false,
                notes: 'Produit sourcé via formulaire rapide',
              }),
            });

            if (response.ok) {
              toast({
                title: 'Produit créé et associé',
                description:
                  'Le produit a été créé et associé à la consultation',
              });
            } else {
              const result = (await response.json()) as { error?: string };
              console.error(
                '[SourcingQuickForm] Association error:',
                result.error
              );
              toast({
                title: 'Produit créé',
                description: `Le produit a été créé mais l'association à la consultation a échoué : ${result.error ?? 'Erreur inconnue'}`,
                variant: 'destructive',
              });
            }
          } catch (assocError) {
            console.error(
              '[SourcingQuickForm] Association failed:',
              assocError
            );
            toast({
              title: 'Produit créé',
              description:
                "Le produit a été créé mais l'association à la consultation a échoué",
              variant: 'destructive',
            });
          }
        } else {
          const toastMessage =
            supplierMode === 'new'
              ? 'Produit et fournisseur créés. La fiche fournisseur pourra être complétée plus tard.'
              : 'Le produit a été ajouté au sourcing';

          toast({
            title: 'Sourcing enregistré',
            description: toastMessage,
          });
        }

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
      <form
        onSubmit={e => {
          void handleSubmit(e).catch(error => {
            console.error('[SourcingQuickForm] Submit error:', error);
          });
        }}
        className="p-6 space-y-6"
      >
        {/* 1. FOURNISSEUR - Radio existant/nouveau */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Fournisseur</Label>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            {/* Radio: Existing supplier */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="supplier_mode"
                value="existing"
                checked={supplierMode === 'existing'}
                onChange={() => setSupplierMode('existing')}
                className="h-4 w-4 text-black accent-black"
              />
              <span className="text-sm font-medium">Fournisseur existant</span>
            </label>

            {supplierMode === 'existing' && (
              <div className="ml-7">
                <SupplierSelector
                  selectedSupplierId={formData.supplier_id || null}
                  onSupplierChange={supplierId => {
                    setFormData(prev => ({
                      ...prev,
                      supplier_id: supplierId || '',
                    }));
                  }}
                  label=""
                  placeholder="Sélectionner un fournisseur..."
                  required={false}
                />
              </div>
            )}

            {/* Radio: New supplier */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="supplier_mode"
                value="new"
                checked={supplierMode === 'new'}
                onChange={() => setSupplierMode('new')}
                className="h-4 w-4 text-black accent-black"
              />
              <span className="text-sm font-medium">Nouveau fournisseur</span>
            </label>

            {supplierMode === 'new' && (
              <div className="ml-7 space-y-3">
                {/* Legal name */}
                <div className="space-y-1">
                  <Label
                    htmlFor="sf_legal_name"
                    className="text-sm font-medium"
                  >
                    Dénomination sociale *
                  </Label>
                  <Input
                    id="sf_legal_name"
                    value={newSupplier.legal_name}
                    onChange={e => {
                      setNewSupplier(prev => ({
                        ...prev,
                        legal_name: e.target.value,
                      }));
                      if (errors.supplier_legal_name)
                        setErrors(prev => ({
                          ...prev,
                          supplier_legal_name: '',
                        }));
                    }}
                    placeholder="Ex: Zentrada GmbH, Maisons du Monde SAS..."
                    className={cn(
                      errors.supplier_legal_name &&
                        'border-red-300 focus:border-red-500'
                    )}
                  />
                  {errors.supplier_legal_name && (
                    <p className="text-sm text-red-600">
                      {errors.supplier_legal_name}
                    </p>
                  )}
                </div>

                {/* Checkbox trade name */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sf_has_different_trade_name"
                    checked={newSupplier.has_different_trade_name}
                    onCheckedChange={(checked: boolean) => {
                      setNewSupplier(prev => ({
                        ...prev,
                        has_different_trade_name: checked,
                        trade_name: checked ? prev.trade_name : '',
                      }));
                      if (!checked && errors.supplier_trade_name) {
                        setErrors(prev => ({
                          ...prev,
                          supplier_trade_name: '',
                        }));
                      }
                    }}
                  />
                  <Label
                    htmlFor="sf_has_different_trade_name"
                    className="text-sm cursor-pointer"
                  >
                    Le nom commercial est différent
                  </Label>
                </div>

                {/* Trade name (conditional) */}
                {newSupplier.has_different_trade_name && (
                  <div className="space-y-1">
                    <Label
                      htmlFor="sf_trade_name"
                      className="text-sm font-medium"
                    >
                      Nom commercial *
                    </Label>
                    <Input
                      id="sf_trade_name"
                      value={newSupplier.trade_name}
                      onChange={e => {
                        setNewSupplier(prev => ({
                          ...prev,
                          trade_name: e.target.value,
                        }));
                        if (errors.supplier_trade_name)
                          setErrors(prev => ({
                            ...prev,
                            supplier_trade_name: '',
                          }));
                      }}
                      placeholder="Ex: Zentrada, MdM..."
                      className={cn(
                        errors.supplier_trade_name &&
                          'border-red-300 focus:border-red-500'
                      )}
                    />
                    {errors.supplier_trade_name && (
                      <p className="text-sm text-red-600">
                        {errors.supplier_trade_name}
                      </p>
                    )}
                  </div>
                )}

                {/* Website */}
                <div className="space-y-1">
                  <Label htmlFor="sf_website" className="text-sm font-medium">
                    Site web *
                  </Label>
                  <Input
                    id="sf_website"
                    type="url"
                    value={newSupplier.website}
                    onChange={e => {
                      setNewSupplier(prev => ({
                        ...prev,
                        website: e.target.value,
                      }));
                      if (errors.supplier_website)
                        setErrors(prev => ({
                          ...prev,
                          supplier_website: '',
                        }));
                    }}
                    placeholder="https://www.fournisseur.com"
                    className={cn(
                      errors.supplier_website &&
                        'border-red-300 focus:border-red-500'
                    )}
                  />
                  {errors.supplier_website && (
                    <p className="text-sm text-red-600">
                      {errors.supplier_website}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Pays</Label>
                  <CountrySelect
                    value={newSupplier.country}
                    onChange={value => {
                      setNewSupplier(prev => ({
                        ...prev,
                        country: value || 'FR',
                      }));
                    }}
                    placeholder="Sélectionner un pays"
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. UPLOAD IMAGES - Facultatif, multi */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Images du produit (facultatif)
          </Label>

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

        {/* 3. NOM PRODUIT - Obligatoire */}
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

        {/* 4. URL FOURNISSEUR - Obligatoire */}
        <div className="space-y-2">
          <Label htmlFor="supplier_url" className="text-sm font-medium">
            URL de la page fournisseur *
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

        {/* 5. PRIX FOURNISSEUR - Obligatoire */}
        <div className="space-y-2">
          <Label htmlFor="cost_price" className="text-sm font-medium">
            Prix d&apos;achat fournisseur HT (€) *
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
            Prix d&apos;achat HT chez le fournisseur
          </p>
        </div>

        {/* 6. RÉFÉRENCE FOURNISSEUR - Facultatif */}
        <div className="space-y-2">
          <Label htmlFor="supplier_reference" className="text-sm font-medium">
            Réf. fournisseur (facultatif)
          </Label>
          <Input
            id="supplier_reference"
            value={formData.supplier_reference}
            onChange={e => {
              setFormData(prev => ({
                ...prev,
                supplier_reference: e.target.value,
              }));
            }}
            placeholder="Ex: ART-12345, SKU-FOURN-001..."
            className="transition-colors"
          />
          <p className="text-xs text-gray-500">
            Référence du produit chez le fournisseur
          </p>
        </div>

        {/* 7. MARQUE - Facultatif */}
        <div className="space-y-2">
          <Label htmlFor="brand" className="text-sm font-medium">
            Marque (facultatif)
          </Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={e => {
              setFormData(prev => ({ ...prev, brand: e.target.value }));
            }}
            placeholder="Ex: HAY, Fermob, Kartell..."
            className="transition-colors"
          />
        </div>

        {/* 8. DESCRIPTION - Facultatif */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description (facultatif)
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => {
              setFormData(prev => ({ ...prev, description: e.target.value }));
            }}
            placeholder="Description courte du produit..."
            rows={3}
            className="transition-colors resize-none"
          />
        </div>

        {/* 9. MOQ - Facultatif */}
        <div className="space-y-2">
          <Label htmlFor="supplier_moq" className="text-sm font-medium">
            Quantité min. de commande (MOQ) (facultatif)
          </Label>
          <Input
            id="supplier_moq"
            type="number"
            min="1"
            value={formData.supplier_moq || ''}
            onChange={e => {
              const value = parseInt(e.target.value) || 0;
              setFormData(prev => ({ ...prev, supplier_moq: value }));
            }}
            placeholder="Ex: 10"
            className="transition-colors"
          />
        </div>

        {/* 10. CANAL DE SOURCING - Facultatif */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Canal de sourcing (facultatif)
          </Label>
          <Select
            value={formData.sourcing_channel || 'none'}
            onValueChange={value => {
              setFormData(prev => ({
                ...prev,
                sourcing_channel: value === 'none' ? '' : value,
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner le canal..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-gray-500">Non spécifié</span>
              </SelectItem>
              <SelectItem value="online">En ligne</SelectItem>
              <SelectItem value="trade_show">Salon professionnel</SelectItem>
              <SelectItem value="referral">Recommandation</SelectItem>
              <SelectItem value="visit">Visite fournisseur</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 11. CLIENT DESTINATAIRE - Facultatif */}
        <div className="space-y-2">
          <ClientOrEnseigneSelector
            enseigneId={formData.enseigne_id || null}
            organisationId={formData.assigned_client_id || null}
            onEnseigneChange={(enseigneId, _enseigneName, parentOrgId) => {
              setFormData(prev => ({
                ...prev,
                enseigne_id: enseigneId || '',
                assigned_client_id: parentOrgId || '',
              }));
            }}
            onOrganisationChange={(organisationId, _organisationName) => {
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
          <>
            {linkedConsultationId && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Link className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  Sera associé à une consultation
                </span>
                <button
                  type="button"
                  onClick={() => setLinkedConsultationId(null)}
                  className="ml-auto text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <ConsultationSuggestions
              clientId={formData.assigned_client_id}
              onLinkToConsultation={consultationId => {
                setLinkedConsultationId(consultationId);
                toast({
                  title: 'Consultation sélectionnée',
                  description:
                    'Le produit sera associé à cette consultation après création',
                });
              }}
              className="bg-blue-50 border-blue-200"
            />
          </>
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
