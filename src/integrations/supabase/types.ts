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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          area: string | null
          city: string | null
          created_at: string | null
          full_address: string
          house_no: string | null
          id: string
          is_default: boolean | null
          label: string | null
          latitude: number
          longitude: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string | null
          full_address: string
          house_no?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          latitude: number
          longitude: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string | null
          full_address?: string
          house_no?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          latitude?: number
          longitude?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          base_price: number
          booking_date: string
          booking_time: string
          booking_type: string
          created_at: string
          customer_address_text: string | null
          customer_latitude: number | null
          customer_longitude: number | null
          customer_name: string | null
          customer_phone: string | null
          final_price: number
          id: string
          payment_status: string
          provider_id: string
          service_name: string
          status: string
          urgency: string
          user_id: string
          worker_id: string | null
        }
        Insert: {
          base_price: number
          booking_date: string
          booking_time: string
          booking_type?: string
          created_at?: string
          customer_address_text?: string | null
          customer_latitude?: number | null
          customer_longitude?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          final_price: number
          id?: string
          payment_status?: string
          provider_id: string
          service_name: string
          status?: string
          urgency?: string
          user_id: string
          worker_id?: string | null
        }
        Update: {
          base_price?: number
          booking_date?: string
          booking_time?: string
          booking_type?: string
          created_at?: string
          customer_address_text?: string | null
          customer_latitude?: number | null
          customer_longitude?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          final_price?: number
          id?: string
          payment_status?: string
          provider_id?: string
          service_name?: string
          status?: string
          urgency?: string
          user_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      complaints: {
        Row: {
          created_at: string | null
          description: string
          id: string
          provider_id: string | null
          status: string | null
          subject: string
          user_id: string | null
          worker_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          provider_id?: string | null
          status?: string | null
          subject: string
          user_id?: string | null
          worker_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          provider_id?: string | null
          status?: string | null
          subject?: string
          user_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "complaints_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          email: string | null
          experience: string | null
          full_name: string | null
          hourly_rate: number | null
          house_no: string | null
          id: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          role: string
          service_category: string | null
          user_id: string
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          experience?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          house_no?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          role?: string
          service_category?: string | null
          user_id: string
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          experience?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          house_no?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          role?: string
          service_category?: string | null
          user_id?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          avatar_initials: string
          base_price: number
          completed_jobs: number
          created_at: string
          experience: string
          id: string
          is_active: boolean
          rating: number
          service_area: string
          service_category: string
          service_name: string
          user_id: string
        }
        Insert: {
          avatar_initials?: string
          base_price?: number
          completed_jobs?: number
          created_at?: string
          experience?: string
          id?: string
          is_active?: boolean
          rating?: number
          service_area?: string
          service_category: string
          service_name: string
          user_id: string
        }
        Update: {
          avatar_initials?: string
          base_price?: number
          completed_jobs?: number
          created_at?: string
          experience?: string
          id?: string
          is_active?: boolean
          rating?: number
          service_area?: string
          service_category?: string
          service_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          user_id: string
          worker_comment: string | null
          worker_id: string | null
          worker_rating: number | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          user_id: string
          worker_comment?: string | null
          worker_id?: string | null
          worker_rating?: number | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          user_id?: string
          worker_comment?: string | null
          worker_id?: string | null
          worker_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          completed_jobs: number | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          provider_id: string
          rating: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_jobs?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          provider_id: string
          rating?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_jobs?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          provider_id?: string
          rating?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      customer_can_reactivate_worker: {
        Args: { _user_id: string; _worker_id: string }
        Returns: boolean
      }
      is_booking_customer: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
      is_worker_for_booking: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
