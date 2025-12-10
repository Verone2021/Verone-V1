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
      _stock_audit_2025_12_02: {
        Row: {
          audit_date: string | null;
          calculated_stock: number | null;
          ecart: number | null;
          id: string | null;
          name: string | null;
          sku: string | null;
          stock_before: number | null;
        };
        Insert: {
          audit_date?: string | null;
          calculated_stock?: number | null;
          ecart?: number | null;
          id?: string | null;
          name?: string | null;
          sku?: string | null;
          stock_before?: number | null;
        };
        Update: {
          audit_date?: string | null;
          calculated_stock?: number | null;
          ecart?: number | null;
          id?: string | null;
          name?: string | null;
          sku?: string | null;
          stock_before?: number | null;
        };
        Relationships: [];
      };
      abby_sync_queue: {
        Row: {
          abby_payload: Json;
          created_at: string;
          created_by: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          last_error: string | null;
          max_retries: number;
          next_retry_at: string | null;
          operation: string;
          processed_at: string | null;
          retry_count: number;
          status: string;
        };
        Insert: {
          abby_payload: Json;
          created_at?: string;
          created_by?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          last_error?: string | null;
          max_retries?: number;
          next_retry_at?: string | null;
          operation: string;
          processed_at?: string | null;
          retry_count?: number;
          status?: string;
        };
        Update: {
          abby_payload?: Json;
          created_at?: string;
          created_by?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          last_error?: string | null;
          max_retries?: number;
          next_retry_at?: string | null;
          operation?: string;
          processed_at?: string | null;
          retry_count?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'abby_sync_queue_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'abby_sync_queue_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      abby_webhook_events: {
        Row: {
          event_data: Json;
          event_id: string;
          event_type: string;
          expires_at: string;
          id: string;
          processed_at: string;
        };
        Insert: {
          event_data: Json;
          event_id: string;
          event_type: string;
          expires_at: string;
          id?: string;
          processed_at?: string;
        };
        Update: {
          event_data?: Json;
          event_id?: string;
          event_type?: string;
          expires_at?: string;
          id?: string;
          processed_at?: string;
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
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      bank_transactions: {
        Row: {
          amount: number;
          bank_account_id: string;
          bank_provider: Database['public']['Enums']['bank_provider'];
          confidence_score: number | null;
          counterparty_iban: string | null;
          counterparty_name: string | null;
          created_at: string;
          currency: string;
          emitted_at: string;
          id: string;
          label: string;
          match_reason: string | null;
          matched_document_id: string | null;
          matching_status: Database['public']['Enums']['matching_status'];
          note: string | null;
          operation_type: string | null;
          raw_data: Json;
          reference: string | null;
          settled_at: string | null;
          side: Database['public']['Enums']['transaction_side'];
          transaction_id: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          bank_account_id: string;
          bank_provider: Database['public']['Enums']['bank_provider'];
          confidence_score?: number | null;
          counterparty_iban?: string | null;
          counterparty_name?: string | null;
          created_at?: string;
          currency?: string;
          emitted_at: string;
          id?: string;
          label: string;
          match_reason?: string | null;
          matched_document_id?: string | null;
          matching_status?: Database['public']['Enums']['matching_status'];
          note?: string | null;
          operation_type?: string | null;
          raw_data: Json;
          reference?: string | null;
          settled_at?: string | null;
          side: Database['public']['Enums']['transaction_side'];
          transaction_id: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          bank_account_id?: string;
          bank_provider?: Database['public']['Enums']['bank_provider'];
          confidence_score?: number | null;
          counterparty_iban?: string | null;
          counterparty_name?: string | null;
          created_at?: string;
          currency?: string;
          emitted_at?: string;
          id?: string;
          label?: string;
          match_reason?: string | null;
          matched_document_id?: string | null;
          matching_status?: Database['public']['Enums']['matching_status'];
          note?: string | null;
          operation_type?: string | null;
          raw_data?: Json;
          reference?: string | null;
          settled_at?: string | null;
          side?: Database['public']['Enums']['transaction_side'];
          transaction_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_transactions_matched_document_id_fkey';
            columns: ['matched_document_id'];
            isOneToOne: false;
            referencedRelation: 'financial_documents';
            referencedColumns: ['id'];
          },
        ];
      };
      bug_reports: {
        Row: {
          actual_behavior: string | null;
          assigned_to: string | null;
          browser_info: Json;
          category: string;
          console_errors: string[] | null;
          created_at: string;
          description: string;
          expected_behavior: string | null;
          id: string;
          priority: string | null;
          reported_by: string | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          screenshot_url: string | null;
          severity: string;
          status: string;
          steps_to_reproduce: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          actual_behavior?: string | null;
          assigned_to?: string | null;
          browser_info?: Json;
          category?: string;
          console_errors?: string[] | null;
          created_at?: string;
          description: string;
          expected_behavior?: string | null;
          id?: string;
          priority?: string | null;
          reported_by?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          screenshot_url?: string | null;
          severity?: string;
          status?: string;
          steps_to_reproduce?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          actual_behavior?: string | null;
          assigned_to?: string | null;
          browser_info?: Json;
          category?: string;
          console_errors?: string[] | null;
          created_at?: string;
          description?: string;
          expected_behavior?: string | null;
          id?: string;
          priority?: string | null;
          reported_by?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          screenshot_url?: string | null;
          severity?: string;
          status?: string;
          steps_to_reproduce?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bug_reports_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'bug_reports_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'bug_reports_reported_by_fkey';
            columns: ['reported_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'bug_reports_reported_by_fkey';
            columns: ['reported_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'bug_reports_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'bug_reports_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
            foreignKeyName: 'channel_price_lists_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'channel_price_lists_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
            foreignKeyName: 'channel_pricing_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'channel_pricing_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
            foreignKeyName: 'channel_pricing_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'channel_pricing_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
            foreignKeyName: 'channel_product_metadata_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'channel_product_metadata_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
          {
            foreignKeyName: 'channel_product_metadata_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'channel_product_metadata_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
            foreignKeyName: 'client_consultations_archived_by_fkey';
            columns: ['archived_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_archived_by_fkey';
            columns: ['archived_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
          {
            foreignKeyName: 'client_consultations_responded_by_fkey';
            columns: ['responded_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_responded_by_fkey';
            columns: ['responded_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'client_consultations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
        Relationships: [
          {
            foreignKeyName: 'collections_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'collections_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
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
            foreignKeyName: 'consultation_products_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'consultation_products_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
        };
        Insert: {
          accepts_marketing?: boolean | null;
          accepts_notifications?: boolean | null;
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
        };
        Update: {
          accepts_marketing?: boolean | null;
          accepts_notifications?: boolean | null;
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
        };
        Relationships: [
          {
            foreignKeyName: 'contacts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'contacts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
            foreignKeyName: 'customer_group_members_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'customer_group_members_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
        Relationships: [
          {
            foreignKeyName: 'customer_groups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'customer_groups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
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
            foreignKeyName: 'customer_price_lists_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'customer_price_lists_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'customer_price_lists_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'customer_price_lists_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
            foreignKeyName: 'customer_pricing_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'customer_pricing_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'customer_pricing_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'customer_pricing_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
        Relationships: [
          {
            foreignKeyName: 'enseignes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'enseignes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      expense_categories: {
        Row: {
          account_code: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          name: string;
          parent_category_id: string | null;
          updated_at: string;
        };
        Insert: {
          account_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name: string;
          parent_category_id?: string | null;
          updated_at?: string;
        };
        Update: {
          account_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          parent_category_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_categories_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'expense_categories_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'expense_categories_parent_category_id_fkey';
            columns: ['parent_category_id'];
            isOneToOne: false;
            referencedRelation: 'expense_categories';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'families_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'families_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'feed_configs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'feed_configs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
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
          {
            foreignKeyName: 'feed_exports_requested_by_fkey';
            columns: ['requested_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'feed_exports_requested_by_fkey';
            columns: ['requested_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
      financial_document_lines: {
        Row: {
          created_at: string;
          description: string;
          document_id: string;
          expense_category_id: string | null;
          id: string;
          line_number: number;
          product_id: string | null;
          quantity: number;
          total_ht: number;
          tva_rate: number;
          unit_price_ht: number;
        };
        Insert: {
          created_at?: string;
          description: string;
          document_id: string;
          expense_category_id?: string | null;
          id?: string;
          line_number: number;
          product_id?: string | null;
          quantity: number;
          total_ht: number;
          tva_rate: number;
          unit_price_ht: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          document_id?: string;
          expense_category_id?: string | null;
          id?: string;
          line_number?: number;
          product_id?: string | null;
          quantity?: number;
          total_ht?: number;
          tva_rate?: number;
          unit_price_ht?: number;
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
            foreignKeyName: 'financial_document_lines_expense_category_id_fkey';
            columns: ['expense_category_id'];
            isOneToOne: false;
            referencedRelation: 'expense_categories';
            referencedColumns: ['id'];
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
          expense_category_id: string | null;
          id: string;
          last_synced_from_abby_at: string | null;
          notes: string | null;
          partner_id: string;
          partner_type: string;
          purchase_order_id: string | null;
          sales_order_id: string | null;
          status: Database['public']['Enums']['document_status'];
          sync_errors: Json | null;
          synced_to_abby_at: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at: string;
          uploaded_file_name: string | null;
          uploaded_file_url: string | null;
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
          expense_category_id?: string | null;
          id?: string;
          last_synced_from_abby_at?: string | null;
          notes?: string | null;
          partner_id: string;
          partner_type: string;
          purchase_order_id?: string | null;
          sales_order_id?: string | null;
          status?: Database['public']['Enums']['document_status'];
          sync_errors?: Json | null;
          synced_to_abby_at?: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at?: string;
          uploaded_file_name?: string | null;
          uploaded_file_url?: string | null;
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
          expense_category_id?: string | null;
          id?: string;
          last_synced_from_abby_at?: string | null;
          notes?: string | null;
          partner_id?: string;
          partner_type?: string;
          purchase_order_id?: string | null;
          sales_order_id?: string | null;
          status?: Database['public']['Enums']['document_status'];
          sync_errors?: Json | null;
          synced_to_abby_at?: string | null;
          total_ht?: number;
          total_ttc?: number;
          tva_amount?: number;
          updated_at?: string;
          uploaded_file_name?: string | null;
          uploaded_file_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_documents_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'financial_documents_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'financial_documents_expense_category_id_fkey';
            columns: ['expense_category_id'];
            isOneToOne: false;
            referencedRelation: 'expense_categories';
            referencedColumns: ['id'];
          },
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
            referencedRelation: 'sales_orders';
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
            foreignKeyName: 'financial_payments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'financial_payments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'financial_payments_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'financial_documents';
            referencedColumns: ['id'];
          },
        ];
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
            foreignKeyName: 'group_price_lists_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'group_price_lists_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
          email: string;
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
          email: string;
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
          email?: string;
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
            foreignKeyName: 'invoice_status_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'invoice_status_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
            foreignKeyName: 'invoices_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'invoices_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'invoices_sales_order_id_fkey';
            columns: ['sales_order_id'];
            isOneToOne: true;
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
        ];
      };
      linkme_affiliates: {
        Row: {
          affiliate_type: string;
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
          slug: string;
          status: string | null;
          tva_rate: number | null;
          updated_at: string | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          affiliate_type: string;
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
          slug: string;
          status?: string | null;
          tva_rate?: number | null;
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          affiliate_type?: string;
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
          slug?: string;
          status?: string | null;
          tva_rate?: number | null;
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'linkme_affiliates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'linkme_affiliates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
          {
            foreignKeyName: 'linkme_affiliates_verified_by_fkey';
            columns: ['verified_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'linkme_affiliates_verified_by_fkey';
            columns: ['verified_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
          selection_id: string | null;
          status: string | null;
          tax_rate: number | null;
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
          selection_id?: string | null;
          status?: string | null;
          tax_rate?: number | null;
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
          selection_id?: string | null;
          status?: string | null;
          tax_rate?: number | null;
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
            isOneToOne: false;
            referencedRelation: 'sales_orders';
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
            foreignKeyName: 'linkme_commissions_paid_by_fkey';
            columns: ['paid_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'linkme_commissions_paid_by_fkey';
            columns: ['paid_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'linkme_commissions_selection_id_fkey';
            columns: ['selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'linkme_commissions_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'linkme_commissions_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
          products_count: number | null;
          published_at: string | null;
          share_token: string | null;
          slug: string;
          total_revenue: number | null;
          updated_at: string | null;
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
          products_count?: number | null;
          published_at?: string | null;
          share_token?: string | null;
          slug: string;
          total_revenue?: number | null;
          updated_at?: string | null;
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
          products_count?: number | null;
          published_at?: string | null;
          share_token?: string | null;
          slug?: string;
          total_revenue?: number | null;
          updated_at?: string | null;
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
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
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
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'order_discounts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'order_discounts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      organisations: {
        Row: {
          abby_customer_id: string | null;
          address_line1: string | null;
          address_line2: string | null;
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
          delivery_time_days: number | null;
          email: string | null;
          enseigne_id: string | null;
          has_different_shipping_address: boolean | null;
          has_different_trade_name: boolean;
          id: string;
          industry_sector: string | null;
          is_active: boolean | null;
          is_enseigne_parent: boolean;
          legal_form: string | null;
          legal_name: string;
          logo_url: string | null;
          minimum_order_amount: number | null;
          notes: string | null;
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
          siren: string | null;
          siret: string | null;
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
          delivery_time_days?: number | null;
          email?: string | null;
          enseigne_id?: string | null;
          has_different_shipping_address?: boolean | null;
          has_different_trade_name?: boolean;
          id?: string;
          industry_sector?: string | null;
          is_active?: boolean | null;
          is_enseigne_parent?: boolean;
          legal_form?: string | null;
          legal_name: string;
          logo_url?: string | null;
          minimum_order_amount?: number | null;
          notes?: string | null;
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
          siren?: string | null;
          siret?: string | null;
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
          delivery_time_days?: number | null;
          email?: string | null;
          enseigne_id?: string | null;
          has_different_shipping_address?: boolean | null;
          has_different_trade_name?: boolean;
          id?: string;
          industry_sector?: string | null;
          is_active?: boolean | null;
          is_enseigne_parent?: boolean;
          legal_form?: string | null;
          legal_name?: string;
          logo_url?: string | null;
          minimum_order_amount?: number | null;
          notes?: string | null;
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
          siren?: string | null;
          siret?: string | null;
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
            foreignKeyName: 'organisations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'organisations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
            foreignKeyName: 'payments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'payments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'payments_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
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
            foreignKeyName: 'price_list_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'price_list_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
            foreignKeyName: 'price_list_items_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'price_list_items_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
          {
            foreignKeyName: 'price_list_items_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'price_list_items_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
        Relationships: [
          {
            foreignKeyName: 'price_lists_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'price_lists_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'price_lists_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'price_lists_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
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
            foreignKeyName: 'product_drafts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'product_drafts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
            foreignKeyName: 'product_images_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'product_images_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
          archived_at: string | null;
          assigned_client_id: string | null;
          availability_type:
            | Database['public']['Enums']['availability_type_enum']
            | null;
          brand: string | null;
          completion_percentage: number | null;
          completion_status: string | null;
          condition: string | null;
          cost_price: number | null;
          created_at: string | null;
          creation_mode: string | null;
          description: string | null;
          dimensions: Json | null;
          eco_tax_default: number | null;
          enseigne_id: string | null;
          gtin: string | null;
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
          sku: string;
          slug: string | null;
          sourcing_type: string | null;
          stock_forecasted_in: number | null;
          stock_forecasted_out: number | null;
          stock_quantity: number | null;
          stock_real: number | null;
          stock_status: Database['public']['Enums']['stock_status_type'];
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
          archived_at?: string | null;
          assigned_client_id?: string | null;
          availability_type?:
            | Database['public']['Enums']['availability_type_enum']
            | null;
          brand?: string | null;
          completion_percentage?: number | null;
          completion_status?: string | null;
          condition?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          creation_mode?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          eco_tax_default?: number | null;
          enseigne_id?: string | null;
          gtin?: string | null;
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
          sku: string;
          slug?: string | null;
          sourcing_type?: string | null;
          stock_forecasted_in?: number | null;
          stock_forecasted_out?: number | null;
          stock_quantity?: number | null;
          stock_real?: number | null;
          stock_status?: Database['public']['Enums']['stock_status_type'];
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
          archived_at?: string | null;
          assigned_client_id?: string | null;
          availability_type?:
            | Database['public']['Enums']['availability_type_enum']
            | null;
          brand?: string | null;
          completion_percentage?: number | null;
          completion_status?: string | null;
          condition?: string | null;
          cost_price?: number | null;
          created_at?: string | null;
          creation_mode?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          eco_tax_default?: number | null;
          enseigne_id?: string | null;
          gtin?: string | null;
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
          sku?: string;
          slug?: string | null;
          sourcing_type?: string | null;
          stock_forecasted_in?: number | null;
          stock_forecasted_out?: number | null;
          stock_quantity?: number | null;
          stock_real?: number | null;
          stock_status?: Database['public']['Enums']['stock_status_type'];
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
          unit_price_ht: number;
          updated_at: string;
        };
        Insert: {
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
          unit_price_ht: number;
          updated_at?: string;
        };
        Update: {
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
          batch_number: string | null;
          created_at: string | null;
          id: string;
          notes: string | null;
          product_id: string;
          purchase_order_id: string;
          quantity_received: number;
          received_at: string;
          received_by: string;
          updated_at: string | null;
        };
        Insert: {
          batch_number?: string | null;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          product_id: string;
          purchase_order_id: string;
          quantity_received: number;
          received_at?: string;
          received_by: string;
          updated_at?: string | null;
        };
        Update: {
          batch_number?: string | null;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string;
          purchase_order_id?: string;
          quantity_received?: number;
          received_at?: string;
          received_by?: string;
          updated_at?: string | null;
        };
        Relationships: [
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
          {
            foreignKeyName: 'purchase_order_receptions_received_by_fkey';
            columns: ['received_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'purchase_order_receptions_received_by_fkey';
            columns: ['received_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
          id: string;
          insurance_cost_ht: number | null;
          notes: string | null;
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
          id?: string;
          insurance_cost_ht?: number | null;
          notes?: string | null;
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
          id?: string;
          insurance_cost_ht?: number | null;
          notes?: string | null;
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
            foreignKeyName: 'purchase_orders_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'purchase_orders_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'purchase_orders_received_by_fkey';
            columns: ['received_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'purchase_orders_received_by_fkey';
            columns: ['received_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'purchase_orders_sent_by_fkey';
            columns: ['sent_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'purchase_orders_sent_by_fkey';
            columns: ['sent_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'purchase_orders_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'organisations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_orders_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'purchase_orders_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
        Relationships: [
          {
            foreignKeyName: 'sales_channels_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_channels_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      sales_order_items: {
        Row: {
          created_at: string;
          discount_percentage: number;
          eco_tax: number;
          expected_delivery_date: string | null;
          id: string;
          is_sample: boolean;
          linkme_selection_item_id: string | null;
          notes: string | null;
          product_id: string;
          quantity: number;
          quantity_shipped: number;
          retrocession_amount: number | null;
          retrocession_amount_ttc: number | null;
          retrocession_rate: number | null;
          sales_order_id: string;
          tax_rate: number;
          total_ht: number | null;
          unit_price_ht: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          discount_percentage?: number;
          eco_tax?: number;
          expected_delivery_date?: string | null;
          id?: string;
          is_sample?: boolean;
          linkme_selection_item_id?: string | null;
          notes?: string | null;
          product_id: string;
          quantity: number;
          quantity_shipped?: number;
          retrocession_amount?: number | null;
          retrocession_amount_ttc?: number | null;
          retrocession_rate?: number | null;
          sales_order_id: string;
          tax_rate?: number;
          total_ht?: number | null;
          unit_price_ht: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          discount_percentage?: number;
          eco_tax?: number;
          expected_delivery_date?: string | null;
          id?: string;
          is_sample?: boolean;
          linkme_selection_item_id?: string | null;
          notes?: string | null;
          product_id?: string;
          quantity?: number;
          quantity_shipped?: number;
          retrocession_amount?: number | null;
          retrocession_amount_ttc?: number | null;
          retrocession_rate?: number | null;
          sales_order_id?: string;
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
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
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
            referencedRelation: 'sales_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_shipped_by_fkey';
            columns: ['shipped_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_order_shipments_shipped_by_fkey';
            columns: ['shipped_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      sales_orders: {
        Row: {
          affiliate_total_ht: number | null;
          affiliate_total_ttc: number | null;
          applied_discount_codes: string[] | null;
          billing_address: Json | null;
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
          currency: string;
          customer_id: string;
          customer_type: string;
          delivered_at: string | null;
          delivered_by: string | null;
          eco_tax_total: number;
          eco_tax_vat_rate: number | null;
          expected_delivery_date: string | null;
          handling_cost_ht: number | null;
          id: string;
          insurance_cost_ht: number | null;
          linkme_selection_id: string | null;
          notes: string | null;
          order_number: string;
          paid_amount: number | null;
          paid_at: string | null;
          payment_status: string | null;
          payment_terms: string | null;
          payment_terms_notes: string | null;
          payment_terms_type:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          ready_for_shipment: boolean | null;
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
          affiliate_total_ht?: number | null;
          affiliate_total_ttc?: number | null;
          applied_discount_codes?: string[] | null;
          billing_address?: Json | null;
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
          currency?: string;
          customer_id: string;
          customer_type: string;
          delivered_at?: string | null;
          delivered_by?: string | null;
          eco_tax_total?: number;
          eco_tax_vat_rate?: number | null;
          expected_delivery_date?: string | null;
          handling_cost_ht?: number | null;
          id?: string;
          insurance_cost_ht?: number | null;
          linkme_selection_id?: string | null;
          notes?: string | null;
          order_number: string;
          paid_amount?: number | null;
          paid_at?: string | null;
          payment_status?: string | null;
          payment_terms?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          ready_for_shipment?: boolean | null;
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
          affiliate_total_ht?: number | null;
          affiliate_total_ttc?: number | null;
          applied_discount_codes?: string[] | null;
          billing_address?: Json | null;
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
          currency?: string;
          customer_id?: string;
          customer_type?: string;
          delivered_at?: string | null;
          delivered_by?: string | null;
          eco_tax_total?: number;
          eco_tax_vat_rate?: number | null;
          expected_delivery_date?: string | null;
          handling_cost_ht?: number | null;
          id?: string;
          insurance_cost_ht?: number | null;
          linkme_selection_id?: string | null;
          notes?: string | null;
          order_number?: string;
          paid_amount?: number | null;
          paid_at?: string | null;
          payment_status?: string | null;
          payment_terms?: string | null;
          payment_terms_notes?: string | null;
          payment_terms_type?:
            | Database['public']['Enums']['payment_terms_type']
            | null;
          ready_for_shipment?: boolean | null;
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
            foreignKeyName: 'sales_orders_cancelled_by_fkey';
            columns: ['cancelled_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_cancelled_by_fkey';
            columns: ['cancelled_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'sales_channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_closed_by_fkey';
            columns: ['closed_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_closed_by_fkey';
            columns: ['closed_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_confirmed_by_fkey';
            columns: ['confirmed_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_confirmed_by_fkey';
            columns: ['confirmed_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_delivered_by_fkey';
            columns: ['delivered_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_delivered_by_fkey';
            columns: ['delivered_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_linkme_selection_id_fkey';
            columns: ['linkme_selection_id'];
            isOneToOne: false;
            referencedRelation: 'linkme_selections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_orders_shipped_by_fkey';
            columns: ['shipped_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_shipped_by_fkey';
            columns: ['shipped_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_warehouse_exit_by_fkey';
            columns: ['warehouse_exit_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sales_orders_warehouse_exit_by_fkey';
            columns: ['warehouse_exit_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
            foreignKeyName: 'sample_orders_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sample_orders_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sample_orders_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'sample_orders_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
          {
            foreignKeyName: 'stock_alert_tracking_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'stock_alert_tracking_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
            foreignKeyName: 'stock_movements_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'stock_movements_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
          {
            foreignKeyName: 'stock_reservations_released_by_fkey';
            columns: ['released_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'stock_reservations_released_by_fkey';
            columns: ['released_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'stock_reservations_reserved_by_fkey';
            columns: ['reserved_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'stock_reservations_reserved_by_fkey';
            columns: ['reserved_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
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
            foreignKeyName: 'user_app_roles_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_app_roles_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
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
          {
            foreignKeyName: 'user_app_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_app_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_profiles: {
        Row: {
          app: Database['public']['Enums']['app_type'];
          app_source: Database['public']['Enums']['app_type'] | null;
          avatar_url: string | null;
          client_type: Database['public']['Enums']['client_type'] | null;
          created_at: string | null;
          first_name: string | null;
          individual_customer_id: string | null;
          job_title: string | null;
          last_name: string | null;
          last_sign_in_at: string | null;
          organisation_id: string | null;
          parent_user_id: string | null;
          partner_id: string | null;
          phone: string | null;
          role: Database['public']['Enums']['user_role_type'];
          scopes: string[] | null;
          updated_at: string | null;
          user_id: string;
          user_type: Database['public']['Enums']['user_type'] | null;
        };
        Insert: {
          app?: Database['public']['Enums']['app_type'];
          app_source?: Database['public']['Enums']['app_type'] | null;
          avatar_url?: string | null;
          client_type?: Database['public']['Enums']['client_type'] | null;
          created_at?: string | null;
          first_name?: string | null;
          individual_customer_id?: string | null;
          job_title?: string | null;
          last_name?: string | null;
          last_sign_in_at?: string | null;
          organisation_id?: string | null;
          parent_user_id?: string | null;
          partner_id?: string | null;
          phone?: string | null;
          role: Database['public']['Enums']['user_role_type'];
          scopes?: string[] | null;
          updated_at?: string | null;
          user_id: string;
          user_type?: Database['public']['Enums']['user_type'] | null;
        };
        Update: {
          app?: Database['public']['Enums']['app_type'];
          app_source?: Database['public']['Enums']['app_type'] | null;
          avatar_url?: string | null;
          client_type?: Database['public']['Enums']['client_type'] | null;
          created_at?: string | null;
          first_name?: string | null;
          individual_customer_id?: string | null;
          job_title?: string | null;
          last_name?: string | null;
          last_sign_in_at?: string | null;
          organisation_id?: string | null;
          parent_user_id?: string | null;
          partner_id?: string | null;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role_type'];
          scopes?: string[] | null;
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
          {
            foreignKeyName: 'user_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'v_users_with_roles';
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
    };
    Views: {
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
        Relationships: [
          {
            foreignKeyName: 'enseignes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_linkme_users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'enseignes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_users_with_roles';
            referencedColumns: ['user_id'];
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
      v_users_with_roles: {
        Row: {
          app: Database['public']['Enums']['app_type'] | null;
          avatar_url: string | null;
          email: string | null;
          enseigne_id: string | null;
          enseigne_name: string | null;
          first_name: string | null;
          last_name: string | null;
          last_sign_in_at: string | null;
          organisation_id: string | null;
          organisation_name: string | null;
          permissions: string[] | null;
          phone: string | null;
          role: string | null;
          role_is_active: boolean | null;
          user_created_at: string | null;
          user_id: string | null;
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
    };
    Functions: {
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
      add_products_to_linkme_catalog: {
        Args: { p_product_ids: string[] };
        Returns: number;
      };
      approve_sample_request: {
        Args: { p_approved_by: string; p_draft_id: string };
        Returns: {
          message: string;
          status: string;
          success: boolean;
        }[];
      };
      auto_cancel_unpaid_orders: { Args: never; Returns: undefined };
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
      batch_add_google_merchant_products: {
        Args: { merchant_id: string; product_ids: string[] };
        Returns: {
          error: string;
          google_product_id: string;
          product_id: string;
          success: boolean;
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
      count_owners: { Args: never; Returns: number };
      create_color_if_not_exists: {
        Args: { color_hex?: string; color_name: string };
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
          expense_category_id: string | null;
          id: string;
          last_synced_from_abby_at: string | null;
          notes: string | null;
          partner_id: string;
          partner_type: string;
          purchase_order_id: string | null;
          sales_order_id: string | null;
          status: Database['public']['Enums']['document_status'];
          sync_errors: Json | null;
          synced_to_abby_at: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at: string;
          uploaded_file_name: string | null;
          uploaded_file_url: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'financial_documents';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_expense: {
        Args: {
          p_amount_ht: number;
          p_amount_ttc: number;
          p_description: string;
          p_expense_category_id: string;
          p_expense_date: string;
          p_notes?: string;
          p_supplier_id: string;
          p_tva_amount: number;
          p_uploaded_file_url?: string;
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
          expense_category_id: string | null;
          id: string;
          last_synced_from_abby_at: string | null;
          notes: string | null;
          partner_id: string;
          partner_type: string;
          purchase_order_id: string | null;
          sales_order_id: string | null;
          status: Database['public']['Enums']['document_status'];
          sync_errors: Json | null;
          synced_to_abby_at: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at: string;
          uploaded_file_name: string | null;
          uploaded_file_url: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'financial_documents';
          isOneToOne: true;
          isSetofReturn: false;
        };
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
          id: string;
          insurance_cost_ht: number | null;
          notes: string | null;
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
          expense_category_id: string | null;
          id: string;
          last_synced_from_abby_at: string | null;
          notes: string | null;
          partner_id: string;
          partner_type: string;
          purchase_order_id: string | null;
          sales_order_id: string | null;
          status: Database['public']['Enums']['document_status'];
          sync_errors: Json | null;
          synced_to_abby_at: string | null;
          total_ht: number;
          total_ttc: number;
          tva_amount: number;
          updated_at: string;
          uploaded_file_name: string | null;
          uploaded_file_url: string | null;
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
      decrement_selection_products_count: {
        Args: { p_selection_id: string };
        Returns: undefined;
      };
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
      get_current_user_id: { Args: never; Returns: string };
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
      get_error_reports_dashboard: {
        Args: {
          limit_param?: number;
          severity_filter?: Database['public']['Enums']['error_severity_enum'];
          status_filter?: Database['public']['Enums']['error_status_enum'];
        };
        Returns: Json;
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
      get_linkme_catalog_products_for_affiliate: {
        Args: { p_affiliate_id?: string };
        Returns: {
          assigned_client_id: string;
          custom_description: string;
          custom_selling_points: string[];
          custom_title: string;
          display_order: number;
          enseigne_id: string;
          id: string;
          is_enabled: boolean;
          is_featured: boolean;
          is_public_showcase: boolean;
          is_sourced: boolean;
          linkme_commission_rate: number;
          max_margin_rate: number;
          min_margin_rate: number;
          product_category_name: string;
          product_family_name: string;
          product_id: string;
          product_image_url: string;
          product_is_active: boolean;
          product_name: string;
          product_price_ht: number;
          product_reference: string;
          product_stock_real: number;
          selections_count: number;
          suggested_margin_rate: number;
          views_count: number;
        }[];
      };
      get_linkme_channel_id: { Args: never; Returns: string };
      get_linkme_showcase_collections_with_products: {
        Args: never;
        Returns: {
          collection_description: string;
          collection_display_order: number;
          collection_id: string;
          collection_image_url: string;
          collection_layout_type: string;
          collection_name: string;
          collection_slug: string;
          products: Json;
        }[];
      };
      get_linkme_showcase_products: {
        Args: never;
        Returns: {
          custom_description: string;
          custom_selling_points: string[];
          custom_title: string;
          display_order: number;
          id: string;
          is_featured: boolean;
          max_margin_rate: number;
          product_category_name: string;
          product_family_name: string;
          product_id: string;
          product_image_url: string;
          product_name: string;
          product_price_ht: number;
          product_reference: string;
          suggested_margin_rate: number;
        }[];
      };
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
      get_primary_contact: {
        Args: { org_id: string };
        Returns: {
          accepts_marketing: boolean | null;
          accepts_notifications: boolean | null;
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
        };
        SetofOptions: {
          from: '*';
          to: 'contacts';
          isOneToOne: true;
          isSetofReturn: false;
        };
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
      get_test_progress_summary: { Args: never; Returns: Json };
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
      get_user_full_name: {
        Args: {
          user_profile_record: Database['public']['Tables']['user_profiles']['Row'];
        };
        Returns: string;
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
      get_user_role: {
        Args: never;
        Returns: Database['public']['Enums']['user_role_type'];
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
      is_admin: { Args: never; Returns: boolean };
      is_backoffice_admin: { Args: never; Returns: boolean };
      is_current_user_admin: { Args: never; Returns: boolean };
      is_current_user_owner: { Args: never; Returns: boolean };
      is_customer_user: { Args: never; Returns: boolean };
      is_enseigne_admin: {
        Args: { check_enseigne_id: string };
        Returns: boolean;
      };
      is_owner: { Args: never; Returns: boolean };
      is_staff_user: { Args: never; Returns: boolean };
      is_tester_or_admin: { Args: never; Returns: boolean };
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
      poll_google_merchant_statuses: {
        Args: { product_ids: string[]; statuses_data: Json };
        Returns: {
          error: string;
          success: boolean;
          updated_count: number;
        }[];
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
      remove_collection_tag: {
        Args: { collection_id: string; tag: string };
        Returns: undefined;
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
      search_product_colors: {
        Args: { search_query: string };
        Returns: {
          hex_code: string;
          id: string;
          is_predefined: boolean;
          name: string;
        }[];
      };
      set_current_user_id: { Args: { user_id: string }; Returns: undefined };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      slugify: { Args: { text_input: string }; Returns: string };
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
      transfer_to_product_catalog: {
        Args: { p_draft_id: string };
        Returns: {
          message: string;
          product_id: string;
          success: boolean;
        }[];
      };
      unmatch_transaction: {
        Args: { p_transaction_id: string };
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
      app_type: 'back-office' | 'site-internet' | 'linkme';
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
      matching_status:
        | 'unmatched'
        | 'auto_matched'
        | 'manual_matched'
        | 'partial_matched'
        | 'ignored';
      movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
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
        | 'draft'
        | 'validated'
        | 'partially_shipped'
        | 'shipped'
        | 'delivered'
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
        | 'artisan';
      test_status_enum: 'pending' | 'passed' | 'failed' | 'warning';
      transaction_side: 'credit' | 'debit';
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
      [_ in never]: never;
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
      app_type: ['back-office', 'site-internet', 'linkme'],
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
      matching_status: [
        'unmatched',
        'auto_matched',
        'manual_matched',
        'partial_matched',
        'ignored',
      ],
      movement_type: ['IN', 'OUT', 'ADJUST', 'TRANSFER'],
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
        'draft',
        'validated',
        'partially_shipped',
        'shipped',
        'delivered',
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
      ],
      test_status_enum: ['pending', 'passed', 'failed', 'warning'],
      transaction_side: ['credit', 'debit'],
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
