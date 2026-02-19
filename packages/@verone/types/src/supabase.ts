export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      _migration_payment_status_backup: {
        Row: {
          id: string | null;
          payment_status: string | null;
          payment_status_v2: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string | null;
          payment_status?: string | null;
          payment_status_v2?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string | null;
          payment_status?: string | null;
          payment_status_v2?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          address_line1: string;
          address_line2: string | null;
          address_type: string;
          archived_at: string | null;
          city: string;
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          country: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          label: string | null;
          latitude: number | null;
          legal_name: string | null;
          longitude: number | null;
          owner_id: string;
          owner_type: string;
          postal_code: string;
          region: string | null;
          siret: string | null;
          source_app: string | null;
          trade_name: string | null;
          updated_at: string | null;
          vat_number: string | null;
        };
        Insert: {
          address_line1: string;
          address_line2?: string | null;
          address_type: string;
          archived_at?: string | null;
          city: string;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          label?: string | null;
          latitude?: number | null;
          legal_name?: string | null;
          longitude?: number | null;
          owner_id: string;
          owner_type: string;
          postal_code: string;
          region?: string | null;
          siret?: string | null;
          source_app?: string | null;
          trade_name?: string | null;
          updated_at?: string | null;
          vat_number?: string | null;
        };
        Update: {
          address_line1?: string;
          address_line2?: string | null;
          address_type?: string;
          archived_at?: string | null;
          city?: string;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          label?: string | null;
          latitude?: number | null;
          legal_name?: string | null;
          longitude?: number | null;
          owner_id?: string;
          owner_type?: string;
          postal_code?: string;
          region?: string | null;
          siret?: string | null;
          source_app?: string | null;
          trade_name?: string | null;
          updated_at?: string | null;
          vat_number?: string | null;
        };
        Relationships: [];
      };
      affiliate_archive_requests: {
        Row: {
          action: string;
          admin_note: string | null;
          affiliate_id: string;
          affiliate_note: string | null;
          created_at: string;
          id: string;
          organisation_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
        };
        Insert: {
          action: string;
          admin_note?: string | null;
          affiliate_id: string;
          affiliate_note?: string | null;
          created_at?: string;
          id?: string;
          organisation_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
        };
        Update: {
          action?: string;
          admin_note?: string | null;
          affiliate_id?: string;
          affiliate_note?: string | null;
          created_at?: string;
          id?: string;
          organisation_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_archive_requests_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_archive_requests_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      affiliate_storage_allocations: {
        Row: {
          allocated_at: string;
          billable_in_storage: boolean;
          id: string;
          owner_enseigne_id: string | null;
          owner_organisation_id: string | null;
          product_id: string;
          stock_quantity: number;
          updated_at: string;
        };
        Insert: {
          allocated_at?: string;
          billable_in_storage?: boolean;
          id?: string;
          owner_enseigne_id?: string | null;
          owner_organisation_id?: string | null;
          product_id: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Update: {
          allocated_at?: string;
          billable_in_storage?: boolean;
          id?: string;
          owner_enseigne_id?: string | null;
          owner_organisation_id?: string | null;
          product_id?: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_storage_allocations_owner_enseigne_id_fkey1';
            columns: ['owner_enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_owner_enseigne_id_fkey1';
            columns: ['owner_enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_owner_organisation_id_fkey1';
            columns: ['owner_organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_product_id_fkey1';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_product_id_fkey1';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_product_id_fkey1';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_product_id_fkey1';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      app_settings: {
        Row: {
          category: string | null;
          created_at: string | null;
          id: string;
          is_public: boolean | null;
          setting_description: string | null;
          setting_key: string;
          setting_value: Json;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          id?: string;
          is_public?: boolean | null;
          setting_description?: string | null;
          setting_key: string;
          setting_value: Json;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          id?: string;
          is_public?: boolean | null;
          setting_description?: string | null;
          setting_key?: string;
          setting_value?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          ip_address: unknown;
          new_data: Json | null;
          old_data: Json | null;
          record_id: string | null;
          severity: string | null;
          table_name: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          severity?: string | null;
          table_name?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          severity?: string | null;
          table_name?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      audit_opjet_invoices: {
        Row: {
          audited_at: string | null;
          created_at: string | null;
          difference_ttc: number | null;
          id: string;
          invoice_date: string | null;
          invoice_number: string;
          invoice_total_ttc: number | null;
          notes: string | null;
          opjet_items: Json | null;
          po_id: string | null;
          po_total_ttc: number | null;
          status: string;
          verone_items: Json | null;
        };
        Insert: {
          audited_at?: string | null;
          created_at?: string | null;
          difference_ttc?: number | null;
          id?: string;
          invoice_date?: string | null;
          invoice_number: string;
          invoice_total_ttc?: number | null;
          notes?: string | null;
          opjet_items?: Json | null;
          po_id?: string | null;
          po_total_ttc?: number | null;
          status: string;
          verone_items?: Json | null;
        };
        Update: {
          audited_at?: string | null;
          created_at?: string | null;
          difference_ttc?: number | null;
          id?: string;
          invoice_date?: string | null;
          invoice_number?: string;
          invoice_total_ttc?: number | null;
          notes?: string | null;
          opjet_items?: Json | null;
          po_id?: string | null;
          po_total_ttc?: number | null;
          status?: string;
          verone_items?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_opjet_invoices_po_id_fkey';
            columns: ['po_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
        ];
      };
      bank_transactions: {
        Row: {
          amount: number;
          amount_ht: number | null;
          amount_vat: number | null;
          applied_rule_id: string | null;
          attachment_ids: string[] | null;
          bank_account_id: string;
          bank_provider: Database['public']['Enums']['bank_provider'];
          category_pcg: string | null;
          confidence_score: number | null;
          counterparty_iban: string | null;
          counterparty_individual_customer_id: string | null;
          counterparty_name: string | null;
          counterparty_organisation_id: string | null;
          counterparty_type: string | null;
          created_at: string;
          currency: string;
          emitted_at: string;
          has_attachment: boolean | null;
          id: string;
          ignore_reason: string | null;
          ignored_at: string | null;
          ignored_by: string | null;
          justification_optional: boolean | null;
          label: string;
          match_reason: string | null;
          matched_document_id: string | null;
          matching_status: Database['public']['Enums']['matching_status'];
          nature: string | null;
          note: string | null;
          operation_type: string | null;
          payment_method: string | null;
          raw_data: Json;
          reference: string | null;
          settled_at: string | null;
          side: Database['public']['Enums']['transaction_side'];
          transaction_id: string;
          updated_at: string;
          vat_breakdown: Json | null;
          vat_rate: number | null;
          vat_source: string | null;
        };
        Insert: {
          amount: number;
          amount_ht?: number | null;
          amount_vat?: number | null;
          applied_rule_id?: string | null;
          attachment_ids?: string[] | null;
          bank_account_id: string;
          bank_provider: Database['public']['Enums']['bank_provider'];
          category_pcg?: string | null;
          confidence_score?: number | null;
          counterparty_iban?: string | null;
          counterparty_individual_customer_id?: string | null;
          counterparty_name?: string | null;
          counterparty_organisation_id?: string | null;
          counterparty_type?: string | null;
          created_at?: string;
          currency?: string;
          emitted_at: string;
          has_attachment?: boolean | null;
          id?: string;
          ignore_reason?: string | null;
          ignored_at?: string | null;
          ignored_by?: string | null;
          justification_optional?: boolean | null;
          label: string;
          match_reason?: string | null;
          matched_document_id?: string | null;
          matching_status?: Database['public']['Enums']['matching_status'];
          nature?: string | null;
          note?: string | null;
          operation_type?: string | null;
          payment_method?: string | null;
          raw_data: Json;
          reference?: string | null;
          settled_at?: string | null;
          side: Database['public']['Enums']['transaction_side'];
          transaction_id: string;
          updated_at?: string;
          vat_breakdown?: Json | null;
          vat_rate?: number | null;
          vat_source?: string | null;
        };
        Update: {
          amount?: number;
          amount_ht?: number | null;
          amount_vat?: number | null;
          applied_rule_id?: string | null;
          attachment_ids?: string[] | null;
          bank_account_id?: string;
          bank_provider?: Database['public']['Enums']['bank_provider'];
          category_pcg?: string | null;
          confidence_score?: number | null;
          counterparty_iban?: string | null;
          counterparty_individual_customer_id?: string | null;
          counterparty_name?: string | null;
          counterparty_organisation_id?: string | null;
          counterparty_type?: string | null;
          created_at?: string;
          currency?: string;
          emitted_at?: string;
          has_attachment?: boolean | null;
          id?: string;
          ignore_reason?: string | null;
          ignored_at?: string | null;
          ignored_by?: string | null;
          justification_optional?: boolean | null;
          label?: string;
          match_reason?: string | null;
          matched_document_id?: string | null;
          matching_status?: Database['public']['Enums']['matching_status'];
          nature?: string | null;
          note?: string | null;
          operation_type?: string | null;
          payment_method?: string | null;
          raw_data?: Json;
          reference?: string | null;
          settled_at?: string | null;
          side?: Database['public']['Enums']['transaction_side'];
          transaction_id?: string;
          updated_at?: string;
          vat_breakdown?: Json | null;
          vat_rate?: number | null;
          vat_source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_transactions_applied_rule_id_fkey';
            columns: ['applied_rule_id'];
            isOneToOne: false;
            referencedRelation: 'matching_rules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_applied_rule_id_fkey';
            columns: ['applied_rule_id'];
            isOneToOne: false;
            referencedRelation: 'v_matching_rules_with_org';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_counterparty_individual_customer_id_fkey';
            columns: ['counterparty_individual_customer_id'];
            isOneToOne: false;
            referencedRelation: 'individual_customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_counterparty_organisation_id_fkey';
            columns: ['counterparty_organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'financial_documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'v_pending_invoice_uploads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['financial_document_id'];
          },
        ];
      };
      bank_transactions_enrichment_audit: {
        Row: {
          action: string;
          after_json: Json;
          before_json: Json;
          changed_at: string;
          changed_by: string | null;
          fields_changed: string[];
          id: string;
          reason: string | null;
          source: string | null;
          transaction_id: string;
        };
        Insert: {
          action: string;
          after_json?: Json;
          before_json?: Json;
          changed_at?: string;
          changed_by?: string | null;
          fields_changed?: string[];
          id?: string;
          reason?: string | null;
          source?: string | null;
          transaction_id: string;
        };
        Update: {
          action?: string;
          after_json?: Json;
          before_json?: Json;
          changed_at?: string;
          changed_by?: string | null;
          fields_changed?: string[];
          id?: string;
          reason?: string | null;
          source?: string | null;
          transaction_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_transactions_enrichment_audit_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'bank_transactions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_enrichment_audit_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_enrichment_audit_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['transaction_id'];
          },
          {
            foreignKeyName: 'bank_transactions_enrichment_audit_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_expenses_with_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_enrichment_audit_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_expenses_with_details';
            referencedColumns: ['transaction_id'];
          },
          {
            foreignKeyName: 'bank_transactions_enrichment_audit_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_enrichment_audit_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_unified';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          facebook_category: string | null;
          family_id: string | null;
          google_category_id: number | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_visible_menu: boolean | null;
          level: number | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          facebook_category?: string | null;
          family_id?: string | null;
          google_category_id?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_visible_menu?: boolean | null;
          level?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          facebook_category?: string | null;
          family_id?: string | null;
          google_category_id?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_visible_menu?: boolean | null;
          level?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
        ];
      };
      category_translations: {
        Row: {
          category_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          language: Database['public']['Enums']['language_type'];
          name: string;
        };
        Insert: {
          category_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          language: Database['public']['Enums']['language_type'];
          name: string;
        };
        Update: {
          category_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          language?: Database['public']['Enums']['language_type'];
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'category_translations_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      channel_price_lists: {
        Row: {
          applicable_regions: string[] | null;
          channel_id: string;
          config: Json | null;
          created_at: string | null;
          created_by: string | null;
          excluded_regions: string[] | null;
          excluded_segments: string[] | null;
          is_active: boolean | null;
          is_default: boolean | null;
          max_discount_allowed: number | null;
          min_order_value: number | null;
          price_list_id: string;
          priority: number | null;
          target_segments: string[] | null;
          updated_at: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          applicable_regions?: string[] | null;
          channel_id: string;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          excluded_regions?: string[] | null;
          excluded_segments?: string[] | null;
          is_active?: boolean | null;
          is_default?: boolean | null;
          max_discount_allowed?: number | null;
          min_order_value?: number | null;
          price_list_id: string;
          priority?: number | null;
          target_segments?: string[] | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          applicable_regions?: string[] | null;
          channel_id?: string;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          excluded_regions?: string[] | null;
          excluded_segments?: string[] | null;
          is_active?: boolean | null;
          is_default?: boolean | null;
          max_discount_allowed?: number | null;
          min_order_value?: number | null;
          price_list_id?: string;
          priority?: number | null;
          target_segments?: string[] | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'channel_price_lists_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channel_price_lists_price_list_id_fkey';
            columns: ['price_list_id'];
            isOneToOne: false;
            referencedRelation: 'price_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      channel_pricing: {
        Row: {
          assembly_price: number | null;
          buffer_rate: number | null;
          channel_commission_rate: number | null;
          channel_id: string;
          created_at: string | null;
          created_by: string | null;
          custom_description: string | null;
          custom_price_ht: number | null;
          custom_selling_points: string[] | null;
          custom_title: string | null;
          delivery_delay_weeks_max: number | null;
          delivery_delay_weeks_min: number | null;
          discount_rate: number | null;
          display_order: number | null;
          eco_participation_amount: number | null;
          id: string;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_public_showcase: boolean | null;
          markup_rate: number | null;
          max_margin_rate: number | null;
          min_margin_rate: number | null;
          min_quantity: number | null;
          notes: string | null;
          product_id: string;
          public_price_ht: number | null;
          requires_assembly: boolean | null;
          selections_count: number | null;
          show_supplier: boolean | null;
          suggested_margin_rate: number | null;
          updated_at: string | null;
          valid_from: string | null;
          valid_until: string | null;
          views_count: number | null;
        };
        Insert: {
          assembly_price?: number | null;
          buffer_rate?: number | null;
          channel_commission_rate?: number | null;
          channel_id: string;
          created_at?: string | null;
          created_by?: string | null;
          custom_description?: string | null;
          custom_price_ht?: number | null;
          custom_selling_points?: string[] | null;
          custom_title?: string | null;
          delivery_delay_weeks_max?: number | null;
          delivery_delay_weeks_min?: number | null;
          discount_rate?: number | null;
          display_order?: number | null;
          eco_participation_amount?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_public_showcase?: boolean | null;
          markup_rate?: number | null;
          max_margin_rate?: number | null;
          min_margin_rate?: number | null;
          min_quantity?: number | null;
          notes?: string | null;
          product_id: string;
          public_price_ht?: number | null;
          requires_assembly?: boolean | null;
          selections_count?: number | null;
          show_supplier?: boolean | null;
          suggested_margin_rate?: number | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
          views_count?: number | null;
        };
        Update: {
          assembly_price?: number | null;
          buffer_rate?: number | null;
          channel_commission_rate?: number | null;
          channel_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          custom_description?: string | null;
          custom_price_ht?: number | null;
          custom_selling_points?: string[] | null;
          custom_title?: string | null;
          delivery_delay_weeks_max?: number | null;
          delivery_delay_weeks_min?: number | null;
          discount_rate?: number | null;
          display_order?: number | null;
          eco_participation_amount?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_public_showcase?: boolean | null;
          markup_rate?: number | null;
          max_margin_rate?: number | null;
          min_margin_rate?: number | null;
          min_quantity?: number | null;
          notes?: string | null;
          product_id?: string;
          public_price_ht?: number | null;
          requires_assembly?: boolean | null;
          selections_count?: number | null;
          show_supplier?: boolean | null;
          suggested_margin_rate?: number | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
          views_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'channel_pricing_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channel_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'channel_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channel_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'channel_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      channel_pricing_history: {
        Row: {
          change_percentage: number | null;
          change_reason: string | null;
          change_type: string;
          changed_at: string;
          changed_by: string | null;
          channel_id: string;
          channel_pricing_id: string;
          id: string;
          metadata: Json | null;
          new_custom_price_ht: number | null;
          new_discount_rate: number | null;
          new_markup_rate: number | null;
          old_custom_price_ht: number | null;
          old_discount_rate: number | null;
          old_markup_rate: number | null;
          product_id: string;
        };
        Insert: {
          change_percentage?: number | null;
          change_reason?: string | null;
          change_type: string;
          changed_at?: string;
          changed_by?: string | null;
          channel_id: string;
          channel_pricing_id: string;
          id?: string;
          metadata?: Json | null;
          new_custom_price_ht?: number | null;
          new_discount_rate?: number | null;
          new_markup_rate?: number | null;
          old_custom_price_ht?: number | null;
          old_discount_rate?: number | null;
          old_markup_rate?: number | null;
          product_id: string;
        };
        Update: {
          change_percentage?: number | null;
          change_reason?: string | null;
          change_type?: string;
          changed_at?: string;
          changed_by?: string | null;
          channel_id?: string;
          channel_pricing_id?: string;
          id?: string;
          metadata?: Json | null;
          new_custom_price_ht?: number | null;
          new_discount_rate?: number | null;
          new_markup_rate?: number | null;
          old_custom_price_ht?: number | null;
          old_discount_rate?: number | null;
          old_markup_rate?: number | null;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'channel_pricing_history_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channel_pricing_history_channel_pricing_id_fkey';
            columns: ['channel_pricing_id'];
            isOneToOne: false;
            referencedRelation: 'channel_pricing';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channel_pricing_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'channel_pricing_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channel_pricing_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'channel_pricing_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      channel_product_metadata: {
        Row: {
          channel_id: string;
          created_at: string | null;
          created_by: string | null;
          custom_brand: string | null;
          custom_description: string | null;
          custom_description_long: string | null;
          custom_selling_points: Json | null;
          custom_technical_description: string | null;
          custom_title: string | null;
          id: string;
          metadata: Json | null;
          product_id: string;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          channel_id: string;
          created_at?: string | null;
          created_by?: string | null;
          custom_brand?: string | null;
          custom_description?: string | null;
          custom_description_long?: string | null;
          custom_selling_points?: Json | null;
          custom_technical_description?: string | null;
          custom_title?: string | null;
          id?: string;
          metadata?: Json | null;
          product_id: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          channel_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          custom_brand?: string | null;
          custom_description?: string | null;
          custom_description_long?: string | null;
          custom_selling_points?: Json | null;
          custom_technical_description?: string | null;
          custom_title?: string | null;
          id?: string;
          metadata?: Json | null;
          product_id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'channel_product_metadata_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channel_product_metadata_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'channel_product_metadata_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channel_product_metadata_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'channel_product_metadata_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      channel_product_pricing: {
        Row: {
          channel: string;
          created_at: string | null;
          id: string;
          price_ht_cents: number;
          product_id: string;
          tva_rate: number;
          updated_at: string | null;
        };
        Insert: {
          channel: string;
          created_at?: string | null;
          id?: string;
          price_ht_cents: number;
          product_id: string;
          tva_rate?: number;
          updated_at?: string | null;
        };
        Update: {
          channel?: string;
          created_at?: string | null;
          id?: string;
          price_ht_cents?: number;
          product_id?: string;
          tva_rate?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'channel_product_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'channel_product_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channel_product_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'channel_product_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      client_consultations: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          assigned_to: string | null;
          client_email: string;
          client_phone: string | null;
          created_at: string | null;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          descriptif: string;
          enseigne_id: string | null;
          estimated_response_date: string | null;
          id: string;
          image_url: string | null;
          notes_internes: string | null;
          organisation_id: string | null;
          priority_level: number | null;
          responded_at: string | null;
          responded_by: string | null;
          source_channel: string | null;
          status: string | null;
          tarif_maximum: number | null;
          updated_at: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          assigned_to?: string | null;
          client_email: string;
          client_phone?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          descriptif: string;
          enseigne_id?: string | null;
          estimated_response_date?: string | null;
          id?: string;
          image_url?: string | null;
          notes_internes?: string | null;
          organisation_id?: string | null;
          priority_level?: number | null;
          responded_at?: string | null;
          responded_by?: string | null;
          source_channel?: string | null;
          status?: string | null;
          tarif_maximum?: number | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          assigned_to?: string | null;
          client_email?: string;
          client_phone?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          descriptif?: string;
          enseigne_id?: string | null;
          estimated_response_date?: string | null;
          id?: string;
          image_url?: string | null;
          notes_internes?: string | null;
          organisation_id?: string | null;
          priority_level?: number | null;
          responded_at?: string | null;
          responded_by?: string | null;
          source_channel?: string | null;
          status?: string | null;
          tarif_maximum?: number | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'client_consultations_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'client_consultations_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'client_consultations_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      collection_images: {
        Row: {
          alt_text: string | null;
          collection_id: string;
          created_at: string | null;
          display_order: number;
          file_name: string | null;
          file_size: number | null;
          height: number | null;
          id: string;
          image_type: string | null;
          is_primary: boolean;
          mime_type: string | null;
          public_url: string | null;
          storage_path: string;
          updated_at: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          collection_id: string;
          created_at?: string | null;
          display_order?: number;
          file_name?: string | null;
          file_size?: number | null;
          height?: number | null;
          id?: string;
          image_type?: string | null;
          is_primary?: boolean;
          mime_type?: string | null;
          public_url?: string | null;
          storage_path: string;
          updated_at?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          collection_id?: string;
          created_at?: string | null;
          display_order?: number;
          file_name?: string | null;
          file_size?: number | null;
          height?: number | null;
          id?: string;
          image_type?: string | null;
          is_primary?: boolean;
          mime_type?: string | null;
          public_url?: string | null;
          storage_path?: string;
          updated_at?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_images_collection_id_fkey';
            columns: ['collection_id'];
            isOneToOne: false;
            referencedRelation: 'collections';
            referencedColumns: ['id'];
          },
        ];
      };
      collection_products: {
        Row: {
          collection_id: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          position: number;
          product_id: string;
        };
        Insert: {
          collection_id: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          position?: number;
          product_id: string;
        };
        Update: {
          collection_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          position?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_products_collection_id_fkey';
            columns: ['collection_id'];
            isOneToOne: false;
            referencedRelation: 'collections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collection_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'collection_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collection_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'collection_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      collection_shares: {
        Row: {
          collection_id: string;
          id: string;
          recipient_email: string | null;
          share_type: string;
          shared_at: string;
          shared_by: string | null;
        };
        Insert: {
          collection_id: string;
          id?: string;
          recipient_email?: string | null;
          share_type?: string;
          shared_at?: string;
          shared_by?: string | null;
        };
        Update: {
          collection_id?: string;
          id?: string;
          recipient_email?: string | null;
          share_type?: string;
          shared_at?: string;
          shared_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_shares_collection_id_fkey';
            columns: ['collection_id'];
            isOneToOne: false;
            referencedRelation: 'collections';
            referencedColumns: ['id'];
          },
        ];
      };
      collection_translations: {
        Row: {
          collection_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          language: Database['public']['Enums']['language_type'];
          name: string;
        };
        Insert: {
          collection_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          language: Database['public']['Enums']['language_type'];
          name: string;
        };
        Update: {
          collection_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          language?: Database['public']['Enums']['language_type'];
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_translations_collection_id_fkey';
            columns: ['collection_id'];
            isOneToOne: false;
            referencedRelation: 'collections';
            referencedColumns: ['id'];
          },
        ];
      };
      collections: {
        Row: {
          archived_at: string | null;
          brand_id: string | null;
          color_theme: string | null;
          created_at: string | null;
          created_by: string;
          description: string | null;
          description_long: string | null;
          display_order: number | null;
          event_tags: string[] | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_published_online: boolean | null;
          last_shared: string | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          product_count: number | null;
          publication_date: string | null;
          season: Database['public']['Enums']['season_type'] | null;
          selling_points: string[] | null;
          shared_count: number | null;
          shared_link_token: string | null;
          slug: string | null;
          sort_order_site: number | null;
          style: string | null;
          suitable_rooms: string[] | null;
          theme_tags: string[] | null;
          unpublication_date: string | null;
          updated_at: string | null;
          visibility: string;
          visible_channels: string[] | null;
        };
        Insert: {
          archived_at?: string | null;
          brand_id?: string | null;
          color_theme?: string | null;
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          description_long?: string | null;
          display_order?: number | null;
          event_tags?: string[] | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_published_online?: boolean | null;
          last_shared?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          product_count?: number | null;
          publication_date?: string | null;
          season?: Database['public']['Enums']['season_type'] | null;
          selling_points?: string[] | null;
          shared_count?: number | null;
          shared_link_token?: string | null;
          slug?: string | null;
          sort_order_site?: number | null;
          style?: string | null;
          suitable_rooms?: string[] | null;
          theme_tags?: string[] | null;
          unpublication_date?: string | null;
          updated_at?: string | null;
          visibility?: string;
          visible_channels?: string[] | null;
        };
        Update: {
          archived_at?: string | null;
          brand_id?: string | null;
          color_theme?: string | null;
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          description_long?: string | null;
          display_order?: number | null;
          event_tags?: string[] | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_published_online?: boolean | null;
          last_shared?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          product_count?: number | null;
          publication_date?: string | null;
          season?: Database['public']['Enums']['season_type'] | null;
          selling_points?: string[] | null;
          shared_count?: number | null;
          shared_link_token?: string | null;
          slug?: string | null;
          sort_order_site?: number | null;
          style?: string | null;
          suitable_rooms?: string[] | null;
          theme_tags?: string[] | null;
          unpublication_date?: string | null;
          updated_at?: string | null;
          visibility?: string;
          visible_channels?: string[] | null;
        };
        Relationships: [];
      };
      consultation_images: {
        Row: {
          alt_text: string | null;
          consultation_id: string;
          created_at: string | null;
          created_by: string | null;
          display_order: number | null;
          file_size: number | null;
          format: string | null;
          height: number | null;
          id: string;
          image_type: Database['public']['Enums']['image_type_enum'] | null;
          is_primary: boolean | null;
          public_url: string | null;
          storage_path: string;
          updated_at: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          consultation_id: string;
          created_at?: string | null;
          created_by?: string | null;
          display_order?: number | null;
          file_size?: number | null;
          format?: string | null;
          height?: number | null;
          id?: string;
          image_type?: Database['public']['Enums']['image_type_enum'] | null;
          is_primary?: boolean | null;
          public_url?: string | null;
          storage_path: string;
          updated_at?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          consultation_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          display_order?: number | null;
          file_size?: number | null;
          format?: string | null;
          height?: number | null;
          id?: string;
          image_type?: Database['public']['Enums']['image_type_enum'] | null;
          is_primary?: boolean | null;
          public_url?: string | null;
          storage_path?: string;
          updated_at?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'consultation_images_consultation_id_fkey';
            columns: ['consultation_id'];
            isOneToOne: false;
            referencedRelation: 'client_consultations';
            referencedColumns: ['id'];
          },
        ];
      };
      consultation_products: {
        Row: {
          consultation_id: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_free: boolean | null;
          is_primary_proposal: boolean | null;
          notes: string | null;
          product_id: string;
          proposed_price: number | null;
          quantity: number;
          status: string | null;
        };
        Insert: {
          consultation_id: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_free?: boolean | null;
          is_primary_proposal?: boolean | null;
          notes?: string | null;
          product_id: string;
          proposed_price?: number | null;
          quantity?: number;
          status?: string | null;
        };
        Update: {
          consultation_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_free?: boolean | null;
          is_primary_proposal?: boolean | null;
          notes?: string | null;
          product_id?: string;
          proposed_price?: number | null;
          quantity?: number;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'consultation_products_consultation_id_fkey';
            columns: ['consultation_id'];
            isOneToOne: false;
            referencedRelation: 'client_consultations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'consultation_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'consultation_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'consultation_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'consultation_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      contacts: {
        Row: {
          accepts_marketing: boolean | null;
          accepts_notifications: boolean | null;
          contact_type: string | null;
          created_at: string | null;
          created_by: string | null;
          department: string | null;
          direct_line: string | null;
          email: string;
          enseigne_id: string | null;
          first_name: string;
          id: string;
          is_active: boolean | null;
          is_billing_contact: boolean | null;
          is_commercial_contact: boolean | null;
          is_primary_contact: boolean | null;
          is_technical_contact: boolean | null;
          language_preference: string | null;
          last_contact_date: string | null;
          last_name: string;
          mobile: string | null;
          notes: string | null;
          organisation_id: string | null;
          owner_type: string | null;
          phone: string | null;
          preferred_communication_method: string | null;
          secondary_email: string | null;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          accepts_marketing?: boolean | null;
          accepts_notifications?: boolean | null;
          contact_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          department?: string | null;
          direct_line?: string | null;
          email: string;
          enseigne_id?: string | null;
          first_name: string;
          id?: string;
          is_active?: boolean | null;
          is_billing_contact?: boolean | null;
          is_commercial_contact?: boolean | null;
          is_primary_contact?: boolean | null;
          is_technical_contact?: boolean | null;
          language_preference?: string | null;
          last_contact_date?: string | null;
          last_name: string;
          mobile?: string | null;
          notes?: string | null;
          organisation_id?: string | null;
          owner_type?: string | null;
          phone?: string | null;
          preferred_communication_method?: string | null;
          secondary_email?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          accepts_marketing?: boolean | null;
          accepts_notifications?: boolean | null;
          contact_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          department?: string | null;
          direct_line?: string | null;
          email?: string;
          enseigne_id?: string | null;
          first_name?: string;
          id?: string;
          is_active?: boolean | null;
          is_billing_contact?: boolean | null;
          is_commercial_contact?: boolean | null;
          is_primary_contact?: boolean | null;
          is_technical_contact?: boolean | null;
          language_preference?: string | null;
          last_contact_date?: string | null;
          last_name?: string;
          mobile?: string | null;
          notes?: string | null;
          organisation_id?: string | null;
          owner_type?: string | null;
          phone?: string | null;
          preferred_communication_method?: string | null;
          secondary_email?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contacts_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contacts_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contacts_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      counterparty_bank_accounts: {
        Row: {
          account_holder_name: string | null;
          bank_name: string | null;
          bic: string | null;
          created_at: string | null;
          created_by: string | null;
          iban: string;
          id: string;
          is_primary: boolean | null;
          organisation_id: string;
          updated_at: string | null;
        };
        Insert: {
          account_holder_name?: string | null;
          bank_name?: string | null;
          bic?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          iban: string;
          id?: string;
          is_primary?: boolean | null;
          organisation_id: string;
          updated_at?: string | null;
        };
        Update: {
          account_holder_name?: string | null;
          bank_name?: string | null;
          bic?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          iban?: string;
          id?: string;
          is_primary?: boolean | null;
          organisation_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'counterparty_bank_accounts_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_group_members: {
        Row: {
          assignment_method: string | null;
          created_at: string | null;
          created_by: string | null;
          customer_id: string;
          customer_type: string;
          expires_at: string | null;
          group_id: string;
          is_active: boolean | null;
          joined_at: string | null;
          notes: string | null;
        };
        Insert: {
          assignment_method?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          customer_id: string;
          customer_type: string;
          expires_at?: string | null;
          group_id: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          notes?: string | null;
        };
        Update: {
          assignment_method?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          customer_id?: string;
          customer_type?: string;
          expires_at?: string | null;
          group_id?: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'customer_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_groups: {
        Row: {
          auto_assignment_rules: Json | null;
          code: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          group_type: string;
          id: string;
          is_active: boolean | null;
          member_count: number | null;
          min_annual_revenue: number | null;
          min_orders_per_year: number | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          auto_assignment_rules?: Json | null;
          code: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          group_type: string;
          id?: string;
          is_active?: boolean | null;
          member_count?: number | null;
          min_annual_revenue?: number | null;
          min_orders_per_year?: number | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          auto_assignment_rules?: Json | null;
          code?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          group_type?: string;
          id?: string;
          is_active?: boolean | null;
          member_count?: number | null;
          min_annual_revenue?: number | null;
          min_orders_per_year?: number | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      customer_price_lists: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          assignment_reason: string | null;
          config: Json | null;
          contract_reference: string | null;
          created_at: string | null;
          created_by: string | null;
          customer_id: string;
          customer_type: string;
          is_active: boolean | null;
          is_default: boolean | null;
          price_list_id: string;
          priority: number | null;
          updated_at: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          assignment_reason?: string | null;
          config?: Json | null;
          contract_reference?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          customer_id: string;
          customer_type: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          price_list_id: string;
          priority?: number | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          assignment_reason?: string | null;
          config?: Json | null;
          contract_reference?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          customer_id?: string;
          customer_type?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          price_list_id?: string;
          priority?: number | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_price_lists_price_list_id_fkey';
            columns: ['price_list_id'];
            isOneToOne: false;
            referencedRelation: 'price_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_pricing: {
        Row: {
          approval_status: string | null;
          approved_at: string | null;
          approved_by: string | null;
          contract_reference: string | null;
          created_at: string | null;
          created_by: string | null;
          custom_price_ht: number | null;
          customer_id: string;
          customer_type: string;
          discount_rate: number | null;
          id: string;
          is_active: boolean | null;
          min_quantity: number | null;
          notes: string | null;
          product_id: string;
          retrocession_rate: number | null;
          updated_at: string | null;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          contract_reference?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          custom_price_ht?: number | null;
          customer_id: string;
          customer_type: string;
          discount_rate?: number | null;
          id?: string;
          is_active?: boolean | null;
          min_quantity?: number | null;
          notes?: string | null;
          product_id: string;
          retrocession_rate?: number | null;
          updated_at?: string | null;
          valid_from: string;
          valid_until?: string | null;
        };
        Update: {
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          contract_reference?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          custom_price_ht?: number | null;
          customer_id?: string;
          customer_type?: string;
          discount_rate?: number | null;
          id?: string;
          is_active?: boolean | null;
          min_quantity?: number | null;
          notes?: string | null;
          product_id?: string;
          retrocession_rate?: number | null;
          updated_at?: string | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'customer_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'customer_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      email_templates: {
        Row: {
          active: boolean | null;
          category: string | null;
          created_at: string | null;
          html_body: string;
          id: string;
          name: string;
          slug: string;
          subject: string;
          updated_at: string | null;
          variables: Json | null;
        };
        Insert: {
          active?: boolean | null;
          category?: string | null;
          created_at?: string | null;
          html_body: string;
          id?: string;
          name: string;
          slug: string;
          subject: string;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Update: {
          active?: boolean | null;
          category?: string | null;
          created_at?: string | null;
          html_body?: string;
          id?: string;
          name?: string;
          slug?: string;
          subject?: string;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Relationships: [];
      };
      enseignes: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          logo_url: string | null;
          member_count: number;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          logo_url?: string | null;
          member_count?: number;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          logo_url?: string | null;
          member_count?: number;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      families: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      feed_configs: {
        Row: {
          access_token: string;
          created_at: string | null;
          created_by: string;
          filters: Json | null;
          format: Database['public']['Enums']['feed_format_type'] | null;
          id: string;
          is_active: boolean | null;
          language: Database['public']['Enums']['language_type'];
          last_export_at: string | null;
          name: string;
          platform: Database['public']['Enums']['feed_platform_type'];
          schedule_day: number | null;
          schedule_frequency:
            | Database['public']['Enums']['schedule_frequency_type']
            | null;
          schedule_hour: number | null;
          updated_at: string | null;
          webhook_url: string | null;
        };
        Insert: {
          access_token: string;
          created_at?: string | null;
          created_by: string;
          filters?: Json | null;
          format?: Database['public']['Enums']['feed_format_type'] | null;
          id?: string;
          is_active?: boolean | null;
          language: Database['public']['Enums']['language_type'];
          last_export_at?: string | null;
          name: string;
          platform: Database['public']['Enums']['feed_platform_type'];
          schedule_day?: number | null;
          schedule_frequency?:
            | Database['public']['Enums']['schedule_frequency_type']
            | null;
          schedule_hour?: number | null;
          updated_at?: string | null;
          webhook_url?: string | null;
        };
        Update: {
          access_token?: string;
          created_at?: string | null;
          created_by?: string;
          filters?: Json | null;
          format?: Database['public']['Enums']['feed_format_type'] | null;
          id?: string;
          is_active?: boolean | null;
          language?: Database['public']['Enums']['language_type'];
          last_export_at?: string | null;
          name?: string;
          platform?: Database['public']['Enums']['feed_platform_type'];
          schedule_day?: number | null;
          schedule_frequency?:
            | Database['public']['Enums']['schedule_frequency_type']
            | null;
          schedule_hour?: number | null;
          updated_at?: string | null;
          webhook_url?: string | null;
        };
        Relationships: [];
      };
      feed_exports: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          duration_seconds: number | null;
          error_message: string | null;
          feed_config_id: string;
          file_size: number | null;
          file_url: string | null;
          id: string;
          ip_address: unknown;
          logs: Json | null;
          products_count: number | null;
          requested_by: string | null;
          started_at: string | null;
          status: Database['public']['Enums']['feed_export_status_type'] | null;
          user_agent: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          error_message?: string | null;
          feed_config_id: string;
          file_size?: number | null;
          file_url?: string | null;
          id?: string;
          ip_address?: unknown;
          logs?: Json | null;
          products_count?: number | null;
          requested_by?: string | null;
          started_at?: string | null;
          status?:
            | Database['public']['Enums']['feed_export_status_type']
            | null;
          user_agent?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          error_message?: string | null;
          feed_config_id?: string;
          file_size?: number | null;
          file_url?: string | null;
          id?: string;
          ip_address?: unknown;
          logs?: Json | null;
          products_count?: number | null;
          requested_by?: string | null;
          started_at?: string | null;
          status?:
            | Database['public']['Enums']['feed_export_status_type']
            | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'feed_exports_feed_config_id_fkey';
            columns: ['feed_config_id'];
            isOneToOne: false;
            referencedRelation: 'feed_configs';
            referencedColumns: ['id'];
          },
        ];
      };
      feed_performance_metrics: {
        Row: {
          avg_duration_seconds: number | null;
          avg_products_count: number | null;
          created_at: string | null;
          error_types: Json | null;
          failed_exports: number | null;
          feed_config_id: string;
          id: string;
          max_duration_seconds: number | null;
          metrics_date: string;
          successful_exports: number | null;
          total_exports: number | null;
          total_file_size_bytes: number | null;
          updated_at: string | null;
        };
        Insert: {
          avg_duration_seconds?: number | null;
          avg_products_count?: number | null;
          created_at?: string | null;
          error_types?: Json | null;
          failed_exports?: number | null;
          feed_config_id: string;
          id?: string;
          max_duration_seconds?: number | null;
          metrics_date: string;
          successful_exports?: number | null;
          total_exports?: number | null;
          total_file_size_bytes?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avg_duration_seconds?: number | null;
          avg_products_count?: number | null;
          created_at?: string | null;
          error_types?: Json | null;
          failed_exports?: number | null;
          feed_config_id?: string;
          id?: string;
          max_duration_seconds?: number | null;
          metrics_date?: string;
          successful_exports?: number | null;
          total_exports?: number | null;
          total_file_size_bytes?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'feed_performance_metrics_feed_config_id_fkey';
            columns: ['feed_config_id'];
            isOneToOne: false;
            referencedRelation: 'feed_configs';
            referencedColumns: ['id'];
          },
        ];
      };
      finance_settings: {
        Row: {
          closed_fiscal_year: number | null;
          id: string;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          closed_fiscal_year?: number | null;
          id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          closed_fiscal_year?: number | null;
          id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      financial_document_lines: {
        Row: {
          created_at: string;
          description: string;
          document_id: string;
          id: string;
          line_number: number;
          pcg_code: string | null;
          product_id: string | null;
          quantity: number;
          sort_order: number | null;
          total_ht: number;
          total_ttc: number | null;
          tva_amount: number | null;
          tva_rate: number;
          unit_price_ht: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          description: string;
          document_id: string;
          id?: string;
          line_number: number;
          pcg_code?: string | null;
          product_id?: string | null;
          quantity: number;
          sort_order?: number | null;
          total_ht: number;
          total_ttc?: number | null;
          tva_amount?: number | null;
          tva_rate: number;
          unit_price_ht: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string;
          document_id?: string;
          id?: string;
          line_number?: number;
          pcg_code?: string | null;
          product_id?: string | null;
          quantity?: number;
          sort_order?: number | null;
          total_ht?: number;
          total_ttc?: number | null;
          tva_amount?: number | null;
          tva_rate?: number;
          unit_price_ht?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_document_lines_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'financial_documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_document_lines_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'v_pending_invoice_uploads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_document_lines_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['financial_document_id'];
          },
          {
            foreignKeyName: 'financial_document_lines_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'financial_document_lines_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_document_lines_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'financial_document_lines_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      financial_documents: {
        Row: {
          abby_invoice_id: string | null;
          abby_invoice_number: string | null;
          abby_pdf_url: string | null;
          abby_public_url: string | null;
          amount_paid: number;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          description: string | null;
          document_date: string;
          document_direction: Database['public']['Enums']['document_direction'];
          document_number: string;
          document_type: Database['public']['Enums']['document_type'];
          due_date: string | null;
          finalized_at: string | null;
          finalized_by: string | null;
          id: string;
          invoice_source: string | null;
          last_synced_from_abby_at: string | null;
          local_pdf_path: string | null;
          local_pdf_url: string | null;
          notes: string | null;
          partner_id: string;
          partner_type: string;
          pcg_code: string | null;
          pdf_stored_at: string | null;
          purchase_order_id: string | null;
          qonto_attachment_id: string | null;
          qonto_invoice_id: string | null;
          qonto_pdf_url: string | null;
          qonto_public_url: string | null;
          sales_order_id: string | null;
          sent_at: string | null;
          status: Database['public']['Enums']['document_status'];
          sync_errors: Json | null;
          synced_to_abby_at: string | null;
          synchronized_at: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at: string;
          upload_status: string | null;
          uploaded_at: string | null;
          uploaded_by: string | null;
          uploaded_file_name: string | null;
          uploaded_file_url: string | null;
          validated_by: string | null;
          validated_to_draft_at: string | null;
          workflow_status: string | null;
        };
        Insert: {
          abby_invoice_id?: string | null;
          abby_invoice_number?: string | null;
          abby_pdf_url?: string | null;
          abby_public_url?: string | null;
          amount_paid?: number;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          description?: string | null;
          document_date: string;
          document_direction: Database['public']['Enums']['document_direction'];
          document_number: string;
          document_type: Database['public']['Enums']['document_type'];
          due_date?: string | null;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          invoice_source?: string | null;
          last_synced_from_abby_at?: string | null;
          local_pdf_path?: string | null;
          local_pdf_url?: string | null;
          notes?: string | null;
          partner_id: string;
          partner_type: string;
          pcg_code?: string | null;
          pdf_stored_at?: string | null;
          purchase_order_id?: string | null;
          qonto_attachment_id?: string | null;
          qonto_invoice_id?: string | null;
          qonto_pdf_url?: string | null;
          qonto_public_url?: string | null;
          sales_order_id?: string | null;
          sent_at?: string | null;
          status?: Database['public']['Enums']['document_status'];
          sync_errors?: Json | null;
          synced_to_abby_at?: string | null;
          synchronized_at?: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at?: string;
          upload_status?: string | null;
          uploaded_at?: string | null;
          uploaded_by?: string | null;
          uploaded_file_name?: string | null;
          uploaded_file_url?: string | null;
          validated_by?: string | null;
          validated_to_draft_at?: string | null;
          workflow_status?: string | null;
        };
        Update: {
          abby_invoice_id?: string | null;
          abby_invoice_number?: string | null;
          abby_pdf_url?: string | null;
          abby_public_url?: string | null;
          amount_paid?: number;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          description?: string | null;
          document_date?: string;
          document_direction?: Database['public']['Enums']['document_direction'];
          document_number?: string;
          document_type?: Database['public']['Enums']['document_type'];
          due_date?: string | null;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          invoice_source?: string | null;
          last_synced_from_abby_at?: string | null;
          local_pdf_path?: string | null;
          local_pdf_url?: string | null;
          notes?: string | null;
          partner_id?: string;
          partner_type?: string;
          pcg_code?: string | null;
          pdf_stored_at?: string | null;
          purchase_order_id?: string | null;
          qonto_attachment_id?: string | null;
          qonto_invoice_id?: string | null;
          qonto_pdf_url?: string | null;
          qonto_public_url?: string | null;
          sales_order_id?: string | null;
          sent_at?: string | null;
          status?: Database['public']['Enums']['document_status'];
          sync_errors?: Json | null;
          synced_to_abby_at?: string | null;
          synchronized_at?: string | null;
          total_ht?: number;
          total_ttc?: number;
          tva_amount?: number;
          updated_at?: string;
          upload_status?: string | null;
          uploaded_at?: string | null;
          uploaded_by?: string | null;
          uploaded_file_name?: string | null;
          uploaded_file_url?: string | null;
          validated_by?: string | null;
          validated_to_draft_at?: string | null;
          workflow_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_documents_partner_id_fkey';
            columns: ['partner_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_documents_purchase_order_id_fkey';
            columns: ['purchase_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_documents_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_documents_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_documents_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_documents_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_documents_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
          {
            foreignKeyName: 'fk_partner';
            columns: ['partner_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      financial_payments: {
        Row: {
          abby_payment_id: string | null;
          amount_paid: number;
          bank_transaction_id: string | null;
          created_at: string;
          created_by: string | null;
          document_id: string;
          id: string;
          notes: string | null;
          payment_date: string;
          payment_method: string | null;
          synced_from_abby_at: string | null;
          transaction_reference: string | null;
        };
        Insert: {
          abby_payment_id?: string | null;
          amount_paid: number;
          bank_transaction_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_id: string;
          id?: string;
          notes?: string | null;
          payment_date: string;
          payment_method?: string | null;
          synced_from_abby_at?: string | null;
          transaction_reference?: string | null;
        };
        Update: {
          abby_payment_id?: string | null;
          amount_paid?: number;
          bank_transaction_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_id?: string;
          id?: string;
          notes?: string | null;
          payment_date?: string;
          payment_method?: string | null;
          synced_from_abby_at?: string | null;
          transaction_reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_payments_bank_transaction_id_fkey';
            columns: ['bank_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'bank_transactions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_payments_bank_transaction_id_fkey';
            columns: ['bank_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_payments_bank_transaction_id_fkey';
            columns: ['bank_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['transaction_id'];
          },
          {
            foreignKeyName: 'financial_payments_bank_transaction_id_fkey';
            columns: ['bank_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_expenses_with_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_payments_bank_transaction_id_fkey';
            columns: ['bank_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_expenses_with_details';
            referencedColumns: ['transaction_id'];
          },
          {
            foreignKeyName: 'financial_payments_bank_transaction_id_fkey';
            columns: ['bank_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_payments_bank_transaction_id_fkey';
            columns: ['bank_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_unified';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_payments_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'financial_documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_payments_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'v_pending_invoice_uploads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_payments_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['financial_document_id'];
          },
        ];
      };
      form_submission_messages: {
        Row: {
          author_name: string | null;
          author_type: string;
          author_user_id: string | null;
          created_at: string | null;
          email_id: string | null;
          email_sent_at: string | null;
          form_submission_id: string;
          id: string;
          message_body: string;
          message_type: string | null;
          sent_via: string | null;
        };
        Insert: {
          author_name?: string | null;
          author_type: string;
          author_user_id?: string | null;
          created_at?: string | null;
          email_id?: string | null;
          email_sent_at?: string | null;
          form_submission_id: string;
          id?: string;
          message_body: string;
          message_type?: string | null;
          sent_via?: string | null;
        };
        Update: {
          author_name?: string | null;
          author_type?: string;
          author_user_id?: string | null;
          created_at?: string | null;
          email_id?: string | null;
          email_sent_at?: string | null;
          form_submission_id?: string;
          id?: string;
          message_body?: string;
          message_type?: string | null;
          sent_via?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'form_submission_messages_form_submission_id_fkey';
            columns: ['form_submission_id'];
            isOneToOne: false;
            referencedRelation: 'form_submissions';
            referencedColumns: ['id'];
          },
        ];
      };
      form_submissions: {
        Row: {
          assigned_to: string | null;
          closed_at: string | null;
          company_name: string | null;
          converted_at: string | null;
          converted_to_id: string | null;
          converted_to_type: string | null;
          created_at: string | null;
          created_by: string | null;
          email: string;
          first_name: string;
          first_reply_at: string | null;
          form_type: string;
          id: string;
          internal_notes: string | null;
          last_name: string;
          message: string;
          metadata: Json | null;
          phone: string;
          primary_category: string | null;
          priority: string | null;
          read_at: string | null;
          role: string | null;
          sla_deadline: string | null;
          source: string;
          source_reference_id: string | null;
          source_reference_name: string | null;
          status: string | null;
          subject: string | null;
          tags: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          closed_at?: string | null;
          company_name?: string | null;
          converted_at?: string | null;
          converted_to_id?: string | null;
          converted_to_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          email: string;
          first_name: string;
          first_reply_at?: string | null;
          form_type: string;
          id?: string;
          internal_notes?: string | null;
          last_name: string;
          message: string;
          metadata?: Json | null;
          phone: string;
          primary_category?: string | null;
          priority?: string | null;
          read_at?: string | null;
          role?: string | null;
          sla_deadline?: string | null;
          source: string;
          source_reference_id?: string | null;
          source_reference_name?: string | null;
          status?: string | null;
          subject?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          closed_at?: string | null;
          company_name?: string | null;
          converted_at?: string | null;
          converted_to_id?: string | null;
          converted_to_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          email?: string;
          first_name?: string;
          first_reply_at?: string | null;
          form_type?: string;
          id?: string;
          internal_notes?: string | null;
          last_name?: string;
          message?: string;
          metadata?: Json | null;
          phone?: string;
          primary_category?: string | null;
          priority?: string | null;
          read_at?: string | null;
          role?: string | null;
          sla_deadline?: string | null;
          source?: string;
          source_reference_id?: string | null;
          source_reference_name?: string | null;
          status?: string | null;
          subject?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      form_types: {
        Row: {
          code: string;
          color: string | null;
          conversion_config: Json | null;
          created_at: string | null;
          default_category: string | null;
          default_priority: string | null;
          description: string | null;
          display_order: number | null;
          enabled: boolean | null;
          icon: string | null;
          id: string;
          label: string;
          optional_fields: Json | null;
          required_fields: Json | null;
          routing_rules: Json | null;
          sla_hours: number | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          color?: string | null;
          conversion_config?: Json | null;
          created_at?: string | null;
          default_category?: string | null;
          default_priority?: string | null;
          description?: string | null;
          display_order?: number | null;
          enabled?: boolean | null;
          icon?: string | null;
          id?: string;
          label: string;
          optional_fields?: Json | null;
          required_fields?: Json | null;
          routing_rules?: Json | null;
          sla_hours?: number | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          color?: string | null;
          conversion_config?: Json | null;
          created_at?: string | null;
          default_category?: string | null;
          default_priority?: string | null;
          description?: string | null;
          display_order?: number | null;
          enabled?: boolean | null;
          icon?: string | null;
          id?: string;
          label?: string;
          optional_fields?: Json | null;
          required_fields?: Json | null;
          routing_rules?: Json | null;
          sla_hours?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      google_merchant_syncs: {
        Row: {
          clicks: number | null;
          conversions: number | null;
          created_at: string | null;
          error_message: string | null;
          google_product_id: string;
          google_status: string | null;
          google_status_checked_at: string | null;
          google_status_detail: Json | null;
          id: string;
          impressions: number | null;
          merchant_id: string;
          product_id: string;
          response_data: Json | null;
          revenue_ht: number | null;
          sync_operation: string;
          sync_status: string;
          synced_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          clicks?: number | null;
          conversions?: number | null;
          created_at?: string | null;
          error_message?: string | null;
          google_product_id: string;
          google_status?: string | null;
          google_status_checked_at?: string | null;
          google_status_detail?: Json | null;
          id?: string;
          impressions?: number | null;
          merchant_id: string;
          product_id: string;
          response_data?: Json | null;
          revenue_ht?: number | null;
          sync_operation: string;
          sync_status: string;
          synced_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          clicks?: number | null;
          conversions?: number | null;
          created_at?: string | null;
          error_message?: string | null;
          google_product_id?: string;
          google_status?: string | null;
          google_status_checked_at?: string | null;
          google_status_detail?: Json | null;
          id?: string;
          impressions?: number | null;
          merchant_id?: string;
          product_id?: string;
          response_data?: Json | null;
          revenue_ht?: number | null;
          sync_operation?: string;
          sync_status?: string;
          synced_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'google_merchant_syncs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'google_merchant_syncs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'google_merchant_syncs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'google_merchant_syncs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      group_price_lists: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          group_id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          price_list_id: string;
          priority: number | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          group_id: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          price_list_id: string;
          priority?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          group_id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          price_list_id?: string;
          priority?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'group_price_lists_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'customer_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_price_lists_price_list_id_fkey';
            columns: ['price_list_id'];
            isOneToOne: false;
            referencedRelation: 'price_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      individual_customers: {
        Row: {
          abby_contact_id: string | null;
          accepts_marketing: boolean | null;
          accepts_notifications: boolean | null;
          address_line1: string | null;
          address_line2: string | null;
          billing_address_line1: string | null;
          billing_address_line2: string | null;
          billing_city: string | null;
          billing_country: string | null;
          billing_postal_code: string | null;
          billing_region: string | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          created_by: string | null;
          email: string | null;
          enseigne_id: string | null;
          first_name: string;
          has_different_billing_address: boolean | null;
          id: string;
          is_active: boolean | null;
          language_preference: string | null;
          last_name: string;
          notes: string | null;
          organisation_id: string | null;
          payment_terms_notes: string | null;
          payment_terms_type:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          pending_approval: boolean | null;
          phone: string | null;
          postal_code: string | null;
          region: string | null;
          source_affiliate_id: string | null;
          source_type:
            | Database['public']['Enums']['customer_source_type']
            | null;
          updated_at: string | null;
        };
        Insert: {
          abby_contact_id?: string | null;
          accepts_marketing?: boolean | null;
          accepts_notifications?: boolean | null;
          address_line1?: string | null;
          address_line2?: string | null;
          billing_address_line1?: string | null;
          billing_address_line2?: string | null;
          billing_city?: string | null;
          billing_country?: string | null;
          billing_postal_code?: string | null;
          billing_region?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          email?: string | null;
          enseigne_id?: string | null;
          first_name: string;
          has_different_billing_address?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          language_preference?: string | null;
          last_name: string;
          notes?: string | null;
          organisation_id?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          pending_approval?: boolean | null;
          phone?: string | null;
          postal_code?: string | null;
          region?: string | null;
          source_affiliate_id?: string | null;
          source_type?:
            | Database['public']['Enums']['customer_source_type']
            | null;
          updated_at?: string | null;
        };
        Update: {
          abby_contact_id?: string | null;
          accepts_marketing?: boolean | null;
          accepts_notifications?: boolean | null;
          address_line1?: string | null;
          address_line2?: string | null;
          billing_address_line1?: string | null;
          billing_address_line2?: string | null;
          billing_city?: string | null;
          billing_country?: string | null;
          billing_postal_code?: string | null;
          billing_region?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          email?: string | null;
          enseigne_id?: string | null;
          first_name?: string;
          has_different_billing_address?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          language_preference?: string | null;
          last_name?: string;
          notes?: string | null;
          organisation_id?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          pending_approval?: boolean | null;
          phone?: string | null;
          postal_code?: string | null;
          region?: string | null;
          source_affiliate_id?: string | null;
          source_type?:
            | Database['public']['Enums']['customer_source_type']
            | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'individual_customers_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'individual_customers_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'individual_customers_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'individual_customers_source_affiliate_id_fkey';
            columns: ['source_affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
        ];
      };
      invoice_status_history: {
        Row: {
          change_reason: string | null;
          changed_at: string;
          changed_by: string | null;
          id: string;
          invoice_id: string;
          new_status: string;
          old_status: string;
        };
        Insert: {
          change_reason?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          id?: string;
          invoice_id: string;
          new_status: string;
          old_status: string;
        };
        Update: {
          change_reason?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          id?: string;
          invoice_id?: string;
          new_status?: string;
          old_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoice_status_history_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          abby_invoice_id: string;
          abby_invoice_number: string;
          abby_pdf_url: string | null;
          abby_public_url: string | null;
          created_at: string;
          created_by: string;
          due_date: string | null;
          id: string;
          invoice_date: string;
          last_synced_from_abby_at: string | null;
          sales_order_id: string;
          status: string;
          sync_errors: Json | null;
          synced_to_abby_at: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at: string;
        };
        Insert: {
          abby_invoice_id: string;
          abby_invoice_number: string;
          abby_pdf_url?: string | null;
          abby_public_url?: string | null;
          created_at?: string;
          created_by: string;
          due_date?: string | null;
          id?: string;
          invoice_date: string;
          last_synced_from_abby_at?: string | null;
          sales_order_id: string;
          status?: string;
          sync_errors?: Json | null;
          synced_to_abby_at?: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at?: string;
        };
        Update: {
          abby_invoice_id?: string;
          abby_invoice_number?: string;
          abby_pdf_url?: string | null;
          abby_public_url?: string | null;
          created_at?: string;
          created_by?: string;
          due_date?: string | null;
          id?: string;
          invoice_date?: string;
          last_synced_from_abby_at?: string | null;
          sales_order_id?: string;
          status?: string;
          sync_errors?: Json | null;
          synced_to_abby_at?: string | null;
          total_ht?: number;
          total_ttc?: number;
          tva_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
        ];
      };
      linkme_affiliates: {
        Row: {
          accent_color: string | null;
          affiliate_type: string;
          background_color: string | null;
          bio: string | null;
          created_at: string | null;
          created_by: string | null;
          default_margin_rate: number | null;
          display_name: string;
          email: string | null;
          enseigne_id: string | null;
          id: string;
          linkme_commission_rate: number | null;
          logo_url: string | null;
          organisation_id: string | null;
          phone: string | null;
          price_display_mode: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          slug: string;
          status: string | null;
          text_color: string | null;
          tva_rate: number | null;
          updated_at: string | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          accent_color?: string | null;
          affiliate_type: string;
          background_color?: string | null;
          bio?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_margin_rate?: number | null;
          display_name: string;
          email?: string | null;
          enseigne_id?: string | null;
          id?: string;
          linkme_commission_rate?: number | null;
          logo_url?: string | null;
          organisation_id?: string | null;
          phone?: string | null;
          price_display_mode?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          slug: string;
          status?: string | null;
          text_color?: string | null;
          tva_rate?: number | null;
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          accent_color?: string | null;
          affiliate_type?: string;
          background_color?: string | null;
          bio?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_margin_rate?: number | null;
          display_name?: string;
          email?: string | null;
          enseigne_id?: string | null;
          id?: string;
          linkme_commission_rate?: number | null;
          logo_url?: string | null;
          organisation_id?: string | null;
          phone?: string | null;
          price_display_mode?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          slug?: string;
          status?: string | null;
          text_color?: string | null;
          tva_rate?: number | null;
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_affiliates_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_affiliates_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_affiliates_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_channel_suppliers: {
        Row: {
          channel_id: string;
          created_at: string;
          display_order: number | null;
          id: string;
          is_visible_as_partner: boolean;
          supplier_id: string;
          updated_at: string;
        };
        Insert: {
          channel_id: string;
          created_at?: string;
          display_order?: number | null;
          id?: string;
          is_visible_as_partner?: boolean;
          supplier_id: string;
          updated_at?: string;
        };
        Update: {
          channel_id?: string;
          created_at?: string;
          display_order?: number | null;
          id?: string;
          is_visible_as_partner?: boolean;
          supplier_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_channel_suppliers_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_channel_suppliers_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_commissions: {
        Row: {
          affiliate_commission: number;
          affiliate_commission_ttc: number | null;
          affiliate_id: string;
          created_at: string | null;
          id: string;
          linkme_commission: number;
          linkme_rate_applied: number;
          margin_rate_applied: number;
          notes: string | null;
          order_amount_ht: number;
          order_id: string;
          order_item_id: string | null;
          order_number: string | null;
          paid_at: string | null;
          paid_by: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          payment_request_id: string | null;
          selection_id: string | null;
          status: string | null;
          tax_rate: number | null;
          updated_at: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          affiliate_commission: number;
          affiliate_commission_ttc?: number | null;
          affiliate_id: string;
          created_at?: string | null;
          id?: string;
          linkme_commission: number;
          linkme_rate_applied: number;
          margin_rate_applied: number;
          notes?: string | null;
          order_amount_ht: number;
          order_id: string;
          order_item_id?: string | null;
          order_number?: string | null;
          paid_at?: string | null;
          paid_by?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_request_id?: string | null;
          selection_id?: string | null;
          status?: string | null;
          tax_rate?: number | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          affiliate_commission?: number;
          affiliate_commission_ttc?: number | null;
          affiliate_id?: string;
          created_at?: string | null;
          id?: string;
          linkme_commission?: number;
          linkme_rate_applied?: number;
          margin_rate_applied?: number;
          notes?: string | null;
          order_amount_ht?: number;
          order_id?: string;
          order_item_id?: string | null;
          order_number?: string | null;
          paid_at?: string | null;
          paid_by?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_request_id?: string | null;
          selection_id?: string | null;
          status?: string | null;
          tax_rate?: number | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_commissions_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_commissions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_commissions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_commissions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_commissions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_commissions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
          {
            foreignKeyName: 'linkme_commissions_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_order_items_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_commissions_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'sales_order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_commissions_payment_request_id_fkey';
            columns: ['payment_request_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_payment_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_commissions_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'linkme_commissions_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'linkme_commissions_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selections';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_info_requests: {
        Row: {
          cancelled_at: string | null;
          cancelled_reason: string | null;
          completed_at: string | null;
          completed_by_email: string | null;
          created_at: string | null;
          custom_message: string | null;
          id: string;
          recipient_email: string;
          recipient_name: string | null;
          recipient_type: string;
          requested_fields: Json;
          sales_order_id: string;
          sent_at: string;
          sent_by: string | null;
          submitted_data: Json | null;
          token: string;
          token_expires_at: string;
          updated_at: string | null;
        };
        Insert: {
          cancelled_at?: string | null;
          cancelled_reason?: string | null;
          completed_at?: string | null;
          completed_by_email?: string | null;
          created_at?: string | null;
          custom_message?: string | null;
          id?: string;
          recipient_email: string;
          recipient_name?: string | null;
          recipient_type: string;
          requested_fields: Json;
          sales_order_id: string;
          sent_at?: string;
          sent_by?: string | null;
          submitted_data?: Json | null;
          token?: string;
          token_expires_at?: string;
          updated_at?: string | null;
        };
        Update: {
          cancelled_at?: string | null;
          cancelled_reason?: string | null;
          completed_at?: string | null;
          completed_by_email?: string | null;
          created_at?: string | null;
          custom_message?: string | null;
          id?: string;
          recipient_email?: string;
          recipient_name?: string | null;
          recipient_type?: string;
          requested_fields?: Json;
          sales_order_id?: string;
          sent_at?: string;
          sent_by?: string | null;
          submitted_data?: Json | null;
          token?: string;
          token_expires_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_info_requests_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_info_requests_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_info_requests_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_info_requests_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_info_requests_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
        ];
      };
      linkme_page_configurations: {
        Row: {
          config: Json;
          created_at: string;
          globe_enabled: boolean;
          globe_rotation_speed: number;
          id: string;
          page_description: string | null;
          page_icon: string | null;
          page_id: string;
          page_name: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          globe_enabled?: boolean;
          globe_rotation_speed?: number;
          id?: string;
          page_description?: string | null;
          page_icon?: string | null;
          page_id: string;
          page_name: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          config?: Json;
          created_at?: string;
          globe_enabled?: boolean;
          globe_rotation_speed?: number;
          id?: string;
          page_description?: string | null;
          page_icon?: string | null;
          page_id?: string;
          page_name?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      linkme_payment_request_items: {
        Row: {
          commission_amount_ttc: number;
          commission_id: string;
          created_at: string | null;
          id: string;
          payment_request_id: string;
        };
        Insert: {
          commission_amount_ttc: number;
          commission_id: string;
          created_at?: string | null;
          id?: string;
          payment_request_id: string;
        };
        Update: {
          commission_amount_ttc?: number;
          commission_id?: string;
          created_at?: string | null;
          id?: string;
          payment_request_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_payment_request_items_commission_id_fkey';
            columns: ['commission_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_commissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_payment_request_items_payment_request_id_fkey';
            columns: ['payment_request_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_payment_requests';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_payment_requests: {
        Row: {
          affiliate_id: string;
          created_at: string | null;
          id: string;
          invoice_file_name: string | null;
          invoice_file_url: string | null;
          invoice_received_at: string | null;
          notes: string | null;
          paid_at: string | null;
          paid_by: string | null;
          payment_proof_url: string | null;
          payment_reference: string | null;
          request_number: string;
          status: string;
          tax_rate: number | null;
          total_amount_ht: number;
          total_amount_ttc: number;
          updated_at: string | null;
        };
        Insert: {
          affiliate_id: string;
          created_at?: string | null;
          id?: string;
          invoice_file_name?: string | null;
          invoice_file_url?: string | null;
          invoice_received_at?: string | null;
          notes?: string | null;
          paid_at?: string | null;
          paid_by?: string | null;
          payment_proof_url?: string | null;
          payment_reference?: string | null;
          request_number: string;
          status?: string;
          tax_rate?: number | null;
          total_amount_ht?: number;
          total_amount_ttc?: number;
          updated_at?: string | null;
        };
        Update: {
          affiliate_id?: string;
          created_at?: string | null;
          id?: string;
          invoice_file_name?: string | null;
          invoice_file_url?: string | null;
          invoice_received_at?: string | null;
          notes?: string | null;
          paid_at?: string | null;
          paid_by?: string | null;
          payment_proof_url?: string | null;
          payment_reference?: string | null;
          request_number?: string;
          status?: string;
          tax_rate?: number | null;
          total_amount_ht?: number;
          total_amount_ttc?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_payment_requests_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_selection_items: {
        Row: {
          base_price_ht: number;
          created_at: string | null;
          custom_description: string | null;
          display_order: number | null;
          id: string;
          is_featured: boolean | null;
          margin_rate: number;
          product_id: string;
          selection_id: string;
          selling_price_ht: number | null;
          updated_at: string | null;
        };
        Insert: {
          base_price_ht: number;
          created_at?: string | null;
          custom_description?: string | null;
          display_order?: number | null;
          id?: string;
          is_featured?: boolean | null;
          margin_rate: number;
          product_id: string;
          selection_id: string;
          selling_price_ht?: number | null;
          updated_at?: string | null;
        };
        Update: {
          base_price_ht?: number;
          created_at?: string | null;
          custom_description?: string | null;
          display_order?: number | null;
          id?: string;
          is_featured?: boolean | null;
          margin_rate?: number;
          product_id?: string;
          selection_id?: string;
          selling_price_ht?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_selection_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selections';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_selections: {
        Row: {
          affiliate_id: string;
          archived_at: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          orders_count: number | null;
          price_display_mode: string | null;
          products_count: number | null;
          published_at: string | null;
          share_token: string | null;
          slug: string;
          total_revenue: number | null;
          updated_at: string | null;
          view_count: number | null;
          views_count: number | null;
        };
        Insert: {
          affiliate_id: string;
          archived_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          orders_count?: number | null;
          price_display_mode?: string | null;
          products_count?: number | null;
          published_at?: string | null;
          share_token?: string | null;
          slug: string;
          total_revenue?: number | null;
          updated_at?: string | null;
          view_count?: number | null;
          views_count?: number | null;
        };
        Update: {
          affiliate_id?: string;
          archived_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          orders_count?: number | null;
          price_display_mode?: string | null;
          products_count?: number | null;
          published_at?: string | null;
          share_token?: string | null;
          slug?: string;
          total_revenue?: number | null;
          updated_at?: string | null;
          view_count?: number | null;
          views_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_selections_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_tracking: {
        Row: {
          affiliate_id: string;
          converted_at: string | null;
          converted_order_id: string | null;
          created_at: string | null;
          id: string;
          referrer_url: string | null;
          selection_id: string | null;
          session_id: string;
          user_agent: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
          visitor_ip: string | null;
        };
        Insert: {
          affiliate_id: string;
          converted_at?: string | null;
          converted_order_id?: string | null;
          created_at?: string | null;
          id?: string;
          referrer_url?: string | null;
          selection_id?: string | null;
          session_id: string;
          user_agent?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          visitor_ip?: string | null;
        };
        Update: {
          affiliate_id?: string;
          converted_at?: string | null;
          converted_order_id?: string | null;
          created_at?: string | null;
          id?: string;
          referrer_url?: string | null;
          selection_id?: string | null;
          session_id?: string;
          user_agent?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          visitor_ip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_tracking_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_tracking_converted_order_id_fkey';
            columns: ['converted_order_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_tracking_converted_order_id_fkey';
            columns: ['converted_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_tracking_converted_order_id_fkey';
            columns: ['converted_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_tracking_converted_order_id_fkey';
            columns: ['converted_order_id'];
            isOneToOne: false;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_tracking_converted_order_id_fkey';
            columns: ['converted_order_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
          {
            foreignKeyName: 'linkme_tracking_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'linkme_tracking_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'linkme_tracking_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selections';
            referencedColumns: ['id'];
          },
        ];
      };
      matching_rules: {
        Row: {
          allow_multiple_categories: boolean | null;
          applies_to_side: Database['public']['Enums']['transaction_side_filter'];
          counterparty_type: string | null;
          created_at: string | null;
          created_by: string | null;
          default_category: string | null;
          default_role_type: string | null;
          disabled_at: string | null;
          display_label: string | null;
          enabled: boolean;
          id: string;
          individual_customer_id: string | null;
          is_active: boolean | null;
          match_patterns: string[] | null;
          match_type: string;
          match_value: string;
          organisation_id: string | null;
          priority: number;
        };
        Insert: {
          allow_multiple_categories?: boolean | null;
          applies_to_side?: Database['public']['Enums']['transaction_side_filter'];
          counterparty_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_category?: string | null;
          default_role_type?: string | null;
          disabled_at?: string | null;
          display_label?: string | null;
          enabled?: boolean;
          id?: string;
          individual_customer_id?: string | null;
          is_active?: boolean | null;
          match_patterns?: string[] | null;
          match_type: string;
          match_value: string;
          organisation_id?: string | null;
          priority?: number;
        };
        Update: {
          allow_multiple_categories?: boolean | null;
          applies_to_side?: Database['public']['Enums']['transaction_side_filter'];
          counterparty_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_category?: string | null;
          default_role_type?: string | null;
          disabled_at?: string | null;
          display_label?: string | null;
          enabled?: boolean;
          id?: string;
          individual_customer_id?: string | null;
          is_active?: boolean | null;
          match_patterns?: string[] | null;
          match_type?: string;
          match_value?: string;
          organisation_id?: string | null;
          priority?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'matching_rules_individual_customer_id_fkey';
            columns: ['individual_customer_id'];
            isOneToOne: false;
            referencedRelation: 'individual_customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matching_rules_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      mcp_resolution_queue: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          error_report_id: string;
          estimated_duration_seconds: number | null;
          execution_log: Json;
          id: string;
          max_retries: number;
          mcp_tools: Json;
          priority: number;
          processed_at: string | null;
          processor_id: string | null;
          retry_count: number;
          started_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_report_id: string;
          estimated_duration_seconds?: number | null;
          execution_log?: Json;
          id?: string;
          max_retries?: number;
          mcp_tools?: Json;
          priority?: number;
          processed_at?: string | null;
          processor_id?: string | null;
          retry_count?: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_report_id?: string;
          estimated_duration_seconds?: number | null;
          execution_log?: Json;
          id?: string;
          max_retries?: number;
          mcp_tools?: Json;
          priority?: number;
          processed_at?: string | null;
          processor_id?: string | null;
          retry_count?: number;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mcp_resolution_strategies: {
        Row: {
          confidence: number;
          created_at: string;
          error_pattern: string;
          estimated_time: string;
          id: string;
          is_active: boolean;
          mcp_tools: Json;
          resolution_steps: Json;
          strategy_name: string;
          success_rate: number | null;
          updated_at: string;
        };
        Insert: {
          confidence: number;
          created_at?: string;
          error_pattern: string;
          estimated_time: string;
          id?: string;
          is_active?: boolean;
          mcp_tools?: Json;
          resolution_steps?: Json;
          strategy_name: string;
          success_rate?: number | null;
          updated_at?: string;
        };
        Update: {
          confidence?: number;
          created_at?: string;
          error_pattern?: string;
          estimated_time?: string;
          id?: string;
          is_active?: boolean;
          mcp_tools?: Json;
          resolution_steps?: Json;
          strategy_name?: string;
          success_rate?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          action_label: string | null;
          action_url: string | null;
          created_at: string | null;
          id: string;
          message: string;
          read: boolean;
          severity: string;
          title: string;
          type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          action_label?: string | null;
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          message: string;
          read?: boolean;
          severity: string;
          title: string;
          type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          action_label?: string | null;
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          message?: string;
          read?: boolean;
          severity?: string;
          title?: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      order_discounts: {
        Row: {
          applicable_channels: string[] | null;
          applicable_customer_types: string[] | null;
          code: string;
          created_at: string | null;
          created_by: string | null;
          current_uses: number | null;
          description: string | null;
          discount_type: string;
          discount_value: number;
          id: string;
          is_active: boolean | null;
          is_combinable: boolean | null;
          max_discount_amount: number | null;
          max_uses_per_customer: number | null;
          max_uses_total: number | null;
          min_order_amount: number | null;
          name: string;
          requires_code: boolean | null;
          updated_at: string | null;
          valid_from: string;
          valid_until: string;
        };
        Insert: {
          applicable_channels?: string[] | null;
          applicable_customer_types?: string[] | null;
          code: string;
          created_at?: string | null;
          created_by?: string | null;
          current_uses?: number | null;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          id?: string;
          is_active?: boolean | null;
          is_combinable?: boolean | null;
          max_discount_amount?: number | null;
          max_uses_per_customer?: number | null;
          max_uses_total?: number | null;
          min_order_amount?: number | null;
          name: string;
          requires_code?: boolean | null;
          updated_at?: string | null;
          valid_from: string;
          valid_until: string;
        };
        Update: {
          applicable_channels?: string[] | null;
          applicable_customer_types?: string[] | null;
          code?: string;
          created_at?: string | null;
          created_by?: string | null;
          current_uses?: number | null;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          id?: string;
          is_active?: boolean | null;
          is_combinable?: boolean | null;
          max_discount_amount?: number | null;
          max_uses_per_customer?: number | null;
          max_uses_total?: number | null;
          min_order_amount?: number | null;
          name?: string;
          requires_code?: boolean | null;
          updated_at?: string | null;
          valid_from?: string;
          valid_until?: string;
        };
        Relationships: [];
      };
      organisations: {
        Row: {
          abby_customer_id: string | null;
          address_line1: string | null;
          address_line2: string | null;
          approval_status: string | null;
          approved_at: string | null;
          approved_by: string | null;
          archived_at: string | null;
          billing_address_line1: string | null;
          billing_address_line2: string | null;
          billing_city: string | null;
          billing_country: string | null;
          billing_postal_code: string | null;
          billing_region: string | null;
          certification_labels: string[] | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          created_by: string | null;
          currency: string | null;
          customer_type: string | null;
          default_channel_id: string | null;
          default_vat_rate: number | null;
          delivery_time_days: number | null;
          email: string | null;
          enseigne_id: string | null;
          has_different_shipping_address: boolean | null;
          has_different_trade_name: boolean;
          id: string;
          industry_sector: string | null;
          is_active: boolean | null;
          is_enseigne_parent: boolean;
          is_service_provider: boolean | null;
          latitude: number | null;
          legal_form: string | null;
          legal_name: string;
          linkme_code: string | null;
          logo_url: string | null;
          longitude: number | null;
          minimum_order_amount: number | null;
          notes: string | null;
          ownership_type:
            | Database['public']['Enums']['organisation_ownership_type']
            | null;
          payment_terms: string | null;
          payment_terms_notes: string | null;
          payment_terms_type:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          phone: string | null;
          postal_code: string | null;
          preferred_supplier: boolean | null;
          prepayment_required: boolean | null;
          rating: number | null;
          region: string | null;
          secondary_email: string | null;
          shipping_address_line1: string | null;
          shipping_address_line2: string | null;
          shipping_city: string | null;
          shipping_country: string | null;
          shipping_postal_code: string | null;
          shipping_region: string | null;
          show_on_linkme_globe: boolean | null;
          siren: string | null;
          siret: string | null;
          source: string | null;
          source_affiliate_id: string | null;
          source_type:
            | Database['public']['Enums']['customer_source_type']
            | null;
          supplier_segment:
            | Database['public']['Enums']['supplier_segment_type']
            | null;
          trade_name: string | null;
          type: Database['public']['Enums']['organisation_type'] | null;
          updated_at: string | null;
          vat_number: string | null;
          website: string | null;
        };
        Insert: {
          abby_customer_id?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          archived_at?: string | null;
          billing_address_line1?: string | null;
          billing_address_line2?: string | null;
          billing_city?: string | null;
          billing_country?: string | null;
          billing_postal_code?: string | null;
          billing_region?: string | null;
          certification_labels?: string[] | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          customer_type?: string | null;
          default_channel_id?: string | null;
          default_vat_rate?: number | null;
          delivery_time_days?: number | null;
          email?: string | null;
          enseigne_id?: string | null;
          has_different_shipping_address?: boolean | null;
          has_different_trade_name?: boolean;
          id?: string;
          industry_sector?: string | null;
          is_active?: boolean | null;
          is_enseigne_parent?: boolean;
          is_service_provider?: boolean | null;
          latitude?: number | null;
          legal_form?: string | null;
          legal_name: string;
          linkme_code?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          minimum_order_amount?: number | null;
          notes?: string | null;
          ownership_type?:
            | Database['public']['Enums']['organisation_ownership_type']
            | null;
          payment_terms?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          phone?: string | null;
          postal_code?: string | null;
          preferred_supplier?: boolean | null;
          prepayment_required?: boolean | null;
          rating?: number | null;
          region?: string | null;
          secondary_email?: string | null;
          shipping_address_line1?: string | null;
          shipping_address_line2?: string | null;
          shipping_city?: string | null;
          shipping_country?: string | null;
          shipping_postal_code?: string | null;
          shipping_region?: string | null;
          show_on_linkme_globe?: boolean | null;
          siren?: string | null;
          siret?: string | null;
          source?: string | null;
          source_affiliate_id?: string | null;
          source_type?:
            | Database['public']['Enums']['customer_source_type']
            | null;
          supplier_segment?:
            | Database['public']['Enums']['supplier_segment_type']
            | null;
          trade_name?: string | null;
          type?: Database['public']['Enums']['organisation_type'] | null;
          updated_at?: string | null;
          vat_number?: string | null;
          website?: string | null;
        };
        Update: {
          abby_customer_id?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          archived_at?: string | null;
          billing_address_line1?: string | null;
          billing_address_line2?: string | null;
          billing_city?: string | null;
          billing_country?: string | null;
          billing_postal_code?: string | null;
          billing_region?: string | null;
          certification_labels?: string[] | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          customer_type?: string | null;
          default_channel_id?: string | null;
          default_vat_rate?: number | null;
          delivery_time_days?: number | null;
          email?: string | null;
          enseigne_id?: string | null;
          has_different_shipping_address?: boolean | null;
          has_different_trade_name?: boolean;
          id?: string;
          industry_sector?: string | null;
          is_active?: boolean | null;
          is_enseigne_parent?: boolean;
          is_service_provider?: boolean | null;
          latitude?: number | null;
          legal_form?: string | null;
          legal_name?: string;
          linkme_code?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          minimum_order_amount?: number | null;
          notes?: string | null;
          ownership_type?:
            | Database['public']['Enums']['organisation_ownership_type']
            | null;
          payment_terms?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          phone?: string | null;
          postal_code?: string | null;
          preferred_supplier?: boolean | null;
          prepayment_required?: boolean | null;
          rating?: number | null;
          region?: string | null;
          secondary_email?: string | null;
          shipping_address_line1?: string | null;
          shipping_address_line2?: string | null;
          shipping_city?: string | null;
          shipping_country?: string | null;
          shipping_postal_code?: string | null;
          shipping_region?: string | null;
          show_on_linkme_globe?: boolean | null;
          siren?: string | null;
          siret?: string | null;
          source?: string | null;
          source_affiliate_id?: string | null;
          source_type?:
            | Database['public']['Enums']['customer_source_type']
            | null;
          supplier_segment?:
            | Database['public']['Enums']['supplier_segment_type']
            | null;
          trade_name?: string | null;
          type?: Database['public']['Enums']['organisation_type'] | null;
          updated_at?: string | null;
          vat_number?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'organisations_default_channel_id_fkey';
            columns: ['default_channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organisations_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organisations_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organisations_source_affiliate_id_fkey';
            columns: ['source_affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          abby_payment_id: string | null;
          amount_paid: number;
          created_at: string;
          created_by: string | null;
          id: string;
          invoice_id: string;
          notes: string | null;
          payment_date: string;
          payment_method: string | null;
          synced_from_abby_at: string | null;
          transaction_reference: string | null;
        };
        Insert: {
          abby_payment_id?: string | null;
          amount_paid: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_id: string;
          notes?: string | null;
          payment_date: string;
          payment_method?: string | null;
          synced_from_abby_at?: string | null;
          transaction_reference?: string | null;
        };
        Update: {
          abby_payment_id?: string | null;
          amount_paid?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_id?: string;
          notes?: string | null;
          payment_date?: string;
          payment_method?: string | null;
          synced_from_abby_at?: string | null;
          transaction_reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
      pcg_categories: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          label: string;
          level: number;
          parent_code: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          label: string;
          level?: number;
          parent_code?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          label?: string;
          level?: number;
          parent_code?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      price_list_history: {
        Row: {
          change_reason: string | null;
          change_type: string;
          changed_at: string | null;
          changed_by: string | null;
          id: string;
          ip_address: unknown;
          max_quantity: number | null;
          min_quantity: number | null;
          price_ht_after: number;
          price_ht_before: number | null;
          price_list_id: string;
          price_list_item_id: string | null;
          product_id: string;
          source: string | null;
          user_agent: string | null;
        };
        Insert: {
          change_reason?: string | null;
          change_type: string;
          changed_at?: string | null;
          changed_by?: string | null;
          id?: string;
          ip_address?: unknown;
          max_quantity?: number | null;
          min_quantity?: number | null;
          price_ht_after: number;
          price_ht_before?: number | null;
          price_list_id: string;
          price_list_item_id?: string | null;
          product_id: string;
          source?: string | null;
          user_agent?: string | null;
        };
        Update: {
          change_reason?: string | null;
          change_type?: string;
          changed_at?: string | null;
          changed_by?: string | null;
          id?: string;
          ip_address?: unknown;
          max_quantity?: number | null;
          min_quantity?: number | null;
          price_ht_after?: number;
          price_ht_before?: number | null;
          price_list_id?: string;
          price_list_item_id?: string | null;
          product_id?: string;
          source?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'price_list_history_price_list_item_id_fkey';
            columns: ['price_list_item_id'];
            isOneToOne: false;
            referencedRelation: 'price_list_items';
            referencedColumns: ['id'];
          },
        ];
      };
      price_list_items: {
        Row: {
          attributes: Json | null;
          cost_price: number | null;
          created_at: string | null;
          created_by: string | null;
          currency: string | null;
          discount_rate: number | null;
          id: string;
          is_active: boolean | null;
          margin_rate: number | null;
          max_quantity: number | null;
          min_quantity: number | null;
          notes: string | null;
          price_ht: number;
          price_list_id: string;
          product_id: string;
          suggested_retail_price: number | null;
          tags: string[] | null;
          updated_at: string | null;
          updated_by: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          attributes?: Json | null;
          cost_price?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          discount_rate?: number | null;
          id?: string;
          is_active?: boolean | null;
          margin_rate?: number | null;
          max_quantity?: number | null;
          min_quantity?: number | null;
          notes?: string | null;
          price_ht: number;
          price_list_id: string;
          product_id: string;
          suggested_retail_price?: number | null;
          tags?: string[] | null;
          updated_at?: string | null;
          updated_by?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          attributes?: Json | null;
          cost_price?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          discount_rate?: number | null;
          id?: string;
          is_active?: boolean | null;
          margin_rate?: number | null;
          max_quantity?: number | null;
          min_quantity?: number | null;
          notes?: string | null;
          price_ht?: number;
          price_list_id?: string;
          product_id?: string;
          suggested_retail_price?: number | null;
          tags?: string[] | null;
          updated_at?: string | null;
          updated_by?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'price_list_items_price_list_id_fkey';
            columns: ['price_list_id'];
            isOneToOne: false;
            referencedRelation: 'price_lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_list_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_list_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_list_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_list_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      price_lists: {
        Row: {
          code: string;
          config: Json | null;
          created_at: string | null;
          created_by: string | null;
          currency: string | null;
          description: string | null;
          id: string;
          includes_tax: boolean | null;
          is_active: boolean | null;
          list_type: string;
          name: string;
          priority: number;
          product_count: number | null;
          requires_approval: boolean | null;
          updated_at: string | null;
          updated_by: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          code: string;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          includes_tax?: boolean | null;
          is_active?: boolean | null;
          list_type: string;
          name: string;
          priority?: number;
          product_count?: number | null;
          requires_approval?: boolean | null;
          updated_at?: string | null;
          updated_by?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          code?: string;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          includes_tax?: boolean | null;
          is_active?: boolean | null;
          list_type?: string;
          name?: string;
          priority?: number;
          product_count?: number | null;
          requires_approval?: boolean | null;
          updated_at?: string | null;
          updated_by?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      product_colors: {
        Row: {
          created_at: string | null;
          hex_code: string | null;
          id: string;
          is_predefined: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          hex_code?: string | null;
          id?: string;
          is_predefined?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          hex_code?: string | null;
          id?: string;
          is_predefined?: boolean | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_commission_history: {
        Row: {
          change_reason: string | null;
          change_type: string;
          id: string;
          modified_at: string;
          modified_by: string | null;
          new_commission_rate: number | null;
          new_payout_ht: number | null;
          old_commission_rate: number | null;
          old_payout_ht: number | null;
          product_id: string;
        };
        Insert: {
          change_reason?: string | null;
          change_type: string;
          id?: string;
          modified_at?: string;
          modified_by?: string | null;
          new_commission_rate?: number | null;
          new_payout_ht?: number | null;
          old_commission_rate?: number | null;
          old_payout_ht?: number | null;
          product_id: string;
        };
        Update: {
          change_reason?: string | null;
          change_type?: string;
          id?: string;
          modified_at?: string;
          modified_by?: string | null;
          new_commission_rate?: number | null;
          new_payout_ht?: number | null;
          old_commission_rate?: number | null;
          old_payout_ht?: number | null;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_commission_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_commission_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_commission_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_commission_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      product_drafts: {
        Row: {
          category_id: string | null;
          color: string | null;
          condition: string | null;
          cost_price: number | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          dimensions: Json | null;
          family_id: string | null;
          gallery_images: Json | null;
          gtin: string | null;
          id: string;
          material: string | null;
          min_stock_level: number | null;
          name: string | null;
          price_ht: number | null;
          primary_image_url: string | null;
          product_group_id: string | null;
          selling_price: number | null;
          sku: string | null;
          status: string | null;
          stock_quantity: number | null;
          subcategory_id: string | null;
          supplier_price: number | null;
          supplier_reference: string | null;
          tax_rate: number | null;
          updated_at: string | null;
          weight: number | null;
          wizard_step_completed: number | null;
        };
        Insert: {
          category_id?: string | null;
          color?: string | null;
          condition?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          family_id?: string | null;
          gallery_images?: Json | null;
          gtin?: string | null;
          id?: string;
          material?: string | null;
          min_stock_level?: number | null;
          name?: string | null;
          price_ht?: number | null;
          primary_image_url?: string | null;
          product_group_id?: string | null;
          selling_price?: number | null;
          sku?: string | null;
          status?: string | null;
          stock_quantity?: number | null;
          subcategory_id?: string | null;
          supplier_price?: number | null;
          supplier_reference?: string | null;
          tax_rate?: number | null;
          updated_at?: string | null;
          weight?: number | null;
          wizard_step_completed?: number | null;
        };
        Update: {
          category_id?: string | null;
          color?: string | null;
          condition?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          family_id?: string | null;
          gallery_images?: Json | null;
          gtin?: string | null;
          id?: string;
          material?: string | null;
          min_stock_level?: number | null;
          name?: string | null;
          price_ht?: number | null;
          primary_image_url?: string | null;
          product_group_id?: string | null;
          selling_price?: number | null;
          sku?: string | null;
          status?: string | null;
          stock_quantity?: number | null;
          subcategory_id?: string | null;
          supplier_price?: number | null;
          supplier_reference?: string | null;
          tax_rate?: number | null;
          updated_at?: string | null;
          weight?: number | null;
          wizard_step_completed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_drafts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_drafts_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_drafts_product_group_id_fkey';
            columns: ['product_group_id'];
            isOneToOne: false;
            referencedRelation: 'product_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_drafts_subcategory_id_fkey';
            columns: ['subcategory_id'];
            isOneToOne: false;
            referencedRelation: 'subcategories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_group_members: {
        Row: {
          added_at: string | null;
          group_id: string;
          id: string;
          is_primary: boolean | null;
          product_id: string;
          sort_order: number | null;
        };
        Insert: {
          added_at?: string | null;
          group_id: string;
          id?: string;
          is_primary?: boolean | null;
          product_id: string;
          sort_order?: number | null;
        };
        Update: {
          added_at?: string | null;
          group_id?: string;
          id?: string;
          is_primary?: boolean | null;
          product_id?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'product_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_group_members_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_group_members_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_group_members_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_group_members_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      product_groups: {
        Row: {
          created_at: string | null;
          description: string | null;
          group_type: string | null;
          id: string;
          is_active: boolean | null;
          item_group_id: string;
          name: string;
          primary_product_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          group_type?: string | null;
          id?: string;
          is_active?: boolean | null;
          item_group_id: string;
          name: string;
          primary_product_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          group_type?: string | null;
          id?: string;
          is_active?: boolean | null;
          item_group_id?: string;
          name?: string;
          primary_product_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_groups_primary_product_id_fkey';
            columns: ['primary_product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_groups_primary_product_id_fkey';
            columns: ['primary_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_groups_primary_product_id_fkey';
            columns: ['primary_product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_groups_primary_product_id_fkey';
            columns: ['primary_product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string | null;
          created_by: string | null;
          display_order: number | null;
          file_size: number | null;
          format: string | null;
          height: number | null;
          id: string;
          image_type: Database['public']['Enums']['image_type_enum'] | null;
          is_primary: boolean | null;
          product_id: string;
          public_url: string | null;
          storage_path: string;
          updated_at: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          display_order?: number | null;
          file_size?: number | null;
          format?: string | null;
          height?: number | null;
          id?: string;
          image_type?: Database['public']['Enums']['image_type_enum'] | null;
          is_primary?: boolean | null;
          product_id: string;
          public_url?: string | null;
          storage_path: string;
          updated_at?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          display_order?: number | null;
          file_size?: number | null;
          format?: string | null;
          height?: number | null;
          id?: string;
          image_type?: Database['public']['Enums']['image_type_enum'] | null;
          is_primary?: boolean | null;
          product_id?: string;
          public_url?: string | null;
          storage_path?: string;
          updated_at?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      product_packages: {
        Row: {
          base_quantity: number;
          created_at: string | null;
          description: string | null;
          discount_rate: number | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          min_order_quantity: number | null;
          name: string;
          product_id: string;
          type: Database['public']['Enums']['package_type'];
          unit_price_ht: number | null;
          updated_at: string | null;
        };
        Insert: {
          base_quantity?: number;
          created_at?: string | null;
          description?: string | null;
          discount_rate?: number | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          min_order_quantity?: number | null;
          name: string;
          product_id: string;
          type: Database['public']['Enums']['package_type'];
          unit_price_ht?: number | null;
          updated_at?: string | null;
        };
        Update: {
          base_quantity?: number;
          created_at?: string | null;
          description?: string | null;
          discount_rate?: number | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          min_order_quantity?: number | null;
          name?: string;
          product_id?: string;
          type?: Database['public']['Enums']['package_type'];
          unit_price_ht?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_packages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_packages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_packages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_packages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      product_purchase_history: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          purchase_order_id: string;
          purchase_order_item_id: string;
          purchased_at: string;
          quantity: number;
          unit_cost_net: number | null;
          unit_price_ht: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          purchase_order_id: string;
          purchase_order_item_id: string;
          purchased_at: string;
          quantity: number;
          unit_cost_net?: number | null;
          unit_price_ht: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          purchase_order_id?: string;
          purchase_order_item_id?: string;
          purchased_at?: string;
          quantity?: number;
          unit_cost_net?: number | null;
          unit_price_ht?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'product_purchase_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_purchase_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_purchase_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_purchase_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_purchase_history_purchase_order_id_fkey';
            columns: ['purchase_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_purchase_history_purchase_order_item_id_fkey';
            columns: ['purchase_order_item_id'];
            isOneToOne: false;
            referencedRelation: 'customer_samples_view';
            referencedColumns: ['sample_id'];
          },
          {
            foreignKeyName: 'product_purchase_history_purchase_order_item_id_fkey';
            columns: ['purchase_order_item_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_order_items';
            referencedColumns: ['id'];
          },
        ];
      };
      product_status_changes: {
        Row: {
          change_reason: string;
          created_at: string | null;
          id: string;
          new_status: string;
          old_status: string;
          product_id: string;
        };
        Insert: {
          change_reason?: string;
          created_at?: string | null;
          id?: string;
          new_status: string;
          old_status: string;
          product_id: string;
        };
        Update: {
          change_reason?: string;
          created_at?: string | null;
          id?: string;
          new_status?: string;
          old_status?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_status_changes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_status_changes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_status_changes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_status_changes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      products: {
        Row: {
          affiliate_approval_status:
            | Database['public']['Enums']['affiliate_product_approval_status']
            | null;
          affiliate_approved_at: string | null;
          affiliate_approved_by: string | null;
          affiliate_commission_rate: number | null;
          affiliate_payout_ht: number | null;
          affiliate_rejection_reason: string | null;
          archived_at: string | null;
          article_type: Database['public']['Enums']['article_type'];
          assigned_client_id: string | null;
          availability_type:
            | Database['public']['Enums']['availability_type_enum']
            | null;
          brand: string | null;
          completion_percentage: number | null;
          completion_status: string | null;
          condition: string | null;
          cost_net_avg: number | null;
          cost_net_last: number | null;
          cost_net_max: number | null;
          cost_net_min: number | null;
          cost_price: number | null;
          cost_price_avg: number | null;
          cost_price_count: number;
          cost_price_last: number | null;
          cost_price_max: number | null;
          cost_price_min: number | null;
          created_at: string | null;
          created_by_affiliate: string | null;
          creation_mode: string | null;
          description: string | null;
          dimensions: Json | null;
          eco_tax_default: number | null;
          enseigne_id: string | null;
          gtin: string | null;
          has_images: boolean;
          id: string;
          is_published_online: boolean | null;
          item_group_id: string | null;
          margin_percentage: number | null;
          meta_description: string | null;
          meta_title: string | null;
          min_stock: number | null;
          name: string;
          product_status: Database['public']['Enums']['product_status_type'];
          product_type: string | null;
          publication_date: string | null;
          rejection_reason: string | null;
          reorder_point: number | null;
          requires_sample: boolean | null;
          search_vector: unknown;
          selling_points: Json | null;
          show_on_linkme_globe: boolean | null;
          sku: string;
          slug: string | null;
          sourcing_type: string | null;
          stock_forecasted_in: number | null;
          stock_forecasted_out: number | null;
          stock_quantity: number | null;
          stock_real: number | null;
          stock_status: Database['public']['Enums']['stock_status_type'];
          store_at_verone: boolean | null;
          style: string | null;
          subcategory_id: string | null;
          suitable_rooms: Database['public']['Enums']['room_type'][] | null;
          supplier_id: string | null;
          supplier_moq: number | null;
          supplier_page_url: string | null;
          supplier_reference: string | null;
          target_margin_percentage: number | null;
          technical_description: string | null;
          unpublication_date: string | null;
          updated_at: string | null;
          variant_attributes: Json | null;
          variant_group_id: string | null;
          variant_position: number | null;
          video_url: string | null;
          weight: number | null;
        };
        Insert: {
          affiliate_approval_status?:
            | Database['public']['Enums']['affiliate_product_approval_status']
            | null;
          affiliate_approved_at?: string | null;
          affiliate_approved_by?: string | null;
          affiliate_commission_rate?: number | null;
          affiliate_payout_ht?: number | null;
          affiliate_rejection_reason?: string | null;
          archived_at?: string | null;
          article_type?: Database['public']['Enums']['article_type'];
          assigned_client_id?: string | null;
          availability_type?:
            | Database['public']['Enums']['availability_type_enum']
            | null;
          brand?: string | null;
          completion_percentage?: number | null;
          completion_status?: string | null;
          condition?: string | null;
          cost_net_avg?: number | null;
          cost_net_last?: number | null;
          cost_net_max?: number | null;
          cost_net_min?: number | null;
          cost_price?: number | null;
          cost_price_avg?: number | null;
          cost_price_count?: number;
          cost_price_last?: number | null;
          cost_price_max?: number | null;
          cost_price_min?: number | null;
          created_at?: string | null;
          created_by_affiliate?: string | null;
          creation_mode?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          eco_tax_default?: number | null;
          enseigne_id?: string | null;
          gtin?: string | null;
          has_images?: boolean;
          id?: string;
          is_published_online?: boolean | null;
          item_group_id?: string | null;
          margin_percentage?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          min_stock?: number | null;
          name: string;
          product_status?: Database['public']['Enums']['product_status_type'];
          product_type?: string | null;
          publication_date?: string | null;
          rejection_reason?: string | null;
          reorder_point?: number | null;
          requires_sample?: boolean | null;
          search_vector?: unknown;
          selling_points?: Json | null;
          show_on_linkme_globe?: boolean | null;
          sku: string;
          slug?: string | null;
          sourcing_type?: string | null;
          stock_forecasted_in?: number | null;
          stock_forecasted_out?: number | null;
          stock_quantity?: number | null;
          stock_real?: number | null;
          stock_status?: Database['public']['Enums']['stock_status_type'];
          store_at_verone?: boolean | null;
          style?: string | null;
          subcategory_id?: string | null;
          suitable_rooms?: Database['public']['Enums']['room_type'][] | null;
          supplier_id?: string | null;
          supplier_moq?: number | null;
          supplier_page_url?: string | null;
          supplier_reference?: string | null;
          target_margin_percentage?: number | null;
          technical_description?: string | null;
          unpublication_date?: string | null;
          updated_at?: string | null;
          variant_attributes?: Json | null;
          variant_group_id?: string | null;
          variant_position?: number | null;
          video_url?: string | null;
          weight?: number | null;
        };
        Update: {
          affiliate_approval_status?:
            | Database['public']['Enums']['affiliate_product_approval_status']
            | null;
          affiliate_approved_at?: string | null;
          affiliate_approved_by?: string | null;
          affiliate_commission_rate?: number | null;
          affiliate_payout_ht?: number | null;
          affiliate_rejection_reason?: string | null;
          archived_at?: string | null;
          article_type?: Database['public']['Enums']['article_type'];
          assigned_client_id?: string | null;
          availability_type?:
            | Database['public']['Enums']['availability_type_enum']
            | null;
          brand?: string | null;
          completion_percentage?: number | null;
          completion_status?: string | null;
          condition?: string | null;
          cost_net_avg?: number | null;
          cost_net_last?: number | null;
          cost_net_max?: number | null;
          cost_net_min?: number | null;
          cost_price?: number | null;
          cost_price_avg?: number | null;
          cost_price_count?: number;
          cost_price_last?: number | null;
          cost_price_max?: number | null;
          cost_price_min?: number | null;
          created_at?: string | null;
          created_by_affiliate?: string | null;
          creation_mode?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          eco_tax_default?: number | null;
          enseigne_id?: string | null;
          gtin?: string | null;
          has_images?: boolean;
          id?: string;
          is_published_online?: boolean | null;
          item_group_id?: string | null;
          margin_percentage?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          min_stock?: number | null;
          name?: string;
          product_status?: Database['public']['Enums']['product_status_type'];
          product_type?: string | null;
          publication_date?: string | null;
          rejection_reason?: string | null;
          reorder_point?: number | null;
          requires_sample?: boolean | null;
          search_vector?: unknown;
          selling_points?: Json | null;
          show_on_linkme_globe?: boolean | null;
          sku?: string;
          slug?: string | null;
          sourcing_type?: string | null;
          stock_forecasted_in?: number | null;
          stock_forecasted_out?: number | null;
          stock_quantity?: number | null;
          stock_real?: number | null;
          stock_status?: Database['public']['Enums']['stock_status_type'];
          store_at_verone?: boolean | null;
          style?: string | null;
          subcategory_id?: string | null;
          suitable_rooms?: Database['public']['Enums']['room_type'][] | null;
          supplier_id?: string | null;
          supplier_moq?: number | null;
          supplier_page_url?: string | null;
          supplier_reference?: string | null;
          target_margin_percentage?: number | null;
          technical_description?: string | null;
          unpublication_date?: string | null;
          updated_at?: string | null;
          variant_attributes?: Json | null;
          variant_group_id?: string | null;
          variant_position?: number | null;
          video_url?: string | null;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_products_variant_group';
            columns: ['variant_group_id'];
            isOneToOne: false;
            referencedRelation: 'variant_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_assigned_client_id_fkey';
            columns: ['assigned_client_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_created_by_affiliate_fkey';
            columns: ['created_by_affiliate'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_subcategory_id_fkey';
            columns: ['subcategory_id'];
            isOneToOne: false;
            referencedRelation: 'subcategories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_order_items: {
        Row: {
          allocated_customs_ht: number;
          allocated_insurance_ht: number;
          allocated_shipping_ht: number;
          archived_at: string | null;
          created_at: string;
          customer_individual_id: string | null;
          customer_organisation_id: string | null;
          discount_percentage: number;
          eco_tax: number;
          expected_delivery_date: string | null;
          id: string;
          notes: string | null;
          product_id: string;
          purchase_order_id: string;
          quantity: number;
          quantity_received: number;
          sample_type: string | null;
          total_ht: number | null;
          unit_cost_net: number | null;
          unit_price_ht: number;
          updated_at: string;
        };
        Insert: {
          allocated_customs_ht?: number;
          allocated_insurance_ht?: number;
          allocated_shipping_ht?: number;
          archived_at?: string | null;
          created_at?: string;
          customer_individual_id?: string | null;
          customer_organisation_id?: string | null;
          discount_percentage?: number;
          eco_tax?: number;
          expected_delivery_date?: string | null;
          id?: string;
          notes?: string | null;
          product_id: string;
          purchase_order_id: string;
          quantity: number;
          quantity_received?: number;
          sample_type?: string | null;
          total_ht?: number | null;
          unit_cost_net?: number | null;
          unit_price_ht: number;
          updated_at?: string;
        };
        Update: {
          allocated_customs_ht?: number;
          allocated_insurance_ht?: number;
          allocated_shipping_ht?: number;
          archived_at?: string | null;
          created_at?: string;
          customer_individual_id?: string | null;
          customer_organisation_id?: string | null;
          discount_percentage?: number;
          eco_tax?: number;
          expected_delivery_date?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string;
          purchase_order_id?: string;
          quantity?: number;
          quantity_received?: number;
          sample_type?: string | null;
          total_ht?: number | null;
          unit_cost_net?: number | null;
          unit_price_ht?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_order_items_customer_individual_id_fkey';
            columns: ['customer_individual_id'];
            isOneToOne: false;
            referencedRelation: 'individual_customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_items_customer_organisation_id_fkey';
            columns: ['customer_organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'purchase_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'purchase_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'purchase_order_items_purchase_order_id_fkey';
            columns: ['purchase_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_order_receptions: {
        Row: {
          affiliate_id: string | null;
          batch_number: string | null;
          created_at: string | null;
          id: string;
          notes: string | null;
          product_id: string;
          purchase_order_id: string | null;
          quantity_expected: number | null;
          quantity_received: number;
          received_at: string;
          received_by: string | null;
          reference_type: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          affiliate_id?: string | null;
          batch_number?: string | null;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          product_id: string;
          purchase_order_id?: string | null;
          quantity_expected?: number | null;
          quantity_received: number;
          received_at?: string;
          received_by?: string | null;
          reference_type?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          affiliate_id?: string | null;
          batch_number?: string | null;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string;
          purchase_order_id?: string | null;
          quantity_expected?: number | null;
          quantity_received?: number;
          received_at?: string;
          received_by?: string | null;
          reference_type?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_order_receptions_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_receptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'purchase_order_receptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_receptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'purchase_order_receptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'purchase_order_receptions_purchase_order_id_fkey';
            columns: ['purchase_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_orders: {
        Row: {
          cancelled_at: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          customs_cost_ht: number | null;
          delivery_address: Json | null;
          eco_tax_total: number;
          eco_tax_vat_rate: number | null;
          expected_delivery_date: string | null;
          fees_vat_rate: number | null;
          id: string;
          insurance_cost_ht: number | null;
          manual_payment_by: string | null;
          manual_payment_date: string | null;
          manual_payment_note: string | null;
          manual_payment_reference: string | null;
          manual_payment_type:
            | Database['public']['Enums']['manual_payment_type']
            | null;
          notes: string | null;
          order_date: string | null;
          payment_status_v2: string | null;
          payment_terms: string | null;
          payment_terms_notes: string | null;
          payment_terms_type:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          po_number: string;
          received_at: string | null;
          received_by: string | null;
          sent_at: string | null;
          sent_by: string | null;
          shipping_cost_ht: number | null;
          status: Database['public']['Enums']['purchase_order_status'];
          supplier_id: string;
          tax_rate: number;
          total_ht: number;
          total_ttc: number;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          cancelled_at?: string | null;
          created_at?: string;
          created_by: string;
          currency?: string;
          customs_cost_ht?: number | null;
          delivery_address?: Json | null;
          eco_tax_total?: number;
          eco_tax_vat_rate?: number | null;
          expected_delivery_date?: string | null;
          fees_vat_rate?: number | null;
          id?: string;
          insurance_cost_ht?: number | null;
          manual_payment_by?: string | null;
          manual_payment_date?: string | null;
          manual_payment_note?: string | null;
          manual_payment_reference?: string | null;
          manual_payment_type?:
            | Database['public']['Enums']['manual_payment_type']
            | null;
          notes?: string | null;
          order_date?: string | null;
          payment_status_v2?: string | null;
          payment_terms?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          po_number: string;
          received_at?: string | null;
          received_by?: string | null;
          sent_at?: string | null;
          sent_by?: string | null;
          shipping_cost_ht?: number | null;
          status?: Database['public']['Enums']['purchase_order_status'];
          supplier_id: string;
          tax_rate?: number;
          total_ht?: number;
          total_ttc?: number;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          cancelled_at?: string | null;
          created_at?: string;
          created_by?: string;
          currency?: string;
          customs_cost_ht?: number | null;
          delivery_address?: Json | null;
          eco_tax_total?: number;
          eco_tax_vat_rate?: number | null;
          expected_delivery_date?: string | null;
          fees_vat_rate?: number | null;
          id?: string;
          insurance_cost_ht?: number | null;
          manual_payment_by?: string | null;
          manual_payment_date?: string | null;
          manual_payment_note?: string | null;
          manual_payment_reference?: string | null;
          manual_payment_type?:
            | Database['public']['Enums']['manual_payment_type']
            | null;
          notes?: string | null;
          order_date?: string | null;
          payment_status_v2?: string | null;
          payment_terms?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          po_number?: string;
          received_at?: string | null;
          received_by?: string | null;
          sent_at?: string | null;
          sent_by?: string | null;
          shipping_cost_ht?: number | null;
          status?: Database['public']['Enums']['purchase_order_status'];
          supplier_id?: string;
          tax_rate?: number;
          total_ht?: number;
          total_ttc?: number;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_orders_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      sales_channels: {
        Row: {
          code: string;
          config: Json | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string | null;
          created_by: string | null;
          default_discount_rate: number | null;
          default_meta_description: string | null;
          default_meta_title: string | null;
          description: string | null;
          display_order: number | null;
          domain_url: string | null;
          icon_name: string | null;
          id: string;
          is_active: boolean | null;
          meta_keywords: string[] | null;
          min_order_value: number | null;
          name: string;
          requires_approval: boolean | null;
          site_logo_url: string | null;
          site_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          config?: Json | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_discount_rate?: number | null;
          default_meta_description?: string | null;
          default_meta_title?: string | null;
          description?: string | null;
          display_order?: number | null;
          domain_url?: string | null;
          icon_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          meta_keywords?: string[] | null;
          min_order_value?: number | null;
          name: string;
          requires_approval?: boolean | null;
          site_logo_url?: string | null;
          site_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          config?: Json | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_discount_rate?: number | null;
          default_meta_description?: string | null;
          default_meta_title?: string | null;
          description?: string | null;
          display_order?: number | null;
          domain_url?: string | null;
          icon_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          meta_keywords?: string[] | null;
          min_order_value?: number | null;
          name?: string;
          requires_approval?: boolean | null;
          site_logo_url?: string | null;
          site_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sales_order_items: {
        Row: {
          base_price_ht_locked: number | null;
          created_at: string;
          discount_percentage: number;
          eco_tax: number;
          expected_delivery_date: string | null;
          id: string;
          is_sample: boolean;
          linkme_selection_item_id: string | null;
          notes: string | null;
          price_locked_at: string | null;
          product_id: string;
          quantity: number;
          quantity_shipped: number;
          retrocession_amount: number | null;
          retrocession_amount_ttc: number | null;
          retrocession_rate: number | null;
          sales_order_id: string;
          selling_price_ht_locked: number | null;
          tax_rate: number;
          total_ht: number | null;
          unit_price_ht: number;
          updated_at: string;
        };
        Insert: {
          base_price_ht_locked?: number | null;
          created_at?: string;
          discount_percentage?: number;
          eco_tax?: number;
          expected_delivery_date?: string | null;
          id?: string;
          is_sample?: boolean;
          linkme_selection_item_id?: string | null;
          notes?: string | null;
          price_locked_at?: string | null;
          product_id: string;
          quantity: number;
          quantity_shipped?: number;
          retrocession_amount?: number | null;
          retrocession_amount_ttc?: number | null;
          retrocession_rate?: number | null;
          sales_order_id: string;
          selling_price_ht_locked?: number | null;
          tax_rate?: number;
          total_ht?: number | null;
          unit_price_ht: number;
          updated_at?: string;
        };
        Update: {
          base_price_ht_locked?: number | null;
          created_at?: string;
          discount_percentage?: number;
          eco_tax?: number;
          expected_delivery_date?: string | null;
          id?: string;
          is_sample?: boolean;
          linkme_selection_item_id?: string | null;
          notes?: string | null;
          price_locked_at?: string | null;
          product_id?: string;
          quantity?: number;
          quantity_shipped?: number;
          retrocession_amount?: number | null;
          retrocession_amount_ttc?: number | null;
          retrocession_rate?: number | null;
          sales_order_id?: string;
          selling_price_ht_locked?: number | null;
          tax_rate?: number;
          total_ht?: number | null;
          unit_price_ht?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_order_items_linkme_selection_item_id_fkey';
            columns: ['linkme_selection_item_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selection_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_linkme_selection_item_id_fkey';
            columns: ['linkme_selection_item_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selection_items_with_pricing';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
        ];
      };
      sales_order_linkme_details: {
        Row: {
          access_form_required: boolean | null;
          access_form_url: string | null;
          billing_contact_source: string | null;
          billing_email: string | null;
          billing_name: string | null;
          billing_phone: string | null;
          confirmed_delivery_date: string | null;
          created_at: string | null;
          delivery_address: string | null;
          delivery_city: string | null;
          delivery_contact_email: string | null;
          delivery_contact_name: string | null;
          delivery_contact_phone: string | null;
          delivery_date: string | null;
          delivery_latitude: number | null;
          delivery_longitude: number | null;
          delivery_notes: string | null;
          delivery_postal_code: string | null;
          delivery_terms_accepted: boolean;
          desired_delivery_date: string | null;
          id: string;
          is_mall_delivery: boolean | null;
          is_new_restaurant: boolean;
          mall_email: string | null;
          mall_form_email: string | null;
          mall_form_required: boolean | null;
          owner_company_legal_name: string | null;
          owner_company_trade_name: string | null;
          owner_contact_same_as_requester: boolean | null;
          owner_email: string | null;
          owner_kbis_url: string | null;
          owner_name: string | null;
          owner_phone: string | null;
          owner_type: string | null;
          reception_contact_email: string | null;
          reception_contact_name: string | null;
          reception_contact_phone: string | null;
          requester_email: string;
          requester_name: string;
          requester_phone: string | null;
          requester_position: string | null;
          requester_type: string;
          sales_order_id: string;
          semi_trailer_accessible: boolean | null;
          step4_completed_at: string | null;
          step4_token: string | null;
          step4_token_expires_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          access_form_required?: boolean | null;
          access_form_url?: string | null;
          billing_contact_source?: string | null;
          billing_email?: string | null;
          billing_name?: string | null;
          billing_phone?: string | null;
          confirmed_delivery_date?: string | null;
          created_at?: string | null;
          delivery_address?: string | null;
          delivery_city?: string | null;
          delivery_contact_email?: string | null;
          delivery_contact_name?: string | null;
          delivery_contact_phone?: string | null;
          delivery_date?: string | null;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          delivery_notes?: string | null;
          delivery_postal_code?: string | null;
          delivery_terms_accepted?: boolean;
          desired_delivery_date?: string | null;
          id?: string;
          is_mall_delivery?: boolean | null;
          is_new_restaurant?: boolean;
          mall_email?: string | null;
          mall_form_email?: string | null;
          mall_form_required?: boolean | null;
          owner_company_legal_name?: string | null;
          owner_company_trade_name?: string | null;
          owner_contact_same_as_requester?: boolean | null;
          owner_email?: string | null;
          owner_kbis_url?: string | null;
          owner_name?: string | null;
          owner_phone?: string | null;
          owner_type?: string | null;
          reception_contact_email?: string | null;
          reception_contact_name?: string | null;
          reception_contact_phone?: string | null;
          requester_email: string;
          requester_name: string;
          requester_phone?: string | null;
          requester_position?: string | null;
          requester_type: string;
          sales_order_id: string;
          semi_trailer_accessible?: boolean | null;
          step4_completed_at?: string | null;
          step4_token?: string | null;
          step4_token_expires_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          access_form_required?: boolean | null;
          access_form_url?: string | null;
          billing_contact_source?: string | null;
          billing_email?: string | null;
          billing_name?: string | null;
          billing_phone?: string | null;
          confirmed_delivery_date?: string | null;
          created_at?: string | null;
          delivery_address?: string | null;
          delivery_city?: string | null;
          delivery_contact_email?: string | null;
          delivery_contact_name?: string | null;
          delivery_contact_phone?: string | null;
          delivery_date?: string | null;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          delivery_notes?: string | null;
          delivery_postal_code?: string | null;
          delivery_terms_accepted?: boolean;
          desired_delivery_date?: string | null;
          id?: string;
          is_mall_delivery?: boolean | null;
          is_new_restaurant?: boolean;
          mall_email?: string | null;
          mall_form_email?: string | null;
          mall_form_required?: boolean | null;
          owner_company_legal_name?: string | null;
          owner_company_trade_name?: string | null;
          owner_contact_same_as_requester?: boolean | null;
          owner_email?: string | null;
          owner_kbis_url?: string | null;
          owner_name?: string | null;
          owner_phone?: string | null;
          owner_type?: string | null;
          reception_contact_email?: string | null;
          reception_contact_name?: string | null;
          reception_contact_phone?: string | null;
          requester_email?: string;
          requester_name?: string;
          requester_phone?: string | null;
          requester_position?: string | null;
          requester_type?: string;
          sales_order_id?: string;
          semi_trailer_accessible?: boolean | null;
          step4_completed_at?: string | null;
          step4_token?: string | null;
          step4_token_expires_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_order_linkme_details_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_linkme_details_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_linkme_details_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_linkme_details_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_linkme_details_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
        ];
      };
      sales_order_shipments: {
        Row: {
          created_at: string | null;
          id: string;
          notes: string | null;
          product_id: string;
          quantity_shipped: number;
          sales_order_id: string;
          shipped_at: string;
          shipped_by: string;
          tracking_number: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          product_id: string;
          quantity_shipped: number;
          sales_order_id: string;
          shipped_at?: string;
          shipped_by: string;
          tracking_number?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string;
          quantity_shipped?: number;
          sales_order_id?: string;
          shipped_at?: string;
          shipped_by?: string;
          tracking_number?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_order_shipments_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
        ];
      };
      sales_orders: {
        Row: {
          accepts_semi_truck: boolean;
          affiliate_total_ht: number | null;
          affiliate_total_ttc: number | null;
          applied_discount_codes: string[] | null;
          billing_address: Json | null;
          billing_contact_id: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          channel_id: string | null;
          closed_at: string | null;
          closed_by: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          created_by: string;
          created_by_affiliate_id: string | null;
          currency: string;
          customer_id: string | null;
          customer_type: string;
          delivered_at: string | null;
          delivered_by: string | null;
          delivery_contact_id: string | null;
          eco_tax_total: number;
          eco_tax_vat_rate: number | null;
          expected_delivery_date: string | null;
          fees_vat_rate: number | null;
          handling_cost_ht: number | null;
          id: string;
          insurance_cost_ht: number | null;
          invoiced_at: string | null;
          is_shopping_center_delivery: boolean;
          linkme_selection_id: string | null;
          manual_payment_by: string | null;
          manual_payment_date: string | null;
          manual_payment_note: string | null;
          manual_payment_reference: string | null;
          manual_payment_type:
            | Database['public']['Enums']['manual_payment_type']
            | null;
          notes: string | null;
          order_date: string | null;
          order_number: string;
          paid_amount: number | null;
          paid_at: string | null;
          payment_status_v2: string | null;
          payment_terms: string | null;
          payment_terms_notes: string | null;
          payment_terms_type:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          pending_admin_validation: boolean | null;
          ready_for_shipment: boolean | null;
          responsable_contact_id: string | null;
          shipped_at: string | null;
          shipped_by: string | null;
          shipping_address: Json | null;
          shipping_cost_ht: number | null;
          status: Database['public']['Enums']['sales_order_status'];
          tax_rate: number;
          total_discount_amount: number | null;
          total_ht: number;
          total_ttc: number;
          updated_at: string;
          warehouse_exit_at: string | null;
          warehouse_exit_by: string | null;
        };
        Insert: {
          accepts_semi_truck?: boolean;
          affiliate_total_ht?: number | null;
          affiliate_total_ttc?: number | null;
          applied_discount_codes?: string[] | null;
          billing_address?: Json | null;
          billing_contact_id?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          channel_id?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          created_by: string;
          created_by_affiliate_id?: string | null;
          currency?: string;
          customer_id?: string | null;
          customer_type: string;
          delivered_at?: string | null;
          delivered_by?: string | null;
          delivery_contact_id?: string | null;
          eco_tax_total?: number;
          eco_tax_vat_rate?: number | null;
          expected_delivery_date?: string | null;
          fees_vat_rate?: number | null;
          handling_cost_ht?: number | null;
          id?: string;
          insurance_cost_ht?: number | null;
          invoiced_at?: string | null;
          is_shopping_center_delivery?: boolean;
          linkme_selection_id?: string | null;
          manual_payment_by?: string | null;
          manual_payment_date?: string | null;
          manual_payment_note?: string | null;
          manual_payment_reference?: string | null;
          manual_payment_type?:
            | Database['public']['Enums']['manual_payment_type']
            | null;
          notes?: string | null;
          order_date?: string | null;
          order_number: string;
          paid_amount?: number | null;
          paid_at?: string | null;
          payment_status_v2?: string | null;
          payment_terms?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          pending_admin_validation?: boolean | null;
          ready_for_shipment?: boolean | null;
          responsable_contact_id?: string | null;
          shipped_at?: string | null;
          shipped_by?: string | null;
          shipping_address?: Json | null;
          shipping_cost_ht?: number | null;
          status?: Database['public']['Enums']['sales_order_status'];
          tax_rate?: number;
          total_discount_amount?: number | null;
          total_ht?: number;
          total_ttc?: number;
          updated_at?: string;
          warehouse_exit_at?: string | null;
          warehouse_exit_by?: string | null;
        };
        Update: {
          accepts_semi_truck?: boolean;
          affiliate_total_ht?: number | null;
          affiliate_total_ttc?: number | null;
          applied_discount_codes?: string[] | null;
          billing_address?: Json | null;
          billing_contact_id?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          channel_id?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          created_by?: string;
          created_by_affiliate_id?: string | null;
          currency?: string;
          customer_id?: string | null;
          customer_type?: string;
          delivered_at?: string | null;
          delivered_by?: string | null;
          delivery_contact_id?: string | null;
          eco_tax_total?: number;
          eco_tax_vat_rate?: number | null;
          expected_delivery_date?: string | null;
          fees_vat_rate?: number | null;
          handling_cost_ht?: number | null;
          id?: string;
          insurance_cost_ht?: number | null;
          invoiced_at?: string | null;
          is_shopping_center_delivery?: boolean;
          linkme_selection_id?: string | null;
          manual_payment_by?: string | null;
          manual_payment_date?: string | null;
          manual_payment_note?: string | null;
          manual_payment_reference?: string | null;
          manual_payment_type?:
            | Database['public']['Enums']['manual_payment_type']
            | null;
          notes?: string | null;
          order_date?: string | null;
          order_number?: string;
          paid_amount?: number | null;
          paid_at?: string | null;
          payment_status_v2?: string | null;
          payment_terms?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          pending_admin_validation?: boolean | null;
          ready_for_shipment?: boolean | null;
          responsable_contact_id?: string | null;
          shipped_at?: string | null;
          shipped_by?: string | null;
          shipping_address?: Json | null;
          shipping_cost_ht?: number | null;
          status?: Database['public']['Enums']['sales_order_status'];
          tax_rate?: number;
          total_discount_amount?: number | null;
          total_ht?: number;
          total_ttc?: number;
          updated_at?: string;
          warehouse_exit_at?: string | null;
          warehouse_exit_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_orders_billing_contact_id_fkey';
            columns: ['billing_contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_created_by_affiliate_id_fkey';
            columns: ['created_by_affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_delivery_contact_id_fkey';
            columns: ['delivery_contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_linkme_selection_id_fkey';
            columns: ['linkme_selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'sales_orders_linkme_selection_id_fkey';
            columns: ['linkme_selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'sales_orders_linkme_selection_id_fkey';
            columns: ['linkme_selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_responsable_contact_id_fkey';
            columns: ['responsable_contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      sample_order_items: {
        Row: {
          actual_cost: number | null;
          created_at: string | null;
          delivered_at: string | null;
          estimated_cost: number | null;
          id: string;
          item_status: string;
          quantity: number | null;
          sample_description: string;
          sample_order_id: string;
          updated_at: string | null;
          validated_at: string | null;
          validation_notes: string | null;
        };
        Insert: {
          actual_cost?: number | null;
          created_at?: string | null;
          delivered_at?: string | null;
          estimated_cost?: number | null;
          id?: string;
          item_status?: string;
          quantity?: number | null;
          sample_description: string;
          sample_order_id: string;
          updated_at?: string | null;
          validated_at?: string | null;
          validation_notes?: string | null;
        };
        Update: {
          actual_cost?: number | null;
          created_at?: string | null;
          delivered_at?: string | null;
          estimated_cost?: number | null;
          id?: string;
          item_status?: string;
          quantity?: number | null;
          sample_description?: string;
          sample_order_id?: string;
          updated_at?: string | null;
          validated_at?: string | null;
          validation_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sample_order_items_sample_order_id_fkey';
            columns: ['sample_order_id'];
            isOneToOne: false;
            referencedRelation: 'sample_orders';
            referencedColumns: ['id'];
          },
        ];
      };
      sample_orders: {
        Row: {
          actual_cost: number | null;
          actual_delivery_date: string | null;
          approved_by: string | null;
          created_at: string | null;
          created_by: string | null;
          expected_delivery_date: string | null;
          id: string;
          internal_notes: string | null;
          order_number: string;
          shipping_cost: number | null;
          status: string;
          supplier_id: string;
          supplier_notes: string | null;
          supplier_order_reference: string | null;
          total_estimated_cost: number | null;
          tracking_number: string | null;
          updated_at: string | null;
        };
        Insert: {
          actual_cost?: number | null;
          actual_delivery_date?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expected_delivery_date?: string | null;
          id?: string;
          internal_notes?: string | null;
          order_number?: string;
          shipping_cost?: number | null;
          status?: string;
          supplier_id: string;
          supplier_notes?: string | null;
          supplier_order_reference?: string | null;
          total_estimated_cost?: number | null;
          tracking_number?: string | null;
          updated_at?: string | null;
        };
        Update: {
          actual_cost?: number | null;
          actual_delivery_date?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expected_delivery_date?: string | null;
          id?: string;
          internal_notes?: string | null;
          order_number?: string;
          shipping_cost?: number | null;
          status?: string;
          supplier_id?: string;
          supplier_notes?: string | null;
          supplier_order_reference?: string | null;
          total_estimated_cost?: number | null;
          tracking_number?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sample_orders_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      stock_alert_tracking: {
        Row: {
          added_to_draft_at: string | null;
          alert_priority: number;
          alert_type: string;
          created_at: string;
          draft_order_id: string | null;
          draft_order_number: string | null;
          id: string;
          min_stock: number;
          notes: string | null;
          product_id: string;
          quantity_in_draft: number | null;
          shortage_quantity: number;
          stock_forecasted_in: number;
          stock_forecasted_out: number;
          stock_real: number;
          supplier_id: string;
          updated_at: string;
          validated: boolean;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          added_to_draft_at?: string | null;
          alert_priority: number;
          alert_type: string;
          created_at?: string;
          draft_order_id?: string | null;
          draft_order_number?: string | null;
          id?: string;
          min_stock?: number;
          notes?: string | null;
          product_id: string;
          quantity_in_draft?: number | null;
          shortage_quantity?: number;
          stock_forecasted_in?: number;
          stock_forecasted_out?: number;
          stock_real?: number;
          supplier_id: string;
          updated_at?: string;
          validated?: boolean;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          added_to_draft_at?: string | null;
          alert_priority?: number;
          alert_type?: string;
          created_at?: string;
          draft_order_id?: string | null;
          draft_order_number?: string | null;
          id?: string;
          min_stock?: number;
          notes?: string | null;
          product_id?: string;
          quantity_in_draft?: number | null;
          shortage_quantity?: number;
          stock_forecasted_in?: number;
          stock_forecasted_out?: number;
          stock_real?: number;
          supplier_id?: string;
          updated_at?: string;
          validated?: boolean;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_alert_tracking_draft_order_id_fkey';
            columns: ['draft_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_alert_tracking_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_alert_tracking_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_alert_tracking_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_alert_tracking_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_alert_tracking_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      stock_movements: {
        Row: {
          affects_forecast: boolean | null;
          carrier_name: string | null;
          channel_id: string | null;
          created_at: string;
          delivery_note: string | null;
          forecast_type: string | null;
          id: string;
          movement_type: Database['public']['Enums']['movement_type'];
          notes: string | null;
          performed_at: string;
          performed_by: string;
          product_id: string;
          purchase_order_item_id: string | null;
          quantity_after: number;
          quantity_before: number;
          quantity_change: number;
          reason_code: Database['public']['Enums']['stock_reason_code'] | null;
          received_by_name: string | null;
          reference_id: string | null;
          reference_type: string | null;
          shipped_by_name: string | null;
          tracking_number: string | null;
          unit_cost: number | null;
          updated_at: string;
          warehouse_id: string | null;
        };
        Insert: {
          affects_forecast?: boolean | null;
          carrier_name?: string | null;
          channel_id?: string | null;
          created_at?: string;
          delivery_note?: string | null;
          forecast_type?: string | null;
          id?: string;
          movement_type: Database['public']['Enums']['movement_type'];
          notes?: string | null;
          performed_at?: string;
          performed_by: string;
          product_id: string;
          purchase_order_item_id?: string | null;
          quantity_after: number;
          quantity_before: number;
          quantity_change: number;
          reason_code?: Database['public']['Enums']['stock_reason_code'] | null;
          received_by_name?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          shipped_by_name?: string | null;
          tracking_number?: string | null;
          unit_cost?: number | null;
          updated_at?: string;
          warehouse_id?: string | null;
        };
        Update: {
          affects_forecast?: boolean | null;
          carrier_name?: string | null;
          channel_id?: string | null;
          created_at?: string;
          delivery_note?: string | null;
          forecast_type?: string | null;
          id?: string;
          movement_type?: Database['public']['Enums']['movement_type'];
          notes?: string | null;
          performed_at?: string;
          performed_by?: string;
          product_id?: string;
          purchase_order_item_id?: string | null;
          quantity_after?: number;
          quantity_before?: number;
          quantity_change?: number;
          reason_code?: Database['public']['Enums']['stock_reason_code'] | null;
          received_by_name?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          shipped_by_name?: string | null;
          tracking_number?: string | null;
          unit_cost?: number | null;
          updated_at?: string;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_stock_movements_channel_id';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_stock_movements_performed_by';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'fk_stock_movements_product_id';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'fk_stock_movements_product_id';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_stock_movements_product_id';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'fk_stock_movements_product_id';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_movements_purchase_order_item_id_fkey';
            columns: ['purchase_order_item_id'];
            isOneToOne: false;
            referencedRelation: 'customer_samples_view';
            referencedColumns: ['sample_id'];
          },
          {
            foreignKeyName: 'stock_movements_purchase_order_item_id_fkey';
            columns: ['purchase_order_item_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_order_items';
            referencedColumns: ['id'];
          },
        ];
      };
      stock_reservations: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          notes: string | null;
          product_id: string;
          reference_id: string;
          reference_type: string;
          released_at: string | null;
          released_by: string | null;
          reserved_at: string;
          reserved_by: string;
          reserved_quantity: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          notes?: string | null;
          product_id: string;
          reference_id: string;
          reference_type: string;
          released_at?: string | null;
          released_by?: string | null;
          reserved_at?: string;
          reserved_by: string;
          reserved_quantity: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string;
          reference_id?: string;
          reference_type?: string;
          released_at?: string | null;
          released_by?: string | null;
          reserved_at?: string;
          reserved_by?: string;
          reserved_quantity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_reservations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_reservations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_reservations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_reservations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      storage_allocations: {
        Row: {
          allocated_at: string;
          billable_in_storage: boolean;
          id: string;
          owner_enseigne_id: string | null;
          owner_organisation_id: string | null;
          product_id: string;
          stock_quantity: number;
          updated_at: string;
        };
        Insert: {
          allocated_at?: string;
          billable_in_storage?: boolean;
          id?: string;
          owner_enseigne_id?: string | null;
          owner_organisation_id?: string | null;
          product_id: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Update: {
          allocated_at?: string;
          billable_in_storage?: boolean;
          id?: string;
          owner_enseigne_id?: string | null;
          owner_organisation_id?: string | null;
          product_id?: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_storage_allocations_owner_enseigne_id_fkey';
            columns: ['owner_enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_owner_enseigne_id_fkey';
            columns: ['owner_enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_owner_organisation_id_fkey';
            columns: ['owner_organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_storage_allocations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      storage_billing_events: {
        Row: {
          billable: boolean;
          created_at: string;
          created_by: string | null;
          happened_at: string;
          id: string;
          owner_enseigne_id: string | null;
          owner_organisation_id: string | null;
          product_id: string;
          qty_change: number;
          reference_id: string | null;
          source: string;
          volume_m3_change: number;
        };
        Insert: {
          billable?: boolean;
          created_at?: string;
          created_by?: string | null;
          happened_at?: string;
          id?: string;
          owner_enseigne_id?: string | null;
          owner_organisation_id?: string | null;
          product_id: string;
          qty_change: number;
          reference_id?: string | null;
          source: string;
          volume_m3_change: number;
        };
        Update: {
          billable?: boolean;
          created_at?: string;
          created_by?: string | null;
          happened_at?: string;
          id?: string;
          owner_enseigne_id?: string | null;
          owner_organisation_id?: string | null;
          product_id?: string;
          qty_change?: number;
          reference_id?: string | null;
          source?: string;
          volume_m3_change?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'storage_billing_events_owner_enseigne_id_fkey';
            columns: ['owner_enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'storage_billing_events_owner_enseigne_id_fkey';
            columns: ['owner_enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'storage_billing_events_owner_organisation_id_fkey';
            columns: ['owner_organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'storage_billing_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'storage_billing_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'storage_billing_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'storage_billing_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      storage_pricing_tiers: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          label: string | null;
          max_volume_m3: number | null;
          min_volume_m3: number;
          price_per_m3: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          label?: string | null;
          max_volume_m3?: number | null;
          min_volume_m3?: number;
          price_per_m3?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          label?: string | null;
          max_volume_m3?: number | null;
          min_volume_m3?: number;
          price_per_m3?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subcategories: {
        Row: {
          category_id: string;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          category_id: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'subcategories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      sync_runs: {
        Row: {
          completed_at: string | null;
          created_at: string;
          current_page: number | null;
          cursor: string | null;
          duration_ms: number | null;
          errors: Json | null;
          id: string;
          items_created: number | null;
          items_failed: number | null;
          items_fetched: number | null;
          items_skipped: number | null;
          items_updated: number | null;
          last_error: string | null;
          last_synced_transaction_id: string | null;
          lock_expires_at: string | null;
          lock_token: string | null;
          locked_at: string | null;
          page_size: number | null;
          started_at: string | null;
          status: Database['public']['Enums']['sync_run_status'];
          sync_from: string | null;
          sync_to: string | null;
          sync_type: Database['public']['Enums']['sync_type'];
          total_pages: number | null;
          triggered_by: string | null;
          triggered_by_user_id: string | null;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          current_page?: number | null;
          cursor?: string | null;
          duration_ms?: number | null;
          errors?: Json | null;
          id?: string;
          items_created?: number | null;
          items_failed?: number | null;
          items_fetched?: number | null;
          items_skipped?: number | null;
          items_updated?: number | null;
          last_error?: string | null;
          last_synced_transaction_id?: string | null;
          lock_expires_at?: string | null;
          lock_token?: string | null;
          locked_at?: string | null;
          page_size?: number | null;
          started_at?: string | null;
          status?: Database['public']['Enums']['sync_run_status'];
          sync_from?: string | null;
          sync_to?: string | null;
          sync_type: Database['public']['Enums']['sync_type'];
          total_pages?: number | null;
          triggered_by?: string | null;
          triggered_by_user_id?: string | null;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          current_page?: number | null;
          cursor?: string | null;
          duration_ms?: number | null;
          errors?: Json | null;
          id?: string;
          items_created?: number | null;
          items_failed?: number | null;
          items_fetched?: number | null;
          items_skipped?: number | null;
          items_updated?: number | null;
          last_error?: string | null;
          last_synced_transaction_id?: string | null;
          lock_expires_at?: string | null;
          lock_token?: string | null;
          locked_at?: string | null;
          page_size?: number | null;
          started_at?: string | null;
          status?: Database['public']['Enums']['sync_run_status'];
          sync_from?: string | null;
          sync_to?: string | null;
          sync_type?: Database['public']['Enums']['sync_type'];
          total_pages?: number | null;
          triggered_by?: string | null;
          triggered_by_user_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      transaction_document_links: {
        Row: {
          allocated_amount: number | null;
          created_at: string | null;
          created_by: string | null;
          document_id: string | null;
          id: string;
          link_type: string;
          notes: string | null;
          purchase_order_id: string | null;
          sales_order_id: string | null;
          transaction_id: string;
          updated_at: string | null;
        };
        Insert: {
          allocated_amount?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          document_id?: string | null;
          id?: string;
          link_type?: string;
          notes?: string | null;
          purchase_order_id?: string | null;
          sales_order_id?: string | null;
          transaction_id: string;
          updated_at?: string | null;
        };
        Update: {
          allocated_amount?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          document_id?: string | null;
          id?: string;
          link_type?: string;
          notes?: string | null;
          purchase_order_id?: string | null;
          sales_order_id?: string | null;
          transaction_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_document_links_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'financial_documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'v_pending_invoice_uploads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['financial_document_id'];
          },
          {
            foreignKeyName: 'transaction_document_links_purchase_order_id_fkey';
            columns: ['purchase_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'bank_transactions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['transaction_id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_expenses_with_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_expenses_with_details';
            referencedColumns: ['transaction_id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_unified';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activity_logs: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          new_data: Json | null;
          old_data: Json | null;
          organisation_id: string | null;
          page_url: string | null;
          record_id: string | null;
          session_id: string | null;
          severity: string | null;
          table_name: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_data?: Json | null;
          old_data?: Json | null;
          organisation_id?: string | null;
          page_url?: string | null;
          record_id?: string | null;
          session_id?: string | null;
          severity?: string | null;
          table_name?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_data?: Json | null;
          old_data?: Json | null;
          organisation_id?: string | null;
          page_url?: string | null;
          record_id?: string | null;
          session_id?: string | null;
          severity?: string | null;
          table_name?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activity_logs_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activity_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_app_roles: {
        Row: {
          app: Database['public']['Enums']['app_type'];
          created_at: string;
          created_by: string | null;
          default_margin_rate: number | null;
          enseigne_id: string | null;
          id: string;
          is_active: boolean;
          organisation_id: string | null;
          permissions: string[] | null;
          role: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          app: Database['public']['Enums']['app_type'];
          created_at?: string;
          created_by?: string | null;
          default_margin_rate?: number | null;
          enseigne_id?: string | null;
          id?: string;
          is_active?: boolean;
          organisation_id?: string | null;
          permissions?: string[] | null;
          role: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          app?: Database['public']['Enums']['app_type'];
          created_at?: string;
          created_by?: string | null;
          default_margin_rate?: number | null;
          enseigne_id?: string | null;
          id?: string;
          is_active?: boolean;
          organisation_id?: string | null;
          permissions?: string[] | null;
          role?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_app_roles_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_app_roles_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_app_roles_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      user_profiles: {
        Row: {
          app_source: Database['public']['Enums']['app_type'] | null;
          avatar_url: string | null;
          client_type: Database['public']['Enums']['client_type'] | null;
          created_at: string | null;
          email: string | null;
          first_name: string | null;
          individual_customer_id: string | null;
          job_title: string | null;
          last_name: string | null;
          last_sign_in_at: string | null;
          organisation_id: string | null;
          parent_user_id: string | null;
          partner_id: string | null;
          phone: string | null;
          updated_at: string | null;
          user_id: string;
          user_type: Database['public']['Enums']['user_type'] | null;
        };
        Insert: {
          app_source?: Database['public']['Enums']['app_type'] | null;
          avatar_url?: string | null;
          client_type?: Database['public']['Enums']['client_type'] | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          individual_customer_id?: string | null;
          job_title?: string | null;
          last_name?: string | null;
          last_sign_in_at?: string | null;
          organisation_id?: string | null;
          parent_user_id?: string | null;
          partner_id?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          user_id: string;
          user_type?: Database['public']['Enums']['user_type'] | null;
        };
        Update: {
          app_source?: Database['public']['Enums']['app_type'] | null;
          avatar_url?: string | null;
          client_type?: Database['public']['Enums']['client_type'] | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          individual_customer_id?: string | null;
          job_title?: string | null;
          last_name?: string | null;
          last_sign_in_at?: string | null;
          organisation_id?: string | null;
          parent_user_id?: string | null;
          partner_id?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          user_id?: string;
          user_type?: Database['public']['Enums']['user_type'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_user_profiles_individual_customer';
            columns: ['individual_customer_id'];
            isOneToOne: false;
            referencedRelation: 'individual_customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user_profiles_organisation';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_profiles_parent_user_id_fkey';
            columns: ['parent_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_sessions: {
        Row: {
          actions_count: number | null;
          created_at: string | null;
          engagement_score: number | null;
          id: string;
          ip_address: string | null;
          last_activity: string;
          organisation_id: string | null;
          pages_visited: number | null;
          session_end: string | null;
          session_id: string;
          session_start: string;
          time_per_module: Json | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          actions_count?: number | null;
          created_at?: string | null;
          engagement_score?: number | null;
          id?: string;
          ip_address?: string | null;
          last_activity: string;
          organisation_id?: string | null;
          pages_visited?: number | null;
          session_end?: string | null;
          session_id: string;
          session_start: string;
          time_per_module?: Json | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          actions_count?: number | null;
          created_at?: string | null;
          engagement_score?: number | null;
          id?: string;
          ip_address?: string | null;
          last_activity?: string;
          organisation_id?: string | null;
          pages_visited?: number | null;
          session_end?: string | null;
          session_id?: string;
          session_start?: string;
          time_per_module?: Json | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_sessions_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      variant_groups: {
        Row: {
          archived_at: string | null;
          auto_name_pattern: string | null;
          base_sku: string;
          common_cost_price: number | null;
          common_dimensions: Json | null;
          common_eco_tax: number | null;
          common_weight: number | null;
          created_at: string | null;
          dimensions_height: number | null;
          dimensions_length: number | null;
          dimensions_unit: string | null;
          dimensions_width: number | null;
          has_common_cost_price: boolean;
          has_common_supplier: boolean;
          has_common_weight: boolean;
          id: string;
          name: string;
          product_count: number | null;
          style: string | null;
          subcategory_id: string;
          suitable_rooms: Database['public']['Enums']['room_type'][] | null;
          supplier_id: string | null;
          updated_at: string | null;
          variant_type: string | null;
        };
        Insert: {
          archived_at?: string | null;
          auto_name_pattern?: string | null;
          base_sku: string;
          common_cost_price?: number | null;
          common_dimensions?: Json | null;
          common_eco_tax?: number | null;
          common_weight?: number | null;
          created_at?: string | null;
          dimensions_height?: number | null;
          dimensions_length?: number | null;
          dimensions_unit?: string | null;
          dimensions_width?: number | null;
          has_common_cost_price?: boolean;
          has_common_supplier?: boolean;
          has_common_weight?: boolean;
          id?: string;
          name: string;
          product_count?: number | null;
          style?: string | null;
          subcategory_id: string;
          suitable_rooms?: Database['public']['Enums']['room_type'][] | null;
          supplier_id?: string | null;
          updated_at?: string | null;
          variant_type?: string | null;
        };
        Update: {
          archived_at?: string | null;
          auto_name_pattern?: string | null;
          base_sku?: string;
          common_cost_price?: number | null;
          common_dimensions?: Json | null;
          common_eco_tax?: number | null;
          common_weight?: number | null;
          created_at?: string | null;
          dimensions_height?: number | null;
          dimensions_length?: number | null;
          dimensions_unit?: string | null;
          dimensions_width?: number | null;
          has_common_cost_price?: boolean;
          has_common_supplier?: boolean;
          has_common_weight?: boolean;
          id?: string;
          name?: string;
          product_count?: number | null;
          style?: string | null;
          subcategory_id?: string;
          suitable_rooms?: Database['public']['Enums']['room_type'][] | null;
          supplier_id?: string | null;
          updated_at?: string | null;
          variant_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'variant_groups_subcategory_id_fkey';
            columns: ['subcategory_id'];
            isOneToOne: false;
            referencedRelation: 'subcategories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'variant_groups_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_configs: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          description: string | null;
          events: string[] | null;
          id: string;
          name: string;
          secret: string;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          events?: string[] | null;
          id?: string;
          name: string;
          secret: string;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          events?: string[] | null;
          id?: string;
          name?: string;
          secret?: string;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [];
      };
      webhook_logs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          event: string;
          id: string;
          payload: Json | null;
          response_body: string | null;
          status_code: number | null;
          webhook_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          event: string;
          id?: string;
          payload?: Json | null;
          response_body?: string | null;
          status_code?: number | null;
          webhook_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          event?: string;
          id?: string;
          payload?: Json | null;
          response_body?: string | null;
          status_code?: number | null;
          webhook_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_logs_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'webhook_configs';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      affiliate_pending_orders: {
        Row: {
          accepts_semi_truck: boolean | null;
          affiliate_email: string | null;
          affiliate_name: string | null;
          affiliate_total_ht: number | null;
          affiliate_total_ttc: number | null;
          affiliate_type: string | null;
          applied_discount_codes: string[] | null;
          billing_address: Json | null;
          billing_contact_id: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          channel_id: string | null;
          closed_at: string | null;
          closed_by: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string | null;
          created_by: string | null;
          created_by_affiliate_id: string | null;
          currency: string | null;
          customer_id: string | null;
          customer_type: string | null;
          delivered_at: string | null;
          delivered_by: string | null;
          delivery_contact_id: string | null;
          eco_tax_total: number | null;
          eco_tax_vat_rate: number | null;
          expected_delivery_date: string | null;
          fees_vat_rate: number | null;
          handling_cost_ht: number | null;
          id: string | null;
          insurance_cost_ht: number | null;
          invoiced_at: string | null;
          is_shopping_center_delivery: boolean | null;
          linkme_selection_id: string | null;
          manual_payment_by: string | null;
          manual_payment_date: string | null;
          manual_payment_note: string | null;
          manual_payment_reference: string | null;
          manual_payment_type:
            | Database['public']['Enums']['manual_payment_type']
            | null;
          notes: string | null;
          order_date: string | null;
          order_number: string | null;
          paid_amount: number | null;
          paid_at: string | null;
          payment_status_v2: string | null;
          payment_terms: string | null;
          payment_terms_notes: string | null;
          payment_terms_type:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          pending_admin_validation: boolean | null;
          ready_for_shipment: boolean | null;
          responsable_contact_id: string | null;
          selection_name: string | null;
          shipped_at: string | null;
          shipped_by: string | null;
          shipping_address: Json | null;
          shipping_cost_ht: number | null;
          status: Database['public']['Enums']['sales_order_status'] | null;
          tax_rate: number | null;
          total_discount_amount: number | null;
          total_ht: number | null;
          total_ttc: number | null;
          updated_at: string | null;
          warehouse_exit_at: string | null;
          warehouse_exit_by: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_orders_billing_contact_id_fkey';
            columns: ['billing_contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_created_by_affiliate_id_fkey';
            columns: ['created_by_affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_delivery_contact_id_fkey';
            columns: ['delivery_contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_linkme_selection_id_fkey';
            columns: ['linkme_selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'sales_orders_linkme_selection_id_fkey';
            columns: ['linkme_selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'sales_orders_linkme_selection_id_fkey';
            columns: ['linkme_selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_responsable_contact_id_fkey';
            columns: ['responsable_contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_samples_view: {
        Row: {
          archived_at: string | null;
          customer_display_name: string | null;
          customer_ind_email: string | null;
          customer_ind_first_name: string | null;
          customer_ind_id: string | null;
          customer_ind_last_name: string | null;
          customer_org_id: string | null;
          customer_org_legal_name: string | null;
          customer_org_trade_name: string | null;
          customer_type: string | null;
          expected_delivery_date: string | null;
          po_created_at: string | null;
          po_number: string | null;
          po_status: string | null;
          product_description: string | null;
          product_id: string | null;
          product_image: string | null;
          product_name: string | null;
          product_sku: string | null;
          purchase_order_id: string | null;
          quantity: number | null;
          sample_created_at: string | null;
          sample_id: string | null;
          sample_notes: string | null;
          sample_status: string | null;
          sample_type: string | null;
          sample_updated_at: string | null;
          supplier_id: string | null;
          supplier_name: string | null;
          supplier_trade_name: string | null;
          unit_price_ht: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_order_items_customer_individual_id_fkey';
            columns: ['customer_ind_id'];
            isOneToOne: false;
            referencedRelation: 'individual_customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_items_customer_organisation_id_fkey';
            columns: ['customer_org_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'purchase_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'purchase_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'purchase_order_items_purchase_order_id_fkey';
            columns: ['purchase_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_orders_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      enseignes_with_stats: {
        Row: {
          active_member_count: number | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string | null;
          is_active: boolean | null;
          logo_url: string | null;
          member_count: number | null;
          name: string | null;
          parent_company_id: string | null;
          parent_company_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          active_member_count?: never;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          logo_url?: string | null;
          member_count?: number | null;
          name?: string | null;
          parent_company_id?: never;
          parent_company_name?: never;
          updated_at?: string | null;
        };
        Update: {
          active_member_count?: never;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          logo_url?: string | null;
          member_count?: number | null;
          name?: string | null;
          parent_company_id?: never;
          parent_company_name?: never;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number | null;
          amount_ht: number | null;
          amount_vat: number | null;
          applied_rule_id: string | null;
          category: string | null;
          category_pcg: string | null;
          classified_at: string | null;
          classified_by: string | null;
          counterparty_iban: string | null;
          counterparty_id: string | null;
          counterparty_name: string | null;
          created_at: string | null;
          currency: string | null;
          emitted_at: string | null;
          id: string | null;
          label: string | null;
          matching_status:
            | Database['public']['Enums']['matching_status']
            | null;
          notes: string | null;
          organisation_id: string | null;
          raw_data: Json | null;
          role_type: string | null;
          settled_at: string | null;
          side: Database['public']['Enums']['transaction_side'] | null;
          status: string | null;
          transaction_id: string | null;
          updated_at: string | null;
          vat_breakdown: Json | null;
          vat_rate: number | null;
        };
        Insert: {
          amount?: number | null;
          amount_ht?: number | null;
          amount_vat?: number | null;
          applied_rule_id?: string | null;
          category?: string | null;
          category_pcg?: string | null;
          classified_at?: never;
          classified_by?: never;
          counterparty_iban?: string | null;
          counterparty_id?: never;
          counterparty_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          emitted_at?: string | null;
          id?: string | null;
          label?: string | null;
          matching_status?:
            | Database['public']['Enums']['matching_status']
            | null;
          notes?: never;
          organisation_id?: string | null;
          raw_data?: Json | null;
          role_type?: never;
          settled_at?: string | null;
          side?: Database['public']['Enums']['transaction_side'] | null;
          status?: never;
          transaction_id?: string | null;
          updated_at?: string | null;
          vat_breakdown?: Json | null;
          vat_rate?: number | null;
        };
        Update: {
          amount?: number | null;
          amount_ht?: number | null;
          amount_vat?: number | null;
          applied_rule_id?: string | null;
          category?: string | null;
          category_pcg?: string | null;
          classified_at?: never;
          classified_by?: never;
          counterparty_iban?: string | null;
          counterparty_id?: never;
          counterparty_name?: string | null;
          created_at?: string | null;
          currency?: string | null;
          emitted_at?: string | null;
          id?: string | null;
          label?: string | null;
          matching_status?:
            | Database['public']['Enums']['matching_status']
            | null;
          notes?: never;
          organisation_id?: string | null;
          raw_data?: Json | null;
          role_type?: never;
          settled_at?: string | null;
          side?: Database['public']['Enums']['transaction_side'] | null;
          status?: never;
          transaction_id?: string | null;
          updated_at?: string | null;
          vat_breakdown?: Json | null;
          vat_rate?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_transactions_applied_rule_id_fkey';
            columns: ['applied_rule_id'];
            isOneToOne: false;
            referencedRelation: 'matching_rules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_applied_rule_id_fkey';
            columns: ['applied_rule_id'];
            isOneToOne: false;
            referencedRelation: 'v_matching_rules_with_org';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_counterparty_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      google_merchant_stats: {
        Row: {
          approved_products: number | null;
          conversion_rate: number | null;
          error_products: number | null;
          last_sync_at: string | null;
          pending_products: number | null;
          refreshed_at: string | null;
          rejected_products: number | null;
          total_clicks: number | null;
          total_conversions: number | null;
          total_impressions: number | null;
          total_products: number | null;
          total_revenue_ht: number | null;
        };
        Relationships: [];
      };
      linkme_globe_items: {
        Row: {
          id: string | null;
          image_url: string | null;
          item_type: string | null;
          name: string | null;
        };
        Relationships: [];
      };
      linkme_order_items_enriched: {
        Row: {
          affiliate_margin: number | null;
          base_price_ht: number | null;
          commission_rate: number | null;
          id: string | null;
          linkme_selection_item_id: string | null;
          margin_rate: number | null;
          product_id: string | null;
          product_image_url: string | null;
          product_name: string | null;
          product_sku: string | null;
          quantity: number | null;
          sales_order_id: string | null;
          selling_price_ht: number | null;
          tax_rate: number | null;
          total_ht: number | null;
          unit_price_ht: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_order_items_linkme_selection_item_id_fkey';
            columns: ['linkme_selection_item_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selection_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_linkme_selection_item_id_fkey';
            columns: ['linkme_selection_item_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selection_items_with_pricing';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_items_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
        ];
      };
      linkme_orders_enriched: {
        Row: {
          affiliate_name: string | null;
          affiliate_type: string | null;
          channel_id: string | null;
          created_at: string | null;
          customer_address: string | null;
          customer_city: string | null;
          customer_email: string | null;
          customer_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_postal_code: string | null;
          customer_type: string | null;
          id: string | null;
          order_number: string | null;
          payment_status: string | null;
          selection_id: string | null;
          selection_name: string | null;
          status: Database['public']['Enums']['sales_order_status'] | null;
          total_ht: number | null;
          total_ttc: number | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_orders_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_orders_with_margins: {
        Row: {
          affiliate_name: string | null;
          affiliate_type: string | null;
          channel_id: string | null;
          created_at: string | null;
          customer_address: string | null;
          customer_city: string | null;
          customer_email: string | null;
          customer_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_postal_code: string | null;
          customer_type: string | null;
          id: string | null;
          items_count: number | null;
          order_number: string | null;
          payment_status: string | null;
          selection_id: string | null;
          selection_name: string | null;
          status: Database['public']['Enums']['sales_order_status'] | null;
          total_affiliate_margin: number | null;
          total_ht: number | null;
          total_ttc: number | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_orders_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_selection_items_with_pricing: {
        Row: {
          category_name: string | null;
          display_order: number | null;
          id: string | null;
          margin_rate: number | null;
          product_id: string | null;
          product_image: string | null;
          product_name: string | null;
          product_sku: string | null;
          selection_id: string | null;
          selling_price_ht: number | null;
          selling_price_ttc: number | null;
          subcategory_id: string | null;
          subcategory_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_selection_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['selection_id'];
          },
          {
            foreignKeyName: 'linkme_selection_items_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_subcategory_id_fkey';
            columns: ['subcategory_id'];
            isOneToOne: false;
            referencedRelation: 'subcategories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_prices_summary: {
        Row: {
          base_price: number | null;
          channel_prices: Json | null;
          currency: string | null;
          last_updated: string | null;
          price_list_name: string | null;
          product_id: string | null;
          product_name: string | null;
          quantity_break_count: number | null;
          sku: string | null;
        };
        Relationships: [];
      };
      stock_alerts_unified_view: {
        Row: {
          alert_color: string | null;
          alert_priority: number | null;
          alert_type: string | null;
          draft_order_id: string | null;
          draft_order_number: string | null;
          id: string | null;
          is_in_draft: boolean | null;
          min_stock: number | null;
          product_id: string | null;
          product_image_url: string | null;
          product_name: string | null;
          quantity_in_draft: number | null;
          severity: string | null;
          shortage_quantity: number | null;
          sku: string | null;
          stock_forecasted_in: number | null;
          stock_forecasted_out: number | null;
          stock_previsionnel: number | null;
          stock_previsionnel_avec_draft: number | null;
          stock_real: number | null;
          supplier_id: string | null;
          validated: boolean | null;
          validated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_alert_tracking_draft_order_id_fkey';
            columns: ['draft_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_alert_tracking_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      stock_alerts_view: {
        Row: {
          alert_priority: number | null;
          alert_status: string | null;
          has_been_ordered: boolean | null;
          min_stock: number | null;
          product_id: string | null;
          product_name: string | null;
          sku: string | null;
          stock_quantity: number | null;
        };
        Relationships: [];
      };
      stock_snapshot: {
        Row: {
          first_movement_at: string | null;
          last_movement_at: string | null;
          product_id: string | null;
          stock_forecasted_in: number | null;
          stock_forecasted_out: number | null;
          stock_real: number | null;
          total_movements_forecast: number | null;
          total_movements_real: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_stock_movements_product_id';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_prices_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'fk_stock_movements_product_id';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_stock_movements_product_id';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_unified_view';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'fk_stock_movements_product_id';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'stock_alerts_view';
            referencedColumns: ['product_id'];
          },
        ];
      };
      v_expenses_with_details: {
        Row: {
          amount: number | null;
          amount_ht: number | null;
          amount_vat: number | null;
          applied_rule_id: string | null;
          category: string | null;
          category_pcg: string | null;
          classified_at: string | null;
          classified_by: string | null;
          counterparty_display_name: string | null;
          counterparty_id: string | null;
          counterparty_name_normalized: string | null;
          created_at: string | null;
          currency: string | null;
          emitted_at: string | null;
          has_attachment: boolean | null;
          id: string | null;
          justification_optional: boolean | null;
          label: string | null;
          notes: string | null;
          organisation_id: string | null;
          organisation_name: string | null;
          organisation_type:
            | Database['public']['Enums']['organisation_type']
            | null;
          raw_data: Json | null;
          role_type: string | null;
          rule_allow_multiple_categories: boolean | null;
          rule_display_label: string | null;
          rule_match_value: string | null;
          settled_at: string | null;
          side: Database['public']['Enums']['transaction_side'] | null;
          status: string | null;
          transaction_counterparty_name: string | null;
          transaction_iban: string | null;
          transaction_id: string | null;
          updated_at: string | null;
          vat_breakdown: Json | null;
          vat_rate: number | null;
          vat_source: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_transactions_applied_rule_id_fkey';
            columns: ['applied_rule_id'];
            isOneToOne: false;
            referencedRelation: 'matching_rules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_applied_rule_id_fkey';
            columns: ['applied_rule_id'];
            isOneToOne: false;
            referencedRelation: 'v_matching_rules_with_org';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_counterparty_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      v_linkme_users: {
        Row: {
          avatar_url: string | null;
          default_margin_rate: number | null;
          email: string | null;
          enseigne_id: string | null;
          enseigne_logo: string | null;
          enseigne_name: string | null;
          first_name: string | null;
          is_active: boolean | null;
          last_name: string | null;
          linkme_role: string | null;
          organisation_id: string | null;
          organisation_logo: string | null;
          organisation_name: string | null;
          permissions: string[] | null;
          phone: string | null;
          role_created_at: string | null;
          user_id: string | null;
          user_role_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_app_roles_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_app_roles_enseigne_id_fkey';
            columns: ['enseigne_id'];
            isOneToOne: false;
            referencedRelation: 'enseignes_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_app_roles_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      v_matching_rules_with_org: {
        Row: {
          allow_multiple_categories: boolean | null;
          applies_to_side:
            | Database['public']['Enums']['transaction_side_filter']
            | null;
          category_label: string | null;
          counterparty_type: string | null;
          created_at: string | null;
          default_category: string | null;
          default_role_type: string | null;
          display_label: string | null;
          enabled: boolean | null;
          id: string | null;
          is_active: boolean | null;
          match_patterns: string[] | null;
          match_type: string | null;
          match_value: string | null;
          matched_expenses_count: number | null;
          organisation_id: string | null;
          organisation_name: string | null;
          organisation_type:
            | Database['public']['Enums']['organisation_type']
            | null;
          priority: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'matching_rules_organisation_id_fkey';
            columns: ['organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
        ];
      };
      v_pcg_categories_tree: {
        Row: {
          code: string | null;
          description: string | null;
          display_order: number | null;
          full_path: string | null;
          id: string | null;
          is_active: boolean | null;
          label: string | null;
          level: number | null;
          parent_code: string | null;
          parent_label: string | null;
        };
        Relationships: [];
      };
      v_pending_invoice_uploads: {
        Row: {
          amount_ttc: number | null;
          created_at: string | null;
          document_type: Database['public']['Enums']['document_type'] | null;
          file_name: string | null;
          file_url: string | null;
          id: string | null;
          status: string | null;
          uploader_email: string | null;
          uploader_name: string | null;
        };
        Relationships: [];
      };
      v_transaction_documents: {
        Row: {
          allocated_amount: number | null;
          created_at: string | null;
          document_amount: number | null;
          document_date: string | null;
          document_id: string | null;
          document_number: string | null;
          document_status:
            | Database['public']['Enums']['document_status']
            | null;
          document_type: Database['public']['Enums']['document_type'] | null;
          link_id: string | null;
          link_type: string | null;
          notes: string | null;
          organisation_name: string | null;
          purchase_order_amount: number | null;
          purchase_order_id: string | null;
          purchase_order_number: string | null;
          purchase_order_status:
            | Database['public']['Enums']['purchase_order_status']
            | null;
          sales_order_amount: number | null;
          sales_order_id: string | null;
          sales_order_number: string | null;
          sales_order_status:
            | Database['public']['Enums']['sales_order_status']
            | null;
          transaction_amount: number | null;
          transaction_date: string | null;
          transaction_id: string | null;
          transaction_label: string | null;
          transaction_side:
            | Database['public']['Enums']['transaction_side']
            | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_document_links_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'financial_documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'v_pending_invoice_uploads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['financial_document_id'];
          },
          {
            foreignKeyName: 'transaction_document_links_purchase_order_id_fkey';
            columns: ['purchase_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_pending_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_enriched';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_orders_with_margins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['sales_order_id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'bank_transactions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['transaction_id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_expenses_with_details';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_expenses_with_details';
            referencedColumns: ['transaction_id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_document_links_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_unified';
            referencedColumns: ['id'];
          },
        ];
      };
      v_transactions_missing_invoice: {
        Row: {
          amount: number | null;
          counterparty_name: string | null;
          currency: string | null;
          customer_id: string | null;
          document_number: string | null;
          emitted_at: string | null;
          financial_document_id: string | null;
          has_attachment: boolean | null;
          id: string | null;
          invoice_source: string | null;
          label: string | null;
          matched_document_id: string | null;
          matching_status:
            | Database['public']['Enums']['matching_status']
            | null;
          order_number: string | null;
          qonto_attachment_id: string | null;
          sales_order_id: string | null;
          settled_at: string | null;
          side: Database['public']['Enums']['transaction_side'] | null;
          transaction_id: string | null;
          upload_status: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'financial_documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'v_pending_invoice_uploads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['financial_document_id'];
          },
        ];
      };
      v_transactions_unified: {
        Row: {
          amount: number | null;
          amount_ht: number | null;
          amount_vat: number | null;
          applied_rule_id: string | null;
          attachment_count: number | null;
          attachment_ids: string[] | null;
          category_pcg: string | null;
          confidence_score: number | null;
          counterparty_iban: string | null;
          counterparty_name: string | null;
          counterparty_organisation_id: string | null;
          created_at: string | null;
          emitted_at: string | null;
          has_attachment: boolean | null;
          id: string | null;
          justification_optional: boolean | null;
          label: string | null;
          match_reason: string | null;
          matched_document_id: string | null;
          matched_document_number: string | null;
          matched_document_type:
            | Database['public']['Enums']['document_type']
            | null;
          matching_status:
            | Database['public']['Enums']['matching_status']
            | null;
          month: number | null;
          nature: string | null;
          operation_type: string | null;
          organisation_name: string | null;
          payment_method: string | null;
          raw_data: Json | null;
          reference: string | null;
          rule_allow_multiple_categories: boolean | null;
          rule_display_label: string | null;
          rule_match_value: string | null;
          settled_at: string | null;
          side: Database['public']['Enums']['transaction_side'] | null;
          transaction_id: string | null;
          unified_status: string | null;
          updated_at: string | null;
          vat_breakdown: Json | null;
          vat_rate: number | null;
          year: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_transactions_applied_rule_id_fkey';
            columns: ['applied_rule_id'];
            isOneToOne: false;
            referencedRelation: 'matching_rules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_applied_rule_id_fkey';
            columns: ['applied_rule_id'];
            isOneToOne: false;
            referencedRelation: 'v_matching_rules_with_org';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_counterparty_organisation_id_fkey';
            columns: ['counterparty_organisation_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'financial_documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'v_pending_invoice_uploads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'v_transactions_missing_invoice';
            referencedColumns: ['financial_document_id'];
          },
        ];
      };
      v_unique_unclassified_labels: {
        Row: {
          expense_ids: string[] | null;
          first_seen: string | null;
          label: string | null;
          last_seen: string | null;
          total_amount: number | null;
          transaction_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      acquire_sync_lock: {
        Args: {
          p_lock_duration_seconds?: number;
          p_sync_type: Database['public']['Enums']['sync_type'];
        };
        Returns: {
          lock_token: string;
          message: string;
          success: boolean;
          sync_run_id: string;
        }[];
      };
      add_collection_tag: {
        Args: { collection_id: string; tag: string };
        Returns: undefined;
      };
      add_product_to_selection: {
        Args: {
          p_base_price_ht: number;
          p_margin_rate?: number;
          p_product_id: string;
          p_selection_id: string;
        };
        Returns: string;
      };
      apply_all_matching_rules: {
        Args: never;
        Returns: {
          expenses_classified: number;
          rules_applied: number;
        }[];
      };
      apply_matching_rule_confirm: {
        Args: { p_rule_id: string; p_selected_normalized_labels: string[] };
        Returns: {
          nb_updated: number;
          updated_ids: string[];
        }[];
      };
      apply_matching_rule_to_history: {
        Args: { rule_id: string };
        Returns: number;
      };
      apply_multi_vat_breakdown: {
        Args: { p_amount_ttc: number; p_rule_breakdown: Json };
        Returns: Json;
      };
      apply_rule_simple: {
        Args: { p_rule_id: string; p_selected_labels: string[] };
        Returns: Json;
      };
      apply_rule_to_all_matching: {
        Args: { p_rule_id: string };
        Returns: {
          message: string;
          nb_updated: number;
        }[];
      };
      approve_affiliate_product: {
        Args: { p_commission_rate?: number; p_product_id: string };
        Returns: Json;
      };
      approve_sample_request: {
        Args: { p_approved_by: string; p_draft_id: string };
        Returns: {
          message: string;
          status: string;
          success: boolean;
        }[];
      };
      archive_address: { Args: { p_address_id: string }; Returns: boolean };
      auto_cancel_unpaid_orders: { Args: never; Returns: undefined };
      auto_classify_all_unmatched: { Args: never; Returns: Json };
      auto_lock_section_if_complete: {
        Args: { section_name_param: string };
        Returns: boolean;
      };
      auto_match_bank_transaction:
        | {
            Args: {
              p_amount: number;
              p_label: string;
              p_settled_at: string;
              p_transaction_id: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_amount: number;
              p_label: string;
              p_settled_at: string;
              p_side: Database['public']['Enums']['transaction_side'];
              p_transaction_id: string;
            };
            Returns: Json;
          };
      auto_register_counterparty_ibans: {
        Args: never;
        Returns: {
          ibans: string[];
          inserted_count: number;
        }[];
      };
      batch_add_google_merchant_products: {
        Args: { merchant_id: string; product_ids: string[] };
        Returns: {
          error: string;
          google_product_id: string;
          product_id: string;
          success: boolean;
        }[];
      };
      build_single_vat_breakdown: {
        Args: { p_amount_ttc: number; p_vat_rate: number };
        Returns: Json;
      };
      calc_product_volume_m3: { Args: { p_dimensions: Json }; Returns: number };
      calculate_affiliate_product_price: {
        Args: { p_margin_rate?: number; p_product_id: string };
        Returns: {
          affiliate_earning: number;
          base_price_ht: number;
          commission_rate: number;
          final_price_ht: number;
          margin_rate: number;
          platform_earning: number;
          pricing_model: string;
        }[];
      };
      calculate_annual_revenue_bfa: {
        Args: { p_fiscal_year: number; p_organisation_id: string };
        Returns: {
          bfa_amount: number;
          bfa_rate: number;
          fiscal_year: number;
          organisation_id: string;
          organisation_name: string;
          total_revenue_ht: number;
        }[];
      };
      calculate_batch_prices_v2: {
        Args: {
          p_channel_id?: string;
          p_customer_id?: string;
          p_customer_type?: string;
          p_date?: string;
          p_product_ids: string[];
          p_quantity?: number;
        };
        Returns: {
          currency: string;
          discount_rate: number;
          max_quantity: number;
          min_quantity: number;
          original_price: number;
          price_ht: number;
          price_list_id: string;
          price_list_name: string;
          price_source: string;
          product_id: string;
        }[];
      };
      calculate_engagement_score: {
        Args: { p_days?: number; p_user_id: string };
        Returns: number;
      };
      calculate_order_line_price: {
        Args: {
          p_channel_id?: string;
          p_customer_id?: string;
          p_customer_type?: string;
          p_date?: string;
          p_product_id: string;
          p_quantity: number;
          p_rfa_discount?: number;
        };
        Returns: {
          currency: string;
          line_total_after_rfa: number;
          line_total_ht: number;
          price_list_name: string;
          price_source: string;
          total_discount_rate: number;
          unit_price_ht: number;
        }[];
      };
      calculate_package_price:
        | {
            Args: {
              base_price_ht_cents: number;
              base_quantity: number;
              discount_rate?: number;
              unit_price_override_cents?: number;
            };
            Returns: number;
          }
        | {
            Args: { p_package_id: string; p_product_id: string };
            Returns: number;
          };
      calculate_price_ttc: {
        Args: { price_ht_cents: number; tax_rate: number };
        Returns: number;
      };
      calculate_price_ttc_cents: {
        Args: { price_ht_cents: number; tva_rate: number };
        Returns: number;
      };
      calculate_product_price_old: {
        Args: {
          p_channel_id?: string;
          p_customer_id?: string;
          p_customer_type?: string;
          p_date?: string;
          p_product_id: string;
          p_quantity?: number;
        };
        Returns: {
          discount_applied: number;
          final_price_ht: number;
          original_price_ht: number;
          pricing_source: string;
        }[];
      };
      calculate_product_price_v2: {
        Args: {
          p_channel_id?: string;
          p_customer_id?: string;
          p_customer_type?: string;
          p_date?: string;
          p_product_id: string;
          p_quantity?: number;
        };
        Returns: {
          currency: string;
          discount_rate: number;
          margin_rate: number;
          max_quantity: number;
          min_quantity: number;
          notes: string;
          original_price: number;
          price_ht: number;
          price_list_id: string;
          price_list_name: string;
          price_source: string;
        }[];
      };
      calculate_stock_forecasted: {
        Args: { p_product_id: string };
        Returns: number;
      };
      calculate_stock_status: {
        Args: { p_stock_real: number };
        Returns: Database['public']['Enums']['stock_status_type'];
      };
      calculate_storage_price: { Args: { volume_m3: number }; Returns: number };
      calculate_vat_from_ttc: {
        Args: { p_amount_ttc: number; p_vat_rate: number };
        Returns: {
          amount_ht: number;
          amount_vat: number;
        }[];
      };
      cancel_affiliate_remainder: {
        Args: { p_reason?: string; p_reception_id: string };
        Returns: Json;
      };
      cancel_order_forecast_movements: {
        Args: {
          p_order_id: string;
          p_performed_by?: string;
          p_reference_type: string;
        };
        Returns: undefined;
      };
      check_incomplete_catalog_products: { Args: never; Returns: number };
      check_late_shipments: { Args: never; Returns: number };
      check_linkme_access_by_email: {
        Args: { p_email: string };
        Returns: boolean;
      };
      check_linkme_affiliate_access: {
        Args: {
          affiliate_row: Database['public']['Tables']['linkme_affiliates']['Row'];
        };
        Returns: boolean;
      };
      check_orders_stock_consistency: {
        Args: never;
        Returns: {
          actual_movements: number;
          expected_movements: number;
          order_id: string;
          order_number: string;
          order_type: string;
          product_id: string;
          product_name: string;
          status: string;
        }[];
      };
      check_overdue_invoices: { Args: never; Returns: number };
      check_sales_order_exists: {
        Args: { p_sales_order_id: string };
        Returns: boolean;
      };
      check_selection_belongs_to_affiliate: {
        Args: { p_selection_id: string; p_user_id: string };
        Returns: boolean;
      };
      check_selection_is_public: {
        Args: { p_selection_id: string };
        Returns: boolean;
      };
      check_transaction_not_locked: {
        Args: { p_transaction_id: string };
        Returns: undefined;
      };
      classify_error_with_ai:
        | {
            Args: {
              error_message: string;
              error_type: string;
              stack_trace?: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              error_message: string;
              error_type: string;
              stack_trace?: string;
            };
            Returns: Json;
          };
      cleanup_auto_suppliers: { Args: { p_dry_run?: boolean }; Returns: Json };
      cleanup_expired_sync_locks: { Args: never; Returns: number };
      cleanup_expired_webhook_events: { Args: never; Returns: number };
      cleanup_old_mcp_tasks: { Args: { days_old?: number }; Returns: number };
      cleanup_old_product_drafts: { Args: never; Returns: number };
      cleanup_old_status_history: { Args: never; Returns: number };
      cleanup_old_sync_operations: { Args: never; Returns: number };
      cleanup_resolved_errors: { Args: never; Returns: number };
      cleanup_validated_alerts: {
        Args: { p_days_threshold?: number };
        Returns: {
          deleted_count: number;
          deleted_product_ids: string[];
        }[];
      };
      complete_mcp_task: {
        Args: {
          execution_details_param?: Json;
          queue_id_param: string;
          resolution_method_param?: string;
          success_param: boolean;
        };
        Returns: boolean;
      };
      confirm_affiliate_reception: {
        Args: {
          p_notes?: string;
          p_quantity_received: number;
          p_reception_id: string;
        };
        Returns: Json;
      };
      count_active_owners: { Args: never; Returns: number };
      create_affiliate_order: {
        Args: {
          p_affiliate_id: string;
          p_billing_contact_id?: string;
          p_customer_id: string;
          p_customer_type: string;
          p_delivery_contact_id?: string;
          p_items: Json;
          p_linkme_details?: Json;
          p_notes?: string;
          p_responsable_contact_id?: string;
          p_selection_id: string;
        };
        Returns: string;
      };
      create_color_if_not_exists: {
        Args: { color_hex?: string; color_name: string };
        Returns: string;
      };
      create_customer_individual_for_affiliate: {
        Args: {
          p_address?: string;
          p_affiliate_id: string;
          p_city?: string;
          p_email?: string;
          p_first_name: string;
          p_last_name: string;
          p_phone?: string;
          p_postal_code?: string;
        };
        Returns: string;
      };
      create_customer_invoice_from_order: {
        Args: { p_sales_order_id: string };
        Returns: {
          abby_invoice_id: string | null;
          abby_invoice_number: string | null;
          abby_pdf_url: string | null;
          abby_public_url: string | null;
          amount_paid: number;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          description: string | null;
          document_date: string;
          document_direction: Database['public']['Enums']['document_direction'];
          document_number: string;
          document_type: Database['public']['Enums']['document_type'];
          due_date: string | null;
          finalized_at: string | null;
          finalized_by: string | null;
          id: string;
          invoice_source: string | null;
          last_synced_from_abby_at: string | null;
          local_pdf_path: string | null;
          local_pdf_url: string | null;
          notes: string | null;
          partner_id: string;
          partner_type: string;
          pcg_code: string | null;
          pdf_stored_at: string | null;
          purchase_order_id: string | null;
          qonto_attachment_id: string | null;
          qonto_invoice_id: string | null;
          qonto_pdf_url: string | null;
          qonto_public_url: string | null;
          sales_order_id: string | null;
          sent_at: string | null;
          status: Database['public']['Enums']['document_status'];
          sync_errors: Json | null;
          synced_to_abby_at: string | null;
          synchronized_at: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at: string;
          upload_status: string | null;
          uploaded_at: string | null;
          uploaded_by: string | null;
          uploaded_file_name: string | null;
          uploaded_file_url: string | null;
          validated_by: string | null;
          validated_to_draft_at: string | null;
          workflow_status: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'financial_documents';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_customer_organisation_for_affiliate: {
        Args: {
          p_address?: string;
          p_affiliate_id: string;
          p_city?: string;
          p_country?: string;
          p_email?: string;
          p_enseigne_id?: string;
          p_is_new_restaurant?: boolean;
          p_latitude?: number;
          p_legal_name: string;
          p_longitude?: number;
          p_ownership_type?: string;
          p_phone?: string;
          p_postal_code?: string;
          p_trade_name?: string;
        };
        Returns: string;
      };
      create_manual_stock_movement: {
        Args: {
          p_movement_type: string;
          p_notes?: string;
          p_performed_by?: string;
          p_product_id: string;
          p_quantity_change: number;
          p_reason_code?: string;
        };
        Returns: string;
      };
      create_notification_for_owners: {
        Args: {
          p_action_label?: string;
          p_action_url?: string;
          p_message: string;
          p_severity: string;
          p_title: string;
          p_type: string;
        };
        Returns: number;
      };
      create_public_linkme_order:
        | {
            Args: {
              p_affiliate_id: string;
              p_billing: Json;
              p_cart: Json;
              p_organisation: Json;
              p_owner: Json;
              p_requester: Json;
              p_selection_id: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_affiliate_id: string;
              p_billing: Json;
              p_cart: Json;
              p_delivery: Json;
              p_organisation: Json;
              p_owner: Json;
              p_requester: Json;
              p_selection_id: string;
            };
            Returns: Json;
          };
      create_public_order:
        | {
            Args: {
              p_customer_code?: string;
              p_customer_data?: Json;
              p_customer_type: string;
              p_items: Json;
              p_selection_id: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_customer_code?: string;
              p_customer_data?: Json;
              p_customer_type: string;
              p_items: Json;
              p_organisation_data?: Json;
              p_selection_id: string;
            };
            Returns: Json;
          };
      create_purchase_order: {
        Args: {
          p_delivery_address?: Json;
          p_items: Json;
          p_notes?: string;
          p_supplier_id: string;
        };
        Returns: {
          cancelled_at: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          customs_cost_ht: number | null;
          delivery_address: Json | null;
          eco_tax_total: number;
          eco_tax_vat_rate: number | null;
          expected_delivery_date: string | null;
          fees_vat_rate: number | null;
          id: string;
          insurance_cost_ht: number | null;
          manual_payment_by: string | null;
          manual_payment_date: string | null;
          manual_payment_note: string | null;
          manual_payment_reference: string | null;
          manual_payment_type:
            | Database['public']['Enums']['manual_payment_type']
            | null;
          notes: string | null;
          order_date: string | null;
          payment_status_v2: string | null;
          payment_terms: string | null;
          payment_terms_notes: string | null;
          payment_terms_type:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          po_number: string;
          received_at: string | null;
          received_by: string | null;
          sent_at: string | null;
          sent_by: string | null;
          shipping_cost_ht: number | null;
          status: Database['public']['Enums']['purchase_order_status'];
          supplier_id: string;
          tax_rate: number;
          total_ht: number;
          total_ttc: number;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'purchase_orders';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_purchase_order_forecast_movements: {
        Args: { p_performed_by?: string; p_purchase_order_id: string };
        Returns: undefined;
      };
      create_purchase_order_reception_movements: {
        Args: { p_performed_by?: string; p_reception_id: string };
        Returns: undefined;
      };
      create_purchase_reception_movement: {
        Args: { p_reception_id: string };
        Returns: undefined;
      };
      create_sales_order_forecast_movements: {
        Args: { p_performed_by?: string; p_sales_order_id: string };
        Returns: undefined;
      };
      create_sample_order: {
        Args: {
          p_created_by?: string;
          p_draft_ids: string[];
          p_expected_delivery_date?: string;
          p_internal_notes?: string;
          p_supplier_id: string;
        };
        Returns: {
          message: string;
          order_id: string;
          success: boolean;
        }[];
      };
      create_supplier_invoice: {
        Args: {
          p_due_date: string;
          p_invoice_date: string;
          p_invoice_number: string;
          p_notes?: string;
          p_purchase_order_id: string;
          p_supplier_id: string;
          p_total_ht: number;
          p_total_ttc: number;
          p_tva_amount: number;
          p_uploaded_file_url: string;
        };
        Returns: {
          abby_invoice_id: string | null;
          abby_invoice_number: string | null;
          abby_pdf_url: string | null;
          abby_public_url: string | null;
          amount_paid: number;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          description: string | null;
          document_date: string;
          document_direction: Database['public']['Enums']['document_direction'];
          document_number: string;
          document_type: Database['public']['Enums']['document_type'];
          due_date: string | null;
          finalized_at: string | null;
          finalized_by: string | null;
          id: string;
          invoice_source: string | null;
          last_synced_from_abby_at: string | null;
          local_pdf_path: string | null;
          local_pdf_url: string | null;
          notes: string | null;
          partner_id: string;
          partner_type: string;
          pcg_code: string | null;
          pdf_stored_at: string | null;
          purchase_order_id: string | null;
          qonto_attachment_id: string | null;
          qonto_invoice_id: string | null;
          qonto_pdf_url: string | null;
          qonto_public_url: string | null;
          sales_order_id: string | null;
          sent_at: string | null;
          status: Database['public']['Enums']['document_status'];
          sync_errors: Json | null;
          synced_to_abby_at: string | null;
          synchronized_at: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at: string;
          upload_status: string | null;
          uploaded_at: string | null;
          uploaded_by: string | null;
          uploaded_file_name: string | null;
          uploaded_file_url: string | null;
          validated_by: string | null;
          validated_to_draft_at: string | null;
          workflow_status: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'financial_documents';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      current_user_has_role_in_org: {
        Args: {
          p_allowed_roles: Database['public']['Enums']['user_role_type'][];
          p_organisation_id: string;
        };
        Returns: boolean;
      };
      current_user_has_scope: { Args: { p_scope: string }; Returns: boolean };
      custom_access_token_hook: { Args: { event: Json }; Returns: Json };
      debug_auth_uid: { Args: never; Returns: Json };
      decrement_selection_products_count: {
        Args: { p_selection_id: string };
        Returns: undefined;
      };
      delete_organisation_safe: { Args: { p_org_id: string }; Returns: Json };
      detect_orphaned_stock: {
        Args: never;
        Returns: {
          nb_movements: number;
          product_id: string;
          product_name: string;
          sku: string;
          stock_real: number;
        }[];
      };
      extract_dimensions_from_name: {
        Args: { product_name: string };
        Returns: Json;
      };
      finalize_sourcing_to_catalog: {
        Args: { draft_id: string };
        Returns: Json;
      };
      format_phone_display: { Args: { phone_input: string }; Returns: string };
      generate_architecture_report: {
        Args: never;
        Returns: {
          component: string;
          details: string;
          status: string;
        }[];
      };
      generate_bfa_report_all_customers: {
        Args: { p_fiscal_year: number };
        Returns: {
          bfa_amount: number;
          bfa_rate: number;
          organisation_id: string;
          organisation_name: string;
          total_revenue_ht: number;
        }[];
      };
      generate_feed_access_token: { Args: never; Returns: string };
      generate_invoice_from_order: {
        Args: { p_sales_order_id: string };
        Returns: {
          abby_invoice_id: string;
          abby_invoice_number: string;
          abby_pdf_url: string | null;
          abby_public_url: string | null;
          created_at: string;
          created_by: string;
          due_date: string | null;
          id: string;
          invoice_date: string;
          last_synced_from_abby_at: string | null;
          sales_order_id: string;
          status: string;
          sync_errors: Json | null;
          synced_to_abby_at: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'invoices';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      generate_item_group_id: { Args: never; Returns: string };
      generate_linkme_code: { Args: never; Returns: string };
      generate_organisation_code: { Args: never; Returns: string };
      generate_po_number: { Args: never; Returns: string };
      generate_product_sku: {
        Args: { p_subcategory_id: string };
        Returns: string;
      };
      generate_share_token: {
        Args: { collection_name: string };
        Returns: string;
      };
      generate_sku: {
        Args: {
          color_code: string;
          family_code: string;
          material_code: string;
          product_code: string;
          size_code?: string;
        };
        Returns: string;
      };
      generate_so_number: { Args: never; Returns: string };
      generate_variant_product_sku: {
        Args: { p_base_sku: string; p_variant_value: string };
        Returns: string;
      };
      get_activity_stats:
        | { Args: { days_ago?: number }; Returns: Json }
        | { Args: { p_days_back?: number; p_user_id: string }; Returns: Json };
      get_affiliate_dashboard_data: {
        Args: { p_affiliate_id: string };
        Returns: Json;
      };
      get_affiliate_product_by_id: {
        Args: { p_enseigne_id: string; p_product_id: string };
        Returns: {
          affiliate_approval_status: Database['public']['Enums']['affiliate_product_approval_status'];
          affiliate_commission_rate: number;
          affiliate_payout_ht: number;
          affiliate_rejection_reason: string;
          created_at: string;
          description: string;
          dimensions: Json;
          id: string;
          name: string;
          sku: string;
          updated_at: string;
        }[];
      };
      get_affiliate_products_for_enseigne: {
        Args: { p_enseigne_id: string };
        Returns: {
          affiliate_approval_status: Database['public']['Enums']['affiliate_product_approval_status'];
          affiliate_commission_rate: number;
          affiliate_payout_ht: number;
          affiliate_rejection_reason: string;
          created_at: string;
          description: string;
          dimensions: Json;
          id: string;
          name: string;
          sku: string;
          updated_at: string;
        }[];
      };
      get_affiliate_storage_summary: {
        Args: {
          p_owner_enseigne_id?: string;
          p_owner_organisation_id?: string;
        };
        Returns: {
          billable_products_count: number;
          billable_volume_m3: number;
          products_count: number;
          total_units: number;
          total_volume_m3: number;
        }[];
      };
      get_affiliates_with_users: {
        Args: never;
        Returns: {
          affiliate_type: string;
          display_name: string;
          enseigne_id: string;
          enseigne_name: string;
          id: string;
          organisation_id: string;
          organisation_name: string;
          slug: string;
          users_count: number;
        }[];
      };
      get_all_storage_overview: {
        Args: never;
        Returns: {
          billable_volume_m3: number;
          owner_id: string;
          owner_name: string;
          owner_type: string;
          products_count: number;
          total_units: number;
          total_volume_m3: number;
        }[];
      };
      get_applicable_price_lists: {
        Args: {
          p_channel_id?: string;
          p_customer_id?: string;
          p_customer_type?: string;
          p_date?: string;
        };
        Returns: {
          list_type: string;
          price_list_id: string;
          priority: number;
          source: string;
        }[];
      };
      get_archived_site_internet_products: {
        Args: never;
        Returns: {
          archived_at: string;
          has_variants: boolean;
          is_eligible: boolean;
          is_published: boolean;
          name: string;
          price_source: string;
          price_ttc: number;
          primary_image_url: string;
          product_id: string;
          sku: string;
          slug: string;
          status: string;
          variants_count: number;
        }[];
      };
      get_available_stock: { Args: { p_product_id: string }; Returns: number };
      get_available_stock_advanced: {
        Args: { p_product_id: string };
        Returns: {
          stock_available: number;
          stock_forecasted_in: number;
          stock_forecasted_out: number;
          stock_real: number;
          stock_total_forecasted: number;
        }[];
      };
      get_best_mcp_strategy: {
        Args: { error_msg: string };
        Returns: {
          confidence: number;
          estimated_time: string;
          mcp_tools: Json;
          resolution_steps: Json;
          strategy_name: string;
        }[];
      };
      get_calculated_stock_from_movements: {
        Args: { p_product_id: string };
        Returns: number;
      };
      get_categories_with_real_counts: {
        Args: never;
        Returns: {
          created_at: string;
          description: string;
          display_order: number;
          facebook_category: string;
          family_id: string;
          google_category_id: number;
          id: string;
          image_url: string;
          is_active: boolean;
          level: number;
          name: string;
          slug: string;
          subcategory_count: number;
          updated_at: string;
        }[];
      };
      get_channel_price_evolution: {
        Args: { p_channel_id: string; p_limit?: number; p_product_id: string };
        Returns: {
          change_percentage: number;
          change_reason: string;
          change_type: string;
          changed_at: string;
          changed_by_email: string;
          new_price: number;
          old_price: number;
        }[];
      };
      get_cleanup_candidates: {
        Args: { p_days_threshold?: number };
        Returns: {
          alert_type: string;
          days_since_validation: number;
          product_id: string;
          product_name: string;
          validated_at: string;
        }[];
      };
      get_consultation_eligible_products: {
        Args: { target_consultation_id?: string };
        Returns: {
          creation_mode: string;
          id: string;
          name: string;
          product_type: string;
          requires_sample: boolean;
          sku: string;
          sourcing_type: string;
          status: string;
          supplier_name: string;
        }[];
      };
      get_current_organisation_id: { Args: never; Returns: string };
      get_customers_for_affiliate: {
        Args: { p_affiliate_id: string };
        Returns: {
          address: string;
          city: string;
          created_at: string;
          customer_type: string;
          email: string;
          id: string;
          is_franchisee: boolean;
          name: string;
          phone: string;
          postal_code: string;
        }[];
      };
      get_daily_activity: {
        Args: never;
        Returns: {
          activity_today: number;
          activity_yesterday: number;
          recent_actions: Json;
          trend_percentage: number;
        }[];
      };
      get_dashboard_metrics: {
        Args: never;
        Returns: {
          generated_at: string;
          metrics: Json;
        }[];
      };
      get_dashboard_stock_orders_metrics: {
        Args: never;
        Returns: {
          month_revenue: number;
          products_to_source: number;
          purchase_orders_count: number;
          stock_value: number;
        }[];
      };
      get_enseigne_details: { Args: { enseigne_uuid: string }; Returns: Json };
      get_enseigne_organisation_stats: {
        Args: { p_enseigne_id: string };
        Returns: {
          order_count: number;
          org_id: string;
          total_commissions_ht: number;
          total_revenue_ht: number;
        }[];
      };
      get_entity_addresses: {
        Args: {
          p_address_type?: string;
          p_include_archived?: boolean;
          p_owner_id: string;
          p_owner_type: string;
        };
        Returns: {
          address_line1: string;
          address_line2: string | null;
          address_type: string;
          archived_at: string | null;
          city: string;
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          country: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          label: string | null;
          latitude: number | null;
          legal_name: string | null;
          longitude: number | null;
          owner_id: string;
          owner_type: string;
          postal_code: string;
          region: string | null;
          siret: string | null;
          source_app: string | null;
          trade_name: string | null;
          updated_at: string | null;
          vat_number: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'addresses';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_error_reports_dashboard: {
        Args: {
          limit_param?: number;
          severity_filter?: Database['public']['Enums']['error_severity_enum'];
          status_filter?: Database['public']['Enums']['error_status_enum'];
        };
        Returns: Json;
      };
      get_finance_settings: { Args: never; Returns: Json };
      get_global_storage_overview: {
        Args: never;
        Returns: {
          billable_products_count: number;
          billable_volume_m3: number;
          owner_id: string;
          owner_name: string;
          owner_type: string;
          products_count: number;
          total_units: number;
          total_volume_m3: number;
        }[];
      };
      get_google_merchant_eligible_products: {
        Args: never;
        Returns: {
          brand: string;
          description: string;
          gtin: string;
          id: string;
          image_url: string;
          name: string;
          price_ht_cents: number;
          price_ttc_cents: number;
          product_status: string;
          sku: string;
          stock_status: string;
          tva_rate: number;
        }[];
      };
      get_google_merchant_product_price: {
        Args: { p_country_code?: string; p_product_id: string };
        Returns: {
          currency: string;
          price_ht: number;
          price_source: string;
          price_ttc: number;
          tva_rate: number;
        }[];
      };
      get_google_merchant_products: {
        Args: never;
        Returns: {
          clicks: number;
          conversions: number;
          error_message: string;
          google_product_id: string;
          google_status: string;
          google_status_checked_at: string;
          google_status_detail: Json;
          id: string;
          impressions: number;
          price_ht_cents: number;
          price_source: string;
          price_ttc_cents: number;
          product_id: string;
          product_name: string;
          revenue_ht: number;
          sku: string;
          sync_status: string;
          synced_at: string;
          tva_rate: number;
        }[];
      };
      get_google_merchant_stats: {
        Args: never;
        Returns: {
          approved_products: number;
          conversion_rate: number;
          error_products: number;
          last_sync_at: string;
          pending_products: number;
          refreshed_at: string;
          rejected_products: number;
          total_clicks: number;
          total_conversions: number;
          total_impressions: number;
          total_products: number;
          total_revenue_ht: number;
        }[];
      };
      get_invoice_status_summary: {
        Args: { p_end_date?: string; p_start_date?: string };
        Returns: {
          count: number;
          status: string;
          total_ht: number;
          total_ttc: number;
        }[];
      };
      get_last_sync_status: {
        Args: { p_sync_type: Database['public']['Enums']['sync_type'] };
        Returns: {
          completed_at: string;
          duration_ms: number;
          has_active_lock: boolean;
          items_created: number;
          items_fetched: number;
          items_updated: number;
          last_cursor: string;
          started_at: string;
          status: Database['public']['Enums']['sync_run_status'];
          sync_run_id: string;
        }[];
      };
      get_linkme_channel_id: { Args: never; Returns: string };
      get_linkme_order_items: {
        Args: { p_order_id: string };
        Returns: {
          affiliate_margin: number;
          base_price_ht: number;
          commission_rate: number;
          id: string;
          margin_rate: number;
          product_id: string;
          product_image_url: string;
          product_name: string;
          product_sku: string;
          quantity: number;
          selling_price_ht: number;
          tax_rate: number;
          total_ht: number;
          unit_price_ht: number;
        }[];
      };
      get_linkme_orders: {
        Args: { p_channel_id?: string; p_limit?: number; p_offset?: number };
        Returns: {
          affiliate_display_name: string;
          affiliate_id: string;
          affiliate_total_ht: number;
          affiliate_type: string;
          billing_address: Json;
          channel: Json;
          created_at: string;
          customer: Json;
          handling_cost_ht: number;
          id: string;
          insurance_cost_ht: number;
          items: Json;
          ld_billing_email: string;
          ld_billing_name: string;
          ld_billing_phone: string;
          ld_confirmed_delivery_date: string;
          ld_delivery_address: string;
          ld_delivery_city: string;
          ld_delivery_contact_email: string;
          ld_delivery_contact_name: string;
          ld_delivery_contact_phone: string;
          ld_delivery_notes: string;
          ld_delivery_postal_code: string;
          ld_desired_delivery_date: string;
          ld_is_mall_delivery: boolean;
          ld_owner_type: string;
          ld_reception_contact_email: string;
          ld_reception_contact_name: string;
          ld_reception_contact_phone: string;
          ld_requester_email: string;
          ld_requester_name: string;
          ld_requester_phone: string;
          ld_requester_position: string;
          order_number: string;
          payment_status: string;
          pending_admin_validation: boolean;
          selection_id: string;
          selection_name: string;
          shipping_address: Json;
          shipping_cost_ht: number;
          status: Database['public']['Enums']['sales_order_status'];
          total_ht: number;
          total_ttc: number;
          updated_at: string;
        }[];
      };
      get_linkme_products_by_year: {
        Args: { target_year: number };
        Returns: {
          product_id: string;
          product_name: string;
          product_sku: string;
          total_ht: number;
          total_quantity: number;
          total_ttc: number;
          total_tva: number;
        }[];
      };
      get_linkme_public_stats: { Args: never; Returns: Json };
      get_low_stock_products: {
        Args: { limit_count?: number };
        Returns: {
          id: string;
          min_stock: number;
          name: string;
          reorder_point: number;
          sku: string;
          stock_real: number;
          supplier_name: string;
        }[];
      };
      get_mcp_queue_stats: {
        Args: never;
        Returns: {
          avg_completion_time_minutes: number;
          completed_tasks: number;
          failed_tasks: number;
          pending_tasks: number;
          processing_tasks: number;
          success_rate_percent: number;
          total_tasks: number;
        }[];
      };
      get_next_mcp_task: {
        Args: { processor_id_param?: string };
        Returns: {
          error_context: Json;
          error_report_id: string;
          mcp_tools: Json;
          priority: number;
          queue_id: string;
          retry_count: number;
        }[];
      };
      get_next_variant_position: {
        Args: { group_id: string };
        Returns: number;
      };
      get_order_total_retrocession: {
        Args: { p_order_id: string };
        Returns: number;
      };
      get_organisation_display_name: {
        Args: { org: Database['public']['Tables']['organisations']['Row'] };
        Returns: string;
      };
      get_pcg_category_totals: {
        Args: { p_end_date?: string; p_start_date?: string };
        Returns: {
          code: string;
          label: string;
          level: number;
          parent_code: string;
          total_amount: number;
          transaction_count: number;
        }[];
      };
      get_pending_approvals_count: { Args: never; Returns: number };
      get_primary_contact: {
        Args: { org_id: string };
        Returns: {
          accepts_marketing: boolean | null;
          accepts_notifications: boolean | null;
          contact_type: string | null;
          created_at: string | null;
          created_by: string | null;
          department: string | null;
          direct_line: string | null;
          email: string;
          enseigne_id: string | null;
          first_name: string;
          id: string;
          is_active: boolean | null;
          is_billing_contact: boolean | null;
          is_commercial_contact: boolean | null;
          is_primary_contact: boolean | null;
          is_technical_contact: boolean | null;
          language_preference: string | null;
          last_contact_date: string | null;
          last_name: string;
          mobile: string | null;
          notes: string | null;
          organisation_id: string | null;
          owner_type: string | null;
          phone: string | null;
          preferred_communication_method: string | null;
          secondary_email: string | null;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'contacts';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_product_commission_history: {
        Args: { p_product_id: string };
        Returns: {
          change_reason: string;
          change_type: string;
          id: string;
          modified_at: string;
          modified_by: string;
          modified_by_email: string;
          new_commission_rate: number;
          new_payout_ht: number;
          old_commission_rate: number;
          old_payout_ht: number;
        }[];
      };
      get_product_cost_price_details: {
        Args: { p_product_id: string };
        Returns: Json;
      };
      get_product_margin_analysis: {
        Args: {
          p_end_date?: string;
          p_product_id: string;
          p_start_date?: string;
        };
        Returns: {
          channel_code: string;
          customer_name: string;
          margin_ht: number;
          margin_percentage: number;
          order_date: string;
          order_reference: string;
          order_type: string;
          quantity: number;
          supplier_name: string;
          total_ht: number;
          unit_price_ht: number;
        }[];
      };
      get_product_stats: {
        Args: never;
        Returns: {
          active_products: number;
          draft_products: number;
          inactive_products: number;
          total_products: number;
          trend_percentage: number;
        }[];
      };
      get_product_stock_summary: {
        Args: { p_product_id: string };
        Returns: {
          is_below_minimum: boolean;
          last_movement_at: string;
          product_id: string;
          product_name: string;
          product_sku: string;
          stock_available: number;
          stock_forecasted_in: number;
          stock_forecasted_out: number;
          stock_minimum: number;
          stock_real: number;
        }[];
      };
      get_product_variants: {
        Args: { input_product_id: string };
        Returns: {
          cost_price: number;
          created_at: string;
          id: string;
          is_variant_parent: boolean;
          name: string;
          sku: string;
          status: string;
          stock_quantity: number;
          variant_attributes: Json;
          variant_group_id: string;
          variant_position: number;
        }[];
      };
      get_products_status_metrics: { Args: never; Returns: Json };
      get_public_selection:
        | { Args: { p_selection_id: string }; Returns: Json }
        | { Args: { p_share_token?: string; p_slug: string }; Returns: Json };
      get_public_selection_by_slug: { Args: { p_slug: string }; Returns: Json };
      get_quantity_breaks: {
        Args: {
          p_channel_id?: string;
          p_customer_id?: string;
          p_customer_type?: string;
          p_date?: string;
          p_product_id: string;
        };
        Returns: {
          discount_rate: number;
          max_quantity: number;
          min_quantity: number;
          price_ht: number;
          price_list_name: string;
          savings_amount: number;
          savings_percent: number;
        }[];
      };
      get_recent_errors: {
        Args: { limit_count?: number };
        Returns: {
          created_at: string;
          error_type: string;
          id: string;
          message: string;
          severity: string;
          source: string;
        }[];
      };
      get_sample_statistics: {
        Args: never;
        Returns: {
          no_sample_count: number;
          requires_sample_count: number;
          sample_percentage: number;
          table_name: string;
          total_products: number;
        }[];
      };
      get_section_progress: {
        Args: { limit_param?: number; section_name_param: string };
        Returns: Json;
      };
      get_shipment_summary: {
        Args: { p_sales_order_id: string };
        Returns: {
          completion_percentage: number;
          last_shipment_date: string;
          total_shipments: number;
          total_units_ordered: number;
          total_units_remaining: number;
          total_units_shipped: number;
        }[];
      };
      get_site_internet_collection_detail: {
        Args: { p_slug: string };
        Returns: Json;
      };
      get_site_internet_collections: {
        Args: never;
        Returns: {
          brand_id: string;
          brand_logo: string;
          brand_name: string;
          collection_id: string;
          cover_image_alt: string;
          cover_image_url: string;
          description: string;
          description_long: string;
          event_tags: string[];
          ineligibility_reasons: string[];
          is_eligible: boolean;
          max_price: number;
          meta_description: string;
          meta_title: string;
          min_price: number;
          name: string;
          product_count: number;
          publication_date: string;
          season: Database['public']['Enums']['season_type'];
          selling_points: string[];
          slug: string;
          sort_order_site: number;
        }[];
      };
      get_site_internet_config: { Args: never; Returns: Json };
      get_site_internet_product_detail: {
        Args: { p_product_id: string };
        Returns: Json;
      };
      get_site_internet_products: {
        Args: never;
        Returns: {
          assembly_price: number;
          brand: string;
          delivery_delay_weeks_max: number;
          delivery_delay_weeks_min: number;
          description: string;
          dimensions: Json;
          discount_rate: number;
          eco_participation_amount: number;
          eligible_variants_count: number;
          has_variants: boolean;
          image_urls: string[];
          ineligibility_reasons: string[];
          is_eligible: boolean;
          is_published: boolean;
          metadata: Json;
          name: string;
          price_ht: number;
          price_source: string;
          price_ttc: number;
          primary_image_url: string;
          product_id: string;
          product_type: string;
          publication_date: string;
          requires_assembly: boolean;
          selling_points: string[];
          seo_meta_description: string;
          seo_title: string;
          sku: string;
          slug: string;
          status: string;
          subcategory_id: string;
          subcategory_name: string;
          suitable_rooms: string[];
          supplier_moq: number;
          technical_description: string;
          variant_group_id: string;
          variants_count: number;
          video_url: string;
          weight: number;
        }[];
      };
      get_smart_stock_status: {
        Args: { p_product_id: string };
        Returns: {
          alert_priority: number;
          alert_status: string;
          has_been_ordered: boolean;
          min_stock: number;
          product_id: string;
          stock_quantity: number;
        }[];
      };
      get_stock_alerts:
        | {
            Args: never;
            Returns: {
              alert_type: string;
              min_stock: number;
              product_id: string;
              product_name: string;
              product_status: Database['public']['Enums']['product_status_type'];
              stock_real: number;
              stock_status: Database['public']['Enums']['stock_status_type'];
            }[];
          }
        | {
            Args: { limit_count?: number };
            Returns: {
              alert_priority: number;
              alert_status: string;
              min_stock: number;
              product_id: string;
              product_name: string;
              sku: string;
              stock_level: number;
            }[];
          };
      get_stock_alerts_count: { Args: never; Returns: number };
      get_stock_analytics: {
        Args: { p_organisation_id?: string; p_period_days?: number };
        Returns: {
          adu: number;
          cost_price: number;
          coverage_days: number;
          days_inactive: number;
          in_30d: number;
          in_365d: number;
          in_90d: number;
          last_entry_date: string;
          last_exit_date: string;
          movement_history: Json;
          out_30d: number;
          out_365d: number;
          out_90d: number;
          product_id: string;
          product_image_url: string;
          product_name: string;
          sku: string;
          stock_current: number;
          stock_minimum: number;
          turnover_rate: number;
        }[];
      };
      get_stock_metrics_optimized: {
        Args: never;
        Returns: {
          average_stock_level: number;
          products_coming_soon: number;
          products_in_stock: number;
          products_low_stock: number;
          products_out_of_stock: number;
          total_products: number;
          total_stock_value: number;
        }[];
      };
      get_stock_reason_description: {
        Args: { reason: Database['public']['Enums']['stock_reason_code'] };
        Returns: string;
      };
      get_stock_summary: {
        Args: never;
        Returns: {
          low_stock_count: number;
          movements_today: number;
          movements_week: number;
          out_of_stock_count: number;
          total_products: number;
          total_quantity: number;
          total_value: number;
        }[];
      };
      get_stock_timeline_forecast: {
        Args: { p_days_ahead?: number; p_product_id: string };
        Returns: {
          cumulative_stock: number;
          forecast_date: string;
          stock_forecasted_in: number;
          stock_forecasted_out: number;
          stock_net_change: number;
          stock_real_change: number;
        }[];
      };
      get_storage_details: {
        Args: {
          p_owner_enseigne_id?: string;
          p_owner_organisation_id?: string;
        };
        Returns: {
          allocated_at: string;
          allocation_id: string;
          billable_in_storage: boolean;
          product_id: string;
          product_name: string;
          product_sku: string;
          stock_quantity: number;
          total_volume_m3: number;
          unit_volume_m3: number;
        }[];
      };
      get_storage_events_history: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_owner_enseigne_id?: string;
          p_owner_organisation_id?: string;
        };
        Returns: {
          billable: boolean;
          created_at: string;
          happened_at: string;
          id: string;
          product_id: string;
          product_name: string;
          product_sku: string;
          qty_change: number;
          source: string;
          volume_m3_change: number;
        }[];
      };
      get_storage_totals: {
        Args: never;
        Returns: {
          active_owners: number;
          billable_volume_m3: number;
          products_count: number;
          total_units: number;
          total_volume_m3: number;
        }[];
      };
      get_storage_weighted_average: {
        Args: {
          p_end_date?: string;
          p_owner_enseigne_id?: string;
          p_owner_organisation_id?: string;
          p_start_date?: string;
        };
        Returns: {
          average_m3: number;
          billable_average_m3: number;
          billable_m3_days: number;
          days_in_period: number;
          total_m3_days: number;
        }[];
      };
      get_test_progress_summary: { Args: never; Returns: Json };
      get_transaction_history: {
        Args: { p_transaction_id: string };
        Returns: {
          action: string;
          after_json: Json;
          audit_id: string;
          before_json: Json;
          changed_at: string;
          changed_by: string;
          fields_changed: string[];
          reason: string;
        }[];
      };
      get_transaction_links: {
        Args: { p_transaction_id: string };
        Returns: {
          allocated_amount: number;
          document_amount: number;
          document_id: string;
          document_number: string;
          link_id: string;
          link_type: string;
          organisation_name: string;
          purchase_order_id: string;
          purchase_order_number: string;
          sales_order_id: string;
          sales_order_number: string;
        }[];
      };
      get_transactions_by_year: {
        Args: never;
        Returns: {
          count: number;
          year: string;
        }[];
      };
      get_transactions_stats: {
        Args: { p_month?: number; p_year?: number };
        Returns: {
          cca_count: number;
          classified_count: number;
          credit_amount: number;
          debit_amount: number;
          ignored_count: number;
          matched_count: number;
          partial_count: number;
          to_process_amount: number;
          to_process_count: number;
          total_amount: number;
          total_count: number;
          with_attachment_count: number;
          without_attachment_count: number;
        }[];
      };
      get_treasury_stats: {
        Args: { p_end_date?: string; p_start_date?: string };
        Returns: Json;
      };
      get_user_activity_stats: {
        Args: { p_days?: number; p_user_id: string };
        Returns: {
          avg_session_duration: number;
          engagement_score: number;
          last_activity: string;
          most_used_module: string;
          total_actions: number;
          total_sessions: number;
        }[];
      };
      get_user_contact: { Args: { p_email: string }; Returns: Json };
      get_user_email: { Args: { p_user_id: string }; Returns: string };
      get_user_full_name: {
        Args: {
          user_profile_record: Database['public']['Tables']['user_profiles']['Row'];
        };
        Returns: string;
      };
      get_user_info: {
        Args: { p_user_id: string };
        Returns: {
          email: string;
          first_name: string;
          last_name: string;
          user_id: string;
        }[];
      };
      get_user_organisation_id: { Args: never; Returns: string };
      get_user_recent_actions: {
        Args: { p_limit?: number; p_user_id: string };
        Returns: {
          action: string;
          created_at: string;
          page_url: string;
          record_id: string;
          severity: string;
          table_name: string;
        }[];
      };
      get_user_stats: {
        Args: never;
        Returns: {
          active_users: number;
          admin_count: number;
          catalog_manager_count: number;
          new_users: number;
          partner_manager_count: number;
          sales_count: number;
          total_users: number;
          trend_percentage: number;
        }[];
      };
      get_user_type: {
        Args: never;
        Returns: Database['public']['Enums']['user_type'];
      };
      get_variant_siblings: {
        Args: { product_id: string };
        Returns: {
          id: string;
          image_url: string;
          name: string;
          price_ht: number;
          sku: string;
          variant_attributes: Json;
          variant_position: number;
        }[];
      };
      handle_abby_webhook_invoice_paid: {
        Args: {
          p_abby_invoice_id: string;
          p_payment_amount: number;
          p_payment_date: string;
          p_payment_method?: string;
        };
        Returns: Json;
      };
      has_been_ordered: { Args: { p_product_id: string }; Returns: boolean };
      has_scope: { Args: { required_scope: string }; Returns: boolean };
      increment_quantity_shipped: {
        Args: { p_item_id: string; p_quantity: number };
        Returns: undefined;
      };
      increment_selection_products_count: {
        Args: { p_selection_id: string };
        Returns: undefined;
      };
      initialize_dashboard_tests: { Args: never; Returns: undefined };
      insert_sales_order_items: { Args: { p_items: Json }; Returns: undefined };
      is_back_office_admin: { Args: never; Returns: boolean };
      is_back_office_owner: { Args: never; Returns: boolean };
      is_back_office_privileged: { Args: never; Returns: boolean };
      is_backoffice_admin: { Args: never; Returns: boolean };
      is_backoffice_user: { Args: never; Returns: boolean };
      is_current_user_admin: { Args: never; Returns: boolean };
      is_customer_user: { Args: never; Returns: boolean };
      is_enseigne_admin: {
        Args: { check_enseigne_id: string };
        Returns: boolean;
      };
      is_enseigne_admin_for: {
        Args: { target_enseigne_id: string };
        Returns: boolean;
      };
      is_staff_user_cached: { Args: never; Returns: boolean };
      is_tester_or_admin: { Args: never; Returns: boolean };
      is_transaction_locked: { Args: { p_tx_date: string }; Returns: boolean };
      is_transaction_locked_by_id: {
        Args: { p_transaction_id: string };
        Returns: boolean;
      };
      link_transaction_to_document: {
        Args: {
          p_allocated_amount?: number;
          p_document_id?: string;
          p_notes?: string;
          p_purchase_order_id?: string;
          p_sales_order_id?: string;
          p_transaction_id: string;
        };
        Returns: string;
      };
      lock_section_when_complete: {
        Args: { force_lock?: boolean; section_name_param: string };
        Returns: Json;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_new_data?: Json;
          p_old_data?: Json;
          p_record_id: string;
          p_severity?: string;
          p_table_name: string;
        };
        Returns: string;
      };
      log_auth_event: {
        Args: { p_details?: Json; p_event_type: string; p_success: boolean };
        Returns: undefined;
      };
      log_transaction_enrichment: {
        Args: {
          p_action: string;
          p_after: Json;
          p_before: Json;
          p_fields: string[];
          p_reason?: string;
          p_source?: string;
          p_transaction_id: string;
        };
        Returns: string;
      };
      lookup_customer_by_code: {
        Args: { p_code: string };
        Returns: {
          city: string;
          legal_name: string;
          organisation_id: string;
          trade_name: string;
        }[];
      };
      manual_match_transaction: {
        Args: { p_document_id: string; p_transaction_id: string };
        Returns: Json;
      };
      mark_payment_received: {
        Args: { p_amount: number; p_order_id: string; p_user_id?: string };
        Returns: undefined;
      };
      mark_sample_delivered: {
        Args: { p_draft_id: string };
        Returns: {
          message: string;
          status: string;
          success: boolean;
        }[];
      };
      mark_sample_ordered: {
        Args: { p_draft_id: string };
        Returns: {
          message: string;
          status: string;
          success: boolean;
        }[];
      };
      mark_sample_required: {
        Args: {
          product_id: string;
          product_table: string;
          requires_sample_value?: boolean;
        };
        Returns: boolean;
      };
      mark_warehouse_exit:
        | { Args: { p_order_id: string }; Returns: undefined }
        | {
            Args: { p_order_id: string; p_user_id?: string };
            Returns: boolean;
          };
      normalize_for_sku: {
        Args: { max_length?: number; text_input: string };
        Returns: string;
      };
      normalize_label: { Args: { input_text: string }; Returns: string };
      normalize_name: { Args: { input_name: string }; Returns: string };
      poll_google_merchant_statuses: {
        Args: { product_ids: string[]; statuses_data: Json };
        Returns: {
          error: string;
          success: boolean;
          updated_count: number;
        }[];
      };
      populate_counterparty_ibans_from_history: {
        Args: never;
        Returns: {
          iban: string;
          organisation_id: string;
          organisation_name: string;
          transaction_count: number;
        }[];
      };
      preview_apply_matching_rule:
        | {
            Args: { p_new_category?: string; p_rule_id: string };
            Returns: Database['public']['CompositeTypes']['preview_match_result'][];
            SetofOptions: {
              from: '*';
              to: 'preview_match_result';
              isOneToOne: false;
              isSetofReturn: true;
            };
          }
        | {
            Args: {
              p_new_category?: string;
              p_new_vat_rate?: number;
              p_rule_id: string;
            };
            Returns: Database['public']['CompositeTypes']['preview_match_result'][];
            SetofOptions: {
              from: '*';
              to: 'preview_match_result';
              isOneToOne: false;
              isSetofReturn: true;
            };
          };
      process_shipment_stock: {
        Args: {
          p_performed_by_user_id?: string;
          p_sales_order_id: string;
          p_shipment_id: string;
        };
        Returns: Json;
      };
      recalculate_forecasted_stock: {
        Args: { p_product_id: string };
        Returns: undefined;
      };
      recalculate_product_stock: {
        Args: { p_product_id: string };
        Returns: undefined;
      };
      recalculate_section_metrics: {
        Args: { section_name_param: string };
        Returns: undefined;
      };
      reconcile_linkme_commissions: { Args: never; Returns: Json };
      record_payment: {
        Args: {
          p_amount_paid: number;
          p_bank_transaction_id?: string;
          p_document_id: string;
          p_notes?: string;
          p_payment_date: string;
          p_payment_method: string;
          p_transaction_reference?: string;
        };
        Returns: {
          abby_payment_id: string | null;
          amount_paid: number;
          bank_transaction_id: string | null;
          created_at: string;
          created_by: string | null;
          document_id: string;
          id: string;
          notes: string | null;
          payment_date: string;
          payment_method: string | null;
          synced_from_abby_at: string | null;
          transaction_reference: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'financial_payments';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      refresh_google_merchant_stats: { Args: never; Returns: undefined };
      regenerate_product_slug: {
        Args: { product_id_param: string };
        Returns: string;
      };
      reject_affiliate_order: {
        Args: { p_order_id: string; p_reason?: string };
        Returns: boolean;
      };
      reject_affiliate_product: {
        Args: { p_product_id: string; p_reason: string };
        Returns: boolean;
      };
      release_sync_lock: {
        Args: {
          p_cursor?: string;
          p_errors?: Json;
          p_items_created?: number;
          p_items_failed?: number;
          p_items_fetched?: number;
          p_items_skipped?: number;
          p_items_updated?: number;
          p_lock_token: string;
          p_status?: Database['public']['Enums']['sync_run_status'];
          p_sync_run_id: string;
        };
        Returns: boolean;
      };
      remove_collection_tag: {
        Args: { collection_id: string; tag: string };
        Returns: undefined;
      };
      remove_dimensions_from_name: {
        Args: { product_name: string };
        Returns: string;
      };
      remove_from_google_merchant: {
        Args: { p_product_id: string };
        Returns: {
          error: string;
          success: boolean;
        }[];
      };
      request_sample_order: {
        Args: {
          p_delivery_time_days?: number;
          p_draft_id: string;
          p_estimated_cost?: number;
          p_sample_description: string;
        };
        Returns: {
          message: string;
          status: string;
          success: boolean;
        }[];
      };
      reset_finance_auto_data: { Args: { p_dry_run?: boolean }; Returns: Json };
      reset_po_sequence_to_max: { Args: never; Returns: number };
      reset_so_sequence_to_max: { Args: never; Returns: number };
      reset_stuck_mcp_tasks: {
        Args: { minutes_stuck?: number };
        Returns: number;
      };
      resync_all_product_stocks: {
        Args: never;
        Returns: {
          ecart: number;
          nb_mouvements_reels: number;
          new_stock_real: number;
          old_stock_real: number;
          product_id: string;
          product_name: string;
          sku: string;
        }[];
      };
      search_collections_by_tags: {
        Args: { search_tags: string[] };
        Returns: {
          archived_at: string | null;
          brand_id: string | null;
          color_theme: string | null;
          created_at: string | null;
          created_by: string;
          description: string | null;
          description_long: string | null;
          display_order: number | null;
          event_tags: string[] | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_published_online: boolean | null;
          last_shared: string | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          product_count: number | null;
          publication_date: string | null;
          season: Database['public']['Enums']['season_type'] | null;
          selling_points: string[] | null;
          shared_count: number | null;
          shared_link_token: string | null;
          slug: string | null;
          sort_order_site: number | null;
          style: string | null;
          suitable_rooms: string[] | null;
          theme_tags: string[] | null;
          unpublication_date: string | null;
          updated_at: string | null;
          visibility: string;
          visible_channels: string[] | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'collections';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      search_organisations_unaccent: {
        Args: { p_query: string; p_type?: string };
        Returns: {
          id: string;
          is_service_provider: boolean;
          legal_name: string;
          trade_name: string;
          type: string;
        }[];
      };
      search_product_colors: {
        Args: { search_query: string };
        Returns: {
          hex_code: string;
          id: string;
          is_predefined: boolean;
          name: string;
        }[];
      };
      set_closed_fiscal_year: { Args: { p_year: number }; Returns: Json };
      set_current_user_id: { Args: { user_id: string }; Returns: undefined };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      slugify: { Args: { text_input: string }; Returns: string };
      submit_affiliate_product_for_approval: {
        Args: { p_product_id: string };
        Returns: boolean;
      };
      suggest_matches: {
        Args: { p_limit?: number; p_transaction_id: string };
        Returns: {
          amount_paid: number;
          document_date: string;
          document_direction: Database['public']['Enums']['document_direction'];
          document_id: string;
          document_number: string;
          document_type: Database['public']['Enums']['document_type'];
          match_reasons: string[];
          match_score: number;
          partner_name: string;
          remaining: number;
          total_ttc: number;
        }[];
      };
      test_custom_access_token_hook: {
        Args: { test_user_id: string };
        Returns: Json;
      };
      toggle_google_merchant_visibility: {
        Args: { p_product_id: string; p_visible: boolean };
        Returns: {
          error: string;
          success: boolean;
        }[];
      };
      toggle_ignore_transaction: {
        Args: { p_ignore: boolean; p_reason?: string; p_tx_id: string };
        Returns: Json;
      };
      track_selection_view: {
        Args: { p_selection_id: string };
        Returns: undefined;
      };
      transfer_to_product_catalog: {
        Args: { p_draft_id: string };
        Returns: {
          message: string;
          product_id: string;
          success: boolean;
        }[];
      };
      unaccent: { Args: { '': string }; Returns: string };
      unlink_transaction_document: {
        Args: { p_link_id: string };
        Returns: boolean;
      };
      unmatch_transaction: {
        Args: { p_transaction_id: string };
        Returns: Json;
      };
      update_affiliate_product: {
        Args: {
          p_change_reason?: string;
          p_commission_rate?: number;
          p_payout_ht?: number;
          p_product_id: string;
        };
        Returns: Json;
      };
      update_google_merchant_metadata: {
        Args: {
          p_custom_description: string;
          p_custom_title: string;
          p_product_id: string;
        };
        Returns: {
          error: string;
          success: boolean;
        }[];
      };
      update_google_merchant_price: {
        Args: {
          p_price_ht_cents: number;
          p_product_id: string;
          p_tva_rate?: number;
        };
        Returns: {
          error: string;
          success: boolean;
        }[];
      };
      update_stock_on_shipment: {
        Args: { p_product_id: string; p_quantity: number };
        Returns: undefined;
      };
      update_test_status: {
        Args: {
          execution_time_param?: number;
          new_status_param: Database['public']['Enums']['test_status_enum'];
          notes_param?: string;
          test_id_param: string;
        };
        Returns: Json;
      };
      update_transaction_attachment_status: {
        Args: { p_attachment_id: string; p_transaction_id: string };
        Returns: undefined;
      };
      update_user_contact:
        | {
            Args: {
              p_email: string;
              p_first_name: string;
              p_last_name: string;
              p_phone?: string;
              p_title?: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_first_name: string;
              p_last_name: string;
              p_phone?: string;
              p_title?: string;
            };
            Returns: Json;
          };
      upsert_address: {
        Args: {
          p_address_data: Json;
          p_address_type: string;
          p_owner_id: string;
          p_owner_type: string;
          p_set_as_default?: boolean;
          p_source_app?: string;
        };
        Returns: string;
      };
      user_enseigne_ids: { Args: never; Returns: string[] };
      user_has_access_to_organisation: {
        Args: { org_id: string };
        Returns: boolean;
      };
      user_has_role_in_org: {
        Args: {
          required_roles: Database['public']['Enums']['user_role_type'][];
          target_org_id: string;
        };
        Returns: boolean;
      };
      validate_affiliate_order: {
        Args: { p_order_id: string };
        Returns: boolean;
      };
      validate_feed_filters: { Args: { filters_json: Json }; Returns: boolean };
      validate_partner_id_migration: {
        Args: never;
        Returns: {
          count: number;
          details: string;
          status: string;
        }[];
      };
      validate_rls_setup: {
        Args: never;
        Returns: {
          policies_count: number;
          rls_enabled: boolean;
          table_name: string;
        }[];
      };
      validate_sample: {
        Args: {
          approved: boolean;
          draft_id: string;
          validated_by_user_id?: string;
          validation_notes_text?: string;
        };
        Returns: Json;
      };
      validate_sourcing_draft:
        | {
            Args: {
              draft_id: string;
              requires_sample_decision: boolean;
              validated_by_user_id: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_cost_price: number;
              p_draft_id: string;
              p_estimated_selling_price?: number;
              p_requires_sample: boolean;
              p_supplier_id: string;
              p_validated_by?: string;
            };
            Returns: {
              draft_status: string;
              message: string;
              success: boolean;
            }[];
          };
      validate_stock_coherence: {
        Args: never;
        Returns: {
          calculated_stock: number;
          difference: number;
          is_coherent: boolean;
          product_id: string;
          sku: string;
          stock_real: number;
        }[];
      };
    };
    Enums: {
      affiliate_product_approval_status:
        | 'draft'
        | 'pending_approval'
        | 'approved'
        | 'rejected';
      app_type: 'back-office' | 'site-internet' | 'linkme';
      article_type: 'vente_de_marchandises' | 'prestations_de_services';
      availability_type_enum:
        | 'normal'
        | 'preorder'
        | 'coming_soon'
        | 'discontinued';
      bank_provider: 'qonto' | 'revolut';
      client_type: 'particulier' | 'professionnel';
      customer_source_type: 'internal' | 'linkme' | 'site-internet' | 'manual';
      document_direction: 'inbound' | 'outbound';
      document_status:
        | 'draft'
        | 'sent'
        | 'received'
        | 'paid'
        | 'partially_paid'
        | 'overdue'
        | 'cancelled'
        | 'refunded';
      document_type:
        | 'customer_invoice'
        | 'customer_credit_note'
        | 'supplier_invoice'
        | 'supplier_credit_note'
        | 'expense';
      error_severity_enum: 'critical' | 'high' | 'medium' | 'low';
      error_status_enum: 'open' | 'in_progress' | 'resolved' | 'closed';
      error_type_enum:
        | 'javascript_error'
        | 'network_error'
        | 'ui_bug'
        | 'performance_issue'
        | 'console_error'
        | 'data_validation'
        | 'functional_bug';
      feed_export_status_type:
        | 'pending'
        | 'processing'
        | 'completed'
        | 'failed'
        | 'cancelled';
      feed_format_type: 'csv' | 'xml' | 'json';
      feed_platform_type: 'google_merchant' | 'facebook_meta' | 'custom';
      image_type_enum:
        | 'primary'
        | 'gallery'
        | 'technical'
        | 'lifestyle'
        | 'thumbnail';
      language_type: 'fr' | 'en' | 'pt';
      manual_payment_type:
        | 'cash'
        | 'check'
        | 'transfer_other'
        | 'card'
        | 'compensation'
        | 'verified_bubble';
      matching_status:
        | 'unmatched'
        | 'auto_matched'
        | 'manual_matched'
        | 'partial_matched'
        | 'ignored';
      movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
      organisation_ownership_type: 'succursale' | 'franchise';
      organisation_type: 'internal' | 'supplier' | 'customer' | 'partner';
      package_type: 'single' | 'pack' | 'bulk' | 'custom';
      payment_terms_type:
        | 'IMMEDIATE'
        | 'NET_15'
        | 'NET_30'
        | 'NET_45'
        | 'NET_60'
        | 'NET_90'
        | 'CUSTOM';
      product_status_type: 'active' | 'preorder' | 'discontinued' | 'draft';
      purchase_order_status:
        | 'draft'
        | 'validated'
        | 'partially_received'
        | 'received'
        | 'cancelled';
      purchase_type: 'dropshipping' | 'stock' | 'on_demand';
      room_type:
        | 'salon'
        | 'salle_a_manger'
        | 'chambre'
        | 'bureau'
        | 'bibliotheque'
        | 'salon_sejour'
        | 'cuisine'
        | 'salle_de_bain'
        | 'wc'
        | 'toilettes'
        | 'hall_entree'
        | 'couloir'
        | 'cellier'
        | 'buanderie'
        | 'dressing'
        | 'cave'
        | 'grenier'
        | 'garage'
        | 'terrasse'
        | 'balcon'
        | 'jardin'
        | 'veranda'
        | 'loggia'
        | 'cour'
        | 'patio'
        | 'salle_de_jeux'
        | 'salle_de_sport'
        | 'atelier'
        | 'mezzanine'
        | 'sous_sol';
      sales_order_status:
        | 'pending_approval'
        | 'draft'
        | 'validated'
        | 'partially_shipped'
        | 'shipped'
        | 'delivered'
        | 'closed'
        | 'cancelled';
      sample_request_status_type: 'pending_approval' | 'approved' | 'rejected';
      sample_status_type:
        | 'not_required'
        | 'request_pending'
        | 'request_approved'
        | 'ordered'
        | 'delivered'
        | 'approved'
        | 'rejected';
      schedule_frequency_type: 'manual' | 'daily' | 'weekly' | 'monthly';
      season_type: 'spring' | 'summer' | 'autumn' | 'winter' | 'all_year';
      sourcing_status_type:
        | 'draft'
        | 'sourcing_validated'
        | 'ready_for_catalog'
        | 'archived';
      stock_reason_code:
        | 'sale'
        | 'transfer_out'
        | 'damage_transport'
        | 'damage_handling'
        | 'damage_storage'
        | 'theft'
        | 'loss_unknown'
        | 'sample_client'
        | 'sample_showroom'
        | 'marketing_event'
        | 'photography'
        | 'rd_testing'
        | 'prototype'
        | 'quality_control'
        | 'return_supplier'
        | 'return_customer'
        | 'warranty_replacement'
        | 'inventory_correction'
        | 'write_off'
        | 'obsolete'
        | 'purchase_reception'
        | 'return_from_client'
        | 'found_inventory'
        | 'manual_adjustment'
        | 'cancelled';
      stock_status_type: 'in_stock' | 'out_of_stock' | 'coming_soon';
      supplier_segment_type:
        | 'strategic'
        | 'preferred'
        | 'approved'
        | 'commodity'
        | 'artisan'
        | 'goods_supplier'
        | 'service_provider'
        | 'logistics'
        | 'government';
      sync_run_status:
        | 'pending'
        | 'running'
        | 'completed'
        | 'partial'
        | 'failed'
        | 'cancelled';
      sync_type:
        | 'transactions'
        | 'client_invoices'
        | 'attachments'
        | 'labels'
        | 'full';
      test_status_enum: 'pending' | 'passed' | 'failed' | 'warning';
      transaction_side: 'credit' | 'debit';
      transaction_side_filter: 'debit' | 'credit' | 'both';
      user_role_type:
        | 'owner'
        | 'admin'
        | 'catalog_manager'
        | 'sales'
        | 'partner_manager'
        | 'customer';
      user_type: 'staff' | 'supplier' | 'customer' | 'partner';
    };
    CompositeTypes: {
      preview_match_result: {
        normalized_label_group: string | null;
        sample_labels: string[] | null;
        transaction_count: number | null;
        total_amount: number | null;
        first_seen: string | null;
        last_seen: string | null;
        counterparty_hint: string | null;
        confidence: string | null;
        confidence_score: number | null;
        reasons: string[] | null;
        sample_transaction_ids: string[] | null;
        already_applied_count: number | null;
        pending_count: number | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      affiliate_product_approval_status: [
        'draft',
        'pending_approval',
        'approved',
        'rejected',
      ],
      app_type: ['back-office', 'site-internet', 'linkme'],
      article_type: ['vente_de_marchandises', 'prestations_de_services'],
      availability_type_enum: [
        'normal',
        'preorder',
        'coming_soon',
        'discontinued',
      ],
      bank_provider: ['qonto', 'revolut'],
      client_type: ['particulier', 'professionnel'],
      customer_source_type: ['internal', 'linkme', 'site-internet', 'manual'],
      document_direction: ['inbound', 'outbound'],
      document_status: [
        'draft',
        'sent',
        'received',
        'paid',
        'partially_paid',
        'overdue',
        'cancelled',
        'refunded',
      ],
      document_type: [
        'customer_invoice',
        'customer_credit_note',
        'supplier_invoice',
        'supplier_credit_note',
        'expense',
      ],
      error_severity_enum: ['critical', 'high', 'medium', 'low'],
      error_status_enum: ['open', 'in_progress', 'resolved', 'closed'],
      error_type_enum: [
        'javascript_error',
        'network_error',
        'ui_bug',
        'performance_issue',
        'console_error',
        'data_validation',
        'functional_bug',
      ],
      feed_export_status_type: [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
      ],
      feed_format_type: ['csv', 'xml', 'json'],
      feed_platform_type: ['google_merchant', 'facebook_meta', 'custom'],
      image_type_enum: [
        'primary',
        'gallery',
        'technical',
        'lifestyle',
        'thumbnail',
      ],
      language_type: ['fr', 'en', 'pt'],
      manual_payment_type: [
        'cash',
        'check',
        'transfer_other',
        'card',
        'compensation',
        'verified_bubble',
      ],
      matching_status: [
        'unmatched',
        'auto_matched',
        'manual_matched',
        'partial_matched',
        'ignored',
      ],
      movement_type: ['IN', 'OUT', 'ADJUST', 'TRANSFER'],
      organisation_ownership_type: ['succursale', 'franchise'],
      organisation_type: ['internal', 'supplier', 'customer', 'partner'],
      package_type: ['single', 'pack', 'bulk', 'custom'],
      payment_terms_type: [
        'IMMEDIATE',
        'NET_15',
        'NET_30',
        'NET_45',
        'NET_60',
        'NET_90',
        'CUSTOM',
      ],
      product_status_type: ['active', 'preorder', 'discontinued', 'draft'],
      purchase_order_status: [
        'draft',
        'validated',
        'partially_received',
        'received',
        'cancelled',
      ],
      purchase_type: ['dropshipping', 'stock', 'on_demand'],
      room_type: [
        'salon',
        'salle_a_manger',
        'chambre',
        'bureau',
        'bibliotheque',
        'salon_sejour',
        'cuisine',
        'salle_de_bain',
        'wc',
        'toilettes',
        'hall_entree',
        'couloir',
        'cellier',
        'buanderie',
        'dressing',
        'cave',
        'grenier',
        'garage',
        'terrasse',
        'balcon',
        'jardin',
        'veranda',
        'loggia',
        'cour',
        'patio',
        'salle_de_jeux',
        'salle_de_sport',
        'atelier',
        'mezzanine',
        'sous_sol',
      ],
      sales_order_status: [
        'pending_approval',
        'draft',
        'validated',
        'partially_shipped',
        'shipped',
        'delivered',
        'closed',
        'cancelled',
      ],
      sample_request_status_type: ['pending_approval', 'approved', 'rejected'],
      sample_status_type: [
        'not_required',
        'request_pending',
        'request_approved',
        'ordered',
        'delivered',
        'approved',
        'rejected',
      ],
      schedule_frequency_type: ['manual', 'daily', 'weekly', 'monthly'],
      season_type: ['spring', 'summer', 'autumn', 'winter', 'all_year'],
      sourcing_status_type: [
        'draft',
        'sourcing_validated',
        'ready_for_catalog',
        'archived',
      ],
      stock_reason_code: [
        'sale',
        'transfer_out',
        'damage_transport',
        'damage_handling',
        'damage_storage',
        'theft',
        'loss_unknown',
        'sample_client',
        'sample_showroom',
        'marketing_event',
        'photography',
        'rd_testing',
        'prototype',
        'quality_control',
        'return_supplier',
        'return_customer',
        'warranty_replacement',
        'inventory_correction',
        'write_off',
        'obsolete',
        'purchase_reception',
        'return_from_client',
        'found_inventory',
        'manual_adjustment',
        'cancelled',
      ],
      stock_status_type: ['in_stock', 'out_of_stock', 'coming_soon'],
      supplier_segment_type: [
        'strategic',
        'preferred',
        'approved',
        'commodity',
        'artisan',
        'goods_supplier',
        'service_provider',
        'logistics',
        'government',
      ],
      sync_run_status: [
        'pending',
        'running',
        'completed',
        'partial',
        'failed',
        'cancelled',
      ],
      sync_type: [
        'transactions',
        'client_invoices',
        'attachments',
        'labels',
        'full',
      ],
      test_status_enum: ['pending', 'passed', 'failed', 'warning'],
      transaction_side: ['credit', 'debit'],
      transaction_side_filter: ['debit', 'credit', 'both'],
      user_role_type: [
        'owner',
        'admin',
        'catalog_manager',
        'sales',
        'partner_manager',
        'customer',
      ],
      user_type: ['staff', 'supplier', 'customer', 'partner'],
    },
  },
} as const;
