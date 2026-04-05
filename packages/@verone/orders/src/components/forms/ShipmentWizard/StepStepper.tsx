'use client';

import { CheckCircle2, ArrowRight } from 'lucide-react';

interface StepStepperProps {
  step: number;
  stepLabels: string[];
  maxStep: number;
}

export function StepStepper({ step, stepLabels, maxStep }: StepStepperProps) {
  if (step > 6) return null;

  return (
    <div className="flex items-center gap-1 mb-4">
      {stepLabels.slice(0, maxStep).map((label, i) => (
        <div key={label} className="flex items-center">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              i + 1 === step
                ? 'bg-blue-100 text-blue-800'
                : i + 1 < step
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {i + 1 < step ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <span>{i + 1}</span>
            )}
            {label}
          </div>
          {i < maxStep - 1 && (
            <ArrowRight className="h-3 w-3 text-gray-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}
