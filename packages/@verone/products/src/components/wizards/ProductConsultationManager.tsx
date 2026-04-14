/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
// @ts-nocheck - Hooks consultations non migrés

'use client';

import { useState, useEffect } from 'react';

import { useToast } from '@verone/common/hooks';
import { useConsultations, useConsultationItems } from '@verone/consultations';
import { Alert, AlertDescription } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Search, Link, ArrowRight, Plus } from 'lucide-react';

import { ConsultationOverviewStats } from './consultation-manager/ConsultationOverviewStats';
import { ProductConsultationView } from './consultation-manager/ProductConsultationView';
import { ConsultationProductsView } from './consultation-manager/ConsultationProductsView';

interface ProductConsultationManagerProps {
  productId?: string;
  consultationId?: string;
  mode?: 'product-centric' | 'consultation-centric' | 'overview';
  onLinkCreated?: () => void;
}

export function ProductConsultationManager({
  productId,
  consultationId,
  mode = 'overview',
  onLinkCreated,
}: ProductConsultationManagerProps) {
  const { toast } = useToast();
  const { consultations, fetchConsultations } = useConsultations();
  const {
    consultationProducts,
    eligibleProducts,
    fetchEligibleProducts,
    assignProduct,
    removeProduct,
  } = useConsultationItems(consultationId);

  const [selectedConsultation, setSelectedConsultation] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [proposedPrice, setProposedPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isPrimaryProposal, setIsPrimaryProposal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  useEffect(() => {
    fetchConsultations();
    fetchEligibleProducts();
  }, []);

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch =
      consultation.organisation_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      consultation.descriptif.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || consultation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = eligibleProducts.filter(
    product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLink = async () => {
    if (!selectedConsultation || !selectedProduct) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez sélectionner une consultation et un produit',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const success = await assignProduct({
        consultation_id: selectedConsultation,
        product_id: selectedProduct,
        quantity: 1,
        unit_price: proposedPrice ? parseFloat(proposedPrice) : undefined,
        is_free: false,
        notes: notes ?? undefined,
      });
      if (success) {
        setSelectedProduct('');
        setProposedPrice('');
        setNotes('');
        setIsPrimaryProposal(false);
        onLinkCreated?.();
        toast({
          title: 'Association créée',
          description: 'Le produit a été ajouté à la consultation',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLink = async (consultationProductId: string) => {
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir retirer ce produit de la consultation ?'
      )
    ) {
      await removeProduct(consultationProductId);
    }
  };

  if (mode === 'product-centric' && productId) {
    return (
      <ProductConsultationView
        productId={productId}
        consultations={filteredConsultations}
        onCreateLink={handleCreateLink}
      />
    );
  }

  if (mode === 'consultation-centric' && consultationId) {
    return (
      <ConsultationProductsView
        consultationId={consultationId}
        consultationProducts={consultationProducts}
        eligibleProducts={filteredProducts}
        onCreateLink={handleCreateLink}
        onRemoveLink={handleRemoveLink}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ConsultationOverviewStats
        consultations={consultations}
        eligibleProducts={eligibleProducts}
        consultationProducts={consultationProducts}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Créer une association produit-consultation
          </CardTitle>
          <CardDescription>
            Associer un produit sourcing à une consultation client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Consultation</Label>
              <Select
                value={selectedConsultation}
                onValueChange={setSelectedConsultation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une consultation..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredConsultations.map(consultation => (
                    <SelectItem key={consultation.id} value={consultation.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {consultation.organisation_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {consultation.descriptif.substring(0, 50)}...
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Produit sourcing</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-gray-500">
                          {product.sku} • {product.supplier_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prix proposé (€ HT)</Label>
              <Input
                type="number"
                step="0.01"
                value={proposedPrice}
                onChange={e => setProposedPrice(e.target.value)}
                placeholder="Prix personnalisé..."
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes commerciales..."
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isPrimaryProposal}
                  onChange={e => setIsPrimaryProposal(e.target.checked)}
                />
                <span>Proposition principale</span>
              </Label>
            </div>
          </div>

          <ButtonV2
            onClick={handleCreateLink}
            disabled={loading || !selectedConsultation || !selectedProduct}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Création en cours...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Créer l'association
              </>
            )}
          </ButtonV2>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Organisation, description..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut consultation</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="terminee">Terminée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <ButtonV2
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setClientFilter('all');
                }}
                className="w-full"
              >
                Réinitialiser
              </ButtonV2>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <ArrowRight className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">
              Workflow associations produits-consultations :
            </div>
            <div className="text-sm space-y-1">
              <p>
                • <strong>Seuls les produits sourcing</strong> peuvent être
                associés aux consultations
              </p>
              <p>
                • <strong>Une proposition principale</strong> par consultation
                maximum
              </p>
              <p>
                • <strong>Prix personnalisés</strong> pour chaque association
              </p>
              <p>
                • <strong>Traçabilité complète</strong> des propositions
                commerciales
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
