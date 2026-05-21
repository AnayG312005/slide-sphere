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
      credit_transactions: {
        Row: {
          clerk_user_id: string
          created_at: string
          delta: number
          id: string
          metadata: Json | null
          project_id: string | null
          reason: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          delta: number
          id?: string
          metadata?: Json | null
          project_id?: string | null
          reason: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          delta?: number
          id?: string
          metadata?: Json | null
          project_id?: string | null
          reason?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clerk_user_id: string
          created_at: string
          credits: number
          display_name: string | null
          email: string | null
          id: string
          plan: string
          total_earned: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          credits?: number
          display_name?: string | null
          email?: string | null
          id?: string
          plan?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          credits?: number
          display_name?: string | null
          email?: string | null
          id?: string
          plan?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          clerk_user_id: string
          created_at: string
          density: string
          description: string | null
          id: string
          slide_count: number | null
          status: string
          style: string
          theme: string
          title: string
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          density?: string
          description?: string | null
          id?: string
          slide_count?: number | null
          status?: string
          style?: string
          theme?: string
          title: string
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          density?: string
          description?: string | null
          id?: string
          slide_count?: number | null
          status?: string
          style?: string
          theme?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      slides: {
        Row: {
          body: string | null
          bullets: Json | null
          created_at: string
          id: string
          image_source: string | null
          image_url: string | null
          layout: string
          notes: string | null
          position: number
          project_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          bullets?: Json | null
          created_at?: string
          id?: string
          image_source?: string | null
          image_url?: string | null
          layout?: string
          notes?: string | null
          position: number
          project_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          bullets?: Json | null
          created_at?: string
          id?: string
          image_source?: string | null
          image_url?: string | null
          layout?: string
          notes?: string | null
          position?: number
          project_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          _amount: number
          _clerk_user_id: string
          _metadata?: Json
          _reason: string
        }
        Returns: number
      }
      consume_credits: {
        Args: {
          _amount: number
          _clerk_user_id: string
          _project_id?: string
          _reason: string
        }
        Returns: number
      }
      ensure_profile: {
        Args: { _clerk_user_id: string; _email: string; _name: string }
        Returns: {
          clerk_user_id: string
          created_at: string
          credits: number
          display_name: string | null
          email: string | null
          id: string
          plan: string
          total_earned: number
          total_spent: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
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
