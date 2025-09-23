export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          facebook_category: string | null
          family_id: string | null
          google_category_id: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          level: number | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          facebook_category?: string | null
          family_id?: string | null
          google_category_id?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          level?: number | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          facebook_category?: string | null
          family_id?: string | null
          google_category_id?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          level?: number | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_translations: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          language: Database["public"]["Enums"]["language_type"]
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          language: Database["public"]["Enums"]["language_type"]
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          language?: Database["public"]["Enums"]["language_type"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_translations: {
        Row: {
          collection_id: string
          created_at: string | null
          description: string | null
          id: string
          language: Database["public"]["Enums"]["language_type"]
          name: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          language: Database["public"]["Enums"]["language_type"]
          name: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          language?: Database["public"]["Enums"]["language_type"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_translations_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          name: string
          season: string | null
          slug: string
          style_tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name: string
          season?: string | null
          slug: string
          style_tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name?: string
          season?: string | null
          slug?: string
          style_tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          accepts_marketing: boolean | null
          accepts_notifications: boolean | null
          created_at: string | null
          created_by: string | null
          department: string | null
          direct_line: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          is_billing_contact: boolean | null
          is_commercial_contact: boolean | null
          is_primary_contact: boolean | null
          is_technical_contact: boolean | null
          language_preference: string | null
          last_contact_date: string | null
          last_name: string
          mobile: string | null
          notes: string | null
          organisation_id: string
          phone: string | null
          preferred_communication_method: string | null
          secondary_email: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          accepts_marketing?: boolean | null
          accepts_notifications?: boolean | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          direct_line?: string | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean | null
          is_billing_contact?: boolean | null
          is_commercial_contact?: boolean | null
          is_primary_contact?: boolean | null
          is_technical_contact?: boolean | null
          language_preference?: string | null
          last_contact_date?: string | null
          last_name: string
          mobile?: string | null
          notes?: string | null
          organisation_id: string
          phone?: string | null
          preferred_communication_method?: string | null
          secondary_email?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          accepts_marketing?: boolean | null
          accepts_notifications?: boolean | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          direct_line?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          is_billing_contact?: boolean | null
          is_commercial_contact?: boolean | null
          is_primary_contact?: boolean | null
          is_technical_contact?: boolean | null
          language_preference?: string | null
          last_contact_date?: string | null
          last_name?: string
          mobile?: string | null
          notes?: string | null
          organisation_id?: string
          phone?: string | null
          preferred_communication_method?: string | null
          secondary_email?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feed_configs: {
        Row: {
          access_token: string
          created_at: string | null
          created_by: string
          filters: Json | null
          format: Database["public"]["Enums"]["feed_format_type"] | null
          id: string
          is_active: boolean | null
          language: Database["public"]["Enums"]["language_type"]
          last_export_at: string | null
          name: string
          platform: Database["public"]["Enums"]["feed_platform_type"]
          schedule_day: number | null
          schedule_frequency:
            | Database["public"]["Enums"]["schedule_frequency_type"]
            | null
          schedule_hour: number | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          created_by: string
          filters?: Json | null
          format?: Database["public"]["Enums"]["feed_format_type"] | null
          id?: string
          is_active?: boolean | null
          language: Database["public"]["Enums"]["language_type"]
          last_export_at?: string | null
          name: string
          platform: Database["public"]["Enums"]["feed_platform_type"]
          schedule_day?: number | null
          schedule_frequency?:
            | Database["public"]["Enums"]["schedule_frequency_type"]
            | null
          schedule_hour?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          created_by?: string
          filters?: Json | null
          format?: Database["public"]["Enums"]["feed_format_type"] | null
          id?: string
          is_active?: boolean | null
          language?: Database["public"]["Enums"]["language_type"]
          last_export_at?: string | null
          name?: string
          platform?: Database["public"]["Enums"]["feed_platform_type"]
          schedule_day?: number | null
          schedule_frequency?:
            | Database["public"]["Enums"]["schedule_frequency_type"]
            | null
          schedule_hour?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      feed_exports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          feed_config_id: string
          file_size: number | null
          file_url: string | null
          id: string
          ip_address: unknown | null
          logs: Json | null
          products_count: number | null
          requested_by: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["feed_export_status_type"] | null
          user_agent: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          feed_config_id: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          ip_address?: unknown | null
          logs?: Json | null
          products_count?: number | null
          requested_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["feed_export_status_type"] | null
          user_agent?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          feed_config_id?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          ip_address?: unknown | null
          logs?: Json | null
          products_count?: number | null
          requested_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["feed_export_status_type"] | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_exports_feed_config_id_fkey"
            columns: ["feed_config_id"]
            isOneToOne: false
            referencedRelation: "feed_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_performance_metrics: {
        Row: {
          avg_duration_seconds: number | null
          avg_products_count: number | null
          created_at: string | null
          error_types: Json | null
          failed_exports: number | null
          feed_config_id: string
          id: string
          max_duration_seconds: number | null
          metrics_date: string
          successful_exports: number | null
          total_exports: number | null
          total_file_size_bytes: number | null
          updated_at: string | null
        }
        Insert: {
          avg_duration_seconds?: number | null
          avg_products_count?: number | null
          created_at?: string | null
          error_types?: Json | null
          failed_exports?: number | null
          feed_config_id: string
          id?: string
          max_duration_seconds?: number | null
          metrics_date: string
          successful_exports?: number | null
          total_exports?: number | null
          total_file_size_bytes?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_duration_seconds?: number | null
          avg_products_count?: number | null
          created_at?: string | null
          error_types?: Json | null
          failed_exports?: number | null
          feed_config_id?: string
          id?: string
          max_duration_seconds?: number | null
          metrics_date?: string
          successful_exports?: number | null
          total_exports?: number | null
          total_file_size_bytes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_performance_metrics_feed_config_id_fkey"
            columns: ["feed_config_id"]
            isOneToOne: false
            referencedRelation: "feed_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          archived_at: string | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_region: string | null
          certification_labels: string[] | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_type: string | null
          delivery_time_days: number | null
          email: string | null
          has_different_shipping_address: boolean | null
          id: string
          industry_sector: string | null
          is_active: boolean | null
          legal_form: string | null
          minimum_order_amount: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          preferred_supplier: boolean | null
          prepayment_required: boolean | null
          rating: number | null
          region: string | null
          secondary_email: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_postal_code: string | null
          shipping_region: string | null
          siret: string | null
          supplier_category: string | null
          supplier_segment: string | null
          type: Database["public"]["Enums"]["organisation_type"] | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_region?: string | null
          certification_labels?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_type?: string | null
          delivery_time_days?: number | null
          email?: string | null
          has_different_shipping_address?: boolean | null
          id?: string
          industry_sector?: string | null
          is_active?: boolean | null
          legal_form?: string | null
          minimum_order_amount?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_supplier?: boolean | null
          prepayment_required?: boolean | null
          rating?: number | null
          region?: string | null
          secondary_email?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_region?: string | null
          siret?: string | null
          supplier_category?: string | null
          supplier_segment?: string | null
          type?: Database["public"]["Enums"]["organisation_type"] | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_region?: string | null
          certification_labels?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_type?: string | null
          delivery_time_days?: number | null
          email?: string | null
          has_different_shipping_address?: boolean | null
          id?: string
          industry_sector?: string | null
          is_active?: boolean | null
          legal_form?: string | null
          minimum_order_amount?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_supplier?: boolean | null
          prepayment_required?: boolean | null
          rating?: number | null
          region?: string | null
          secondary_email?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_region?: string | null
          siret?: string | null
          supplier_category?: string | null
          supplier_segment?: string | null
          type?: Database["public"]["Enums"]["organisation_type"] | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      product_drafts: {
        Row: {
          category_id: string | null
          color: string | null
          condition: string | null
          cost_price: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          dimensions: Json | null
          estimated_selling_price: number | null
          family_id: string | null
          generated_description: string | null
          gtin: string | null
          id: string
          margin_percentage: number | null
          material: string | null
          min_stock_level: number | null
          name: string | null
          price_ht: number | null
          selling_price: number | null
          sku: string | null
          status: string | null
          stock_quantity: number | null
          subcategory_id: string | null
          supplier_description: string | null
          supplier_id: string | null
          supplier_page_url: string | null
          supplier_price: number | null
          supplier_reference: string | null
          tax_rate: number | null
          updated_at: string | null
          weight: number | null
          wizard_step_completed: number | null
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dimensions?: Json | null
          estimated_selling_price?: number | null
          family_id?: string | null
          generated_description?: string | null
          gtin?: string | null
          id?: string
          margin_percentage?: number | null
          material?: string | null
          min_stock_level?: number | null
          name?: string | null
          price_ht?: number | null
          selling_price?: number | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          supplier_description?: string | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_price?: number | null
          supplier_reference?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          weight?: number | null
          wizard_step_completed?: number | null
        }
        Update: {
          category_id?: string | null
          color?: string | null
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dimensions?: Json | null
          estimated_selling_price?: number | null
          family_id?: string | null
          generated_description?: string | null
          gtin?: string | null
          id?: string
          margin_percentage?: number | null
          material?: string | null
          min_stock_level?: number | null
          name?: string | null
          price_ht?: number | null
          selling_price?: number | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          supplier_description?: string | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_price?: number | null
          supplier_reference?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          weight?: number | null
          wizard_step_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_drafts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_drafts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_drafts_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_drafts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          file_size: number | null
          format: string | null
          height: number | null
          id: string
          image_type: Database["public"]["Enums"]["image_type_enum"] | null
          is_primary: boolean | null
          product_id: string
          public_url: string | null
          storage_path: string
          updated_at: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          image_type?: Database["public"]["Enums"]["image_type_enum"] | null
          is_primary?: boolean | null
          product_id: string
          public_url?: string | null
          storage_path: string
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          image_type?: Database["public"]["Enums"]["image_type_enum"] | null
          is_primary?: boolean | null
          product_id?: string
          public_url?: string | null
          storage_path?: string
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
        ]
      }
      product_packages: {
        Row: {
          base_quantity: number
          created_at: string | null
          description: string | null
          discount_rate: number | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          min_order_quantity: number | null
          name: string
          product_id: string
          type: Database["public"]["Enums"]["package_type"]
          unit_price_ht: number | null
          updated_at: string | null
        }
        Insert: {
          base_quantity?: number
          created_at?: string | null
          description?: string | null
          discount_rate?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          min_order_quantity?: number | null
          name: string
          product_id: string
          type: Database["public"]["Enums"]["package_type"]
          unit_price_ht?: number | null
          updated_at?: string | null
        }
        Update: {
          base_quantity?: number
          created_at?: string | null
          description?: string | null
          discount_rate?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          min_order_quantity?: number | null
          name?: string
          product_id?: string
          type?: Database["public"]["Enums"]["package_type"]
          unit_price_ht?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_packages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_packages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          condition: string | null
          cost_price: number | null
          created_at: string | null
          dimensions: Json | null
          gtin: string | null
          id: string
          margin_percentage: number | null
          min_stock_level: number | null
          name: string
          price_ht: number
          supplier_cost_price: number | null
          sku: string
          slug: string | null
          status: Database["public"]["Enums"]["availability_status_type"] | null
          stock_quantity: number | null
          subcategory_id: string | null
          supplier_id: string | null
          supplier_page_url: string | null
          supplier_reference: string | null
          updated_at: string | null
          variant_attributes: Json | null
          video_url: string | null
          weight: number | null
        }
        Insert: {
          brand?: string | null
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          dimensions?: Json | null
          gtin?: string | null
          id?: string
          margin_percentage?: number | null
          min_stock_level?: number | null
          name: string
          price_ht: number
          supplier_cost_price?: number | null
          sku: string
          slug?: string | null
          status?:
            | Database["public"]["Enums"]["availability_status_type"]
            | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_reference?: string | null
          updated_at?: string | null
          variant_attributes?: Json | null
          video_url?: string | null
          weight?: number | null
        }
        Update: {
          brand?: string | null
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          dimensions?: Json | null
          gtin?: string | null
          id?: string
          margin_percentage?: number | null
          min_stock_level?: number | null
          name?: string
          price_ht?: number
          supplier_cost_price?: number | null
          sku?: string
          slug?: string | null
          status?:
            | Database["public"]["Enums"]["availability_status_type"]
            | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_reference?: string | null
          updated_at?: string | null
          variant_attributes?: Json | null
          video_url?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          discount_percentage: number
          expected_delivery_date: string | null
          id: string
          notes: string | null
          product_id: string
          purchase_order_id: string
          quantity: number
          quantity_received: number
          total_ht: number | null
          unit_price_ht: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          product_id: string
          purchase_order_id: string
          quantity: number
          quantity_received?: number
          total_ht?: number | null
          unit_price_ht: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          quantity_received?: number
          total_ht?: number | null
          unit_price_ht?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          cancelled_at: string | null
          created_at: string
          created_by: string
          currency: string
          delivery_address: Json | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          po_number: string
          received_at: string | null
          received_by: string | null
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string
          tax_rate: number
          total_ht: number
          total_ttc: number
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          created_by: string
          currency?: string
          delivery_address?: Json | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          po_number: string
          received_at?: string | null
          received_by?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string
          tax_rate?: number
          total_ht?: number
          total_ttc?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          delivery_address?: Json | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          po_number?: string
          received_at?: string | null
          received_by?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string
          tax_rate?: number
          total_ht?: number
          total_ttc?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          created_at: string
          discount_percentage: number
          expected_delivery_date: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          quantity_shipped: number
          sales_order_id: string
          total_ht: number | null
          unit_price_ht: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          quantity_shipped?: number
          sales_order_id: string
          total_ht?: number | null
          unit_price_ht: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          quantity_shipped?: number
          sales_order_id?: string
          total_ht?: number | null
          unit_price_ht?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          billing_address: Json | null
          cancelled_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string
          currency: string
          customer_id: string
          delivered_at: string | null
          delivered_by: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_number: string
          payment_terms: string | null
          shipped_at: string | null
          shipped_by: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["sales_order_status"]
          tax_rate: number
          total_ht: number
          total_ttc: number
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by: string
          currency?: string
          customer_id: string
          delivered_at?: string | null
          delivered_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_terms?: string | null
          shipped_at?: string | null
          shipped_by?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["sales_order_status"]
          tax_rate?: number
          total_ht?: number
          total_ttc?: number
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          customer_id?: string
          delivered_at?: string | null
          delivered_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_terms?: string | null
          shipped_at?: string | null
          shipped_by?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["sales_order_status"]
          tax_rate?: number
          total_ht?: number
          total_ttc?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          performed_at: string
          performed_by: string
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          unit_cost: number | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          performed_at?: string
          performed_by: string
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          performed_at?: string
          performed_by?: string
          product_id?: string
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      stock_reservations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          product_id: string
          reference_id: string
          reference_type: string
          released_at: string | null
          released_by: string | null
          reserved_at: string
          reserved_by: string
          reserved_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          reference_id: string
          reference_type: string
          released_at?: string | null
          released_by?: string | null
          reserved_at?: string
          reserved_by: string
          reserved_quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          reference_id?: string
          reference_type?: string
          released_at?: string | null
          released_by?: string | null
          reserved_at?: string
          reserved_by?: string
          reserved_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_info: Json | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          delivery_time_days: number | null
          id: string
          is_active: boolean | null
          is_preferred: boolean | null
          minimum_order_amount: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_time_days?: number | null
          id?: string
          is_active?: boolean | null
          is_preferred?: boolean | null
          minimum_order_amount?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          contact_info?: Json | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_time_days?: number | null
          id?: string
          is_active?: boolean | null
          is_preferred?: boolean | null
          minimum_order_amount?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          job_title: string | null
          last_name: string | null
          last_sign_in_at: string | null
          partner_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role_type"]
          scopes: string[] | null
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          job_title?: string | null
          last_name?: string | null
          last_sign_in_at?: string | null
          partner_id?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role_type"]
          scopes?: string[] | null
          updated_at?: string | null
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          job_title?: string | null
          last_name?: string | null
          last_sign_in_at?: string | null
          partner_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
    }
    Views: {
      product_images_complete: {
        Row: {
          alt_text: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          file_size: number | null
          format: string | null
          height: number | null
          id: string | null
          image_type: Database["public"]["Enums"]["image_type_enum"] | null
          is_primary: boolean | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          public_url: string | null
          storage_path: string | null
          updated_at: string | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
        ]
      }
      products_with_default_package: {
        Row: {
          brand: string | null
          condition: string | null
          cost_price: number | null
          created_at: string | null
          default_package_name: string | null
          default_package_price: number | null
          default_package_quantity: number | null
          default_package_type:
            | Database["public"]["Enums"]["package_type"]
            | null
          dimensions: Json | null
          gtin: string | null
          id: string | null
          margin_percentage: number | null
          min_stock_level: number | null
          name: string | null
          price_ht: number | null
          supplier_cost_price: number | null
          sku: string | null
          slug: string | null
          status: Database["public"]["Enums"]["availability_status_type"] | null
          stock_quantity: number | null
          subcategory_id: string | null
          supplier_id: string | null
          supplier_page_url: string | null
          supplier_reference: string | null
          updated_at: string | null
          variant_attributes: Json | null
          video_url: string | null
          weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_package_price: {
        Args:
          | {
              base_price_ht_cents: number
              base_quantity: number
              discount_rate?: number
              unit_price_override_cents?: number
            }
          | { p_package_id: string; p_product_id: string }
        Returns: number
      }
      calculate_price_ttc: {
        Args: { price_ht_cents: number; tax_rate: number }
        Returns: number
      }
      cleanup_old_product_drafts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_owners: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      format_phone_display: {
        Args: { phone_input: string }
        Returns: string
      }
      generate_architecture_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          details: string
          status: string
        }[]
      }
      generate_feed_access_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_po_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_sku: {
        Args: {
          color_code: string
          family_code: string
          material_code: string
          product_code: string
          size_code?: string
        }
        Returns: string
      }
      generate_so_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_stock: {
        Args: { p_product_id: string }
        Returns: number
      }
      get_daily_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          activity_today: number
          activity_yesterday: number
          recent_actions: Json
          trend_percentage: number
        }[]
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          generated_at: string
          metrics: Json
        }[]
      }
      get_primary_contact: {
        Args: { org_id: string }
        Returns: {
          accepts_marketing: boolean | null
          accepts_notifications: boolean | null
          created_at: string | null
          created_by: string | null
          department: string | null
          direct_line: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          is_billing_contact: boolean | null
          is_commercial_contact: boolean | null
          is_primary_contact: boolean | null
          is_technical_contact: boolean | null
          language_preference: string | null
          last_contact_date: string | null
          last_name: string
          mobile: string | null
          notes: string | null
          organisation_id: string
          phone: string | null
          preferred_communication_method: string | null
          secondary_email: string | null
          title: string | null
          updated_at: string | null
        }
      }
      get_product_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_products: number
          draft_products: number
          inactive_products: number
          total_products: number
          trend_percentage: number
        }[]
      }
      get_products_for_feed: {
        Args: { config_id: string }
        Returns: {
          brand: string
          category_name: string
          name: string
          price_ht: number
          primary_image_url: string
          product_group_id: string
          product_id: string
          sku: string
          status: Database["public"]["Enums"]["availability_status_type"]
        }[]
      }
      get_stock_alerts: {
        Args: { limit_count?: number }
        Returns: {
          alert_status: string
          product_id: string
          product_name: string
          stock_level: number
        }[]
      }
      get_user_full_name: {
        Args: {
          user_profile_record: Database["public"]["Tables"]["user_profiles"]["Row"]
        }
        Returns: string
      }
      get_user_organisation_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role_type"]
      }
      get_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users: number
          admin_count: number
          catalog_manager_count: number
          new_users: number
          partner_manager_count: number
          sales_count: number
          total_users: number
          trend_percentage: number
        }[]
      }
      has_scope: {
        Args: { required_scope: string }
        Returns: boolean
      }
      is_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_access_to_organisation: {
        Args: { org_id: string }
        Returns: boolean
      }
      validate_feed_filters: {
        Args: { filters_json: Json }
        Returns: boolean
      }
      validate_rls_setup: {
        Args: Record<PropertyKey, never>
        Returns: {
          policies_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
    }
    Enums: {
      availability_status_type:
        | "in_stock"
        | "out_of_stock"
        | "preorder"
        | "coming_soon"
        | "discontinued"
      feed_export_status_type:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      feed_format_type: "csv" | "xml" | "json"
      feed_platform_type: "google_merchant" | "facebook_meta" | "custom"
      image_type_enum:
        | "primary"
        | "gallery"
        | "technical"
        | "lifestyle"
        | "thumbnail"
      language_type: "fr" | "en" | "pt"
      movement_type: "IN" | "OUT" | "ADJUST" | "TRANSFER"
      organisation_type: "internal" | "supplier" | "customer" | "partner"
      package_type: "single" | "pack" | "bulk" | "custom"
      purchase_order_status:
        | "draft"
        | "sent"
        | "confirmed"
        | "partially_received"
        | "received"
        | "cancelled"
      purchase_type: "dropshipping" | "stock" | "on_demand"
      sales_order_status:
        | "draft"
        | "confirmed"
        | "partially_shipped"
        | "shipped"
        | "delivered"
        | "cancelled"
      schedule_frequency_type: "manual" | "daily" | "weekly" | "monthly"
      user_role_type:
        | "owner"
        | "admin"
        | "catalog_manager"
        | "sales"
        | "partner_manager"
      user_type: "staff" | "supplier" | "customer" | "partner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      availability_status_type: [
        "in_stock",
        "out_of_stock",
        "preorder",
        "coming_soon",
        "discontinued",
      ],
      feed_export_status_type: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      feed_format_type: ["csv", "xml", "json"],
      feed_platform_type: ["google_merchant", "facebook_meta", "custom"],
      image_type_enum: [
        "primary",
        "gallery",
        "technical",
        "lifestyle",
        "thumbnail",
      ],
      language_type: ["fr", "en", "pt"],
      movement_type: ["IN", "OUT", "ADJUST", "TRANSFER"],
      organisation_type: ["internal", "supplier", "customer", "partner"],
      package_type: ["single", "pack", "bulk", "custom"],
      purchase_order_status: [
        "draft",
        "sent",
        "confirmed",
        "partially_received",
        "received",
        "cancelled",
      ],
      purchase_type: ["dropshipping", "stock", "on_demand"],
      sales_order_status: [
        "draft",
        "confirmed",
        "partially_shipped",
        "shipped",
        "delivered",
        "cancelled",
      ],
      schedule_frequency_type: ["manual", "daily", "weekly", "monthly"],
      user_role_type: [
        "owner",
        "admin",
        "catalog_manager",
        "sales",
        "partner_manager",
      ],
      user_type: ["staff", "supplier", "customer", "partner"],
    },
  },
} as const