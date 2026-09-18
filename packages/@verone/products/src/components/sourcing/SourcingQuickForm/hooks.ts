'use client';

import { useState, useRef, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common/hooks';
import { associateProductToConsultation } from '@verone/utils';
import { defaultRateFor } from '@verone/utils/currency';
// Chemin direct et non le tonneau `@verone/utils/validation` : celui-ci tire
// `form-security` -> isomorphic-dompurify -> jsdom, qui casse la generation des
// pages de LinkMe (constate en CI le 17/09).
import { isValidUrl, normalizeUrl } from '@verone/utils/validation/form-inputs';
import { useOrganisations } from '@verone/organisations/hooks';

import { useSourcingCreateUpdate } from '@verone/products/hooks';

import type { NewSupplierState, ProductFormData, SupplierMode } from './types';

// Le formulaire n'affiche pas la liste sourcing : rien à recharger après la
// création (l'appelant recharge sa propre liste via onSuccess).
const noListToRefresh = () => Promise.resolve();

/**
 * Longueur minimale d'un nom de produit. Miroir exact de la contrainte
 * `name_length` de la table `products` : sans ce garde-fou, l'enregistrement
 * partait et revenait en erreur technique.
 */
const PRODUCT_NAME_MIN_LENGTH = 5;

/**
 * Clé d'erreur → identifiant du champ à l'écran. Sert à amener la personne
 * jusqu'au champ fautif : le formulaire défile dans une fenêtre, un message
 * affiché hors du pli n'existe pas.
 */
const ERROR_FIELD_IDS: Record<string, string> = {
  supplier_legal_name: 'sf_legal_name',
  supplier_trade_name: 'sf_trade_name',
  supplier_website: 'sf_website',
  name: 'name',
  supplier_page_url: 'supplier_url',
  cost_price: 'cost_price',
};

/** Amène le premier champ en erreur sous les yeux, et lui donne le focus. */
function focusFirstError(errorKeys: string[]): void {
  if (typeof document === 'undefined') return;
  const firstKey = Object.keys(ERROR_FIELD_IDS).find(key =>
    errorKeys.includes(key)
  );
  if (!firstKey) return;
  const element = document.getElementById(ERROR_FIELD_IDS[firstKey]);
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.focus({ preventScroll: true });
}

export function useSourcingQuickForm(onSuccess?: (draftId: string) => void) {
  const router = useRouter();
  const { toast } = useToast();
  const { createSourcingProduct } = useSourcingCreateUpdate({
    refetch: noListToRefresh,
  });
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
    cost_price_currency: 'EUR',
    cost_price_exchange_rate: 1,
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

  /**
   * Mise à jour du formulaire avec gestion du taux de change automatique.
   * Quand la monnaie change, le taux est initialisé au taux par défaut.
   * Le taux peut ensuite être modifié manuellement sur la ligne.
   */
  const handleFieldChange = useCallback((updates: Partial<ProductFormData>) => {
    setFormData(prev => {
      const merged = { ...prev, ...updates };
      // Si la monnaie change et que le taux n'est pas explicitement passé,
      // on initialise le taux au taux par défaut de la nouvelle monnaie.
      if (
        updates.cost_price_currency !== undefined &&
        updates.cost_price_exchange_rate === undefined
      ) {
        merged.cost_price_exchange_rate = defaultRateFor(
          updates.cost_price_currency
        );
      }
      return merged;
    });
  }, []);

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
      } else if (!isValidUrl(newSupplier.website)) {
        newErrors.supplier_website =
          'Adresse invalide (exemple : fournisseur.com)';
      }
    }

    const name = formData.name.trim();
    if (!name) {
      newErrors.name = 'Le nom du produit est obligatoire';
    } else if (name.length < PRODUCT_NAME_MIN_LENGTH) {
      // La base refuse un nom plus court (CHECK name_length sur `products`).
      // Sans ce contrôle ici, l'enregistrement partait et se faisait rejeter
      // avec un message technique incompréhensible.
      newErrors.name = `Le nom doit faire au moins ${PRODUCT_NAME_MIN_LENGTH} caractères`;
    }

    // URL de la page produit chez le fournisseur : facultative (Roméo, 17/09).
    // Quand le fournisseur est déjà enregistré avec son site, redemander le lien
    // de chaque produit bloquait des créations légitimes. Le format reste
    // vérifié dès que le champ est rempli — et une adresse tapée sans
    // « https:// » est acceptée, elle sera complétée à l'envoi.
    if (
      formData.supplier_page_url.trim() &&
      !isValidUrl(formData.supplier_page_url)
    ) {
      newErrors.supplier_page_url =
        'Adresse invalide (exemple : fournisseur.com/produit)';
    }

    if (!formData.cost_price || formData.cost_price <= 0) {
      newErrors.cost_price = "Le prix d'achat est obligatoire et doit être > 0";
    }

    setErrors(newErrors);
    const keys = Object.keys(newErrors);
    if (keys.length > 0) focusFirstError(keys);
    return keys.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Formulaire incomplet',
        description:
          'Un champ demande une correction : il est signalé en rouge juste au-dessus.',
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
          website: normalizeUrl(newSupplier.website) || null,
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
        name: formData.name.trim(),
        supplier_page_url:
          normalizeUrl(formData.supplier_page_url) || undefined,
        cost_price: formData.cost_price ?? undefined,
        cost_price_currency: formData.cost_price_currency,
        cost_price_exchange_rate: formData.cost_price_exchange_rate,
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
            await associateProductToConsultation({
              consultationId: linkedConsultationId,
              productId: newProduct.id,
              quantity: 1,
              proposedPrice: null,
              isFree: false,
              notes: 'Produit sourcé via formulaire rapide',
            });

            toast({
              title: 'Produit créé et associé',
              description: 'Le produit a été créé et associé à la consultation',
            });
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
          router.push(`/produits/sourcing/produits/${newProduct.id}`);
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
    handleFieldChange,
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
