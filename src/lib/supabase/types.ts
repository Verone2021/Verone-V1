export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      // Autres tables à ajouter si nécessaire
      [key: string]: any
    }
    Enums: {
      [key: string]: string
    }
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: {
          id: string
          name: string
          slug: string
          type: 'internal' | 'supplier' | 'customer' | 'partner'
          email: string | null
          country: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type?: 'internal' | 'supplier' | 'customer' | 'partner'
          email?: string | null
          country?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: 'internal' | 'supplier' | 'customer' | 'partner'
          email?: string | null
          country?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          role: 'owner' | 'admin' | 'catalog_manager' | 'sales' | 'partner_manager'
          scopes: string[]
          partner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          role: 'owner' | 'admin' | 'catalog_manager' | 'sales' | 'partner_manager'
          scopes?: string[]
          partner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          role?: 'owner' | 'admin' | 'catalog_manager' | 'sales' | 'partner_manager'
          scopes?: string[]
          partner_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          parent_id: string | null
          name: string
          slug: string
          level: number
          google_category_id: number | null
          facebook_category: string | null
          description: string | null
          image_url: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_id?: string | null
          name: string
          slug: string
          level?: number
          google_category_id?: number | null
          facebook_category?: string | null
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_id?: string | null
          name?: string
          slug?: string
          level?: number
          google_category_id?: number | null
          facebook_category?: string | null
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          storage_bucket: string
          storage_path: string
          storage_url: string | null
          file_name: string
          original_name: string
          mime_type: string
          file_size: number
          file_extension: string | null
          document_type: 'image' | 'document' | 'video' | 'audio' | 'pdf' | 'spreadsheet' | 'presentation' | 'archive'
          document_category: 'product_image' | 'category_image' | 'family_image' | 'client_document' | 'supplier_document' | 'contract' | 'invoice' | 'quote' | 'order' | 'catalog' | 'marketing_material' | 'internal_document'
          title: string | null
          description: string | null
          tags: string[]
          access_level: 'public' | 'internal' | 'restricted' | 'private'
          is_active: boolean
          related_entity_type: string | null
          related_entity_id: string | null
          image_width: number | null
          image_height: number | null
          alt_text: string | null
          version_number: number
          is_processed: boolean
          processing_status: string | null
          metadata: Json
          uploaded_by: string | null
          organisation_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          storage_bucket: string
          storage_path: string
          storage_url?: string | null
          file_name: string
          original_name: string
          mime_type: string
          file_size: number
          file_extension?: string | null
          document_type: 'image' | 'document' | 'video' | 'audio' | 'pdf' | 'spreadsheet' | 'presentation' | 'archive'
          document_category: 'product_image' | 'category_image' | 'family_image' | 'client_document' | 'supplier_document' | 'contract' | 'invoice' | 'quote' | 'order' | 'catalog' | 'marketing_material' | 'internal_document'
          title?: string | null
          description?: string | null
          tags?: string[]
          access_level?: 'public' | 'internal' | 'restricted' | 'private'
          is_active?: boolean
          related_entity_type?: string | null
          related_entity_id?: string | null
          image_width?: number | null
          image_height?: number | null
          alt_text?: string | null
          version_number?: number
          is_processed?: boolean
          processing_status?: string | null
          metadata?: Json
          uploaded_by?: string | null
          organisation_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          storage_bucket?: string
          storage_path?: string
          storage_url?: string | null
          file_name?: string
          original_name?: string
          mime_type?: string
          file_size?: number
          file_extension?: string | null
          document_type?: 'image' | 'document' | 'video' | 'audio' | 'pdf' | 'spreadsheet' | 'presentation' | 'archive'
          document_category?: 'product_image' | 'category_image' | 'family_image' | 'client_document' | 'supplier_document' | 'contract' | 'invoice' | 'quote' | 'order' | 'catalog' | 'marketing_material' | 'internal_document'
          title?: string | null
          description?: string | null
          tags?: string[]
          access_level?: 'public' | 'internal' | 'restricted' | 'private'
          is_active?: boolean
          related_entity_type?: string | null
          related_entity_id?: string | null
          image_width?: number | null
          image_height?: number | null
          alt_text?: string | null
          version_number?: number
          is_processed?: boolean
          processing_status?: string | null
          metadata?: Json
          uploaded_by?: string | null
          organisation_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organisation_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      organisation_type: 'internal' | 'supplier' | 'customer' | 'partner'
      user_role_type: 'owner' | 'admin' | 'catalog_manager' | 'sales' | 'partner_manager'
      user_type: 'staff' | 'supplier' | 'customer' | 'partner'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}