'use client';

import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';

export type ShippingMethod = 'packlink' | 'chrono_track' | 'manual';

export interface ParcelData {
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  items: {
    orderItemId: string;
    quantity: number;
  }[];
}

export interface CreateShipmentRequest {
  salesOrderId: string;
  shippingMethod: ShippingMethod;
  parcels: ParcelData[];
  costPaid: number;
  costCharged: number;
  carrierName?: string;
  tracking?: string;
  notes?: string;
  metadata?: any;
}

export interface Shipment {
  id: string;
  sales_order_id: string;
  shipping_method: ShippingMethod;
  carrier_name?: string;
  service_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  cost_paid_eur: number;
  cost_charged_eur: number;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  packlink_label_url?: string;
  notes?: string;
}

export function useShipments() {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const supabase = createClient();
  const { toast } = useToast();

  /**
   * Créer expédition Packlink (automatique via API)
   */
  const createPacklinkShipment = useCallback(
    async (request: CreateShipmentRequest) => {
      setLoading(true);
      try {
        // 1. Appeler API route Packlink pour créer shipment + label
        const response = await fetch('/api/packlink/create-shipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            salesOrderId: request.salesOrderId,
            parcels: request.parcels,
            costCharged: request.costCharged,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erreur API Packlink');
        }

        // 2. Créer record shipment dans Supabase
        const { data: shipment, error: shipmentError } = await supabase
          .from('shipments' as any)
          .insert({
            sales_order_id: request.salesOrderId,
            shipping_method: 'packlink',
            carrier_name: result.carrier_name,
            service_name: result.service_name,
            tracking_number: result.tracking_number,
            tracking_url: result.tracking_url,
            cost_paid_eur: result.cost_paid,
            cost_charged_eur: request.costCharged,
            packlink_shipment_id: result.packlink_id,
            packlink_label_url: result.label_url,
            packlink_response: result.raw_response,
            notes: request.notes || null,
            metadata: request.metadata || {},
          })
          .select()
          .single();

        if (shipmentError) throw shipmentError;

        // 3. Créer parcels
        const parcelsData = request.parcels.map((p, idx) => ({
          shipment_id: (shipment as any).id,
          parcel_number: idx + 1,
          weight_kg: p.weight_kg,
          length_cm: p.length_cm,
          width_cm: p.width_cm,
          height_cm: p.height_cm,
        }));

        const { data: createdParcels, error: parcelsError } = await supabase
          .from('shipping_parcels' as any)
          .insert(parcelsData)
          .select();

        if (parcelsError) throw parcelsError;

        // 4. Créer parcel_items
        const parcelItems: any[] = [];
        request.parcels.forEach((parcel, idx) => {
          const parcelId = (createdParcels as any)[idx].id;
          parcel.items.forEach(item => {
            parcelItems.push({
              parcel_id: parcelId,
              sales_order_item_id: item.orderItemId,
              quantity_shipped: item.quantity,
            });
          });
        });

        if (parcelItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('parcel_items' as any)
            .insert(parcelItems);

          if (itemsError) throw itemsError;
        }

        // 5. Process stock via RPC
        const { data: stockResult, error: stockError } = await supabase.rpc(
          'process_shipment_stock' as any,
          {
            p_shipment_id: (shipment as any).id,
            p_sales_order_id: request.salesOrderId,
          }
        );

        if (stockError) throw stockError;

        toast({
          title: 'Expédition Packlink créée',
          description: `Étiquette générée avec succès. Tracking: ${result.tracking_number}`,
          variant: 'default',
        });

        return { success: true, shipment, labelUrl: result.label_url };
      } catch (error) {
        console.error('Erreur création shipment Packlink:', error);
        toast({
          title: 'Erreur Packlink',
          description:
            error instanceof Error
              ? error.message
              : 'Erreur lors de la création',
          variant: 'destructive',
        });
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  /**
   * Créer expédition Chrono Track (formulaire externe)
   */
  const createChronoTrackShipment = useCallback(
    async (request: CreateShipmentRequest) => {
      setLoading(true);
      try {
        // 1. Créer shipment dans Supabase
        const { data: shipment, error: shipmentError } = await supabase
          .from('shipments' as any)
          .insert({
            sales_order_id: request.salesOrderId,
            shipping_method: 'chrono_track',
            carrier_name: 'Chrono Track',
            tracking_number: request.tracking,
            cost_paid_eur: request.costPaid,
            cost_charged_eur: request.costCharged,
            chrono_track_reference: request.tracking,
          })
          .select()
          .single();

        if (shipmentError) throw shipmentError;

        // 2. Créer parcels
        const parcelsData = request.parcels.map((p, idx) => ({
          shipment_id: (shipment as any).id,
          parcel_number: idx + 1,
          weight_kg: p.weight_kg,
          length_cm: p.length_cm,
          width_cm: p.width_cm,
          height_cm: p.height_cm,
        }));

        const { data: createdParcels, error: parcelsError } = await supabase
          .from('shipping_parcels' as any)
          .insert(parcelsData)
          .select();

        if (parcelsError) throw parcelsError;

        // 3. Créer parcel_items
        const parcelItems: any[] = [];
        request.parcels.forEach((parcel, idx) => {
          const parcelId = (createdParcels as any)[idx].id;
          parcel.items.forEach(item => {
            parcelItems.push({
              parcel_id: parcelId,
              sales_order_item_id: item.orderItemId,
              quantity_shipped: item.quantity,
            });
          });
        });

        if (parcelItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('parcel_items' as any)
            .insert(parcelItems);

          if (itemsError) throw itemsError;
        }

        // 4. Process stock via RPC
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: stockResult, error: stockError } = await supabase.rpc(
          'process_shipment_stock' as any,
          {
            p_shipment_id: (shipment as any).id,
            p_sales_order_id: request.salesOrderId,
            p_performed_by_user_id: user?.id,
          }
        );

        if (stockError) throw stockError;

        // Vérifier si la RPC a retourné une erreur dans le JSON
        if (stockResult && !stockResult.success) {
          throw new Error(
            stockResult.error || 'Erreur lors du traitement du stock'
          );
        }

        toast({
          title: 'Expédition Chrono Track enregistrée',
          description: `Tracking: ${request.tracking}`,
          variant: 'default',
        });

        return { success: true, shipment };
      } catch (error) {
        console.error('Erreur création shipment Chrono Track:', error);
        toast({
          title: 'Erreur Chrono Track',
          description:
            error instanceof Error
              ? error.message
              : 'Erreur lors de la création',
          variant: 'destructive',
        });
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  /**
   * Créer expédition manuelle
   */
  const createManualShipment = useCallback(
    async (request: CreateShipmentRequest) => {
      setLoading(true);
      try {
        // 1. Créer shipment dans Supabase
        const { data: shipment, error: shipmentError } = await supabase
          .from('shipments' as any)
          .insert({
            sales_order_id: request.salesOrderId,
            shipping_method: 'manual',
            carrier_name: request.carrierName,
            tracking_number: request.tracking || null,
            cost_paid_eur: request.costPaid,
            cost_charged_eur: request.costCharged,
            notes: request.notes || null,
            metadata: request.metadata || {},
          })
          .select()
          .single();

        if (shipmentError) throw shipmentError;

        // 2. Créer parcels
        const parcelsData = request.parcels.map((p, idx) => ({
          shipment_id: (shipment as any).id,
          parcel_number: idx + 1,
          weight_kg: p.weight_kg,
          length_cm: p.length_cm,
          width_cm: p.width_cm,
          height_cm: p.height_cm,
        }));

        const { data: createdParcels, error: parcelsError } = await supabase
          .from('shipping_parcels' as any)
          .insert(parcelsData)
          .select();

        if (parcelsError) throw parcelsError;

        // 3. Créer parcel_items
        const parcelItems: any[] = [];
        request.parcels.forEach((parcel, idx) => {
          const parcelId = (createdParcels as any)[idx].id;
          parcel.items.forEach(item => {
            parcelItems.push({
              parcel_id: parcelId,
              sales_order_item_id: item.orderItemId,
              quantity_shipped: item.quantity,
            });
          });
        });

        if (parcelItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('parcel_items' as any)
            .insert(parcelItems);

          if (itemsError) throw itemsError;
        }

        // 4. Process stock via RPC
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: stockResult, error: stockError } = await supabase.rpc(
          'process_shipment_stock' as any,
          {
            p_shipment_id: (shipment as any).id,
            p_sales_order_id: request.salesOrderId,
            p_performed_by_user_id: user?.id,
          }
        );

        if (stockError) throw stockError;

        // Vérifier si la RPC a retourné une erreur dans le JSON
        if (stockResult && !stockResult.success) {
          throw new Error(
            stockResult.error || 'Erreur lors du traitement du stock'
          );
        }

        toast({
          title: 'Expédition manuelle créée',
          description: `Transporteur: ${request.carrierName}`,
          variant: 'default',
        });

        return { success: true, shipment };
      } catch (error) {
        console.error('Erreur création shipment manuel:', error);
        toast({
          title: 'Erreur expédition',
          description:
            error instanceof Error
              ? error.message
              : 'Erreur lors de la création',
          variant: 'destructive',
        });
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  /**
   * Fetch shipments for a sales order
   */
  const fetchShipmentsForOrder = useCallback(
    async (salesOrderId: string) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select('*')
          .eq('sales_order_id', salesOrderId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setShipments((data || []) as any);
        return data || [];
      } catch (error) {
        console.error('Erreur récupération shipments:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les expéditions',
          variant: 'destructive',
        });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  return {
    loading,
    shipments,
    createPacklinkShipment,
    createChronoTrackShipment,
    createManualShipment,
    fetchShipmentsForOrder,
  };
}
