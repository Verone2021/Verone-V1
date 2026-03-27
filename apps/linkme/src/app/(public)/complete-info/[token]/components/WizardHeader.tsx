import { Check } from 'lucide-react';

import type { WizardStepConfig } from './types';

interface WizardHeaderProps {
  steps: WizardStepConfig[];
  currentStepIndex: number;
  completedSteps: Set<string>;
}

export function WizardHeader({
  steps,
  currentStepIndex,
  completedSteps,
}: WizardHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = completedSteps.has(step.id);
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`h-px w-8 ${isCompleted || index <= currentStepIndex ? 'bg-blue-400' : 'bg-gray-200'}`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center h-9 w-9 rounded-full border-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium hidden sm:block ${
                  isActive
                    ? 'text-blue-600'
                    : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
