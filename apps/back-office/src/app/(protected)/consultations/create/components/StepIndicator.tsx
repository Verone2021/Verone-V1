import { Check, User, FileText, Eye } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Client', icon: User },
  { id: 2, label: 'Demande', icon: FileText },
  { id: 3, label: 'Confirmation', icon: Eye },
] as const;

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between px-4">
      {STEPS.map((s, i) => {
        const StepIcon = s.icon;
        const isCompleted = currentStep > s.id;
        const isCurrent = currentStep === s.id;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isCompleted
                    ? 'bg-green-600 border-green-600 text-white'
                    : isCurrent
                      ? 'bg-black border-black text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  isCurrent
                    ? 'text-black'
                    : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mt-[-16px] ${
                  currentStep > s.id ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
