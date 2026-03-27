import { Button } from '@verone/ui';
import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react';

interface WizardFooterProps {
  currentStepIndex: number;
  totalSteps: number;
  isLastStep: boolean;
  isSubmitting: boolean;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function WizardFooter({
  currentStepIndex,
  totalSteps,
  isLastStep,
  isSubmitting,
  canProceed,
  onBack,
  onNext,
  onSubmit,
}: WizardFooterProps) {
  return (
    <div className="flex items-center justify-between pt-4">
      <div>
        {currentStepIndex > 0 && (
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Precedent
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-400">
        {currentStepIndex + 1} / {totalSteps}
      </div>

      <div>
        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !canProceed}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        ) : (
          <Button type="button" onClick={onNext} disabled={!canProceed}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
