import { Input, Label } from '@verone/ui';
import { Check, Mail, Phone, User } from 'lucide-react';

function getFieldIcon(inputType: string) {
  switch (inputType) {
    case 'email':
      return Mail;
    case 'tel':
      return Phone;
    default:
      return User;
  }
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
  inputType: string;
}

export function ReadOnlyField({ label, value, inputType }: ReadOnlyFieldProps) {
  const FieldIcon = getFieldIcon(inputType);
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-gray-500 text-sm">
        <FieldIcon className="h-3.5 w-3.5" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 text-sm">
          {value}
        </div>
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
      </div>
    </div>
  );
}

interface EditableFieldProps {
  fieldKey: string;
  label: string;
  inputType: string;
  value: string;
  onChange: (value: string) => void;
}

export function EditableField({
  fieldKey,
  label,
  inputType,
  value,
  onChange,
}: EditableFieldProps) {
  const FieldIcon = getFieldIcon(inputType);
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={fieldKey}
        className="flex items-center gap-1 text-orange-700 font-medium text-sm"
      >
        <FieldIcon className="h-3.5 w-3.5" />
        {label} *
      </Label>
      <Input
        id={fieldKey}
        type={inputType}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="border-orange-300 focus:border-orange-500 focus:ring-orange-500"
        placeholder={`Saisir ${label.toLowerCase()}`}
      />
    </div>
  );
}
