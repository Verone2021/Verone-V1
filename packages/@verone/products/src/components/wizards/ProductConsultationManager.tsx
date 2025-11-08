// @ts-nocheck - Hooks consultations non migrés

'use client';

import { useState, useEffect } from 'react';

import { useToast } from '@verone/common/hooks';
import { useConsultations, useConsultationItems } from '@verone/consultations';
import { Alert, AlertDescription } from '@verone/ui';
import { Badge } from '@verone/ui';
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
import { cn } from '@verone/utils';
import {
  Search,
  Link,
  Unlink,
  Users,
  Package,
  ArrowRight,
  Plus,
  Eye,
  CheckCircle,
} from 'lucide-react';

interface ProductConsultationManagerProps {
  productId?: string; // Si fourni, focus sur ce produit
  consultationId?: string; // Si fourni, focus sur cette consultation
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

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  useEffect(() => {
    fetchConsultations();
    fetchEligibleProducts();
  }, []);

  // Filtrer les consultations
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

  // Filtrer les produits éligibles
  const filteredProducts = eligibleProducts.filter(product => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Créer une association
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
        quantity: 1, // Default quantity
        unit_price: proposedPrice ? parseFloat(proposedPrice) : undefined,
        is_free: false,
        notes: notes || undefined,
        // is_primary_proposal: isPrimaryProposal, // DEPRECATED - plus utilisé dans nouveau workflow
      });

      if (success) {
        // Reset form
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

  // Supprimer une association
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
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Consultations actives</p>
                <p className="text-2xl font-bold">
                  {consultations.filter(c => c.status === 'en_cours').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Produits sourcing</p>
                <p className="text-2xl font-bold">{eligibleProducts.length}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Associations actives</p>
                <p className="text-2xl font-bold">
                  {consultationProducts.length}
                </p>
              </div>
              <Link className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de conversion</p>
                <p className="text-2xl font-bold">
                  {consultations.length > 0
                    ? Math.round(
                        (consultations.filter(c => c.status === 'terminee')
                          .length /
                          consultations.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-black" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface de création d'associations */}
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
            {/* Sélection consultation */}
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

            {/* Sélection produit */}
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

          {/* Options avancées */}
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

      {/* Filtres et recherche */}
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
                  {/* TODO: Ajouter liste des clients */}
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

      {/* Informations workflow */}
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

// Composant pour vue centrée sur un produit
function ProductConsultationView({
  productId,
  consultations,
  onCreateLink,
}: {
  productId: string;
  consultations: any[];
  onCreateLink: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultations pour ce produit</CardTitle>
        <CardDescription>
          Gérer les associations entre ce produit et les consultations clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Interface simplifiée pour un produit spécifique */}
        <div className="text-center text-gray-500">
          Interface produit-centrique à implémenter
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour vue centrée sur une consultation
function ConsultationProductsView({
  consultationId,
  consultationProducts,
  eligibleProducts,
  onCreateLink,
  onRemoveLink,
}: {
  consultationId: string;
  consultationProducts: any[];
  eligibleProducts: any[];
  onCreateLink: () => void;
  onRemoveLink: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Produits associés à cette consultation</CardTitle>
          <CardDescription>
            Gérer les produits proposés pour cette consultation client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consultationProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Aucun produit associé à cette consultation
            </div>
          ) : (
            <div className="space-y-4">
              {consultationProducts.map(cp => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{cp.product?.name}</h4>
                    <p className="text-sm text-gray-500">{cp.product?.sku}</p>
                    {cp.proposed_price && (
                      <p className="text-sm font-medium text-green-600">
                        {cp.proposed_price}€ HT
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {cp.is_primary_proposal && <Badge>Principale</Badge>}
                    <ButtonV2
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveLink(cp.id)}
                    >
                      <Unlink className="h-4 w-4" />
                    </ButtonV2>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
