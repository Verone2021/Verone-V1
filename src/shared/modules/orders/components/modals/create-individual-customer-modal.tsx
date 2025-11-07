'use client';

import { useState } from 'react';

import { Plus, User, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';

interface CreateIndividualCustomerData {
  first_name: string;
  last_name: string;
  email: string; // OBLIGATOIRE dans la DB
  phone?: string;

  // Adresse principale (livraison)
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  region?: string;
  country?: string;

  // Adresse de facturation (si différente)
  has_different_billing_address?: boolean;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_postal_code?: string;
  billing_city?: string;
  billing_region?: string;
  billing_country?: string;

  // Préférences (vrais champs DB)
  language_preference?: string;
  accepts_marketing?: boolean;
  accepts_notifications?: boolean;
  notes?: string;

  is_active?: boolean;
}

interface CreateIndividualCustomerModalProps {
  onCustomerCreated?: (customerId: string, customerName: string) => void;
  trigger?: React.ReactNode;
}

export function CreateIndividualCustomerModal({
  onCustomerCreated,
  trigger,
}: CreateIndividualCustomerModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<
    Partial<CreateIndividualCustomerData>
  >({
    is_active: true,
    has_different_billing_address: false,
    accepts_marketing: false,
    accepts_notifications: true,
    language_preference: 'fr',
    country: 'France',
  });

  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation champs obligatoires
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
      // Type assertion sécurisé: validation des champs obligatoires effectuée ligne 84-91
      const { data, error } = await supabase
        .from('individual_customers')
        .insert([formData as CreateIndividualCustomerData])
        .select()
        .single();

      if (error) throw error;

      const customerName = `${formData.first_name} ${formData.last_name}`;

      toast({
        title: '✅ Client particulier créé',
        description: `${customerName} a été créé avec succès.`,
      });

      // Callback avec l'ID et le nom
      if (onCustomerCreated && data) {
        onCustomerCreated(data.id, customerName);
      }

      // Reset form et fermer modal
      setFormData({
        is_active: true,
        has_different_billing_address: false,
        accepts_marketing: false,
        accepts_notifications: true,
        language_preference: 'fr',
        country: 'France',
      });
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

  const handleInputChange = (
    field: keyof CreateIndividualCustomerData,
    value: any
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="border-black">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client particulier
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Créer un nouveau client particulier
          </DialogTitle>
          <DialogDescription>
            Remplissez les champs obligatoires (*) et les informations
            complémentaires si disponibles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="addresses">Adresses</TabsTrigger>
              <TabsTrigger value="preferences">Préférences</TabsTrigger>
            </TabsList>

            {/* TAB 1: Informations générales */}
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
                        value={formData.first_name || ''}
                        onChange={e =>
                          handleInputChange('first_name', e.target.value)
                        }
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
                        value={formData.last_name || ''}
                        onChange={e =>
                          handleInputChange('last_name', e.target.value)
                        }
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
                      value={formData.email || ''}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="jean.dupont@email.com"
                      className="border-black"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                      className="border-black"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={checked =>
                        handleInputChange('is_active', checked)
                      }
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Client actif
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Adresses */}
            <TabsContent value="addresses" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-sm">
                    Adresse de livraison
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_line1">Adresse ligne 1</Label>
                      <Input
                        id="address_line1"
                        value={formData.address_line1 || ''}
                        onChange={e =>
                          handleInputChange('address_line1', e.target.value)
                        }
                        placeholder="12 rue de la Paix"
                        className="border-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line2">Adresse ligne 2</Label>
                      <Input
                        id="address_line2"
                        value={formData.address_line2 || ''}
                        onChange={e =>
                          handleInputChange('address_line2', e.target.value)
                        }
                        placeholder="Appartement 3B"
                        className="border-black"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Code postal</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code || ''}
                          onChange={e =>
                            handleInputChange('postal_code', e.target.value)
                          }
                          placeholder="75001"
                          className="border-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={formData.city || ''}
                          onChange={e =>
                            handleInputChange('city', e.target.value)
                          }
                          placeholder="Paris"
                          className="border-black"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="region">Région</Label>
                        <Input
                          id="region"
                          value={formData.region || ''}
                          onChange={e =>
                            handleInputChange('region', e.target.value)
                          }
                          placeholder="Île-de-France"
                          className="border-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Pays</Label>
                        <Input
                          id="country"
                          value={formData.country || ''}
                          onChange={e =>
                            handleInputChange('country', e.target.value)
                          }
                          placeholder="France"
                          className="border-black"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox
                      id="has_different_billing_address"
                      checked={formData.has_different_billing_address}
                      onCheckedChange={checked =>
                        handleInputChange(
                          'has_different_billing_address',
                          checked
                        )
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

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="billing_address_line1">
                            Adresse ligne 1
                          </Label>
                          <Input
                            id="billing_address_line1"
                            value={formData.billing_address_line1 || ''}
                            onChange={e =>
                              handleInputChange(
                                'billing_address_line1',
                                e.target.value
                              )
                            }
                            placeholder="15 avenue des Champs"
                            className="border-black"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="billing_address_line2">
                            Adresse ligne 2
                          </Label>
                          <Input
                            id="billing_address_line2"
                            value={formData.billing_address_line2 || ''}
                            onChange={e =>
                              handleInputChange(
                                'billing_address_line2',
                                e.target.value
                              )
                            }
                            placeholder="Étage 2"
                            className="border-black"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="billing_postal_code">
                              Code postal
                            </Label>
                            <Input
                              id="billing_postal_code"
                              value={formData.billing_postal_code || ''}
                              onChange={e =>
                                handleInputChange(
                                  'billing_postal_code',
                                  e.target.value
                                )
                              }
                              placeholder="75008"
                              className="border-black"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="billing_city">Ville</Label>
                            <Input
                              id="billing_city"
                              value={formData.billing_city || ''}
                              onChange={e =>
                                handleInputChange(
                                  'billing_city',
                                  e.target.value
                                )
                              }
                              placeholder="Paris"
                              className="border-black"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="billing_region">Région</Label>
                            <Input
                              id="billing_region"
                              value={formData.billing_region || ''}
                              onChange={e =>
                                handleInputChange(
                                  'billing_region',
                                  e.target.value
                                )
                              }
                              placeholder="Île-de-France"
                              className="border-black"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="billing_country">Pays</Label>
                            <Input
                              id="billing_country"
                              value={formData.billing_country || ''}
                              onChange={e =>
                                handleInputChange(
                                  'billing_country',
                                  e.target.value
                                )
                              }
                              placeholder="France"
                              className="border-black"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Préférences */}
            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accepts_marketing"
                      checked={formData.accepts_marketing}
                      onCheckedChange={checked =>
                        handleInputChange('accepts_marketing', checked)
                      }
                    />
                    <Label
                      htmlFor="accepts_marketing"
                      className="cursor-pointer"
                    >
                      Accepte les emails marketing
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accepts_notifications"
                      checked={formData.accepts_notifications}
                      onCheckedChange={checked =>
                        handleInputChange('accepts_notifications', checked)
                      }
                    />
                    <Label
                      htmlFor="accepts_notifications"
                      className="cursor-pointer"
                    >
                      Accepte les notifications
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes internes</Label>
                    <Input
                      id="notes"
                      value={formData.notes || ''}
                      onChange={e => handleInputChange('notes', e.target.value)}
                      placeholder="Informations complémentaires..."
                      className="border-black"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Boutons d'action */}
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
    </Dialog>
  );
}
