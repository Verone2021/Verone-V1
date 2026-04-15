'use client';

import { useState } from 'react';

import { Plus, User } from 'lucide-react';

import { Button } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { Tabs, TabsList, TabsTrigger } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';

import { CustomerAddressesTab } from './individual-customer/CustomerAddressesTab';
import { CustomerGeneralTab } from './individual-customer/CustomerGeneralTab';
import { CustomerPreferencesTab } from './individual-customer/CustomerPreferencesTab';

interface ICreateIndividualCustomerData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
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
  language_preference?: string;
  accepts_marketing?: boolean;
  accepts_notifications?: boolean;
  notes?: string;
  is_active?: boolean;
}

interface ICreateIndividualCustomerModalProps {
  onCustomerCreated?: (customerId: string, customerName: string) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  enseigneId?: string | null;
  sourceType?: 'manual' | 'linkme' | 'site-internet' | 'internal';
}

const DEFAULT_FORM_DATA: Partial<ICreateIndividualCustomerData> = {
  is_active: true,
  has_different_billing_address: false,
  accepts_marketing: false,
  accepts_notifications: true,
  language_preference: 'fr',
  country: 'France',
};

export function CreateIndividualCustomerModal({
  onCustomerCreated,
  trigger,
  isOpen: controlledOpen,
  onClose,
  enseigneId,
  sourceType,
}: ICreateIndividualCustomerModalProps): React.ReactNode {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => {
        if (!v) onClose?.();
      }
    : setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] =
    useState<Partial<ICreateIndividualCustomerData>>(DEFAULT_FORM_DATA);

  const { toast } = useToast();
  const supabase = createClient();

  const handleInputChange = (
    field: string,
    value: string | boolean | null
  ): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        title: 'Erreur de validation',
        description: "Le prénom, le nom et l'email sont obligatoires.",
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const insertData = {
        ...formData,
        ...(enseigneId ? { enseigne_id: enseigneId } : {}),
        ...(sourceType ? { source_type: sourceType } : {}),
      };
      const { data, error } = await supabase
        .from('individual_customers')
        .insert([insertData as ICreateIndividualCustomerData])
        .select('id')
        .single();

      if (error) throw error;

      const customerName = `${formData.first_name} ${formData.last_name}`;
      toast({
        title: '✅ Client particulier créé',
        description: `${customerName} a été créé avec succès.`,
      });

      if (onCustomerCreated && data) onCustomerCreated(data.id, customerName);

      setFormData(DEFAULT_FORM_DATA);
      setOpen(false);
    } catch (error) {
      console.error('Erreur création client particulier:', error);
      toast({
        title: '❌ Erreur création client',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Nouveau client particulier
        </DialogTitle>
        <DialogDescription>
          Créez un nouveau client particulier dans le système
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={e => {
          void handleSubmit(e);
        }}
        className="space-y-6"
      >
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="addresses">Adresses</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
          </TabsList>

          <CustomerGeneralTab
            formData={formData}
            onFieldChange={handleInputChange}
          />
          <CustomerAddressesTab
            formData={formData}
            onFieldChange={handleInputChange}
          />
          <CustomerPreferencesTab
            formData={formData}
            onFieldChange={handleInputChange}
          />
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="bg-black hover:bg-gray-800 text-white"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer le client'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="bg-black hover:bg-gray-800 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client particulier
          </Button>
        </DialogTrigger>
      )}
      {content}
    </Dialog>
  );
}
