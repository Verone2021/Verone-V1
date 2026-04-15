'use client';

import {
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
  TabsContent,
} from '@verone/ui';

interface ICustomerGeneralData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

interface ICustomerGeneralTabProps {
  formData: ICustomerGeneralData;
  onFieldChange: (field: string, value: string | boolean | null) => void;
}

export function CustomerGeneralTab({
  formData,
  onFieldChange,
}: ICustomerGeneralTabProps): React.ReactNode {
  return (
    <TabsContent value="general" className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name ?? ''}
                onChange={e => onFieldChange('first_name', e.target.value)}
                placeholder="Jean"
                className="border-black"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name ?? ''}
                onChange={e => onFieldChange('last_name', e.target.value)}
                placeholder="Dupont"
                className="border-black"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email ?? ''}
              onChange={e => onFieldChange('email', e.target.value)}
              placeholder="jean.dupont@email.com"
              className="border-black"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone ?? ''}
              onChange={e => onFieldChange('phone', e.target.value)}
              placeholder="+33 1 23 45 67 89"
              className="border-black"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={checked => onFieldChange('is_active', checked)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Client actif
            </Label>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
