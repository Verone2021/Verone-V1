'use client';

/**
 * AddAllocationDialog component for Stockage page
 *
 * @module stockage-dialogs
 * @since 2025-12-20
 */

import {
  Badge,
  Button,
  Calendar,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from '@verone/ui';
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
} from 'lucide-react';

import { useLinkMeOwners, type LinkMeOwner } from './hooks/use-linkme-owners';
import {
  formatVolumePreview,
  useProductsForStorage,
  type ProductForStorage,
} from './hooks/use-products-for-storage';
import { useAddAllocationForm } from './use-add-allocation-form';
import { handleAllocationSubmit } from './use-add-allocation-submit';

function OwnerCommandList({
  selectedOwner,
  owners,
  ownersLoading,
  ownerSearch,
  setOwnerSearch,
  onSelect,
}: {
  selectedOwner: LinkMeOwner | null;
  owners: LinkMeOwner[] | undefined;
  ownersLoading: boolean;
  ownerSearch: string;
  setOwnerSearch: (s: string) => void;
  onSelect: (o: LinkMeOwner) => void;
}) {
  return (
    <Command>
      <CommandInput
        placeholder="Rechercher..."
        value={ownerSearch}
        onValueChange={setOwnerSearch}
      />
      <CommandList>
        <CommandEmpty>
          {ownersLoading ? 'Chargement...' : 'Aucun client trouve'}
        </CommandEmpty>
        <CommandGroup>
          {(owners ?? []).map(owner => (
            <CommandItem
              key={`${owner.type}-${owner.id}`}
              value={`${owner.type}-${owner.id}`}
              onSelect={() => onSelect(owner)}
            >
              <Check
                className={`mr-2 h-4 w-4 ${selectedOwner?.id === owner.id ? 'opacity-100' : 'opacity-0'}`}
              />
              <Badge
                variant={owner.type === 'enseigne' ? 'default' : 'secondary'}
                className="mr-2 text-xs"
              >
                {owner.type === 'enseigne' ? 'E' : 'O'}
              </Badge>
              {owner.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function OwnerCombobox({
  selectedOwner,
  ownerOpen,
  setOwnerOpen,
  ownerSearch,
  setOwnerSearch,
  owners,
  ownersLoading,
  onSelect,
}: {
  selectedOwner: LinkMeOwner | null;
  ownerOpen: boolean;
  setOwnerOpen: (v: boolean) => void;
  ownerSearch: string;
  setOwnerSearch: (s: string) => void;
  owners: LinkMeOwner[] | undefined;
  ownersLoading: boolean;
  onSelect: (o: LinkMeOwner) => void;
}) {
  return (
    <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={ownerOpen}
          className="w-full justify-between"
        >
          {selectedOwner ? (
            <span className="flex items-center gap-2">
              <Badge
                variant={
                  selectedOwner.type === 'enseigne' ? 'default' : 'secondary'
                }
                className="text-xs"
              >
                {selectedOwner.type === 'enseigne' ? 'E' : 'O'}
              </Badge>
              {selectedOwner.name}
            </span>
          ) : (
            'Selectionner un client...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <OwnerCommandList
          selectedOwner={selectedOwner}
          owners={owners}
          ownersLoading={ownersLoading}
          ownerSearch={ownerSearch}
          setOwnerSearch={setOwnerSearch}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

function ProductCommandList({
  selectedProduct,
  products,
  productsLoading,
  productSearch,
  setProductSearch,
  onSelect,
}: {
  selectedProduct: ProductForStorage | null;
  products: ProductForStorage[] | undefined;
  productsLoading: boolean;
  productSearch: string;
  setProductSearch: (s: string) => void;
  onSelect: (p: ProductForStorage) => void;
}) {
  return (
    <Command>
      <CommandInput
        placeholder="Rechercher par nom ou SKU..."
        value={productSearch}
        onValueChange={setProductSearch}
      />
      <CommandList>
        <CommandEmpty>
          {productsLoading
            ? 'Chargement...'
            : productSearch.length < 2
              ? 'Tapez au moins 2 caracteres'
              : 'Aucun produit trouve'}
        </CommandEmpty>
        <CommandGroup>
          {(products ?? []).map(product => (
            <CommandItem
              key={product.id}
              value={product.id}
              onSelect={() => onSelect(product)}
            >
              <Check
                className={`mr-2 h-4 w-4 ${selectedProduct?.id === product.id ? 'opacity-100' : 'opacity-0'}`}
              />
              <div className="flex flex-col">
                <span>{product.name}</span>
                <span className="text-xs text-gray-500">
                  {product.sku} - {formatVolumePreview(product.volume_m3)}/unite
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function ProductCombobox({
  selectedProduct,
  productOpen,
  setProductOpen,
  productSearch,
  setProductSearch,
  products,
  productsLoading,
  onSelect,
}: {
  selectedProduct: ProductForStorage | null;
  productOpen: boolean;
  setProductOpen: (v: boolean) => void;
  productSearch: string;
  setProductSearch: (s: string) => void;
  products: ProductForStorage[] | undefined;
  productsLoading: boolean;
  onSelect: (p: ProductForStorage) => void;
}) {
  return (
    <Popover open={productOpen} onOpenChange={setProductOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={productOpen}
          className="w-full justify-between"
        >
          {selectedProduct ? (
            <span className="truncate">
              {selectedProduct.name} ({selectedProduct.sku})
            </span>
          ) : (
            'Selectionner un produit...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <ProductCommandList
          selectedProduct={selectedProduct}
          products={products}
          productsLoading={productsLoading}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

function StartDateField({
  form,
}: {
  form: ReturnType<typeof useAddAllocationForm>;
}) {
  return (
    <div className="space-y-2">
      <Label>Date de debut stockage (optionnel)</Label>
      <Popover open={form.startDateOpen} onOpenChange={form.setStartDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {form.storageStartDate
              ? form.storageStartDate.toLocaleDateString('fr-FR')
              : 'Par defaut (date de creation)'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={form.storageStartDate}
            onSelect={(date: Date | undefined) => {
              form.setStorageStartDate(date);
              form.setStartDateOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {form.storageStartDate && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-500"
          onClick={() => form.setStorageStartDate(undefined)}
        >
          Effacer la date
        </Button>
      )}
    </div>
  );
}

function SelectorsSection({
  form,
  owners,
  ownersLoading,
  products,
  productsLoading,
}: {
  form: ReturnType<typeof useAddAllocationForm>;
  owners: LinkMeOwner[] | undefined;
  ownersLoading: boolean;
  products: ProductForStorage[] | undefined;
  productsLoading: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Client (Enseigne ou Organisation LinkMe)</Label>
        <OwnerCombobox
          selectedOwner={form.selectedOwner}
          ownerOpen={form.ownerOpen}
          setOwnerOpen={form.setOwnerOpen}
          ownerSearch={form.ownerSearch}
          setOwnerSearch={form.setOwnerSearch}
          owners={owners}
          ownersLoading={ownersLoading}
          onSelect={owner => {
            form.setSelectedOwner(owner);
            form.setOwnerOpen(false);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Produit</Label>
        <ProductCombobox
          selectedProduct={form.selectedProduct}
          productOpen={form.productOpen}
          setProductOpen={form.setProductOpen}
          productSearch={form.productSearch}
          setProductSearch={form.setProductSearch}
          products={products}
          productsLoading={productsLoading}
          onSelect={product => {
            form.setSelectedProduct(product);
            form.setQuantity(
              product.stock_quantity > 0 ? product.stock_quantity : 1
            );
            form.setProductOpen(false);
          }}
        />
      </div>
    </>
  );
}

function QuantityBillableSection({
  form,
}: {
  form: ReturnType<typeof useAddAllocationForm>;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Quantite</Label>
        <Input
          type="number"
          min={1}
          value={form.quantity}
          onChange={e =>
            form.setQuantity(Math.max(1, parseInt(e.target.value) || 1))
          }
        />
        {form.selectedProduct && form.selectedProduct.stock_quantity > 0 && (
          <p className="text-xs text-gray-500">
            Stock produit : {form.selectedProduct.stock_quantity} unites
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="billable-toggle">Facturable</Label>
        <Switch
          id="billable-toggle"
          checked={form.billable}
          onCheckedChange={form.setBillable}
        />
      </div>
    </>
  );
}

function AllocationDialogFooter({
  form,
  onClose,
  onSuccess,
}: {
  form: ReturnType<typeof useAddAllocationForm>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>
        Annuler
      </Button>
      <Button
        onClick={() => {
          void handleAllocationSubmit(form, onSuccess).catch(error => {
            console.error('[Stockage] handleSubmit failed:', error);
          });
        }}
        disabled={
          !form.selectedOwner ||
          !form.selectedProduct ||
          form.quantity <= 0 ||
          form.createAllocation.isPending
        }
      >
        {form.createAllocation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        Ajouter
      </Button>
    </DialogFooter>
  );
}

export function AddAllocationDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const form = useAddAllocationForm();
  const { data: owners, isLoading: ownersLoading } = useLinkMeOwners(
    form.ownerSearch
  );
  const { data: products, isLoading: productsLoading } = useProductsForStorage(
    form.productSearch
  );

  const handleClose = () => {
    form.resetForm();
    form.setOwnerSearch('');
    form.setProductSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Nouvelle allocation de stockage
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <SelectorsSection
            form={form}
            owners={owners}
            ownersLoading={ownersLoading}
            products={products}
            productsLoading={productsLoading}
          />
          <QuantityBillableSection form={form} />
          <StartDateField form={form} />
          {form.selectedProduct && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Volume prevu:</strong>{' '}
                {formatVolumePreview(form.previewVolume)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {form.quantity} x{' '}
                {formatVolumePreview(form.selectedProduct.volume_m3)}
              </p>
            </div>
          )}
        </div>
        <AllocationDialogFooter
          form={form}
          onClose={handleClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
