'use client';

import {
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
  TabsContent,
} from '@verone/ui';

interface ICustomerPreferencesData {
  accepts_marketing?: boolean;
  accepts_notifications?: boolean;
  notes?: string;
}

interface ICustomerPreferencesTabProps {
  formData: ICustomerPreferencesData;
  onFieldChange: (field: string, value: string | boolean | null) => void;
}

export function CustomerPreferencesTab({
  formData,
  onFieldChange,
}: ICustomerPreferencesTabProps): React.ReactNode {
  return (
    <TabsContent value="preferences" className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accepts_marketing"
              checked={formData.accepts_marketing}
              onCheckedChange={checked =>
                onFieldChange('accepts_marketing', checked)
              }
            />
            <Label htmlFor="accepts_marketing" className="cursor-pointer">
              Accepte les emails marketing
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accepts_notifications"
              checked={formData.accepts_notifications}
              onCheckedChange={checked =>
                onFieldChange('accepts_notifications', checked)
              }
            />
            <Label htmlFor="accepts_notifications" className="cursor-pointer">
              Accepte les notifications
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Input
              id="notes"
              value={formData.notes ?? ''}
              onChange={e => onFieldChange('notes', e.target.value)}
              placeholder="Informations complémentaires..."
              className="border-black"
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
