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
      behavioral_values: {
        Row: {
          balance_percentage: number | null
          behaviors: Json | null
          created_at: string | null
          feeling_notes: Json | null
          id: string
          is_pinned: boolean | null
          notes: string | null
          positive_feeling_dates: Json | null
          positive_feelings: Json | null
          selected_feelings: Json | null
          updated_at: string | null
          user_id: string
          value_id: string
          value_name: string
        }
        Insert: {
          balance_percentage?: number | null
          behaviors?: Json | null
          created_at?: string | null
          feeling_notes?: Json | null
          id?: string
          is_pinned?: boolean | null
          notes?: string | null
          positive_feeling_dates?: Json | null
          positive_feelings?: Json | null
          selected_feelings?: Json | null
          updated_at?: string | null
          user_id: string
          value_id: string
          value_name: string
        }
        Update: {
          balance_percentage?: number | null
          behaviors?: Json | null
          created_at?: string | null
          feeling_notes?: Json | null
          id?: string
          is_pinned?: boolean | null
          notes?: string | null
          positive_feeling_dates?: Json | null
          positive_feelings?: Json | null
          selected_feelings?: Json | null
          updated_at?: string | null
          user_id?: string
          value_id?: string
          value_name?: string
        }
        Relationships: []
      }
      divine_names: {
        Row: {
          created_at: string | null
          divine_name: string
          id: string
          notes: string | null
          progress: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          divine_name: string
          id?: string
          notes?: string | null
          progress?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          divine_name?: string
          id?: string
          notes?: string | null
          progress?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      self_dialogue_messages: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          message: string
          sender: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          message: string
          sender: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          message?: string
          sender?: string
          user_id?: string
        }
        Relationships: []
      }
      spiritual_values: {
        Row: {
          balance_percentage: number | null
          created_at: string | null
          feeling_notes: Json | null
          feeling_tasks: Json | null
          id: string
          is_pinned: boolean | null
          notes: string | null
          positive_feeling_dates: Json | null
          positive_feelings: Json | null
          selected_feelings: Json | null
          session_id: string | null
          updated_at: string | null
          user_id: string
          value_id: string
          value_name: string
        }
        Insert: {
          balance_percentage?: number | null
          created_at?: string | null
          feeling_notes?: Json | null
          feeling_tasks?: Json | null
          id?: string
          is_pinned?: boolean | null
          notes?: string | null
          positive_feeling_dates?: Json | null
          positive_feelings?: Json | null
          selected_feelings?: Json | null
          session_id?: string | null
          updated_at?: string | null
          user_id: string
          value_id: string
          value_name: string
        }
        Update: {
          balance_percentage?: number | null
          created_at?: string | null
          feeling_notes?: Json | null
          feeling_tasks?: Json | null
          id?: string
          is_pinned?: boolean | null
          notes?: string | null
          positive_feeling_dates?: Json | null
          positive_feelings?: Json | null
          selected_feelings?: Json | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string
          value_id?: string
          value_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
