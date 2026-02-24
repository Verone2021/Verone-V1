'use client';

import * as React from 'react';

import { CheckCircle2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

export interface SuccessDialogProps {
  /**
   * Open/close state
   */
  open: boolean;

  /**
   * Callback to change open/close state
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog description
   */
  description: string;

  /**
   * Close button text
   * @default "Fermer"
   */
  closeText?: string;

  /**
   * Optional custom content (e.g. reception summary)
   */
  children?: React.ReactNode;
}

/**
 * SuccessDialog
 *
 * Post-action confirmation dialog with success feedback.
 * Based on the same AlertDialog pattern as ConfirmDialog.
 *
 * @example
 * ```tsx
 * <SuccessDialog
 *   open={showSuccess}
 *   onOpenChange={setShowSuccess}
 *   title="Reception validated"
 *   description="The reception has been recorded."
 * >
 *   <ul><li>Product A - 10 units</li></ul>
 * </SuccessDialog>
 * ```
 */
export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  closeText = 'Fermer',
  children,
}: SuccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5 p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        {children && (
          <div className="mt-2 max-h-60 overflow-y-auto">{children}</div>
        )}
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            {closeText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
