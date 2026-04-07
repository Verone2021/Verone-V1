'use client';

import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

type GoogleMerchantSettingsTabProps = {
  syncFrequency: string;
};

export function GoogleMerchantSettingsTab({
  syncFrequency,
}: GoogleMerchantSettingsTabProps): JSX.Element {
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="text-black">Paramètres du Feed</CardTitle>
        <CardDescription>
          Configurez les paramètres de synchronisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">
              Fréquence de synchronisation
            </label>
            <Select defaultValue={syncFrequency}>
              <SelectTrigger className="w-full mt-1 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manuelle</SelectItem>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Quotidienne</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Format d&apos;export</label>
            <Select defaultValue="xml">
              <SelectTrigger className="w-full mt-1 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xml">XML (Google Shopping)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-600">
              Synchronisation automatique activée
            </p>
            <ButtonV2 className="bg-black hover:bg-gray-800 text-white">
              Enregistrer les paramètres
            </ButtonV2>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
