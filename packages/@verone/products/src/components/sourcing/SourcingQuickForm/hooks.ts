'use client';

import { useState, useRef, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common/hooks';
import { useOrganisations } from '@verone/organisations/hooks';

import { useSourcingProducts } from '@verone/products/hooks';

import type { NewSupplierState, ProductFormData, SupplierMode } from './types';

export function useSourcingQuickForm(onSuccess?: (draftId: string) => void) {
  const router = useRouter();
  const { toast } = useToast();
  const { createSourcingProduct } = useSourcingProducts({});
  const { createOrganisation } = useOrganisations();

  const [supplierMode, setSupplierMode] = useState<SupplierMode>('existing');

  const [newSupplier, setNewSupplier] = useState<NewSupplierState>({
    legal_name: '',
    has_different_trade_name: false,
    trade_name: '',
    website: '',
    country: 'FR',
  });

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    supplier_page_url: '',
    cost_price: 0,
    supplier_reference: '',
    manufacturer: '',
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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
      let supplierId = formData.supplier_id ?? undefined;

      if (supplierMode === 'new') {
        const newOrg = await createOrganisation({
          legal_name: newSupplier.legal_name,
          trade_name: newSupplier.has_different_trade_name
            ? newSupplier.trade_name
            : null,
          has_different_trade_name: newSupplier.has_different_trade_name,
          type: 'supplier',
          is_active: true,
          website: newSupplier.website ?? null,
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
        supplier_page_url: formData.supplier_page_url ?? undefined,
        cost_price: formData.cost_price ?? undefined,
        supplier_reference: formData.supplier_reference ?? undefined,
        manufacturer: formData.manufacturer ?? undefined,
        description: formData.description ?? undefined,
        supplier_moq: formData.supplier_moq ?? undefined,
        sourcing_channel: formData.sourcing_channel ?? undefined,
        supplier_id: supplierId,
        assigned_client_id: formData.assigned_client_id ?? undefined,
        enseigne_id: formData.enseigne_id ?? undefined,
        imageFiles: selectedImages.length > 0 ? selectedImages : undefined,
      };

      const newProduct = await createSourcingProduct(productData);

      if (newProduct) {
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

  return {
    supplierMode,
    setSupplierMode,
    newSupplier,
    setNewSupplier,
    formData,
    setFormData,
    selectedImages,
    imagePreviews,
    isSubmitting,
    errors,
    setErrors,
    linkedConsultationId,
    setLinkedConsultationId,
    fileInputRef,
    handleImagesSelect,
    removeImage,
    handleSubmit,
  };
}
