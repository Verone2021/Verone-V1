'use client';

import { useState, useEffect } from 'react';

import {
  FileText,
  Eye,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Hash,
  Type,
  List,
} from 'lucide-react';

import { Alert, AlertDescription } from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Label } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { cn } from '@verone/utils';

import { ProductDescriptionsPreview } from './product-descriptions/ProductDescriptionsPreview';
import { ProductDescriptionsFooter } from './product-descriptions/ProductDescriptionsFooter';

interface ProductDescriptionsUpdate {
  description: string | null;
  technical_description: string | null;
  selling_points: string[] | null;
  updated_at: string;
}

interface ProductDescriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  initialData?: {
    description?: string;
    technical_description?: string;
    selling_points?: string[];
  };
  onUpdate: (data: ProductDescriptionsUpdate) => void;
}

const SELLING_POINTS_SUGGESTIONS = [
  'Qualité garantie',
  'Livraison rapide et soignée',
  'Garantie constructeur étendue',
  'Finition artisanale',
  'Matériaux durables et écologiques',
  'Design exclusif',
  'Excellent rapport qualité-prix',
  'Service client dédié',
  'Installation possible',
  'Personnalisation disponible',
];

function getTextStats(text: string) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    chars,
    words,
    charColor:
      chars < 50
        ? 'text-red-600'
        : chars > 500
          ? 'text-black'
          : 'text-green-600',
  };
}

export function ProductDescriptionsModal({
  isOpen,
  onClose,
  productId,
  productName,
  initialData,
  onUpdate,
}: ProductDescriptionsModalProps) {
  const supabase = createClient();

  const [description, setDescription] = useState('');
  const [technicalDescription, setTechnicalDescription] = useState('');
  const [sellingPoints, setSellingPoints] = useState<string[]>([]);
  const [newSellingPoint, setNewSellingPoint] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description ?? '');
      setTechnicalDescription(initialData.technical_description ?? '');
      setSellingPoints(initialData.selling_points ?? []);
    }
  }, [initialData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        description: description.trim() ?? null,
        technical_description: technicalDescription.trim() ?? null,
        selling_points: sellingPoints.length > 0 ? sellingPoints : null,
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (dbError) throw dbError;

      setSuccess(true);
      onUpdate(updateData);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      let errorMessage = 'Erreur lors de la sauvegarde des descriptions';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message: unknown }).message === 'string'
      ) {
        errorMessage = (err as { message: string }).message;
      }
      console.error('Erreur sauvegarde descriptions:', err);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSellingPoint = () => {
    if (
      newSellingPoint.trim() &&
      !sellingPoints.includes(newSellingPoint.trim())
    ) {
      setSellingPoints(prev => [...prev, newSellingPoint.trim()]);
      setNewSellingPoint('');
    }
  };

  const handleRemoveSellingPoint = (index: number) => {
    setSellingPoints(prev => prev.filter((_, i) => i !== index));
  };

  const mainStats = getTextStats(description);
  const techStats = getTextStats(technicalDescription);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-5xl md:max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-black" />
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-black">
                Descriptions produit
              </span>
              <span className="text-sm text-gray-600 font-normal">
                {productName}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {previewMode ? 'Éditer' : 'Aperçu'}
              </ButtonV2>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 mb-6">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Descriptions mises à jour avec succès !
              </AlertDescription>
            </Alert>
          )}

          {previewMode ? (
            <ProductDescriptionsPreview
              productName={productName}
              description={description}
              technicalDescription={technicalDescription}
              sellingPoints={sellingPoints}
              onEdit={() => setPreviewMode(false)}
            />
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="main" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Description principale
                </TabsTrigger>
                <TabsTrigger
                  value="technical"
                  className="flex items-center gap-2"
                >
                  <Hash className="h-4 w-4" />
                  Technique
                </TabsTrigger>
                <TabsTrigger
                  value="selling"
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  Points de vente
                </TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium"
                    >
                      Description générale du produit
                    </Label>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn('font-medium', mainStats.charColor)}>
                        {mainStats.chars} caractères
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">
                        {mainStats.words} mots
                      </span>
                    </div>
                  </div>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Décrivez ce produit de manière attractive pour vos clients..."
                    className="min-h-[120px] text-sm"
                    rows={6}
                  />
                  <div className="text-xs text-gray-500">
                    Cette description sera visible par vos clients.
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="technical_description"
                      className="text-sm font-medium"
                    >
                      Description technique détaillée
                    </Label>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn('font-medium', techStats.charColor)}>
                        {techStats.chars} caractères
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">
                        {techStats.words} mots
                      </span>
                    </div>
                  </div>
                  <Textarea
                    id="technical_description"
                    value={technicalDescription}
                    onChange={e => setTechnicalDescription(e.target.value)}
                    placeholder="Spécifications techniques, matériaux, instructions d'entretien..."
                    className="min-h-[120px] text-sm"
                    rows={6}
                  />
                  <div className="text-xs text-gray-500">
                    Informations techniques pour les professionnels.
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="selling" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Points de vente clés
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {sellingPoints.length} point
                      {sellingPoints.length > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {sellingPoints.length > 0 && (
                    <div className="space-y-2">
                      {sellingPoints.map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-black rounded-full flex-shrink-0" />
                          <span className="flex-1 text-sm">{point}</span>
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSellingPoint(index)}
                            className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </ButtonV2>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Textarea
                        value={newSellingPoint}
                        onChange={e => setNewSellingPoint(e.target.value)}
                        placeholder="Nouveau point de vente attractif..."
                        className="flex-1 text-sm"
                        rows={2}
                      />
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={handleAddSellingPoint}
                        disabled={!newSellingPoint.trim()}
                        className="h-fit mt-auto"
                      >
                        <Plus className="h-4 w-4" />
                      </ButtonV2>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 font-medium">
                        Suggestions :
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {SELLING_POINTS_SUGGESTIONS.slice(0, 6).map(
                          suggestion => (
                            <Badge
                              key={suggestion}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-gray-100"
                              onClick={() => {
                                if (!sellingPoints.includes(suggestion)) {
                                  setSellingPoints(prev => [
                                    ...prev,
                                    suggestion,
                                  ]);
                                }
                              }}
                            >
                              + {suggestion}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Utilisez des phrases courtes et impactantes.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <ProductDescriptionsFooter
          description={description}
          technicalDescription={technicalDescription}
          sellingPoints={sellingPoints}
          saving={saving}
          onCancel={onClose}
          onSave={() => {
            void handleSave().catch(() => undefined);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
