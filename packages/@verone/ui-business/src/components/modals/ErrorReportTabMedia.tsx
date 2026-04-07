'use client';

import type React from 'react';
import { useRef } from 'react';

import { ButtonV2, Card, CardContent, Label } from '@verone/ui';
import { Camera, Image, Upload, X } from 'lucide-react';

import type { ErrorReport } from './error-report-modal.types';

interface ErrorReportTabMediaProps {
  formData: Partial<ErrorReport>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ErrorReport>>>;
}

export function ErrorReportTabMedia({
  formData,
  setFormData,
}: ErrorReportTabMediaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(
      file => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );
    setFormData(prev => ({
      ...prev,
      screenshots: [...(prev.screenshots ?? []), ...newFiles],
    }));
  };

  const removeScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots?.filter((_, i) => i !== index) ?? [],
    }));
  };

  const captureScreenshot = async () => {
    try {
      if ('getDisplayMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        void video.play();

        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);

          canvas.toBlob(blob => {
            if (blob) {
              const file = new File([blob], `screenshot-${Date.now()}.png`, {
                type: 'image/png',
              });
              setFormData(prev => ({
                ...prev,
                screenshots: [...(prev.screenshots ?? []), file],
              }));
            }
          });

          stream.getTracks().forEach(track => track.stop());
        });
      }
    } catch (error) {
      console.warn('Screenshot capture not available:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Screenshots et captures</Label>
        <div className="flex gap-2">
          <ButtonV2
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void captureScreenshot()}
          >
            <Camera className="h-4 w-4 mr-2" />
            Capture écran
          </ButtonV2>
          <ButtonV2
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload fichier
          </ButtonV2>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFileUpload(e.target.files)}
      />

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        onDrop={e => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        onDragOver={e => e.preventDefault()}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image
          className="h-12 w-12 mx-auto text-gray-400 mb-4"
          aria-hidden="true"
        />
        <p className="text-gray-600">
          Glissez-déposez vos images ici ou cliquez pour sélectionner
        </p>
        <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF jusqu'à 10MB</p>
      </div>

      {formData.screenshots && formData.screenshots.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {formData.screenshots.map((file, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                <ButtonV2
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={() => removeScreenshot(index)}
                >
                  <X className="h-3 w-3" />
                </ButtonV2>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {file.name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
