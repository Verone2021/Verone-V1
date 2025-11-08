'use client';

import { useState, useEffect } from 'react';

import { ButtonV2 } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreatePriceList,
  useUpdatePriceList,
  type PriceList,
  type PriceListType,
  type CreatePriceListData,
  type UpdatePriceListData,
} from '@/shared/modules/finance/hooks';

interface PriceListFormModalProps {
  open: boolean;
  onClose: () => void;
  priceList?: PriceList | null;
}

export function PriceListFormModal({
  open,
  onClose,
  priceList,
}: PriceListFormModalProps) {
  const isEditMode = !!priceList;

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [listType, setListType] = useState<PriceListType>('base');
  const [priority, setPriority] = useState(100);
  const [currency, setCurrency] = useState('EUR');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Mutations
  const { mutate: createPriceList, isPending: isCreating } =
    useCreatePriceList();
  const { mutate: updatePriceList, isPending: isUpdating } =
    useUpdatePriceList();

  const isLoading = isCreating || isUpdating;

  // Charger les données en mode édition
  useEffect(() => {
    if (priceList) {
      setCode(priceList.code);
      setName(priceList.name);
      setDescription(priceList.description || '');
      setListType(priceList.list_type);
      setPriority(priceList.priority);
      setCurrency(priceList.currency);
      setValidFrom(priceList.valid_from || '');
      setValidUntil(priceList.valid_until || '');
      setIsActive(priceList.is_active);
    } else {
      resetForm();
    }
  }, [priceList]);

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setListType('base');
    setPriority(100);
    setCurrency('EUR');
    setValidFrom('');
    setValidUntil('');
    setIsActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && priceList) {
      const data: UpdatePriceListData = {
        code,
        name,
        description: description || undefined,
        list_type: listType,
        priority,
        currency,
        valid_from: validFrom || undefined,
        valid_until: validUntil || undefined,
        is_active: isActive,
      };

      updatePriceList(
        { priceListId: priceList.id, data },
        {
          onSuccess: () => {
            onClose();
            resetForm();
          },
        }
      );
    } else {
      const data: CreatePriceListData = {
        code,
        name,
        description: description || undefined,
        list_type: listType,
        priority,
        currency,
        valid_from: validFrom || undefined,
        valid_until: validUntil || undefined,
        is_active: isActive,
      };

      createPriceList(data, {
        onSuccess: () => {
          onClose();
          resetForm();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? 'Modifier la liste de prix'
              : 'Nouvelle liste de prix'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifiez les informations de la liste de prix'
              : 'Créez une nouvelle liste de prix pour gérer vos tarifs'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Code <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="PL-2025-001"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="listType">
                  Type de liste <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={listType}
                  onValueChange={value => setListType(value as PriceListType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base Catalogue</SelectItem>
                    <SelectItem value="customer_group">
                      Groupe Client
                    </SelectItem>
                    <SelectItem value="channel">Canal de Vente</SelectItem>
                    <SelectItem value="promotional">Promotionnelle</SelectItem>
                    <SelectItem value="contract">Contrat Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Nom <span className="text-red-600">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Prix Wholesale 2025"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description optionnelle de la liste de prix"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>

          {/* Paramètres */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Paramètres</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priorité <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="1000"
                  value={priority}
                  onChange={e => setPriority(parseInt(e.target.value) || 100)}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Plus le nombre est petit, plus la priorité est élevée (ex: 50
                  = priorité haute)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">
                  Devise <span className="text-red-600">*</span>
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Date début validité</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Date fin validité</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Liste active</Label>
                <p className="text-sm text-gray-500">
                  Les listes inactives ne sont pas utilisées dans les calculs de
                  prix
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </ButtonV2>
            <ButtonV2 type="submit" disabled={isLoading}>
              {isLoading
                ? 'Enregistrement...'
                : isEditMode
                  ? 'Mettre à jour'
                  : 'Créer la liste'}
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
