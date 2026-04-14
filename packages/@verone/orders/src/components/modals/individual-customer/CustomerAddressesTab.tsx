'use client';

import {
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
  TabsContent,
} from '@verone/ui';

interface ICustomerAddressesData {
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  region?: string;
  country?: string;
  has_different_billing_address?: boolean;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_postal_code?: string;
  billing_city?: string;
  billing_region?: string;
  billing_country?: string;
}

interface ICustomerAddressesTabProps {
  formData: ICustomerAddressesData;
  onFieldChange: (field: string, value: string | boolean | null) => void;
}

function AddressFields({
  prefix,
  data,
  onFieldChange,
}: {
  prefix: string;
  data: ICustomerAddressesData;
  onFieldChange: (field: string, value: string) => void;
}): React.ReactNode {
  const line1Key = prefix ? `${prefix}_address_line1` : 'address_line1';
  const line2Key = prefix ? `${prefix}_address_line2` : 'address_line2';
  const postalKey = prefix ? `${prefix}_postal_code` : 'postal_code';
  const cityKey = prefix ? `${prefix}_city` : 'city';
  const regionKey = prefix ? `${prefix}_region` : 'region';
  const countryKey = prefix ? `${prefix}_country` : 'country';

  const getValue = (key: string): string => {
    return (
      ((data as Record<string, string | boolean | undefined>)[key] as string) ??
      ''
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={line1Key}>Adresse ligne 1</Label>
        <Input
          id={line1Key}
          value={getValue(line1Key)}
          onChange={e => onFieldChange(line1Key, e.target.value)}
          placeholder="12 rue de la Paix"
          className="border-black"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={line2Key}>Adresse ligne 2</Label>
        <Input
          id={line2Key}
          value={getValue(line2Key)}
          onChange={e => onFieldChange(line2Key, e.target.value)}
          placeholder="Appartement 3B"
          className="border-black"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={postalKey}>Code postal</Label>
          <Input
            id={postalKey}
            value={getValue(postalKey)}
            onChange={e => onFieldChange(postalKey, e.target.value)}
            placeholder="75001"
            className="border-black"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={cityKey}>Ville</Label>
          <Input
            id={cityKey}
            value={getValue(cityKey)}
            onChange={e => onFieldChange(cityKey, e.target.value)}
            placeholder="Paris"
            className="border-black"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={regionKey}>Région</Label>
          <Input
            id={regionKey}
            value={getValue(regionKey)}
            onChange={e => onFieldChange(regionKey, e.target.value)}
            placeholder="Île-de-France"
            className="border-black"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={countryKey}>Pays</Label>
          <Input
            id={countryKey}
            value={getValue(countryKey)}
            onChange={e => onFieldChange(countryKey, e.target.value)}
            placeholder="France"
            className="border-black"
          />
        </div>
      </div>
    </div>
  );
}

export function CustomerAddressesTab({
  formData,
  onFieldChange,
}: ICustomerAddressesTabProps): React.ReactNode {
  return (
    <TabsContent value="addresses" className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-sm">Adresse de livraison</h3>
          <AddressFields
            prefix=""
            data={formData}
            onFieldChange={onFieldChange}
          />

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="has_different_billing_address"
              checked={formData.has_different_billing_address}
              onCheckedChange={checked =>
                onFieldChange('has_different_billing_address', String(checked))
              }
            />
            <Label
              htmlFor="has_different_billing_address"
              className="cursor-pointer"
            >
              Adresse de facturation différente
            </Label>
          </div>

          {formData.has_different_billing_address && (
            <>
              <h3 className="font-semibold text-sm pt-4">
                Adresse de facturation
              </h3>
              <AddressFields
                prefix="billing"
                data={formData}
                onFieldChange={onFieldChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
