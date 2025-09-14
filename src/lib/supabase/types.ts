/**
 * 🔧 Database Types - Generated from Supabase
 *
 * Types générés automatiquement depuis la structure DB
 */

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
      // Ajout d'autres tables selon besoins
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