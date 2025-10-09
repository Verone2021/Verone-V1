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
      abby_sync_queue: {
        Row: {
          abby_payload: Json
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          last_error: string | null
          max_retries: number
          next_retry_at: string | null
          operation: string
          processed_at: string | null
          retry_count: number
          status: string
        }
        Insert: {
          abby_payload: Json
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          last_error?: string | null
          max_retries?: number
          next_retry_at?: string | null
          operation: string
          processed_at?: string | null
          retry_count?: number
          status?: string
        }
        Update: {
          abby_payload?: Json
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          last_error?: string | null
          max_retries?: number
          next_retry_at?: string | null
          operation?: string
          processed_at?: string | null
          retry_count?: number
          status?: string
        }
        Relationships: []
      }
      abby_webhook_events: {
        Row: {
          event_data: Json
          event_id: string
          event_type: string
          expires_at: string
          id: string
          processed_at: string
        }
        Insert: {
          event_data: Json
          event_id: string
          event_type: string
          expires_at: string
          id?: string
          processed_at?: string
        }
        Update: {
          event_data?: Json
          event_id?: string
          event_type?: string
          expires_at?: string
          id?: string
          processed_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          severity: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          severity?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          severity?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          actual_behavior: string | null
          assigned_to: string | null
          browser_info: Json
          category: string
          console_errors: string[] | null
          created_at: string
          description: string
          expected_behavior: string | null
          id: string
          priority: string | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          screenshot_url: string | null
          severity: string
          status: string
          steps_to_reproduce: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_behavior?: string | null
          assigned_to?: string | null
          browser_info?: Json
          category?: string
          console_errors?: string[] | null
          created_at?: string
          description: string
          expected_behavior?: string | null
          id?: string
          priority?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_behavior?: string | null
          assigned_to?: string | null
          browser_info?: Json
          category?: string
          console_errors?: string[] | null
          created_at?: string
          description?: string
          expected_behavior?: string | null
          id?: string
          priority?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      client_consultations: {
        Row: {
          assigned_to: string | null
          client_email: string
          client_phone: string | null
          created_at: string | null
          created_by: string | null
          descriptif: string
          estimated_response_date: string | null
          id: string
          image_url: string | null
          notes_internes: string | null
          organisation_name: string
          priority_level: number | null
          responded_at: string | null
          responded_by: string | null
          source_channel: string | null
          status: string | null
          tarif_maximum: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_email: string
          client_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          descriptif: string
          estimated_response_date?: string | null
          id?: string
          image_url?: string | null
          notes_internes?: string | null
          organisation_name: string
          priority_level?: number | null
          responded_at?: string | null
          responded_by?: string | null
          source_channel?: string | null
          status?: string | null
          tarif_maximum?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_email?: string
          client_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          descriptif?: string
          estimated_response_date?: string | null
          id?: string
          image_url?: string | null
          notes_internes?: string | null
          organisation_name?: string
          priority_level?: number | null
          responded_at?: string | null
          responded_by?: string | null
          source_channel?: string | null
          status?: string | null
          tarif_maximum?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      collection_images: {
        Row: {
          alt_text: string | null
          collection_id: string
          created_at: string | null
          display_order: number
          file_name: string | null
          file_size: number | null
          height: number | null
          id: string
          image_type: string | null
          is_primary: boolean
          mime_type: string | null
          public_url: string | null
          storage_path: string
          updated_at: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          collection_id: string
          created_at?: string | null
          display_order?: number
          file_name?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          image_type?: string | null
          is_primary?: boolean
          mime_type?: string | null
          public_url?: string | null
          storage_path: string
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          collection_id?: string
          created_at?: string | null
          display_order?: number
          file_name?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          image_type?: string | null
          is_primary?: boolean
          mime_type?: string | null
          public_url?: string | null
          storage_path?: string
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_images_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection_primary_images"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_images_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          created_at: string | null
          created_by: string | null
          id: string
          position: number
          product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          position?: number
          product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection_primary_images"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_shares: {
        Row: {
          collection_id: string
          id: string
          recipient_email: string | null
          share_type: string
          shared_at: string
          shared_by: string | null
        }
        Insert: {
          collection_id: string
          id?: string
          recipient_email?: string | null
          share_type?: string
          shared_at?: string
          shared_by?: string | null
        }
        Update: {
          collection_id?: string
          id?: string
          recipient_email?: string | null
          share_type?: string
          shared_at?: string
          shared_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_shares_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection_primary_images"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_shares_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
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
            referencedRelation: "collection_primary_images"
            referencedColumns: ["collection_id"]
          },
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
          archived_at: string | null
          color_theme: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          last_shared: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          product_count: number | null
          shared_count: number | null
          shared_link_token: string | null
          sort_order: number | null
          style: string | null
          suitable_rooms: string[] | null
          theme_tags: string[] | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          archived_at?: string | null
          color_theme?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          last_shared?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          product_count?: number | null
          shared_count?: number | null
          shared_link_token?: string | null
          sort_order?: number | null
          style?: string | null
          suitable_rooms?: string[] | null
          theme_tags?: string[] | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          archived_at?: string | null
          color_theme?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          last_shared?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          product_count?: number | null
          shared_count?: number | null
          shared_link_token?: string | null
          sort_order?: number | null
          style?: string | null
          suitable_rooms?: string[] | null
          theme_tags?: string[] | null
          updated_at?: string | null
          visibility?: string
        }
        Relationships: []
      }
      consultation_images: {
        Row: {
          alt_text: string | null
          consultation_id: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          file_size: number | null
          format: string | null
          height: number | null
          id: string
          image_type: Database["public"]["Enums"]["image_type_enum"] | null
          is_primary: boolean | null
          public_url: string | null
          storage_path: string
          updated_at: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          consultation_id: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          image_type?: Database["public"]["Enums"]["image_type_enum"] | null
          is_primary?: boolean | null
          public_url?: string | null
          storage_path: string
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          consultation_id?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          image_type?: Database["public"]["Enums"]["image_type_enum"] | null
          is_primary?: boolean | null
          public_url?: string | null
          storage_path?: string
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_images_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "client_consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_images_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations_with_primary_image"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_products: {
        Row: {
          consultation_id: string
          created_at: string | null
          created_by: string | null
          id: string
          is_free: boolean | null
          is_primary_proposal: boolean | null
          notes: string | null
          product_id: string
          proposed_price: number | null
          quantity: number
          status: string | null
        }
        Insert: {
          consultation_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_free?: boolean | null
          is_primary_proposal?: boolean | null
          notes?: string | null
          product_id: string
          proposed_price?: number | null
          quantity?: number
          status?: string | null
        }
        Update: {
          consultation_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_free?: boolean | null
          is_primary_proposal?: boolean | null
          notes?: string | null
          product_id?: string
          proposed_price?: number | null
          quantity?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_products_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "client_consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_products_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations_with_primary_image"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
        ]
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
      error_notifications_queue: {
        Row: {
          created_at: string
          error_id: string
          failed_at: string | null
          failure_reason: string | null
          id: string
          notification_payload: Json
          notification_type: string
          recipient: string
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_id: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          notification_payload?: Json
          notification_type: string
          recipient: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_id?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          notification_payload?: Json
          notification_type?: string
          recipient?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_notifications_queue_error_id_fkey"
            columns: ["error_id"]
            isOneToOne: false
            referencedRelation: "error_reports_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      error_reports_v2: {
        Row: {
          ai_classification: Json | null
          ai_confidence_score: number | null
          ai_suggested_tools: Json | null
          auto_fixable: boolean
          browser_info: Json
          context_data: Json
          created_at: string
          error_type: string
          estimated_fix_time: string
          first_seen_at: string
          fix_priority: number
          id: string
          last_seen_at: string
          mcp_tools_needed: Json
          message: string
          ml_pattern_match: string | null
          module: string
          occurrence_count: number
          page_url: string
          resolution_confidence_score: number | null
          resolution_method: string | null
          resolution_status: string
          resolution_suggestions: Json | null
          resolution_time_taken: string | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string
          severity: string
          stack_trace: string | null
          test_id: string | null
          updated_at: string
          user_action: string
        }
        Insert: {
          ai_classification?: Json | null
          ai_confidence_score?: number | null
          ai_suggested_tools?: Json | null
          auto_fixable?: boolean
          browser_info?: Json
          context_data?: Json
          created_at?: string
          error_type: string
          estimated_fix_time: string
          first_seen_at?: string
          fix_priority: number
          id?: string
          last_seen_at?: string
          mcp_tools_needed?: Json
          message: string
          ml_pattern_match?: string | null
          module: string
          occurrence_count?: number
          page_url: string
          resolution_confidence_score?: number | null
          resolution_method?: string | null
          resolution_status?: string
          resolution_suggestions?: Json | null
          resolution_time_taken?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id: string
          severity: string
          stack_trace?: string | null
          test_id?: string | null
          updated_at?: string
          user_action: string
        }
        Update: {
          ai_classification?: Json | null
          ai_confidence_score?: number | null
          ai_suggested_tools?: Json | null
          auto_fixable?: boolean
          browser_info?: Json
          context_data?: Json
          created_at?: string
          error_type?: string
          estimated_fix_time?: string
          first_seen_at?: string
          fix_priority?: number
          id?: string
          last_seen_at?: string
          mcp_tools_needed?: Json
          message?: string
          ml_pattern_match?: string | null
          module?: string
          occurrence_count?: number
          page_url?: string
          resolution_confidence_score?: number | null
          resolution_method?: string | null
          resolution_status?: string
          resolution_suggestions?: Json | null
          resolution_time_taken?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string
          severity?: string
          stack_trace?: string | null
          test_id?: string | null
          updated_at?: string
          user_action?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_reports_v2_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "manual_tests_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      error_resolution_history: {
        Row: {
          confidence_score: number | null
          created_at: string
          error_context: Json | null
          error_id: string
          id: string
          mcp_tools_used: Json | null
          resolution_attempt_number: number
          resolution_method: string
          success: boolean
          suggestions_provided: Json | null
          time_taken: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          error_context?: Json | null
          error_id: string
          id?: string
          mcp_tools_used?: Json | null
          resolution_attempt_number?: number
          resolution_method: string
          success: boolean
          suggestions_provided?: Json | null
          time_taken: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          error_context?: Json | null
          error_id?: string
          id?: string
          mcp_tools_used?: Json | null
          resolution_attempt_number?: number
          resolution_method?: string
          success?: boolean
          suggestions_provided?: Json | null
          time_taken?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_resolution_history_error_id_fkey"
            columns: ["error_id"]
            isOneToOne: false
            referencedRelation: "error_reports_v2"
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
      individual_customers: {
        Row: {
          abby_contact_id: string | null
          accepts_marketing: boolean | null
          accepts_notifications: boolean | null
          address_line1: string | null
          address_line2: string | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_region: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string
          first_name: string
          has_different_billing_address: boolean | null
          id: string
          is_active: boolean | null
          language_preference: string | null
          last_name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          region: string | null
          updated_at: string | null
        }
        Insert: {
          abby_contact_id?: string | null
          accepts_marketing?: boolean | null
          accepts_notifications?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_region?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          first_name: string
          has_different_billing_address?: boolean | null
          id?: string
          is_active?: boolean | null
          language_preference?: string | null
          last_name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          abby_contact_id?: string | null
          accepts_marketing?: boolean | null
          accepts_notifications?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_region?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          first_name?: string
          has_different_billing_address?: boolean | null
          id?: string
          is_active?: boolean | null
          language_preference?: string | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_status_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          id: string
          invoice_id: string
          new_status: string
          old_status: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          invoice_id: string
          new_status: string
          old_status: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          invoice_id?: string
          new_status?: string
          old_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_status_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          abby_invoice_id: string
          abby_invoice_number: string
          abby_pdf_url: string | null
          abby_public_url: string | null
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          invoice_date: string
          last_synced_from_abby_at: string | null
          sales_order_id: string
          status: string
          sync_errors: Json | null
          synced_to_abby_at: string | null
          total_ht: number
          total_ttc: number
          tva_amount: number
          updated_at: string
        }
        Insert: {
          abby_invoice_id: string
          abby_invoice_number: string
          abby_pdf_url?: string | null
          abby_public_url?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          invoice_date: string
          last_synced_from_abby_at?: string | null
          sales_order_id: string
          status?: string
          sync_errors?: Json | null
          synced_to_abby_at?: string | null
          total_ht: number
          total_ttc: number
          tva_amount: number
          updated_at?: string
        }
        Update: {
          abby_invoice_id?: string
          abby_invoice_number?: string
          abby_pdf_url?: string | null
          abby_public_url?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          last_synced_from_abby_at?: string | null
          sales_order_id?: string
          status?: string
          sync_errors?: Json | null
          synced_to_abby_at?: string | null
          total_ht?: number
          total_ttc?: number
          tva_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: true
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_tests_progress: {
        Row: {
          created_at: string | null
          execution_time_ms: number | null
          id: string
          notes: string | null
          section_name: string
          status: Database["public"]["Enums"]["test_status_enum"]
          subsection_name: string
          test_description: string | null
          test_id: string
          test_title: string
          tested_at: string | null
          tester_id: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          notes?: string | null
          section_name: string
          status?: Database["public"]["Enums"]["test_status_enum"]
          subsection_name: string
          test_description?: string | null
          test_id: string
          test_title: string
          tested_at?: string | null
          tester_id?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          notes?: string | null
          section_name?: string
          status?: Database["public"]["Enums"]["test_status_enum"]
          subsection_name?: string
          test_description?: string | null
          test_id?: string
          test_title?: string
          tested_at?: string | null
          tester_id?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      mcp_resolution_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_report_id: string
          estimated_duration_seconds: number | null
          execution_log: Json
          id: string
          max_retries: number
          mcp_tools: Json
          priority: number
          processed_at: string | null
          processor_id: string | null
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_report_id: string
          estimated_duration_seconds?: number | null
          execution_log?: Json
          id?: string
          max_retries?: number
          mcp_tools?: Json
          priority?: number
          processed_at?: string | null
          processor_id?: string | null
          retry_count?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_report_id?: string
          estimated_duration_seconds?: number | null
          execution_log?: Json
          id?: string
          max_retries?: number
          mcp_tools?: Json
          priority?: number
          processed_at?: string | null
          processor_id?: string | null
          retry_count?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_resolution_queue_error_report_id_fkey"
            columns: ["error_report_id"]
            isOneToOne: false
            referencedRelation: "error_reports_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_resolution_strategies: {
        Row: {
          confidence: number
          created_at: string
          error_pattern: string
          estimated_time: string
          id: string
          is_active: boolean
          mcp_tools: Json
          resolution_steps: Json
          strategy_name: string
          success_rate: number | null
          updated_at: string
        }
        Insert: {
          confidence: number
          created_at?: string
          error_pattern: string
          estimated_time: string
          id?: string
          is_active?: boolean
          mcp_tools?: Json
          resolution_steps?: Json
          strategy_name: string
          success_rate?: number | null
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          error_pattern?: string
          estimated_time?: string
          id?: string
          is_active?: boolean
          mcp_tools?: Json
          resolution_steps?: Json
          strategy_name?: string
          success_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean
          severity: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean
          severity: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean
          severity?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          abby_customer_id: string | null
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
          abby_customer_id?: string | null
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
          abby_customer_id?: string | null
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
      parcel_items: {
        Row: {
          created_at: string
          id: string
          parcel_id: string
          quantity_shipped: number
          sales_order_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parcel_id: string
          quantity_shipped: number
          sales_order_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parcel_id?: string
          quantity_shipped?: number
          sales_order_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcel_items_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "shipping_parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcel_items_sales_order_item_id_fkey"
            columns: ["sales_order_item_id"]
            isOneToOne: false
            referencedRelation: "sales_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          abby_payment_id: string | null
          amount_paid: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          synced_from_abby_at: string | null
          transaction_reference: string | null
        }
        Insert: {
          abby_payment_id?: string | null
          amount_paid: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          synced_from_abby_at?: string | null
          transaction_reference?: string | null
        }
        Update: {
          abby_payment_id?: string | null
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          synced_from_abby_at?: string | null
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colors: {
        Row: {
          created_at: string | null
          hex_code: string | null
          id: string
          is_predefined: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hex_code?: string | null
          id?: string
          is_predefined?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hex_code?: string | null
          id?: string
          is_predefined?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_drafts: {
        Row: {
          assigned_client_id: string | null
          availability_type: string | null
          brand: string | null
          category_id: string | null
          condition: string | null
          cost_price: number | null
          created_at: string | null
          creation_mode: string | null
          description: string | null
          dimensions: Json | null
          family_id: string | null
          gtin: string | null
          id: string
          margin_percentage: number | null
          min_stock: number | null
          name: string | null
          product_type: string | null
          reorder_point: number | null
          requires_sample: boolean | null
          selling_points: string[] | null
          slug: string | null
          stock_forecasted_in: number | null
          stock_forecasted_out: number | null
          stock_quantity: number | null
          stock_real: number | null
          subcategory_id: string | null
          supplier_id: string | null
          supplier_page_url: string | null
          supplier_reference: string | null
          target_margin_percentage: number | null
          updated_at: string | null
          variant_attributes: Json | null
          video_url: string | null
          weight: number | null
        }
        Insert: {
          assigned_client_id?: string | null
          availability_type?: string | null
          brand?: string | null
          category_id?: string | null
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          creation_mode?: string | null
          description?: string | null
          dimensions?: Json | null
          family_id?: string | null
          gtin?: string | null
          id?: string
          margin_percentage?: number | null
          min_stock?: number | null
          name?: string | null
          product_type?: string | null
          reorder_point?: number | null
          requires_sample?: boolean | null
          selling_points?: string[] | null
          slug?: string | null
          stock_forecasted_in?: number | null
          stock_forecasted_out?: number | null
          stock_quantity?: number | null
          stock_real?: number | null
          subcategory_id?: string | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_reference?: string | null
          target_margin_percentage?: number | null
          updated_at?: string | null
          variant_attributes?: Json | null
          video_url?: string | null
          weight?: number | null
        }
        Update: {
          assigned_client_id?: string | null
          availability_type?: string | null
          brand?: string | null
          category_id?: string | null
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          creation_mode?: string | null
          description?: string | null
          dimensions?: Json | null
          family_id?: string | null
          gtin?: string | null
          id?: string
          margin_percentage?: number | null
          min_stock?: number | null
          name?: string | null
          product_type?: string | null
          reorder_point?: number | null
          requires_sample?: boolean | null
          selling_points?: string[] | null
          slug?: string | null
          stock_forecasted_in?: number | null
          stock_forecasted_out?: number | null
          stock_quantity?: number | null
          stock_real?: number | null
          subcategory_id?: string | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_reference?: string | null
          target_margin_percentage?: number | null
          updated_at?: string | null
          variant_attributes?: Json | null
          video_url?: string | null
          weight?: number | null
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
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_group_members: {
        Row: {
          added_at: string | null
          group_id: string
          id: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          added_at?: string | null
          group_id: string
          id?: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          added_at?: string | null
          group_id?: string
          id?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_group_members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_group_members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_group_members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_group_members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      product_groups: {
        Row: {
          created_at: string | null
          description: string | null
          group_type: string | null
          id: string
          is_active: boolean | null
          item_group_id: string
          name: string
          primary_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_type?: string | null
          id?: string
          is_active?: boolean | null
          item_group_id: string
          name: string
          primary_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_type?: string | null
          id?: string
          is_active?: boolean | null
          item_group_id?: string
          name?: string
          primary_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_groups_primary_product_id_fkey"
            columns: ["primary_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_groups_primary_product_id_fkey"
            columns: ["primary_product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_groups_primary_product_id_fkey"
            columns: ["primary_product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_groups_primary_product_id_fkey"
            columns: ["primary_product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
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
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
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
          {
            foreignKeyName: "product_packages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_packages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      product_status_changes: {
        Row: {
          change_reason: string
          created_at: string | null
          id: string
          new_status: string
          old_status: string
          product_id: string
        }
        Insert: {
          change_reason?: string
          created_at?: string | null
          id?: string
          new_status: string
          old_status: string
          product_id: string
        }
        Update: {
          change_reason?: string
          created_at?: string | null
          id?: string
          new_status?: string
          old_status?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_status_changes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_status_changes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_status_changes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_status_changes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          assigned_client_id: string | null
          availability_type:
            | Database["public"]["Enums"]["availability_type_enum"]
            | null
          brand: string | null
          completion_percentage: number | null
          completion_status: string | null
          condition: string | null
          cost_price: number
          created_at: string | null
          creation_mode: string | null
          description: string | null
          dimensions: Json | null
          gtin: string | null
          id: string
          item_group_id: string | null
          margin_percentage: number | null
          min_stock: number | null
          name: string
          product_type: string | null
          reorder_point: number | null
          requires_sample: boolean | null
          selling_points: Json | null
          sku: string
          slug: string | null
          sourcing_type: string | null
          status: Database["public"]["Enums"]["availability_status_type"] | null
          stock_forecasted_in: number | null
          stock_forecasted_out: number | null
          stock_quantity: number | null
          stock_real: number | null
          subcategory_id: string | null
          suitable_rooms: Database["public"]["Enums"]["room_type"][] | null
          supplier_id: string | null
          supplier_page_url: string | null
          supplier_reference: string | null
          target_margin_percentage: number | null
          technical_description: string | null
          updated_at: string | null
          variant_attributes: Json | null
          variant_group_id: string | null
          variant_position: number | null
          video_url: string | null
          weight: number | null
        }
        Insert: {
          archived_at?: string | null
          assigned_client_id?: string | null
          availability_type?:
            | Database["public"]["Enums"]["availability_type_enum"]
            | null
          brand?: string | null
          completion_percentage?: number | null
          completion_status?: string | null
          condition?: string | null
          cost_price: number
          created_at?: string | null
          creation_mode?: string | null
          description?: string | null
          dimensions?: Json | null
          gtin?: string | null
          id?: string
          item_group_id?: string | null
          margin_percentage?: number | null
          min_stock?: number | null
          name: string
          product_type?: string | null
          reorder_point?: number | null
          requires_sample?: boolean | null
          selling_points?: Json | null
          sku: string
          slug?: string | null
          sourcing_type?: string | null
          status?:
            | Database["public"]["Enums"]["availability_status_type"]
            | null
          stock_forecasted_in?: number | null
          stock_forecasted_out?: number | null
          stock_quantity?: number | null
          stock_real?: number | null
          subcategory_id?: string | null
          suitable_rooms?: Database["public"]["Enums"]["room_type"][] | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_reference?: string | null
          target_margin_percentage?: number | null
          technical_description?: string | null
          updated_at?: string | null
          variant_attributes?: Json | null
          variant_group_id?: string | null
          variant_position?: number | null
          video_url?: string | null
          weight?: number | null
        }
        Update: {
          archived_at?: string | null
          assigned_client_id?: string | null
          availability_type?:
            | Database["public"]["Enums"]["availability_type_enum"]
            | null
          brand?: string | null
          completion_percentage?: number | null
          completion_status?: string | null
          condition?: string | null
          cost_price?: number
          created_at?: string | null
          creation_mode?: string | null
          description?: string | null
          dimensions?: Json | null
          gtin?: string | null
          id?: string
          item_group_id?: string | null
          margin_percentage?: number | null
          min_stock?: number | null
          name?: string
          product_type?: string | null
          reorder_point?: number | null
          requires_sample?: boolean | null
          selling_points?: Json | null
          sku?: string
          slug?: string | null
          sourcing_type?: string | null
          status?:
            | Database["public"]["Enums"]["availability_status_type"]
            | null
          stock_forecasted_in?: number | null
          stock_forecasted_out?: number | null
          stock_quantity?: number | null
          stock_real?: number | null
          subcategory_id?: string | null
          suitable_rooms?: Database["public"]["Enums"]["room_type"][] | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_reference?: string | null
          target_margin_percentage?: number | null
          technical_description?: string | null
          updated_at?: string | null
          variant_attributes?: Json | null
          variant_group_id?: string | null
          variant_position?: number | null
          video_url?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_variant_group"
            columns: ["variant_group_id"]
            isOneToOne: false
            referencedRelation: "variant_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_assigned_client_id_fkey"
            columns: ["assigned_client_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_receptions: {
        Row: {
          batch_number: string | null
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          purchase_order_id: string
          quantity_received: number
          received_at: string
          received_by: string
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          purchase_order_id: string
          quantity_received: number
          received_at?: string
          received_by: string
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          purchase_order_id?: string
          quantity_received?: number
          received_at?: string
          received_by?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_receptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_receptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_receptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_receptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_receptions_purchase_order_id_fkey"
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
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
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
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string
          currency: string
          customer_id: string
          customer_type: string
          delivered_at: string | null
          delivered_by: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_number: string
          paid_amount: number | null
          paid_at: string | null
          payment_status: string | null
          payment_terms: string | null
          ready_for_shipment: boolean | null
          shipped_at: string | null
          shipped_by: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["sales_order_status"]
          tax_rate: number
          total_ht: number
          total_ttc: number
          updated_at: string
          warehouse_exit_at: string | null
          warehouse_exit_by: string | null
        }
        Insert: {
          billing_address?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by: string
          currency?: string
          customer_id: string
          customer_type: string
          delivered_at?: string | null
          delivered_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_status?: string | null
          payment_terms?: string | null
          ready_for_shipment?: boolean | null
          shipped_at?: string | null
          shipped_by?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["sales_order_status"]
          tax_rate?: number
          total_ht?: number
          total_ttc?: number
          updated_at?: string
          warehouse_exit_at?: string | null
          warehouse_exit_by?: string | null
        }
        Update: {
          billing_address?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          customer_id?: string
          customer_type?: string
          delivered_at?: string | null
          delivered_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_status?: string | null
          payment_terms?: string | null
          ready_for_shipment?: boolean | null
          shipped_at?: string | null
          shipped_by?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["sales_order_status"]
          tax_rate?: number
          total_ht?: number
          total_ttc?: number
          updated_at?: string
          warehouse_exit_at?: string | null
          warehouse_exit_by?: string | null
        }
        Relationships: []
      }
      sample_order_items: {
        Row: {
          actual_cost: number | null
          created_at: string | null
          delivered_at: string | null
          estimated_cost: number | null
          id: string
          item_status: string
          quantity: number | null
          sample_description: string
          sample_order_id: string
          updated_at: string | null
          validated_at: string | null
          validation_notes: string | null
        }
        Insert: {
          actual_cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_cost?: number | null
          id?: string
          item_status?: string
          quantity?: number | null
          sample_description: string
          sample_order_id: string
          updated_at?: string | null
          validated_at?: string | null
          validation_notes?: string | null
        }
        Update: {
          actual_cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_cost?: number | null
          id?: string
          item_status?: string
          quantity?: number | null
          sample_description?: string
          sample_order_id?: string
          updated_at?: string | null
          validated_at?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sample_order_items_sample_order_id_fkey"
            columns: ["sample_order_id"]
            isOneToOne: false
            referencedRelation: "sample_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_orders: {
        Row: {
          actual_cost: number | null
          actual_delivery_date: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          internal_notes: string | null
          order_number: string
          shipping_cost: number | null
          status: string
          supplier_id: string
          supplier_notes: string | null
          supplier_order_reference: string | null
          total_estimated_cost: number | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_delivery_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          internal_notes?: string | null
          order_number?: string
          shipping_cost?: number | null
          status?: string
          supplier_id: string
          supplier_notes?: string | null
          supplier_order_reference?: string | null
          total_estimated_cost?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_delivery_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          internal_notes?: string | null
          order_number?: string
          shipping_cost?: number | null
          status?: string
          supplier_id?: string
          supplier_notes?: string | null
          supplier_order_reference?: string | null
          total_estimated_cost?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sample_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier_name: string | null
          chronotruck_data: Json | null
          chronotruck_palette_count: number | null
          chronotruck_reference: string | null
          chronotruck_url: string | null
          cost_charged_eur: number | null
          cost_paid_eur: number | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          estimated_delivery_at: string | null
          id: string
          metadata: Json | null
          mondial_relay_label_url: string | null
          mondial_relay_point_address: string | null
          mondial_relay_point_id: string | null
          mondial_relay_point_name: string | null
          mondial_relay_response: Json | null
          notes: string | null
          packlink_label_url: string | null
          packlink_response: Json | null
          packlink_service_id: number | null
          packlink_shipment_id: string | null
          sales_order_id: string
          service_name: string | null
          shipment_type: Database["public"]["Enums"]["shipment_type"]
          shipped_at: string | null
          shipping_address: Json | null
          shipping_method: Database["public"]["Enums"]["shipping_method"]
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          carrier_name?: string | null
          chronotruck_data?: Json | null
          chronotruck_palette_count?: number | null
          chronotruck_reference?: string | null
          chronotruck_url?: string | null
          cost_charged_eur?: number | null
          cost_paid_eur?: number | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          metadata?: Json | null
          mondial_relay_label_url?: string | null
          mondial_relay_point_address?: string | null
          mondial_relay_point_id?: string | null
          mondial_relay_point_name?: string | null
          mondial_relay_response?: Json | null
          notes?: string | null
          packlink_label_url?: string | null
          packlink_response?: Json | null
          packlink_service_id?: number | null
          packlink_shipment_id?: string | null
          sales_order_id: string
          service_name?: string | null
          shipment_type?: Database["public"]["Enums"]["shipment_type"]
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_method: Database["public"]["Enums"]["shipping_method"]
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier_name?: string | null
          chronotruck_data?: Json | null
          chronotruck_palette_count?: number | null
          chronotruck_reference?: string | null
          chronotruck_url?: string | null
          cost_charged_eur?: number | null
          cost_paid_eur?: number | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          metadata?: Json | null
          mondial_relay_label_url?: string | null
          mondial_relay_point_address?: string | null
          mondial_relay_point_id?: string | null
          mondial_relay_point_name?: string | null
          mondial_relay_response?: Json | null
          notes?: string | null
          packlink_label_url?: string | null
          packlink_response?: Json | null
          packlink_service_id?: number | null
          packlink_shipment_id?: string | null
          sales_order_id?: string
          service_name?: string | null
          shipment_type?: Database["public"]["Enums"]["shipment_type"]
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_parcels: {
        Row: {
          created_at: string
          height_cm: number
          id: string
          length_cm: number
          parcel_number: number
          parcel_tracking_number: string | null
          parcel_type: Database["public"]["Enums"]["shipment_type"]
          shipment_id: string
          weight_kg: number
          width_cm: number
        }
        Insert: {
          created_at?: string
          height_cm: number
          id?: string
          length_cm: number
          parcel_number: number
          parcel_tracking_number?: string | null
          parcel_type?: Database["public"]["Enums"]["shipment_type"]
          shipment_id: string
          weight_kg: number
          width_cm: number
        }
        Update: {
          created_at?: string
          height_cm?: number
          id?: string
          length_cm?: number
          parcel_number?: number
          parcel_tracking_number?: string | null
          parcel_type?: Database["public"]["Enums"]["shipment_type"]
          shipment_id?: string
          weight_kg?: number
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipping_parcels_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          affects_forecast: boolean | null
          created_at: string
          forecast_type: string | null
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          performed_at: string
          performed_by: string
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason_code: Database["public"]["Enums"]["stock_reason_code"] | null
          reference_id: string | null
          reference_type: string | null
          unit_cost: number | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          affects_forecast?: boolean | null
          created_at?: string
          forecast_type?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          performed_at?: string
          performed_by: string
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason_code?: Database["public"]["Enums"]["stock_reason_code"] | null
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          affects_forecast?: boolean | null
          created_at?: string
          forecast_type?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          performed_at?: string
          performed_by?: string
          product_id?: string
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reason_code?: Database["public"]["Enums"]["stock_reason_code"] | null
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_stock_movements_performed_by"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_stock_movements_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stock_movements_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_default_package"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stock_movements_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stock_movements_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
        ]
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
      test_error_reports: {
        Row: {
          assigned_to: string | null
          browser_info: Json | null
          created_at: string | null
          error_details: Json | null
          error_message: string
          error_type: Database["public"]["Enums"]["error_type_enum"]
          id: string
          reporter_id: string
          reproduction_steps: string | null
          screenshot_url: string | null
          severity: Database["public"]["Enums"]["error_severity_enum"]
          status: Database["public"]["Enums"]["error_status_enum"]
          test_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          browser_info?: Json | null
          created_at?: string | null
          error_details?: Json | null
          error_message: string
          error_type: Database["public"]["Enums"]["error_type_enum"]
          id?: string
          reporter_id: string
          reproduction_steps?: string | null
          screenshot_url?: string | null
          severity?: Database["public"]["Enums"]["error_severity_enum"]
          status?: Database["public"]["Enums"]["error_status_enum"]
          test_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          browser_info?: Json | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string
          error_type?: Database["public"]["Enums"]["error_type_enum"]
          id?: string
          reporter_id?: string
          reproduction_steps?: string | null
          screenshot_url?: string | null
          severity?: Database["public"]["Enums"]["error_severity_enum"]
          status?: Database["public"]["Enums"]["error_status_enum"]
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_error_reports_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "manual_tests_progress"
            referencedColumns: ["test_id"]
          },
        ]
      }
      test_sections_lock: {
        Row: {
          completion_percentage: number
          created_at: string | null
          failed_tests: number
          id: string
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          passed_tests: number
          pending_tests: number
          section_name: string
          section_title: string
          section_url: string | null
          total_tests: number
          unlock_conditions: Json | null
          updated_at: string | null
          warning_tests: number
        }
        Insert: {
          completion_percentage?: number
          created_at?: string | null
          failed_tests?: number
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          passed_tests?: number
          pending_tests?: number
          section_name: string
          section_title: string
          section_url?: string | null
          total_tests?: number
          unlock_conditions?: Json | null
          updated_at?: string | null
          warning_tests?: number
        }
        Update: {
          completion_percentage?: number
          created_at?: string | null
          failed_tests?: number
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          passed_tests?: number
          pending_tests?: number
          section_name?: string
          section_title?: string
          section_url?: string | null
          total_tests?: number
          unlock_conditions?: Json | null
          updated_at?: string | null
          warning_tests?: number
        }
        Relationships: []
      }
      test_validation_state: {
        Row: {
          browser_screenshot_url: string | null
          console_errors: Json | null
          created_at: string | null
          error_details: Json | null
          execution_time_ms: number | null
          id: string
          locked: boolean | null
          module_name: string
          performance_metrics: Json | null
          status: string
          test_id: string
          test_title: string
          updated_at: string | null
          validation_timestamp: string | null
        }
        Insert: {
          browser_screenshot_url?: string | null
          console_errors?: Json | null
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms?: number | null
          id?: string
          locked?: boolean | null
          module_name: string
          performance_metrics?: Json | null
          status?: string
          test_id: string
          test_title: string
          updated_at?: string | null
          validation_timestamp?: string | null
        }
        Update: {
          browser_screenshot_url?: string | null
          console_errors?: Json | null
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms?: number | null
          id?: string
          locked?: boolean | null
          module_name?: string
          performance_metrics?: Json | null
          status?: string
          test_id?: string
          test_title?: string
          updated_at?: string | null
          validation_timestamp?: string | null
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          organisation_id: string | null
          page_url: string | null
          record_id: string | null
          session_id: string | null
          severity: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organisation_id?: string | null
          page_url?: string | null
          record_id?: string | null
          session_id?: string | null
          severity?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organisation_id?: string | null
          page_url?: string | null
          record_id?: string | null
          session_id?: string | null
          severity?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      user_sessions: {
        Row: {
          actions_count: number | null
          created_at: string | null
          engagement_score: number | null
          id: string
          ip_address: string | null
          last_activity: string
          organisation_id: string | null
          pages_visited: number | null
          session_end: string | null
          session_id: string
          session_start: string
          time_per_module: Json | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          actions_count?: number | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          ip_address?: string | null
          last_activity: string
          organisation_id?: string | null
          pages_visited?: number | null
          session_end?: string | null
          session_id: string
          session_start: string
          time_per_module?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          actions_count?: number | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          organisation_id?: string | null
          pages_visited?: number | null
          session_end?: string | null
          session_id?: string
          session_start?: string
          time_per_module?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      variant_groups: {
        Row: {
          archived_at: string | null
          auto_name_pattern: string | null
          base_sku: string
          common_dimensions: Json | null
          common_weight: number | null
          created_at: string | null
          dimensions_height: number | null
          dimensions_length: number | null
          dimensions_unit: string | null
          dimensions_width: number | null
          has_common_supplier: boolean
          id: string
          name: string
          product_count: number | null
          style: string | null
          subcategory_id: string
          suitable_rooms: Database["public"]["Enums"]["room_type"][] | null
          supplier_id: string | null
          updated_at: string | null
          variant_type: string | null
        }
        Insert: {
          archived_at?: string | null
          auto_name_pattern?: string | null
          base_sku: string
          common_dimensions?: Json | null
          common_weight?: number | null
          created_at?: string | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_unit?: string | null
          dimensions_width?: number | null
          has_common_supplier?: boolean
          id?: string
          name: string
          product_count?: number | null
          style?: string | null
          subcategory_id: string
          suitable_rooms?: Database["public"]["Enums"]["room_type"][] | null
          supplier_id?: string | null
          updated_at?: string | null
          variant_type?: string | null
        }
        Update: {
          archived_at?: string | null
          auto_name_pattern?: string | null
          base_sku?: string
          common_dimensions?: Json | null
          common_weight?: number | null
          created_at?: string | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_unit?: string | null
          dimensions_width?: number | null
          has_common_supplier?: boolean
          id?: string
          name?: string
          product_count?: number | null
          style?: string | null
          subcategory_id?: string
          suitable_rooms?: Database["public"]["Enums"]["room_type"][] | null
          supplier_id?: string | null
          updated_at?: string | null
          variant_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variant_groups_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_groups_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_log_summary: {
        Row: {
          action: string | null
          event_count: number | null
          log_date: string | null
          severity: string | null
        }
        Relationships: []
      }
      collection_primary_images: {
        Row: {
          alt_text: string | null
          collection_id: string | null
          collection_name: string | null
          file_size: number | null
          height: number | null
          image_id: string | null
          public_url: string | null
          width: number | null
        }
        Relationships: []
      }
      consultations_with_primary_image: {
        Row: {
          assigned_to: string | null
          client_email: string | null
          client_phone: string | null
          created_at: string | null
          created_by: string | null
          descriptif: string | null
          estimated_response_date: string | null
          id: string | null
          image_url: string | null
          notes_internes: string | null
          organisation_name: string | null
          primary_image_alt_text: string | null
          primary_image_id: string | null
          primary_image_storage_path: string | null
          primary_image_url: string | null
          priority_level: number | null
          responded_at: string | null
          responded_by: string | null
          source_channel: string | null
          status: string | null
          tarif_maximum: number | null
          total_images: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      error_dashboard_summary: {
        Row: {
          auto_fixable_count: number | null
          critical_count: number | null
          hour_bucket: string | null
          resolution_rate: number | null
          resolved_count: number | null
          total_errors: number | null
        }
        Relationships: []
      }
      mcp_queue_status: {
        Row: {
          avg_priority: number | null
          count: number | null
          newest_task: string | null
          oldest_task: string | null
          status: string | null
        }
        Relationships: []
      }
      module_test_progress: {
        Row: {
          completion_percentage: number | null
          failed_tests: number | null
          last_validation: string | null
          locked_tests: number | null
          module_name: string | null
          total_tests: number | null
          validated_tests: number | null
        }
        Relationships: []
      }
      pending_orders: {
        Row: {
          created_at: string | null
          delivery_date: string | null
          id: string | null
          order_date: string | null
          order_number: string | null
          order_type: string | null
          organisation_id: string | null
          organisation_name: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      product_images_complete: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number | null
          file_size_bytes: number | null
          height: number | null
          id: string | null
          is_primary: boolean | null
          mime_type: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          storage_path: string | null
          updated_at: string | null
          url: string | null
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
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_health_monitor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      products_with_default_package: {
        Row: {
          archived_at: string | null
          assigned_client_id: string | null
          availability_type:
            | Database["public"]["Enums"]["availability_type_enum"]
            | null
          brand: string | null
          computed_stock_status: string | null
          condition: string | null
          cost_price: number | null
          created_at: string | null
          creation_mode: string | null
          description: string | null
          dimensions: Json | null
          gtin: string | null
          id: string | null
          margin_percentage: number | null
          min_stock: number | null
          name: string | null
          product_type: string | null
          projected_stock: number | null
          reorder_point: number | null
          requires_sample: boolean | null
          selling_points: Json | null
          sku: string | null
          slug: string | null
          sourcing_type: string | null
          status: Database["public"]["Enums"]["availability_status_type"] | null
          stock_forecasted_in: number | null
          stock_forecasted_out: number | null
          stock_quantity: number | null
          stock_real: number | null
          subcategory_id: string | null
          supplier_id: string | null
          supplier_page_url: string | null
          supplier_reference: string | null
          target_margin_percentage: number | null
          technical_description: string | null
          updated_at: string | null
          variant_attributes: Json | null
          video_url: string | null
          weight: number | null
        }
        Insert: {
          archived_at?: string | null
          assigned_client_id?: string | null
          availability_type?:
            | Database["public"]["Enums"]["availability_type_enum"]
            | null
          brand?: string | null
          computed_stock_status?: never
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          creation_mode?: string | null
          description?: string | null
          dimensions?: Json | null
          gtin?: string | null
          id?: string | null
          margin_percentage?: number | null
          min_stock?: number | null
          name?: string | null
          product_type?: string | null
          projected_stock?: never
          reorder_point?: number | null
          requires_sample?: boolean | null
          selling_points?: Json | null
          sku?: string | null
          slug?: string | null
          sourcing_type?: string | null
          status?:
            | Database["public"]["Enums"]["availability_status_type"]
            | null
          stock_forecasted_in?: number | null
          stock_forecasted_out?: number | null
          stock_quantity?: number | null
          stock_real?: number | null
          subcategory_id?: string | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_reference?: string | null
          target_margin_percentage?: number | null
          technical_description?: string | null
          updated_at?: string | null
          variant_attributes?: Json | null
          video_url?: string | null
          weight?: number | null
        }
        Update: {
          archived_at?: string | null
          assigned_client_id?: string | null
          availability_type?:
            | Database["public"]["Enums"]["availability_type_enum"]
            | null
          brand?: string | null
          computed_stock_status?: never
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          creation_mode?: string | null
          description?: string | null
          dimensions?: Json | null
          gtin?: string | null
          id?: string | null
          margin_percentage?: number | null
          min_stock?: number | null
          name?: string | null
          product_type?: string | null
          projected_stock?: never
          reorder_point?: number | null
          requires_sample?: boolean | null
          selling_points?: Json | null
          sku?: string | null
          slug?: string | null
          sourcing_type?: string | null
          status?:
            | Database["public"]["Enums"]["availability_status_type"]
            | null
          stock_forecasted_in?: number | null
          stock_forecasted_out?: number | null
          stock_quantity?: number | null
          stock_real?: number | null
          subcategory_id?: string | null
          supplier_id?: string | null
          supplier_page_url?: string | null
          supplier_reference?: string | null
          target_margin_percentage?: number | null
          technical_description?: string | null
          updated_at?: string | null
          variant_attributes?: Json | null
          video_url?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_assigned_client_id_fkey"
            columns: ["assigned_client_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
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
      stock_health_monitor: {
        Row: {
          calculated_stock: number | null
          difference: number | null
          id: string | null
          is_coherent: boolean | null
          name: string | null
          sku: string | null
          status: string | null
          stock_quantity: number | null
          stock_real: number | null
        }
        Insert: {
          calculated_stock?: never
          difference?: never
          id?: string | null
          is_coherent?: never
          name?: string | null
          sku?: string | null
          status?: never
          stock_quantity?: number | null
          stock_real?: number | null
        }
        Update: {
          calculated_stock?: never
          difference?: never
          id?: string | null
          is_coherent?: never
          name?: string | null
          sku?: string | null
          status?: never
          stock_quantity?: number | null
          stock_real?: number | null
        }
        Relationships: []
      }
      stock_overview: {
        Row: {
          id: string | null
          min_stock: number | null
          name: string | null
          reorder_point: number | null
          status: Database["public"]["Enums"]["availability_status_type"] | null
          stock_alert_level: string | null
          stock_forecasted_in: number | null
          stock_forecasted_out: number | null
          stock_quantity: number | null
          stock_real: number | null
        }
        Insert: {
          id?: string | null
          min_stock?: number | null
          name?: string | null
          reorder_point?: number | null
          status?:
            | Database["public"]["Enums"]["availability_status_type"]
            | null
          stock_alert_level?: never
          stock_forecasted_in?: number | null
          stock_forecasted_out?: number | null
          stock_quantity?: number | null
          stock_real?: number | null
        }
        Update: {
          id?: string | null
          min_stock?: number | null
          name?: string | null
          reorder_point?: number | null
          status?:
            | Database["public"]["Enums"]["availability_status_type"]
            | null
          stock_alert_level?: never
          stock_forecasted_in?: number | null
          stock_forecasted_out?: number | null
          stock_quantity?: number | null
          stock_real?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_collection_tag: {
        Args: { collection_id: string; tag: string }
        Returns: undefined
      }
      approve_sample_request: {
        Args: { p_approved_by: string; p_draft_id: string }
        Returns: {
          message: string
          status: string
          success: boolean
        }[]
      }
      auto_cancel_unpaid_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_lock_section_if_complete: {
        Args: { section_name_param: string }
        Returns: boolean
      }
      calculate_annual_revenue_bfa: {
        Args: { p_fiscal_year: number; p_organisation_id: string }
        Returns: {
          bfa_amount: number
          bfa_rate: number
          fiscal_year: number
          organisation_id: string
          organisation_name: string
          total_revenue_ht: number
        }[]
      }
      calculate_automatic_product_status: {
        Args: { p_stock_forecasted_in: number; p_stock_real: number }
        Returns: Database["public"]["Enums"]["availability_status_type"]
      }
      calculate_engagement_score: {
        Args: { p_days?: number; p_user_id: string }
        Returns: number
      }
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
      calculate_sourcing_product_status: {
        Args: { p_product_id: string }
        Returns: Database["public"]["Enums"]["availability_status_type"]
      }
      calculate_stock_status: {
        Args: { p_stock_real: number }
        Returns: Database["public"]["Enums"]["availability_status_type"]
      }
      cancel_order_forecast_movements: {
        Args: {
          p_order_id: string
          p_performed_by?: string
          p_reference_type: string
        }
        Returns: undefined
      }
      check_orders_stock_consistency: {
        Args: Record<PropertyKey, never>
        Returns: {
          actual_movements: number
          expected_movements: number
          order_id: string
          order_number: string
          order_type: string
          product_id: string
          product_name: string
          status: string
        }[]
      }
      classify_error_with_ai: {
        Args:
          | { error_message: string; error_type: string; stack_trace?: string }
          | { error_message: string; error_type: string; stack_trace?: string }
        Returns: Json
      }
      cleanup_expired_webhook_events: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_mcp_tasks: {
        Args: { days_old?: number }
        Returns: number
      }
      cleanup_old_status_history: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_sync_operations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_resolved_errors: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_mcp_task: {
        Args: {
          execution_details_param?: Json
          queue_id_param: string
          resolution_method_param?: string
          success_param: boolean
        }
        Returns: boolean
      }
      count_owners: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_color_if_not_exists: {
        Args: { color_hex?: string; color_name: string }
        Returns: string
      }
      create_purchase_order_forecast_movements: {
        Args: { p_performed_by?: string; p_purchase_order_id: string }
        Returns: undefined
      }
      create_purchase_reception_movement: {
        Args: { p_reception_id: string }
        Returns: undefined
      }
      create_sales_order_forecast_movements: {
        Args: { p_performed_by?: string; p_sales_order_id: string }
        Returns: undefined
      }
      create_sales_order_shipment_movements: {
        Args: { p_performed_by?: string; p_sales_order_id: string }
        Returns: undefined
      }
      create_sample_order: {
        Args: {
          p_created_by?: string
          p_draft_ids: string[]
          p_expected_delivery_date?: string
          p_internal_notes?: string
          p_supplier_id: string
        }
        Returns: {
          message: string
          order_id: string
          success: boolean
        }[]
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
      generate_bfa_report_all_customers: {
        Args: { p_fiscal_year: number }
        Returns: {
          bfa_amount: number
          bfa_rate: number
          organisation_id: string
          organisation_name: string
          total_revenue_ht: number
        }[]
      }
      generate_feed_access_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_from_order: {
        Args: { p_sales_order_id: string }
        Returns: {
          abby_invoice_id: string
          abby_invoice_number: string
          abby_pdf_url: string | null
          abby_public_url: string | null
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          invoice_date: string
          last_synced_from_abby_at: string | null
          sales_order_id: string
          status: string
          sync_errors: Json | null
          synced_to_abby_at: string | null
          total_ht: number
          total_ttc: number
          tva_amount: number
          updated_at: string
        }
      }
      generate_item_group_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_po_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_product_sku: {
        Args: { p_subcategory_id: string }
        Returns: string
      }
      generate_share_token: {
        Args: { collection_name: string }
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
      generate_variant_product_sku: {
        Args: { p_base_sku: string; p_variant_value: string }
        Returns: string
      }
      get_available_stock: {
        Args: { p_product_id: string }
        Returns: number
      }
      get_available_stock_advanced: {
        Args: { p_product_id: string }
        Returns: {
          stock_available: number
          stock_forecasted_in: number
          stock_forecasted_out: number
          stock_real: number
          stock_total_forecasted: number
        }[]
      }
      get_best_mcp_strategy: {
        Args: { error_msg: string }
        Returns: {
          confidence: number
          estimated_time: string
          mcp_tools: Json
          resolution_steps: Json
          strategy_name: string
        }[]
      }
      get_calculated_stock_from_movements: {
        Args: { p_product_id: string }
        Returns: number
      }
      get_categories_with_real_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          description: string
          display_order: number
          facebook_category: string
          family_id: string
          google_category_id: number
          id: string
          image_url: string
          is_active: boolean
          level: number
          name: string
          slug: string
          subcategory_count: number
          updated_at: string
        }[]
      }
      get_consultation_eligible_products: {
        Args: { target_consultation_id?: string }
        Returns: {
          creation_mode: string
          id: string
          name: string
          product_type: string
          requires_sample: boolean
          sku: string
          sourcing_type: string
          status: string
          supplier_name: string
        }[]
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
      get_dashboard_stock_orders_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          month_revenue: number
          products_to_source: number
          purchase_orders_count: number
          stock_value: number
        }[]
      }
      get_error_reports_dashboard: {
        Args: {
          limit_param?: number
          severity_filter?: Database["public"]["Enums"]["error_severity_enum"]
          status_filter?: Database["public"]["Enums"]["error_status_enum"]
        }
        Returns: Json
      }
      get_invoice_status_summary: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          count: number
          status: string
          total_ht: number
          total_ttc: number
        }[]
      }
      get_low_stock_products: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          min_stock: number
          name: string
          reorder_point: number
          sku: string
          stock_real: number
          supplier_name: string
        }[]
      }
      get_mcp_queue_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_completion_time_minutes: number
          completed_tasks: number
          failed_tasks: number
          pending_tasks: number
          processing_tasks: number
          success_rate_percent: number
          total_tasks: number
        }[]
      }
      get_next_mcp_task: {
        Args: { processor_id_param?: string }
        Returns: {
          error_context: Json
          error_report_id: string
          mcp_tools: Json
          priority: number
          queue_id: string
          retry_count: number
        }[]
      }
      get_next_variant_position: {
        Args: { group_id: string }
        Returns: number
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
      get_product_variants: {
        Args: { input_product_id: string }
        Returns: {
          cost_price: number
          created_at: string
          id: string
          is_variant_parent: boolean
          name: string
          sku: string
          status: string
          stock_quantity: number
          variant_attributes: Json
          variant_group_id: string
          variant_position: number
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
      get_products_status_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_recent_errors: {
        Args: { limit_count?: number }
        Returns: {
          created_at: string
          error_type: string
          id: string
          message: string
          severity: string
          source: string
        }[]
      }
      get_sample_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          no_sample_count: number
          requires_sample_count: number
          sample_percentage: number
          table_name: string
          total_products: number
        }[]
      }
      get_section_progress: {
        Args: { limit_param?: number; section_name_param: string }
        Returns: Json
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
      get_stock_metrics_optimized: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_stock_level: number
          products_coming_soon: number
          products_in_stock: number
          products_low_stock: number
          products_out_of_stock: number
          total_products: number
          total_stock_value: number
        }[]
      }
      get_stock_reason_description: {
        Args: { reason: Database["public"]["Enums"]["stock_reason_code"] }
        Returns: string
      }
      get_stock_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          low_stock_count: number
          movements_today: number
          movements_week: number
          out_of_stock_count: number
          total_products: number
          total_quantity: number
          total_value: number
        }[]
      }
      get_test_progress_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_activity_stats: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          avg_session_duration: unknown
          engagement_score: number
          last_activity: string
          most_used_module: string
          total_actions: number
          total_sessions: number
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
      get_user_recent_actions: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          action: string
          created_at: string
          page_url: string
          record_id: string
          severity: string
          table_name: string
        }[]
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
      get_variant_siblings: {
        Args: { product_id: string }
        Returns: {
          id: string
          image_url: string
          name: string
          price_ht: number
          sku: string
          variant_attributes: Json
          variant_position: number
        }[]
      }
      handle_abby_webhook_invoice_paid: {
        Args: {
          p_abby_invoice_id: string
          p_payment_amount: number
          p_payment_date: string
          p_payment_method?: string
        }
        Returns: Json
      }
      has_scope: {
        Args: { required_scope: string }
        Returns: boolean
      }
      initialize_dashboard_tests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manual_status: {
        Args: {
          p_status: Database["public"]["Enums"]["availability_status_type"]
        }
        Returns: boolean
      }
      is_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_tester_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      lock_section_when_complete: {
        Args: { force_lock?: boolean; section_name_param: string }
        Returns: Json
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id: string
          p_severity?: string
          p_table_name: string
        }
        Returns: string
      }
      log_auth_event: {
        Args: { p_details?: Json; p_event_type: string; p_success: boolean }
        Returns: undefined
      }
      mark_payment_received: {
        Args:
          | { p_amount: number; p_order_id: string }
          | { p_amount: number; p_order_id: string; p_user_id?: string }
        Returns: boolean
      }
      mark_sample_delivered: {
        Args: { p_draft_id: string }
        Returns: {
          message: string
          status: string
          success: boolean
        }[]
      }
      mark_sample_ordered: {
        Args: { p_draft_id: string }
        Returns: {
          message: string
          status: string
          success: boolean
        }[]
      }
      mark_sample_required: {
        Args: {
          product_id: string
          product_table: string
          requires_sample_value?: boolean
        }
        Returns: boolean
      }
      mark_warehouse_exit: {
        Args:
          | { p_order_id: string }
          | { p_order_id: string; p_user_id?: string }
        Returns: boolean
      }
      normalize_for_sku: {
        Args: { max_length?: number; text_input: string }
        Returns: string
      }
      process_shipment_stock: {
        Args: {
          p_performed_by_user_id?: string
          p_sales_order_id: string
          p_shipment_id: string
        }
        Returns: Json
      }
      recalculate_forecasted_stock: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      recalculate_product_stock: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      recalculate_section_metrics: {
        Args: { section_name_param: string }
        Returns: undefined
      }
      remove_collection_tag: {
        Args: { collection_id: string; tag: string }
        Returns: undefined
      }
      request_sample_order: {
        Args: {
          p_delivery_time_days?: number
          p_draft_id: string
          p_estimated_cost?: number
          p_sample_description: string
        }
        Returns: {
          message: string
          status: string
          success: boolean
        }[]
      }
      reset_stuck_mcp_tasks: {
        Args: { minutes_stuck?: number }
        Returns: number
      }
      search_collections_by_tags: {
        Args: { search_tags: string[] }
        Returns: {
          archived_at: string | null
          color_theme: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          last_shared: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          product_count: number | null
          shared_count: number | null
          shared_link_token: string | null
          sort_order: number | null
          style: string | null
          suitable_rooms: string[] | null
          theme_tags: string[] | null
          updated_at: string | null
          visibility: string
        }[]
      }
      search_product_colors: {
        Args: { search_query: string }
        Returns: {
          hex_code: string
          id: string
          is_predefined: boolean
          name: string
        }[]
      }
      transfer_to_product_catalog: {
        Args: { p_draft_id: string }
        Returns: {
          message: string
          product_id: string
          success: boolean
        }[]
      }
      update_product_status_if_needed: {
        Args: { p_force_recalculation?: boolean; p_product_id: string }
        Returns: Database["public"]["Enums"]["availability_status_type"]
      }
      update_test_status: {
        Args: {
          execution_time_param?: number
          new_status_param: Database["public"]["Enums"]["test_status_enum"]
          notes_param?: string
          test_id_param: string
        }
        Returns: Json
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
      validate_sample: {
        Args: {
          p_approved: boolean
          p_draft_id: string
          p_validated_by?: string
          p_validation_notes?: string
        }
        Returns: {
          message: string
          status: string
          success: boolean
        }[]
      }
      validate_sourcing_draft: {
        Args: {
          p_cost_price: number
          p_draft_id: string
          p_estimated_selling_price?: number
          p_requires_sample: boolean
          p_supplier_id: string
          p_validated_by?: string
        }
        Returns: {
          draft_status: string
          message: string
          success: boolean
        }[]
      }
      validate_stock_coherence: {
        Args: Record<PropertyKey, never>
        Returns: {
          calculated_stock: number
          difference: number
          is_coherent: boolean
          product_id: string
          sku: string
          stock_real: number
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
        | "sourcing"
        | "pret_a_commander"
        | "echantillon_a_commander"
      availability_type_enum:
        | "normal"
        | "preorder"
        | "coming_soon"
        | "discontinued"
      error_severity_enum: "critical" | "high" | "medium" | "low"
      error_status_enum: "open" | "in_progress" | "resolved" | "closed"
      error_type_enum:
        | "javascript_error"
        | "network_error"
        | "ui_bug"
        | "performance_issue"
        | "console_error"
        | "data_validation"
        | "functional_bug"
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
      room_type:
        | "salon"
        | "salle_a_manger"
        | "chambre"
        | "bureau"
        | "bibliotheque"
        | "salon_sejour"
        | "cuisine"
        | "salle_de_bain"
        | "wc"
        | "toilettes"
        | "hall_entree"
        | "couloir"
        | "cellier"
        | "buanderie"
        | "dressing"
        | "cave"
        | "grenier"
        | "garage"
        | "terrasse"
        | "balcon"
        | "jardin"
        | "veranda"
        | "loggia"
        | "cour"
        | "patio"
        | "salle_de_jeux"
        | "salle_de_sport"
        | "atelier"
        | "mezzanine"
        | "sous_sol"
      sales_order_status:
        | "draft"
        | "confirmed"
        | "partially_shipped"
        | "shipped"
        | "delivered"
        | "cancelled"
      sample_request_status_type: "pending_approval" | "approved" | "rejected"
      sample_status_type:
        | "not_required"
        | "request_pending"
        | "request_approved"
        | "ordered"
        | "delivered"
        | "approved"
        | "rejected"
      schedule_frequency_type: "manual" | "daily" | "weekly" | "monthly"
      shipment_type: "parcel" | "pallet"
      shipping_method: "packlink" | "mondial_relay" | "chronotruck" | "manual"
      sourcing_status_type:
        | "draft"
        | "sourcing_validated"
        | "ready_for_catalog"
        | "archived"
      stock_reason_code:
        | "sale"
        | "transfer_out"
        | "damage_transport"
        | "damage_handling"
        | "damage_storage"
        | "theft"
        | "loss_unknown"
        | "sample_client"
        | "sample_showroom"
        | "marketing_event"
        | "photography"
        | "rd_testing"
        | "prototype"
        | "quality_control"
        | "return_supplier"
        | "return_customer"
        | "warranty_replacement"
        | "inventory_correction"
        | "write_off"
        | "obsolete"
        | "purchase_reception"
        | "return_from_client"
        | "found_inventory"
        | "manual_adjustment"
      test_status_enum: "pending" | "passed" | "failed" | "warning"
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
        "sourcing",
        "pret_a_commander",
        "echantillon_a_commander",
      ],
      availability_type_enum: [
        "normal",
        "preorder",
        "coming_soon",
        "discontinued",
      ],
      error_severity_enum: ["critical", "high", "medium", "low"],
      error_status_enum: ["open", "in_progress", "resolved", "closed"],
      error_type_enum: [
        "javascript_error",
        "network_error",
        "ui_bug",
        "performance_issue",
        "console_error",
        "data_validation",
        "functional_bug",
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
      room_type: [
        "salon",
        "salle_a_manger",
        "chambre",
        "bureau",
        "bibliotheque",
        "salon_sejour",
        "cuisine",
        "salle_de_bain",
        "wc",
        "toilettes",
        "hall_entree",
        "couloir",
        "cellier",
        "buanderie",
        "dressing",
        "cave",
        "grenier",
        "garage",
        "terrasse",
        "balcon",
        "jardin",
        "veranda",
        "loggia",
        "cour",
        "patio",
        "salle_de_jeux",
        "salle_de_sport",
        "atelier",
        "mezzanine",
        "sous_sol",
      ],
      sales_order_status: [
        "draft",
        "confirmed",
        "partially_shipped",
        "shipped",
        "delivered",
        "cancelled",
      ],
      sample_request_status_type: ["pending_approval", "approved", "rejected"],
      sample_status_type: [
        "not_required",
        "request_pending",
        "request_approved",
        "ordered",
        "delivered",
        "approved",
        "rejected",
      ],
      schedule_frequency_type: ["manual", "daily", "weekly", "monthly"],
      shipment_type: ["parcel", "pallet"],
      shipping_method: ["packlink", "mondial_relay", "chronotruck", "manual"],
      sourcing_status_type: [
        "draft",
        "sourcing_validated",
        "ready_for_catalog",
        "archived",
      ],
      stock_reason_code: [
        "sale",
        "transfer_out",
        "damage_transport",
        "damage_handling",
        "damage_storage",
        "theft",
        "loss_unknown",
        "sample_client",
        "sample_showroom",
        "marketing_event",
        "photography",
        "rd_testing",
        "prototype",
        "quality_control",
        "return_supplier",
        "return_customer",
        "warranty_replacement",
        "inventory_correction",
        "write_off",
        "obsolete",
        "purchase_reception",
        "return_from_client",
        "found_inventory",
        "manual_adjustment",
      ],
      test_status_enum: ["pending", "passed", "failed", "warning"],
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
