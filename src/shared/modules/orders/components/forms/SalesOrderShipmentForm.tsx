'use client'

/**
 * 📦 Formulaire Expédition Sales Order
 * Workflow Odoo-inspired avec validation inline
 */

import { useState, useEffect, useMemo } from 'react'
import { Package, CheckCircle2, AlertTriangle, Calendar, Truck, MapPin, DollarSign } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSalesShipments, type SalesOrderForShipment } from '@/shared/modules/orders/hooks'
import type { ShipmentItem, ShipmentCarrierInfo, ShippingAddress } from '@/types/reception-shipment'
import { formatDate, formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface SalesOrderShipmentFormProps {
  salesOrder: SalesOrderForShipment
  onSuccess: () => void
  onCancel: () => void
}

export function SalesOrderShipmentForm({
  salesOrder,
  onSuccess,
  onCancel
}: SalesOrderShipmentFormProps) {
  const supabase = createClient()
  const { prepareShipmentItems, validateShipment, validating, loadShipmentHistory } = useSalesShipments()

  const [items, setItems] = useState<ShipmentItem[]>([])
  const [shippedAt, setShippedAt] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState<any[]>([])

  // Carrier info
  const [carrierType, setCarrierType] = useState<'packlink' | 'mondial_relay' | 'chronotruck' | 'other'>('packlink')
  const [carrierName, setCarrierName] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [costPaid, setCostPaid] = useState('')
  const [costCharged, setCostCharged] = useState('')

  // Shipping address
  const [recipientName, setRecipientName] = useState('')
  const [company, setCompany] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('France')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Initialiser items
  useEffect(() => {
    const shipmentItems = prepareShipmentItems(salesOrder)
    setItems(shipmentItems)
  }, [salesOrder, prepareShipmentItems])

  // Charger historique
  useEffect(() => {
    loadShipmentHistory(salesOrder.id).then(setHistory)
  }, [salesOrder.id, loadShipmentHistory])

  // Pré-remplir adresse si disponible
  useEffect(() => {
    if (salesOrder.shipping_address) {
      const addr = salesOrder.shipping_address
      setRecipientName(addr.recipient_name || '')
      setCompany(addr.company || '')
      setAddressLine1(addr.address_line1 || '')
      setAddressLine2(addr.address_line2 || '')
      setPostalCode(addr.postal_code || '')
      setCity(addr.city || '')
      setCountry(addr.country || 'France')
      setPhone(addr.phone || '')
      setEmail(addr.email || '')
    }
  }, [salesOrder.shipping_address])

  // Calculer totaux
  const totals = useMemo(() => {
    const totalQuantityToShip = items.reduce((sum, item) => sum + (item.quantity_to_ship || 0), 0)
    const totalValue = items.reduce((sum, item) => sum + (item.quantity_to_ship * item.unit_price_ht), 0)
    const allFullyShipped = items.every(item =>
      (item.quantity_already_shipped + item.quantity_to_ship) >= item.quantity_ordered
    )
    const hasStockIssues = items.some(item => item.quantity_to_ship > item.stock_available)

    return { totalQuantityToShip, totalValue, allFullyShipped, hasStockIssues }
  }, [items])

  // Update quantité item
  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0
    setItems(prev => prev.map(item => {
      if (item.sales_order_item_id === itemId) {
        const maxQuantity = Math.min(item.quantity_remaining, item.stock_available)
        return {
          ...item,
          quantity_to_ship: Math.max(0, Math.min(numValue, maxQuantity))
        }
      }
      return item
    }))
  }

  // Expédier tout (auto-fill quantités disponibles)
  const handleShipAll = () => {
    setItems(prev => prev.map(item => ({
      ...item,
      quantity_to_ship: Math.min(item.quantity_remaining, item.stock_available)
    })))
  }

  // Validation
  const handleValidate = async () => {
    // Obtenir l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      alert('Erreur: utilisateur non authentifié')
      return
    }

    const itemsToShip = items
      .filter(item => item.quantity_to_ship > 0)
      .map(item => ({
        sales_order_item_id: item.sales_order_item_id,
        product_id: item.product_id,
        quantity_to_ship: item.quantity_to_ship
      }))

    if (itemsToShip.length === 0) {
      alert('Veuillez saisir au moins une quantité à expédier')
      return
    }

    // Vérifier stock
    if (totals.hasStockIssues) {
      alert('Stock insuffisant pour certains produits. Ajustez les quantités.')
      return
    }

    // Phase 1: Adresse et transporteur OPTIONNELS (workflow simplifié)
    // Phase 2: Intégrations transporteurs (Packlink, Mondial Relay, etc.)

    const carrierInfo: ShipmentCarrierInfo = {
      carrier_type: carrierType,
      carrier_name: carrierType === 'other' ? carrierName : undefined,
      service_name: serviceName || undefined,
      tracking_number: trackingNumber || undefined,
      tracking_url: trackingUrl || undefined,
      cost_paid_eur: costPaid ? parseFloat(costPaid) : undefined,
      cost_charged_eur: costCharged ? parseFloat(costCharged) : undefined
    }

    // Adresse optionnelle - créer seulement si au moins un champ rempli
    const shippingAddress: ShippingAddress | undefined =
      (recipientName || addressLine1 || postalCode || city) ? {
        recipient_name: recipientName || '',
        company: company || undefined,
        address_line1: addressLine1 || '',
        address_line2: addressLine2 || undefined,
        postal_code: postalCode || '',
        city: city || '',
        country: country || 'France',
        phone: phone || undefined,
        email: email || undefined
      } : undefined

    const result = await validateShipment({
      sales_order_id: salesOrder.id,
      items: itemsToShip,
      shipped_at: shippedAt + 'T' + new Date().toTimeString().split(' ')[0],
      carrier_info: carrierInfo,
      shipping_address: shippingAddress as any,
      notes: notes || undefined,
      shipped_by: user.id
    })

    if (result.success) {
      onSuccess()
    } else {
      alert(`Erreur: ${result.error}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-verone-primary" />
            Expédition Commande
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Commande {(salesOrder as any).so_number || salesOrder.order_number} • {salesOrder.organisations?.trade_name || salesOrder.organisations?.legal_name}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonV2 variant="outline" onClick={handleShipAll}>
            Tout expédier
          </ButtonV2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">À expédier</div>
          <div className="text-2xl font-bold mt-1">{totals.totalQuantityToShip}</div>
          <div className="text-xs text-muted-foreground mt-1">unités</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Valeur</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totals.totalValue)}</div>
          <div className="text-xs text-muted-foreground mt-1">HT</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Statut</div>
          <Badge className="mt-1" variant={totals.allFullyShipped ? "secondary" : "secondary"}>
            {totals.allFullyShipped ? "Complète" : "Partielle"}
          </Badge>
          {totals.hasStockIssues && (
            <Badge variant="destructive" className="mt-1 ml-2">Stock insuffisant</Badge>
          )}
        </Card>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Articles</TabsTrigger>
          <TabsTrigger value="carrier">Transporteur</TabsTrigger>
          <TabsTrigger value="address">Adresse</TabsTrigger>
        </TabsList>

        {/* Onglet Articles */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-center">Commandée</TableHead>
                  <TableHead className="text-center">Déjà expédiée</TableHead>
                  <TableHead className="text-center">Restante</TableHead>
                  <TableHead className="text-center">Stock dispo</TableHead>
                  <TableHead className="text-center">À expédier</TableHead>
                  <TableHead className="text-right">Prix Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => {
                  const hasStockIssue = item.quantity_to_ship > item.stock_available
                  return (
                    <TableRow key={item.sales_order_item_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground">{item.product_sku}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity_ordered}</TableCell>
                      <TableCell className="text-center">
                        {item.quantity_already_shipped > 0 && (
                          <Badge variant="secondary">{item.quantity_already_shipped}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{item.quantity_remaining}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.stock_available >= item.quantity_remaining ? "secondary" : "destructive"}>
                          {item.stock_available}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max={Math.min(item.quantity_remaining, item.stock_available)}
                          value={item.quantity_to_ship}
                          onChange={(e) => handleQuantityChange(item.sales_order_item_id, e.target.value)}
                          className={`w-20 text-center ${hasStockIssue ? 'border-red-500' : ''}`}
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(item.unit_price_ht)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity_to_ship * item.unit_price_ht)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Onglet Transporteur */}
        <TabsContent value="carrier" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <Label>Type de transporteur</Label>
                <Select value={carrierType} onValueChange={(v: any) => setCarrierType(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="packlink">Packlink</SelectItem>
                    <SelectItem value="mondial_relay">Mondial Relay</SelectItem>
                    <SelectItem value="chronotruck">Chronotruck</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {carrierType === 'other' && (
                <div>
                  <Label>Nom du transporteur</Label>
                  <Input
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="Ex: Colissimo, UPS, DHL..."
                    className="mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service (optionnel)</Label>
                  <Input
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Ex: Express, Standard..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Numéro de tracking (optionnel)</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ex: 3SABCD123456789"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>URL de tracking (optionnel)</Label>
                <Input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Coût payé (€ HT)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={costPaid}
                    onChange={(e) => setCostPaid(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Coût facturé client (€ HT)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={costCharged}
                    onChange={(e) => setCostCharged(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Onglet Adresse */}
        <TabsContent value="address" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Destinataire *</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nom complet"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Entreprise</Label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Nom entreprise (optionnel)"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Adresse ligne 1 *</Label>
                <Input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Numéro et rue"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label>Adresse ligne 2</Label>
                <Input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Complément (optionnel)"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Code postal *</Label>
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Ville *</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Pays *</Label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="France"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@exemple.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date expédition</Label>
          <Input
            type="date"
            value={shippedAt}
            onChange={(e) => setShippedAt(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Notes expédition (optionnel)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      {/* Historique */}
      {history.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Historique expéditions ({history.length})
          </h4>
          <div className="space-y-2">
            {history.map((h, idx) => (
              <div key={idx} className="text-sm border-l-2 border-verone-primary pl-3 py-1">
                <div className="font-medium">
                  {formatDate(h.shipped_at)} • {h.carrier_name} • {h.total_quantity} unités
                </div>
                {h.tracking_number && (
                  <div className="text-xs text-muted-foreground">Tracking: {h.tracking_number}</div>
                )}
                <div className="text-muted-foreground text-xs">
                  {h.items.map((i: any) => `${i.product_sku}: ${i.quantity_shipped}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <ButtonV2 variant="outline" onClick={onCancel} disabled={validating}>
          Annuler
        </ButtonV2>
        <ButtonV2
          onClick={handleValidate}
          disabled={validating || totals.totalQuantityToShip === 0 || totals.hasStockIssues}
          className="bg-verone-primary hover:bg-verone-primary/90"
        >
          {validating ? 'Validation...' : (totals.allFullyShipped ? 'Valider Expédition Complète' : 'Valider Expédition Partielle')}
        </ButtonV2>
      </div>
    </div>
  )
}
