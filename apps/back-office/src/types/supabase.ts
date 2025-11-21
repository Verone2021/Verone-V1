/**
 * Types TypeScript générés depuis Supabase
 * IMPORTANT: Ces types sont synchronisés avec les migrations de base de données
 *
 * Dernière mise à jour: 2025-11-21
 * Migrations appliquées:
 * - 20251120160000_cleanup_purchase_order_status_enum.sql
 * - 20251120161000_cleanup_sales_order_status_enum.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          supplier_id: string;
          organisation_id: string;
          status: Database['public']['Enums']['purchase_order_status'];
          total_ht: number;
          total_ttc: number;
          expected_delivery_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          po_number: string;
          supplier_id: string;
          organisation_id: string;
          status?: Database['public']['Enums']['purchase_order_status'];
          total_ht: number;
          total_ttc: number;
          expected_delivery_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          po_number?: string;
          supplier_id?: string;
          organisation_id?: string;
          status?: Database['public']['Enums']['purchase_order_status'];
          total_ht?: number;
          total_ttc?: number;
          expected_delivery_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          [key: string]: any;
        };
      };
      sales_orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          customer_type: 'organization' | 'individual';
          organisation_id: string;
          channel_id: string | null;
          status: Database['public']['Enums']['sales_order_status'];
          payment_status: Database['public']['Enums']['payment_status'];
          total_ht: number;
          total_ttc: number;
          created_at: string;
          updated_at: string;
          validated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          customer_type: 'organization' | 'individual';
          organisation_id: string;
          channel_id?: string | null;
          status?: Database['public']['Enums']['sales_order_status'];
          payment_status?: Database['public']['Enums']['payment_status'];
          total_ht: number;
          total_ttc: number;
          created_at?: string;
          updated_at?: string;
          validated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          customer_type?: 'organization' | 'individual';
          organisation_id?: string;
          channel_id?: string | null;
          status?: Database['public']['Enums']['sales_order_status'];
          payment_status?: Database['public']['Enums']['payment_status'];
          total_ht?: number;
          total_ttc?: number;
          created_at?: string;
          updated_at?: string;
          validated_at?: string | null;
          [key: string]: any;
        };
      };
      [key: string]: any;
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      /**
       * Statuts des commandes d'achat (purchase orders)
       *
       * Workflow: draft → validated → partially_received → received
       * Annulation: possible depuis draft, validated, partially_received
       *
       * Migration: 20251120160000_cleanup_purchase_order_status_enum.sql
       * - ❌ Supprimé: 'sent' (obsolète)
       * - ✅ Remplacé: 'confirmed' → 'validated'
       */
      purchase_order_status:
        | 'draft'
        | 'validated'
        | 'partially_received'
        | 'received'
        | 'cancelled';

      /**
       * Statuts des commandes de vente (sales orders)
       *
       * Workflow: draft → validated → partially_shipped → shipped → delivered → closed
       * Annulation: possible depuis draft, validated, partially_shipped, shipped
       *
       * Migration: 20251120161000_cleanup_sales_order_status_enum.sql
       * - ❌ Supprimé: 'sent' (obsolète)
       * - ✅ Remplacé: 'confirmed' → 'validated'
       */
      sales_order_status:
        | 'draft'
        | 'validated'
        | 'partially_shipped'
        | 'shipped'
        | 'delivered'
        | 'cancelled'
        | 'closed';

      /**
       * Statuts de paiement
       */
      payment_status: 'pending' | 'partial' | 'paid' | 'refunded' | 'overdue';

      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: any;
    };
  };
}
