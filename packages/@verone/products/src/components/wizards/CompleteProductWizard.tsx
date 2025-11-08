'use client';

import { useState, useEffect } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Save,
  Package,
  Info,
  DollarSign,
  Settings,
  Image as ImageIcon,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Alert, AlertDescription } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Progress } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';
import { useProducts } from '@verone/products/hooks';

// Sections du wizard
import { GeneralInfoSection } from '@verone/products/components/wizards/sections/GeneralInfoSection';
import { ImagesSection } from '@verone/products/components/wizards/sections/ImagesSection';
import { PricingSection } from '@verone/products/components/wizards/sections/PricingSection';
import { StockSection } from '@verone/products/components/wizards/sections/StockSection';
import { SupplierSection } from '@verone/products/components/wizards/sections/SupplierSection';
import { TechnicalSection } from '@verone/products/components/wizards/sections/TechnicalSection';

interface CompleteProductWizardProps {
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  editMode?: boolean;
  draftId?: string;
}

export interface WizardFormData {
  // Informations générales - REFACTORISÉ selon nouvelle logique
  name: string;
  slug: string;
  description: string;
  // technical_description: SUPPRIMÉ - consolidé dans description
  selling_points: string[];
  condition: string;
  availability_type: string;
  video_url: string;

  // Catégorisation
  family_id: string;
  category_id: string;
  subcategory_id: string;

  // Fournisseur et sourcing
  supplier_id: string;
  supplier_page_url: string;
  supplier_reference: string;

  // Tarification et coûts - REFACTORISÉ logique prix minimum
  cost_price: string;
  // supplier_cost_price: SUPPRIMÉ - n'existe plus
  target_margin_percentage: string;
  margin_percentage: string;

  // Caractéristiques techniques
  brand: string;
  variant_attributes: Record<string, any>;
  dimensions: Record<string, any>;
  weight: string;
  gtin: string;

  // Type et assignation
  product_type: 'standard' | 'custom';
  assigned_client_id: string;
  creation_mode: 'sourcing' | 'complete';
  requires_sample: boolean;

  // Stock et inventaire
  stock_quantity: string;
  stock_real: string;
  stock_forecasted_in: string;
  stock_forecasted_out: string;
  min_stock: string;
  reorder_point: string;

  // Métadonnées (lecture seule)
  sku?: string;
  status?: string;
  archived_at?: string;
}

const WIZARD_SECTIONS = [
  { id: 'general', label: 'Informations générales', icon: Info },
  { id: 'supplier', label: 'Fournisseur', icon: Truck },
  { id: 'pricing', label: 'Tarification', icon: DollarSign },
  { id: 'technical', label: 'Caractéristiques', icon: Settings },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'stock', label: 'Stock', icon: Package },
];

export function CompleteProductWizard({
  onSuccess,
  onCancel,
  editMode = false,
  draftId,
}: CompleteProductWizardProps) {
  const { toast } = useToast();
  const { createProduct, updateProduct } = useProducts();

  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    // Informations générales
    name: '',
    slug: '',
    description: '',
    selling_points: [],
    condition: 'new',
    availability_type: 'normal',
    video_url: '',

    // Catégorisation
    family_id: '',
    category_id: '',
    subcategory_id: '',

    // Fournisseur et sourcing
    supplier_id: '',
    supplier_page_url: '',
    supplier_reference: '',

    // Tarification et coûts
    cost_price: '',
    target_margin_percentage: '',
    margin_percentage: '',

    // Caractéristiques techniques
    brand: '',
    variant_attributes: {},
    dimensions: {},
    weight: '',
    gtin: '',

    // Type et assignation
    product_type: 'standard',
    assigned_client_id: '',
    creation_mode: 'complete',
    requires_sample: false,

    // Stock et inventaire
    stock_quantity: '',
    stock_real: '',
    stock_forecasted_in: '',
    stock_forecasted_out: '',
    min_stock: '',
    reorder_point: '',
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftIdState, setDraftIdState] = useState<string | null>(
    draftId || null
  );

  // Fonction helper pour charger un produit existant
  const getDraftForEdit = async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  // Charger le brouillon en mode édition
  useEffect(() => {
    if (editMode && draftId) {
      loadDraftForEdit(draftId);
    }
  }, [editMode, draftId]);

  const loadDraftForEdit = async (id: string) => {
    try {
      setIsLoading(true);
      const draft = await getDraftForEdit(id);

      if (draft) {
        setFormData({
          name: draft.name || '',
          slug: draft.slug || '',
          description: draft.description || '',
          selling_points: (Array.isArray(draft.selling_points)
            ? draft.selling_points
            : []) as string[],
          condition: draft.condition || 'new',
          availability_type: draft.availability_type || 'normal',
          video_url: draft.video_url || '',
          family_id: '',
          category_id: '',
          subcategory_id: draft.subcategory_id || '',
          supplier_id: draft.supplier_id || '',
          supplier_page_url: draft.supplier_page_url || '',
          supplier_reference: draft.supplier_reference || '',
          cost_price: draft.cost_price?.toString() || '',
          target_margin_percentage:
            draft.target_margin_percentage?.toString() || '',
          margin_percentage: draft.margin_percentage?.toString() || '',
          brand: draft.brand || '',
          variant_attributes: (draft.variant_attributes || {}) as Record<
            string,
            any
          >,
          dimensions: (draft.dimensions || {}) as Record<string, any>,
          weight: draft.weight?.toString() || '',
          gtin: draft.gtin || '',
          product_type: (draft.product_type || 'standard') as
            | 'custom'
            | 'standard',
          assigned_client_id: draft.assigned_client_id || '',
          creation_mode: (draft.creation_mode || 'complete') as
            | 'sourcing'
            | 'complete',
          requires_sample: draft.requires_sample || false,
          stock_quantity: draft.stock_quantity?.toString() || '',
          stock_real: draft.stock_real?.toString() || '',
          stock_forecasted_in: draft.stock_forecasted_in?.toString() || '',
          stock_forecasted_out: draft.stock_forecasted_out?.toString() || '',
          min_stock: draft.min_stock?.toString() || '',
          reorder_point: draft.reorder_point?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Erreur chargement brouillon:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le brouillon',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calcul du pourcentage de completion
  const calculateProgress = () => {
    const allFields = Object.entries(formData);
    const filledFields = allFields.filter(([key, value]) => {
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null)
        return Object.keys(value).length > 0;
      return value !== null && value !== undefined;
    });

    const imageProgress = selectedImages.length > 0 ? 1 : 0;
    const totalProgress = filledFields.length + imageProgress;
    const totalFields = allFields.length + 1; // +1 pour les images

    return Math.round((totalProgress / totalFields) * 100);
  };

  // Sauvegarde automatique du brouillon
  const saveDraft = async (showToast = true) => {
    try {
      setIsSaving(true);

      // 🔥 FIX: Construire productData avec champs essentiels + completion_status: 'draft'
      const productData = {
        // Informations générales (avec valeurs par défaut pour champs obligatoires)
        name: formData.name || 'Produit sans nom',
        slug:
          formData.slug ||
          formData.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-') ||
          `product-${Date.now()}`,
        description: formData.description,
        selling_points:
          formData.selling_points.length > 0
            ? formData.selling_points
            : undefined,
        condition: formData.condition || 'new',
        availability_type: formData.availability_type || 'normal',
        video_url: formData.video_url || undefined,

        // Catégorisation (SEULEMENT subcategory_id existe dans products)
        subcategory_id: formData.subcategory_id || undefined,

        // Fournisseur
        supplier_id: formData.supplier_id || undefined,
        supplier_page_url: formData.supplier_page_url || undefined,
        supplier_reference: formData.supplier_reference || undefined,

        // Tarification (conversion string → number avec valeurs par défaut)
        // 🔥 FIX: cost_price et margin_percentage doivent être NULL si non renseignés (contrainte CHECK > 0)
        cost_price: formData.cost_price
          ? parseFloat(formData.cost_price)
          : undefined,
        target_margin_percentage: formData.target_margin_percentage
          ? parseFloat(formData.target_margin_percentage)
          : undefined,
        margin_percentage: formData.margin_percentage
          ? parseFloat(formData.margin_percentage)
          : undefined,

        // Caractéristiques techniques
        brand: formData.brand || undefined,
        variant_attributes:
          Object.keys(formData.variant_attributes).length > 0
            ? formData.variant_attributes
            : undefined,
        dimensions:
          Object.keys(formData.dimensions).length > 0
            ? formData.dimensions
            : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        gtin: formData.gtin || undefined,

        // Type et assignation
        product_type: formData.product_type || 'standard',
        assigned_client_id: formData.assigned_client_id || undefined,
        creation_mode: 'complete' as const, // 🔥 Toujours 'complete' pour ce wizard
        requires_sample: formData.requires_sample || false,

        // Stock (conversion string → number)
        stock_quantity: formData.stock_quantity
          ? parseInt(formData.stock_quantity)
          : undefined,
        stock_real: formData.stock_real
          ? parseInt(formData.stock_real)
          : undefined,
        stock_forecasted_in: formData.stock_forecasted_in
          ? parseInt(formData.stock_forecasted_in)
          : undefined,
        stock_forecasted_out: formData.stock_forecasted_out
          ? parseInt(formData.stock_forecasted_out)
          : undefined,
        min_stock: formData.min_stock
          ? parseInt(formData.min_stock)
          : undefined,
        reorder_point: formData.reorder_point
          ? parseInt(formData.reorder_point)
          : undefined,

        // 🔥 FIX CRITIQUE: Marquer comme brouillon en cours de création
        completion_status: 'draft' as const,
        status: 'coming_soon' as const, // Disponibilité "à venir" jusqu'à finalisation
      };

      let result;
      if (draftIdState) {
        // Mise à jour du produit existant
        result = await updateProduct(draftIdState, productData);
      } else {
        // Création d'un nouveau produit
        result = await createProduct(productData);
        if (result?.id) {
          setDraftIdState(result.id);
        }
      }

      if (showToast) {
        toast({
          title: 'Brouillon sauvegardé',
          description: 'Vos modifications ont été enregistrées',
        });
      }

      return result;
    } catch (error) {
      console.error('Erreur sauvegarde brouillon:', error);
      if (showToast) {
        toast({
          title: 'Erreur de sauvegarde',
          description:
            error instanceof Error
              ? error.message
              : 'Impossible de sauvegarder le brouillon',
          variant: 'destructive',
        });
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Finaliser et créer le produit
  const finalizeDraft = async () => {
    try {
      setIsLoading(true);

      // 🔥 FIX: Sauvegarder d'abord les dernières modifications
      await saveDraft(false);

      if (!draftIdState) {
        throw new Error('Aucun produit à finaliser');
      }

      // 🔥 FIX: Finaliser le produit en changeant completion_status: 'active'
      const finalizedProduct = await updateProduct(draftIdState, {
        completion_status: 'active' as const,
        status: 'in_stock' as const, // Produit disponible en stock par défaut
        completion_percentage: 100,
      });

      if (!finalizedProduct) {
        throw new Error('Impossible de finaliser le produit');
      }

      toast({
        title: 'Produit créé',
        description: 'Le produit a été ajouté au catalogue',
      });

      if (onSuccess) {
        onSuccess(finalizedProduct.id);
      }
    } catch (error) {
      console.error('Erreur finalisation:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de finaliser le produit',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation entre sections
  const nextSection = () => {
    if (currentSection < WIZARD_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      saveDraft(false); // Sauvegarde silencieuse
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const progress = calculateProgress();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du brouillon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec progression */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-black">
                {editMode ? 'Édition du produit' : 'Nouveau Produit Complet'}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Aucun champ n'est obligatoire. Complétez les informations à
                votre rythme.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {progress}%
              </div>
              <div className="text-sm text-gray-500">Complété</div>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Progression globale</span>
              <div className="flex items-center space-x-2">
                {isSaving && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Sauvegarde...</span>
                  </>
                )}
                {progress === 100 && (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Prêt à finaliser</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation par onglets */}
      <Tabs value={WIZARD_SECTIONS[currentSection].id} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {WIZARD_SECTIONS.map((section, index) => {
            const Icon = section.icon;
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                onClick={() => setCurrentSection(index)}
                className="flex items-center space-x-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{section.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenu des sections */}
        <TabsContent value="general">
          <GeneralInfoSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => saveDraft()}
          />
        </TabsContent>

        <TabsContent value="supplier">
          <SupplierSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => saveDraft()}
          />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => saveDraft()}
          />
        </TabsContent>

        <TabsContent value="technical">
          <TechnicalSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => saveDraft()}
          />
        </TabsContent>

        <TabsContent value="images">
          <ImagesSection
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            formData={formData}
            onSave={() => saveDraft()}
          />
        </TabsContent>

        <TabsContent value="stock">
          <StockSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => saveDraft()}
          />
        </TabsContent>
      </Tabs>

      {/* Footer avec actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={prevSection}
                disabled={currentSection === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              <Button
                variant="outline"
                onClick={nextSection}
                disabled={currentSection === WIZARD_SECTIONS.length - 1}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => saveDraft()}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>

              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
              )}

              <Button
                onClick={finalizeDraft}
                disabled={isLoading || !draftIdState}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finalisation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finaliser le produit
                  </>
                )}
              </Button>
            </div>
          </div>

          {progress < 30 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Astuce :</strong> Vous pouvez finaliser le produit à
                tout moment, même avec des informations partielles. Complétez au
                minimum le nom pour une meilleure organisation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
