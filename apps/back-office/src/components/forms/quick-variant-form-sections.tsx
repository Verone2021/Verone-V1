/**
 * Quick Variant Form — reusable sub-components
 */

'use client';

import Image from 'next/image';

import { useToast } from '@verone/common';
import { ButtonV2 } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Upload, X, Palette, Ruler, Layers, Loader2 } from 'lucide-react';

import { getVariantOptions } from './quick-variant-form-constants';

// ---------------------------------------------------------------------------
// VariantField
// ---------------------------------------------------------------------------

interface VariantFieldProps {
  type: string;
  value: string;
  onChange: (value: string) => void;
  variantType: string;
}

export function VariantField({
  type,
  value,
  onChange,
  variantType,
}: VariantFieldProps) {
  const options = getVariantOptions(type);
  const icons: Record<string, React.ReactNode> = {
    color: <Palette className="h-4 w-4" />,
    size: <Ruler className="h-4 w-4" />,
    material: <Layers className="h-4 w-4" />,
    pattern: <Layers className="h-4 w-4" />,
  };

  return (
    <div className="space-y-2">
      <Label className="text-black flex items-center space-x-2">
        {icons[type]}
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
}

// ---------------------------------------------------------------------------
// ImagePreview (internal)
// ---------------------------------------------------------------------------

interface ImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
}

function ImagePreview({ imageUrl, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative">
      <div className="relative w-full h-32 rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt="Preview"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <ButtonV2
        type="button"
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </ButtonV2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImageDropzone (internal)
// ---------------------------------------------------------------------------

interface ImageDropzoneProps {
  uploadingImage: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ImageDropzone({ uploadingImage, onChange }: ImageDropzoneProps) {
  return (
    <div className="text-center">
      {uploadingImage ? (
        <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
      ) : (
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
      )}
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
          onChange={onChange}
          disabled={uploadingImage}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImageUploadSection
// ---------------------------------------------------------------------------

interface ImageUploadSectionProps {
  imageUrl: string;
  uploadingImage: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}

export function ImageUploadSection({
  imageUrl,
  uploadingImage,
  onUpload,
  onRemove,
}: ImageUploadSectionProps) {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '❌ Fichier trop volumineux',
        description: "L'image doit faire moins de 5MB",
        variant: 'destructive',
      });
      return;
    }

    void onUpload(file).catch(error => {
      console.error('[ImageUploadSection] handleImageUpload failed:', error);
    });
  };

  return (
    <div className="space-y-2">
      <Label className="text-black">Image du produit</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        {imageUrl ? (
          <ImagePreview imageUrl={imageUrl} onRemove={onRemove} />
        ) : (
          <ImageDropzone
            uploadingImage={uploadingImage}
            onChange={handleFileChange}
          />
        )}
      </div>
    </div>
  );
}
