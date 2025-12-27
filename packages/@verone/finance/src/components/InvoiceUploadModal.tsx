'use client';

import { useCallback, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { Badge, Button, Progress } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';

export interface TransactionForUpload {
  id: string;
  transaction_id: string;
  label: string;
  counterparty_name: string | null;
  amount: number;
  currency: string;
  emitted_at: string;
  has_attachment: boolean;
  matched_document_id?: string | null;
  order_number?: string | null;
}

interface InvoiceUploadModalProps {
  transaction: TransactionForUpload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function InvoiceUploadModal({
  transaction,
  open,
  onOpenChange,
  onUploadComplete,
}: InvoiceUploadModalProps): React.ReactNode {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = useCallback((): void => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setErrorMessage(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback((): void => {
    if (status !== 'uploading') {
      resetState();
      onOpenChange(false);
    }
  }, [status, resetState, onOpenChange]);

  const validateFile = useCallback((f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return `Type de fichier non supporté. Acceptés: PDF, JPEG, PNG`;
    }
    if (f.size > MAX_FILE_SIZE) {
      return 'Fichier trop volumineux (max 10MB)';
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: File): void => {
      const error = validateFile(selectedFile);
      if (error) {
        setErrorMessage(error);
        return;
      }
      setErrorMessage(null);
      setFile(selectedFile);
    },
    [validateFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setDragOver(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async (): Promise<void> => {
    if (!file || !transaction) return;

    setStatus('uploading');
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('transactionId', transaction.transaction_id);
      if (transaction.matched_document_id) {
        formData.append('documentId', transaction.matched_document_id);
      }

      setProgress(30);

      const response = await fetch('/api/qonto/attachments/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Erreur lors de l'upload");
      }

      setProgress(100);
      setStatus('success');

      toast({
        title: 'Facture uploadée',
        description: 'La facture a été envoyée à Qonto avec succès.',
      });

      // Fermer après 1.5s et notifier le parent
      setTimeout(() => {
        handleClose();
        onUploadComplete?.();
      }, 1500);
    } catch (err: unknown) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setErrorMessage(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  }, [file, transaction, toast, handleClose, onUploadComplete]);

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        data-testid="modal-upload-attachment"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Uploader une facture
          </DialogTitle>
          <DialogDescription>
            Attachez une facture PDF à cette transaction Qonto
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Info */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">
                {transaction.counterparty_name ?? transaction.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(transaction.emitted_at)}
              </p>
              {transaction.order_number && (
                <Badge variant="outline" className="mt-1">
                  {transaction.order_number}
                </Badge>
              )}
            </div>
            <p className="text-lg font-semibold text-green-600">
              +
              {formatAmount(Math.abs(transaction.amount), transaction.currency)}
            </p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={cn(
            'relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            status === 'success' && 'border-green-500 bg-green-50',
            status === 'error' && 'border-red-500 bg-red-50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleInputChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={status === 'uploading' || status === 'success'}
          />

          {status === 'idle' && !file && (
            <>
              <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">
                Glissez un fichier ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPEG ou PNG (max 10MB)
              </p>
            </>
          )}

          {status === 'idle' && file && (
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={e => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {status === 'uploading' && (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">Upload en cours...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-medium">Facture uploadée avec succès!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && status === 'idle' && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={status === 'uploading'}
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || status === 'uploading' || status === 'success'}
          >
            {status === 'uploading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Uploader vers Qonto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
