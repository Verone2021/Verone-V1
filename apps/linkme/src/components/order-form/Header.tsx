import { X } from 'lucide-react';

import type { HeaderProps } from './types';

export function Header({
  title,
  subtitle,
  steps,
  currentStep,
  onClose,
}: HeaderProps) {
  return (
    <div className="flex-shrink-0 border-b bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <span className="text-xs text-gray-400">({subtitle})</span>
          )}
        </div>

        {steps && currentStep && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 hidden sm:inline">
              {currentStep}/{steps.length}
            </span>
            <div className="flex items-center gap-1">
              {steps.map(step => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full ${
                      isCompleted
                        ? 'bg-green-500'
                        : isActive
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
