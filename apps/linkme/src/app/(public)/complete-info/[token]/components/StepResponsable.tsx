import type { StepProps } from './types';
import { ReadOnlyField, EditableField } from './FieldRenderer';

export function StepResponsable({
  step,
  formValues,
  onFieldChange,
}: StepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Veuillez renseigner les coordonnees du responsable de la commande.
      </p>
      {step.existingFields.map(f => (
        <ReadOnlyField
          key={f.key}
          label={f.label}
          value={f.value}
          inputType="text"
        />
      ))}
      {step.missingFields.map(f => (
        <EditableField
          key={f.key}
          fieldKey={f.key}
          label={f.label}
          inputType={f.inputType}
          value={formValues[f.key] ?? ''}
          onChange={v => onFieldChange(f.key, v)}
        />
      ))}
    </div>
  );
}
