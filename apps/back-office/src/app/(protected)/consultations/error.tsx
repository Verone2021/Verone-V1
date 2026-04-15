'use client';

import { ModuleErrorBoundary } from '@/components/errors/ModuleErrorBoundary';

export default function ConsultationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ModuleErrorBoundary
      error={error}
      reset={reset}
      moduleName="Consultations"
    />
  );
}
