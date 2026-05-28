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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          assigned_to: string
          completed: boolean
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          notes: string | null
          related_to_id: string | null
          related_to_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_type?: string
          assigned_to: string
          completed?: boolean
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          notes?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          assigned_to?: string
          completed?: boolean
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          call_type: Database["public"]["Enums"]["call_type"]
          called_at: string
          called_by: string
          created_at: string
          customer_id: string | null
          duration_seconds: number | null
          id: string
          lead_id: string | null
          notes: string | null
          outcome: string | null
          phone: string | null
          recording_url: string | null
        }
        Insert: {
          call_type?: Database["public"]["Enums"]["call_type"]
          called_at?: string
          called_by: string
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          outcome?: string | null
          phone?: string | null
          recording_url?: string | null
        }
        Update: {
          call_type?: Database["public"]["Enums"]["call_type"]
          called_at?: string
          called_by?: string
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          outcome?: string | null
          phone?: string | null
          recording_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          applies_to: string
          created_at: string
          field_name: string
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          options: Json | null
          sort_order: number
        }
        Insert: {
          applies_to?: string
          created_at?: string
          field_name: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          sort_order?: number
        }
        Update: {
          applies_to?: string
          created_at?: string
          field_name?: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          sort_order?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          birthday: string | null
          city: string | null
          company: string | null
          created_at: string
          created_by: string
          email: string | null
          gst_number: string | null
          id: string
          lead_id: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          gst_number?: string | null
          id?: string
          lead_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birthday?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          deal_name: string
          expected_close_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          stage: string
          updated_at: string
          value: number
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          customer_id?: string | null
          deal_name: string
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          stage?: string
          updated_at?: string
          value?: number
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          deal_name?: string
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          stage?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_heads: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          description: string | null
          expense_date: string
          id: string
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          related_to_id: string | null
          related_to_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          related_to_id?: string | null
          related_to_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          related_to_id?: string | null
          related_to_type?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      helpdesk_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          customer_id?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          holiday_type: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          date: string
          holiday_type?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          date?: string
          holiday_type?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_categories_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      lead_sources_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          category: string | null
          city: string | null
          company: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          next_followup: string | null
          notes: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["lead_priority"] | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          next_followup?: string | null
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          next_followup?: string | null
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          customer_id: string | null
          id: string
          lead_id: string | null
          message_type: Database["public"]["Enums"]["message_type"]
          phone: string
          sent_at: string | null
          sent_by: string
          status: string | null
          template_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          phone: string
          sent_at?: string | null
          sent_by: string
          status?: string | null
          template_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          message_type?: Database["public"]["Enums"]["message_type"]
          phone?: string
          sent_at?: string | null
          sent_by?: string
          status?: string | null
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      post_sales: {
        Row: {
          allocated_to: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          due_amount: number
          due_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          observer: string | null
          sale_date: string | null
          sale_type: string
          status: string
          tenure: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          allocated_to?: string | null
          created_at?: string
          created_by: string
          customer_id?: string | null
          due_amount?: number
          due_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          observer?: string | null
          sale_date?: string | null
          sale_type?: string
          status?: string
          tenure?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          allocated_to?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          due_amount?: number
          due_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          observer?: string | null
          sale_date?: string | null
          sale_type?: string
          status?: string
          tenure?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          designation: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          designation?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          designation?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string | null
          discount_amount: number
          discount_percent: number | null
          id: string
          items: Json
          lead_id: string | null
          notes: string | null
          quotation_number: string
          status: Database["public"]["Enums"]["quotation_status"]
          subtotal: number
          tax_amount: number
          tax_percent: number | null
          terms: string | null
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id?: string | null
          discount_amount?: number
          discount_percent?: number | null
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          quotation_number: string
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          tax_amount?: number
          tax_percent?: number | null
          terms?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string | null
          discount_amount?: number
          discount_percent?: number | null
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          quotation_number?: string
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          tax_amount?: number
          tax_percent?: number | null
          terms?: string | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_calls: {
        Row: {
          contact_name: string
          created_at: string
          created_by: string
          customer_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          phone: string | null
          reminder_sent: boolean
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          created_by: string
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          phone?: string | null
          reminder_sent?: boolean
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          created_by?: string
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          phone?: string | null
          reminder_sent?: boolean
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_calls_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_conditions: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "sales_rep" | "owner"
      call_type: "incoming" | "outgoing" | "missed"
      lead_priority: "low" | "medium" | "high" | "urgent"
      lead_status:
        | "new_lead"
        | "callback"
        | "not_interested"
        | "dp"
        | "cbpc"
        | "pg"
        | "dp_followup"
        | "pg_followup"
        | "video_meeting"
        | "video_meeting_followup"
        | "converted"
        | "dead"
      message_type: "whatsapp" | "sms" | "email"
      quotation_status: "draft" | "sent" | "accepted" | "rejected" | "expired"
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
      app_role: ["admin", "manager", "sales_rep", "owner"],
      call_type: ["incoming", "outgoing", "missed"],
      lead_priority: ["low", "medium", "high", "urgent"],
      lead_status: [
        "new_lead",
        "callback",
        "not_interested",
        "dp",
        "cbpc",
        "pg",
        "dp_followup",
        "pg_followup",
        "video_meeting",
        "video_meeting_followup",
        "converted",
        "dead",
      ],
      message_type: ["whatsapp", "sms", "email"],
      quotation_status: ["draft", "sent", "accepted", "rejected", "expired"],
    },
  },
} as const
