import Image from 'next/image';

import { ButtonUnified, ImageUploadZone } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileText,
  X,
} from 'lucide-react';

import type {
  ConsultationFormData,
  UploadedImage,
} from '../use-create-consultation';
import { MAX_IMAGES } from '../use-create-consultation';

interface StepDemandeProps {
  formData: ConsultationFormData;
  errors: Record<string, string>;
  uploadedImages: UploadedImage[];
  canGoNext: boolean;
  onInputChange: (
    field: keyof ConsultationFormData,
    value: ConsultationFormData[keyof ConsultationFormData]
  ) => void;
  onImageUploadSuccess: (
    publicUrl: string,
    fileName: string,
    storagePath?: string,
    fileSize?: number
  ) => void;
  onRemoveImage: (index: number) => void;
  onImageUploadError: (error: Error) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDemande({
  formData,
  errors,
  uploadedImages,
  canGoNext,
  onInputChange,
  onImageUploadSuccess,
  onRemoveImage,
  onImageUploadError,
  onNext,
  onBack,
}: StepDemandeProps) {
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Description de la demande</span>
        </CardTitle>
        <CardDescription>
          Decrivez le besoin du client et les parametres
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="descriptif">
            Description detaillee <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="descriptif"
            value={formData.descriptif}
            onChange={e => onInputChange('descriptif', e.target.value)}
            placeholder="Decrivez les besoins, le contexte et les attentes du client..."
            rows={5}
            className={errors.descriptif ? 'border-red-500' : ''}
          />
          {errors.descriptif && (
            <p className="text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.descriptif}
            </p>
          )}
        </div>

        {uploadedImages.length > 0 && (
          <div className="space-y-2">
            <Label>
              Images ajoutees ({uploadedImages.length}/{MAX_IMAGES})
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {uploadedImages.map((img, index) => (
                <div
                  key={img.publicUrl}
                  className="relative group rounded-lg border border-green-200 bg-green-50 overflow-hidden"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={img.publicUrl}
                      alt={img.fileName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="text-xs text-gray-600 truncate px-2 py-1">
                    {img.fileName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedImages.length < MAX_IMAGES && (
          <ImageUploadZone
            key={`upload-zone-${uploadedImages.length}`}
            bucket="product-images"
            folder="consultations"
            onUploadSuccess={onImageUploadSuccess}
            onUploadError={onImageUploadError}
            label={
              uploadedImages.length === 0
                ? 'Images (optionnel, max 5)'
                : 'Ajouter une image'
            }
            helperText="Glissez-deposez une image ou cliquez pour selectionner"
            acceptedFormats={{
              'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
            }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="tarif_maximum">Budget maximum (EUR)</Label>
            <Input
              id="tarif_maximum"
              type="number"
              min="0"
              step="100"
              value={formData.tarif_maximum ?? ''}
              onChange={e =>
                onInputChange(
                  'tarif_maximum',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              placeholder="10000"
            />
          </div>

          <div className="space-y-2">
            <Label>Priorite</Label>
            <Select
              value={formData.priority_level?.toString()}
              onValueChange={value =>
                onInputChange('priority_level', parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Tres urgent (5)</SelectItem>
                <SelectItem value="4">Urgent (4)</SelectItem>
                <SelectItem value="3">Normal+ (3)</SelectItem>
                <SelectItem value="2">Normal (2)</SelectItem>
                <SelectItem value="1">Faible (1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Canal d&apos;origine</Label>
            <Select
              value={formData.source_channel}
              onValueChange={value => onInputChange('source_channel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Site web</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Telephone</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_response_date">
            <Calendar className="h-4 w-4 inline mr-1" />
            Date de reponse estimee
          </Label>
          <Input
            id="estimated_response_date"
            type="date"
            value={formData.estimated_response_date}
            onChange={e =>
              onInputChange('estimated_response_date', e.target.value)
            }
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes_internes">Notes internes</Label>
          <Textarea
            id="notes_internes"
            value={formData.notes_internes ?? ''}
            onChange={e => onInputChange('notes_internes', e.target.value)}
            placeholder="Notes visibles uniquement par l'equipe..."
            rows={3}
          />
        </div>

        <div className="flex justify-between pt-4 border-t">
          <ButtonUnified variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </ButtonUnified>
          <ButtonUnified onClick={onNext} disabled={!canGoNext}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </ButtonUnified>
        </div>
      </CardContent>
    </Card>
  );
}
