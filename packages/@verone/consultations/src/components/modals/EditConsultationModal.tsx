'use client';

import { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  X,
  Save,
  Calendar,
  Mail,
  Phone,
  Building,
  AlertCircle,
} from 'lucide-react';

import type { ClientConsultation } from '@verone/consultations/hooks';

interface EditConsultationModalProps {
  open: boolean;
  onClose: () => void;
  consultation: ClientConsultation;
  onUpdated: (updates: Partial<ClientConsultation>) => Promise<boolean>;
}

export function EditConsultationModal({
  open,
  onClose,
  consultation,
  onUpdated,
}: EditConsultationModalProps) {
  const [formData, setFormData] = useState({
    client_email: '',
    client_phone: '',
    descriptif: '',
    notes_internes: '',
    tarif_maximum: 0,
    estimated_response_date: '',
    priority_level: 2,
    source_channel: 'website' as 'website' | 'email' | 'phone' | 'other',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire avec les données de la consultation
  useEffect(() => {
    if (consultation) {
      setFormData({
        client_email: consultation.client_email || '',
        client_phone: consultation.client_phone || '',
        descriptif: consultation.descriptif || '',
        notes_internes: consultation.notes_internes || '',
        tarif_maximum: consultation.tarif_maximum || 0,
        estimated_response_date: consultation.estimated_response_date
          ? new Date(consultation.estimated_response_date)
              .toISOString()
              .split('T')[0]
          : '',
        priority_level: consultation.priority_level || 2,
        source_channel: consultation.source_channel || 'website',
      });
    }
  }, [consultation]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_email.trim()) {
      newErrors.client_email = "L'email client est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = "Format d'email invalide";
    }

    if (!formData.descriptif.trim()) {
      newErrors.descriptif = 'La description est obligatoire';
    }

    if (formData.tarif_maximum && formData.tarif_maximum < 0) {
      newErrors.tarif_maximum = 'Le budget ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updates: Partial<ClientConsultation> = {
        client_email: formData.client_email,
        client_phone: formData.client_phone || undefined,
        descriptif: formData.descriptif,
        notes_internes: formData.notes_internes || undefined,
        tarif_maximum:
          formData.tarif_maximum > 0 ? formData.tarif_maximum : undefined,
        estimated_response_date: formData.estimated_response_date || undefined,
        priority_level: formData.priority_level,
        source_channel: formData.source_channel,
      };

      const success = await onUpdated(updates);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur mise à jour consultation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xs font-bold flex items-center gap-1">
              <Building className="h-3 w-3" />
              Modifier la consultation
            </DialogTitle>
            <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
              <X className="h-3 w-3" />
            </ButtonV2>
          </div>
          <DialogDescription>
            Modifiez les informations de la consultation client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-1 mt-1">
          {/* Email Client */}
          <div className="space-y-1">
            <Label htmlFor="client-email" className="text-xs font-medium">
              Email client *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                id="client-email"
                type="email"
                value={formData.client_email}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    client_email: e.target.value,
                  }));
                  if (errors.client_email)
                    setErrors(prev => ({ ...prev, client_email: '' }));
                }}
                placeholder="client@example.com"
                className={cn(
                  'pl-10',
                  errors.client_email && 'border-red-300 focus:border-red-500'
                )}
              />
            </div>
            {errors.client_email && (
              <p className="text-xs text-red-600">{errors.client_email}</p>
            )}
          </div>

          {/* Téléphone Client */}
          <div className="space-y-1">
            <Label htmlFor="client-phone" className="text-xs font-medium">
              Téléphone client
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                id="client-phone"
                type="tel"
                value={formData.client_phone}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    client_phone: e.target.value,
                  }))
                }
                placeholder="+33 6 12 34 56 78"
                className="pl-10"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="descriptif" className="text-xs font-medium">
              Description de la consultation *
            </Label>
            <Textarea
              id="descriptif"
              value={formData.descriptif}
              onChange={e => {
                setFormData(prev => ({ ...prev, descriptif: e.target.value }));
                if (errors.descriptif)
                  setErrors(prev => ({ ...prev, descriptif: '' }));
              }}
              placeholder="Décrivez les besoins du client..."
              rows={4}
              className={cn(
                errors.descriptif && 'border-red-300 focus:border-red-500'
              )}
            />
            {errors.descriptif && (
              <p className="text-xs text-red-600">{errors.descriptif}</p>
            )}
          </div>

          {/* Notes internes */}
          <div className="space-y-1">
            <Label htmlFor="notes-internes" className="text-xs font-medium">
              Notes internes
            </Label>
            <Textarea
              id="notes-internes"
              value={formData.notes_internes}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  notes_internes: e.target.value,
                }))
              }
              placeholder="Notes privées visibles uniquement par l'équipe..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Ces notes ne sont pas visibles par le client
            </p>
          </div>

          {/* Grid pour Budget et Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {/* Budget Maximum */}
            <div className="space-y-1">
              <Label htmlFor="tarif-maximum" className="text-xs font-medium">
                Budget maximum (€)
              </Label>
              <Input
                id="tarif-maximum"
                type="number"
                step="0.01"
                min="0"
                value={formData.tarif_maximum || ''}
                onChange={e => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, tarif_maximum: value }));
                  if (errors.tarif_maximum)
                    setErrors(prev => ({ ...prev, tarif_maximum: '' }));
                }}
                placeholder="5000"
                className={cn(
                  errors.tarif_maximum && 'border-red-300 focus:border-red-500'
                )}
              />
              {errors.tarif_maximum && (
                <p className="text-xs text-red-600">{errors.tarif_maximum}</p>
              )}
            </div>

            {/* Date Réponse Estimée */}
            <div className="space-y-1">
              <Label htmlFor="estimated-date" className="text-xs font-medium">
                Date de réponse estimée
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  id="estimated-date"
                  type="date"
                  value={formData.estimated_response_date}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      estimated_response_date: e.target.value,
                    }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Grid pour Priorité et Canal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {/* Priorité */}
            <div className="space-y-1">
              <Label htmlFor="priority" className="text-xs font-medium">
                Niveau de priorité
              </Label>
              <Select
                value={formData.priority_level.toString()}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    priority_level: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Très urgent (5)</SelectItem>
                  <SelectItem value="4">Urgent (4)</SelectItem>
                  <SelectItem value="3">Normal+ (3)</SelectItem>
                  <SelectItem value="2">Normal (2)</SelectItem>
                  <SelectItem value="1">Faible (1)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Canal Source */}
            <div className="space-y-1">
              <Label htmlFor="source-channel" className="text-xs font-medium">
                Canal d'origine
              </Label>
              <Select
                value={formData.source_channel}
                onValueChange={(value: any) =>
                  setFormData(prev => ({ ...prev, source_channel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Site web</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Téléphone</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500">* Champs obligatoires</div>

            <div className="flex items-center space-x-3">
              <ButtonV2
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </ButtonV2>

              <ButtonV2
                type="submit"
                disabled={isSubmitting}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-2" />
                    Enregistrer
                  </>
                )}
              </ButtonV2>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
