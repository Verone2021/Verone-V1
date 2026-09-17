'use client';

import { useState } from 'react';

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { convertToEur } from '@verone/utils/currency';
import { parseDecimalInput } from '@verone/utils/validation';
import { Euro, Link } from 'lucide-react';

import type { ProductFormData } from '../types';

interface ProductFieldsSectionProps {
  formData: ProductFormData;
  errors: Record<string, string>;
  onFieldChange: (updates: Partial<ProductFormData>) => void;
  onClearError: (key: string) => void;
}

export function ProductFieldsSection({
  formData,
  errors,
  onFieldChange,
  onClearError,
}: ProductFieldsSectionProps) {
  // Le prix est saisi en texte libre pour accepter la virgule française.
  // Avec `type="number"`, Chrome considère « 12,50 » comme invalide : `value`
  // vaut alors la chaîne vide, le prix est perdu et l'envoi est bloqué sans
  // message. On garde ici la frappe telle quelle, et on remonte au parent le
  // nombre correspondant. Formulaire de création uniquement : pas de valeur
  // initiale à resynchroniser.
  const [costPriceText, setCostPriceText] = useState<string>(
    formData.cost_price ? String(formData.cost_price) : ''
  );
  const [exchangeRateText, setExchangeRateText] = useState<string>(
    String(formData.cost_price_exchange_rate)
  );

  return (
    <>
      {/* Nom produit */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Nom du produit *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => {
            onFieldChange({ name: e.target.value });
            if (errors.name) onClearError('name');
          }}
          placeholder="Ex: Fauteuil design scandinave..."
          className={cn(
            'transition-colors',
            errors.name && 'border-red-300 focus:border-red-500'
          )}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* URL fournisseur */}
      <div className="space-y-2">
        <Label htmlFor="supplier_url" className="text-sm font-medium">
          URL de la page fournisseur (facultatif)
        </Label>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="supplier_url"
            // Volontairement `text` et non `url` : le champ est facultatif, et
            // `type="url"` fait refuser « fournisseur.fr/p » par le navigateur,
            // qui bloque alors l'envoi sans afficher quoi que ce soit dans la
            // page. Le format est verifie en JavaScript, qui complete le
            // « https:// » manquant.
            type="text"
            inputMode="url"
            value={formData.supplier_page_url}
            onChange={e => {
              onFieldChange({ supplier_page_url: e.target.value });
              if (errors.supplier_page_url) onClearError('supplier_page_url');
            }}
            placeholder="https://fournisseur.com/produit/123"
            className={cn(
              'pl-10 transition-colors',
              errors.supplier_page_url && 'border-red-300 focus:border-red-500'
            )}
          />
        </div>
        {errors.supplier_page_url && (
          <p className="text-sm text-red-600">{errors.supplier_page_url}</p>
        )}
        <p className="text-xs text-gray-500">
          Lien vers la fiche produit chez le fournisseur
        </p>
      </div>

      {/* Prix d'achat */}
      <div className="space-y-2">
        <Label htmlFor="cost_price" className="text-sm font-medium">
          Prix d&apos;achat fournisseur HT *
        </Label>
        {/* Champ + sélecteur monnaie sur la même ligne */}
        <div className="flex gap-2 items-stretch">
          <div className="relative flex-1">
            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="cost_price"
              type="text"
              inputMode="decimal"
              value={costPriceText}
              onChange={e => {
                const raw = e.target.value;
                setCostPriceText(raw);
                onFieldChange({ cost_price: parseDecimalInput(raw) ?? 0 });
                if (errors.cost_price) onClearError('cost_price');
              }}
              placeholder="250,00"
              className={cn(
                'pl-10 transition-colors',
                errors.cost_price && 'border-red-300 focus:border-red-500'
              )}
            />
          </div>
          <Select
            value={formData.cost_price_currency}
            onValueChange={value => {
              onFieldChange({ cost_price_currency: value });
            }}
          >
            <SelectTrigger className="w-[88px] shrink-0 h-10 md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">€ EUR</SelectItem>
              <SelectItem value="USD">$ USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Équivalent en euros affiché quand la monnaie est USD */}
        {formData.cost_price_currency === 'USD' && formData.cost_price > 0 && (
          <p className="text-xs text-zinc-500">
            ≈{' '}
            {convertToEur(
              formData.cost_price,
              'USD',
              formData.cost_price_exchange_rate
            ).toFixed(2)}{' '}
            € au taux de {formData.cost_price_exchange_rate}
          </p>
        )}
        {/* Taux modifiable à la main quand la monnaie est USD */}
        {formData.cost_price_currency === 'USD' && (
          <div className="flex items-center gap-2">
            <Label
              htmlFor="cost_price_exchange_rate"
              className="text-xs text-zinc-500 whitespace-nowrap"
            >
              1 USD =
            </Label>
            <Input
              id="cost_price_exchange_rate"
              // Meme raison que le prix d'achat : la virgule doit passer.
              type="text"
              inputMode="decimal"
              value={exchangeRateText}
              onChange={e => {
                const raw = e.target.value;
                setExchangeRateText(raw);
                const rate = parseDecimalInput(raw);
                if (rate !== null && rate > 0) {
                  onFieldChange({ cost_price_exchange_rate: rate });
                }
              }}
              className="h-7 w-24 text-xs"
            />
            <span className="text-xs text-zinc-500">EUR</span>
          </div>
        )}
        {errors.cost_price && (
          <p className="text-sm text-red-600">{errors.cost_price}</p>
        )}
        <p className="text-xs text-gray-500">
          Prix d&apos;achat HT chez le fournisseur — les prix de vente restent
          toujours en euros
        </p>
      </div>

      {/* Référence fournisseur */}
      <div className="space-y-2">
        <Label htmlFor="supplier_reference" className="text-sm font-medium">
          Réf. fournisseur (facultatif)
        </Label>
        <Input
          id="supplier_reference"
          value={formData.supplier_reference}
          onChange={e => {
            onFieldChange({ supplier_reference: e.target.value });
          }}
          placeholder="Ex: ART-12345, SKU-FOURN-001..."
          className="transition-colors"
        />
        <p className="text-xs text-gray-500">
          Référence du produit chez le fournisseur
        </p>
      </div>

      {/* Fabricant */}
      <div className="space-y-2">
        <Label htmlFor="manufacturer" className="text-sm font-medium">
          Fabricant (facultatif)
        </Label>
        <Input
          id="manufacturer"
          value={formData.manufacturer}
          onChange={e => {
            onFieldChange({ manufacturer: e.target.value });
          }}
          placeholder="Ex: HAY, Fermob, Kartell..."
          className="transition-colors"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description (facultatif)
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => {
            onFieldChange({ description: e.target.value });
          }}
          placeholder="Description courte du produit..."
          rows={3}
          className="transition-colors resize-none"
        />
      </div>

      {/* MOQ */}
      <div className="space-y-2">
        <Label htmlFor="supplier_moq" className="text-sm font-medium">
          Quantité min. de commande (MOQ) (facultatif)
        </Label>
        <Input
          id="supplier_moq"
          type="number"
          // Champ facultatif : 0 = non renseigné. min="1" bloquait la validation
          // du formulaire alors que la valeur par défaut est 0 (Roméo 17/09).
          min="0"
          value={formData.supplier_moq ? String(formData.supplier_moq) : ''}
          onChange={e => {
            const value = parseInt(e.target.value) || 0;
            onFieldChange({ supplier_moq: value });
          }}
          placeholder="Ex: 10"
          className="transition-colors"
        />
      </div>

      {/* Canal de sourcing */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Canal de sourcing (facultatif)
        </Label>
        <Select
          value={formData.sourcing_channel || 'none'}
          onValueChange={value => {
            onFieldChange({
              sourcing_channel: value === 'none' ? '' : value,
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner le canal..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-gray-500">Non spécifié</span>
            </SelectItem>
            <SelectItem value="online">En ligne</SelectItem>
            <SelectItem value="trade_show">Salon professionnel</SelectItem>
            <SelectItem value="referral">Recommandation</SelectItem>
            <SelectItem value="visit">Visite fournisseur</SelectItem>
            <SelectItem value="other">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
