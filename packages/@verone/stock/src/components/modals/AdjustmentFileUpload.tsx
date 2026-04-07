'use client';

import { Loader2, Upload, X } from 'lucide-react';

import { Button } from '@verone/ui';

interface AdjustmentFileUploadProps {
  uploadedFile: File | null;
  uploading: boolean;
  onFileChange: (file: File) => void;
  onClear: () => void;
}

export function AdjustmentFileUpload({
  uploadedFile,
  uploading,
  onFileChange,
  onClear,
}: AdjustmentFileUploadProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Document justificatif (optionnel mais recommandé)
      </label>
      <div className="mt-1">
        {!uploadedFile ? (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Upload en cours...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Cliquez pour uploader</span>{' '}
                    ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, PDF, Excel (max 5MB)
                  </p>
                </>
              )}
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*,.pdf,.xls,.xlsx"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) onFileChange(file);
              }}
              disabled={uploading}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                {uploadedFile.name}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
