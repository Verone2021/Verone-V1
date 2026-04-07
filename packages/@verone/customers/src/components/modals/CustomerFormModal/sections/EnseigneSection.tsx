import { Store } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import { useActiveEnseignes } from '@verone/organisations/hooks';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Switch } from '@verone/ui';

import type { CustomerFormData } from '../schema';

interface EnseigneSectionProps {
  form: UseFormReturn<CustomerFormData>;
}

export function EnseigneSection({ form }: EnseigneSectionProps) {
  const { enseignes } = useActiveEnseignes();

  if (enseignes.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Store className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Enseigne</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="enseigne_id">Enseigne</Label>
          <Select
            value={form.watch('enseigne_id') ?? '__none__'}
            onValueChange={value =>
              form.setValue('enseigne_id', value === '__none__' ? null : value)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Aucune enseigne" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Aucune enseigne</SelectItem>
              {enseignes.map(enseigne => (
                <SelectItem key={enseigne.id} value={enseigne.id}>
                  {enseigne.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.watch('enseigne_id') && (
          <>
            <div>
              <Label htmlFor="ownership_type">Type de propriété</Label>
              <Select
                value={form.watch('ownership_type') ?? '__none__'}
                onValueChange={value =>
                  form.setValue(
                    'ownership_type',
                    value === '__none__'
                      ? null
                      : (value as 'succursale' | 'franchise')
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Non défini" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Non défini</SelectItem>
                  <SelectItem value="succursale">
                    Succursale (propre)
                  </SelectItem>
                  <SelectItem value="franchise">Franchise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end pb-1">
              <div className="flex items-center space-x-3">
                <Switch
                  id="is_enseigne_parent"
                  checked={form.watch('is_enseigne_parent')}
                  onCheckedChange={checked =>
                    form.setValue('is_enseigne_parent', checked)
                  }
                />
                <div>
                  <Label
                    htmlFor="is_enseigne_parent"
                    className="font-medium text-sm"
                  >
                    Société mère
                  </Label>
                  <p className="text-xs text-gray-400">
                    Holding de l&apos;enseigne
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
