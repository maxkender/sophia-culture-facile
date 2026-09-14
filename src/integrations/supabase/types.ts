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
      access_codes: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          code: string
          created_at: string
          id: string
          platform: Database["public"]["Enums"]["device_platform"]
          redeem_url: string | null
          state: Database["public"]["Enums"]["code_state"]
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          code: string
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["device_platform"]
          redeem_url?: string | null
          state?: Database["public"]["Enums"]["code_state"]
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          code?: string
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["device_platform"]
          redeem_url?: string | null
          state?: Database["public"]["Enums"]["code_state"]
        }
        Relationships: [
          {
            foreignKeyName: "access_codes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          comment: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          comment?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          comment?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          admin_note: string | null
          country: string | null
          created_at: string
          created_profile_id: string | null
          cv_path: string | null
          date_of_birth: string | null
          education: string
          email: string
          email_sent_at: string | null
          full_name: string
          id: string
          is_certified_teacher: boolean
          motivation: string
          platform: Database["public"]["Enums"]["device_platform"]
          previous_work: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school: string | null
          status: Database["public"]["Enums"]["application_state"]
          tried_sophia: boolean
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          country?: string | null
          created_at?: string
          created_profile_id?: string | null
          cv_path?: string | null
          date_of_birth?: string | null
          education?: string
          email: string
          email_sent_at?: string | null
          full_name: string
          id?: string
          is_certified_teacher?: boolean
          motivation?: string
          platform?: Database["public"]["Enums"]["device_platform"]
          previous_work?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school?: string | null
          status?: Database["public"]["Enums"]["application_state"]
          tried_sophia?: boolean
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          country?: string | null
          created_at?: string
          created_profile_id?: string | null
          cv_path?: string | null
          date_of_birth?: string | null
          education?: string
          email?: string
          email_sent_at?: string | null
          full_name?: string
          id?: string
          is_certified_teacher?: boolean
          motivation?: string
          platform?: Database["public"]["Enums"]["device_platform"]
          previous_work?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school?: string | null
          status?: Database["public"]["Enums"]["application_state"]
          tried_sophia?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          author_id: string
          document_version: string
          id: string
          signature_ip: string | null
          signed_at: string
          signed_name: string
          user_agent: string | null
        }
        Insert: {
          author_id: string
          document_version: string
          id?: string
          signature_ip?: string | null
          signed_at?: string
          signed_name: string
          user_agent?: string | null
        }
        Update: {
          author_id?: string
          document_version?: string
          id?: string
          signature_ip?: string | null
          signed_at?: string
          signed_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          author_id: string | null
          brief_note: string | null
          created_at: string
          due_date: string | null
          id: string
          lot_code: string | null
          lot_name: string | null
          order_index: number
          review_comment: string | null
          status: Database["public"]["Enums"]["course_status"]
          subject_area: string | null
          submitted_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          brief_note?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          lot_code?: string | null
          lot_name?: string | null
          order_index?: number
          review_comment?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          subject_area?: string | null
          submitted_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          brief_note?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          lot_code?: string | null
          lot_name?: string | null
          order_index?: number
          review_comment?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          subject_area?: string | null
          submitted_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          note: string | null
          title: string
          version: number
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          note?: string | null
          title?: string
          version: number
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          note?: string | null
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: Json
          created_at: string
          current_version: number
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          current_version?: number
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          current_version?: number
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_code: string | null
          access_redeem_url: string | null
          activated_at: string | null
          bio: string | null
          country: string | null
          created_at: string
          email: string | null
          fee: string | null
          full_name: string
          id: string
          institution: string | null
          invite_expires_at: string | null
          invite_token: string | null
          invited_at: string | null
          is_test: boolean
          photo_url: string | null
          platform: Database["public"]["Enums"]["device_platform"] | null
          role: Database["public"]["Enums"]["portal_role"]
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_code?: string | null
          access_redeem_url?: string | null
          activated_at?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          fee?: string | null
          full_name: string
          id?: string
          institution?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          is_test?: boolean
          photo_url?: string | null
          platform?: Database["public"]["Enums"]["device_platform"] | null
          role?: Database["public"]["Enums"]["portal_role"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_code?: string | null
          access_redeem_url?: string | null
          activated_at?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          fee?: string | null
          full_name?: string
          id?: string
          institution?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          is_test?: boolean
          photo_url?: string | null
          platform?: Database["public"]["Enums"]["device_platform"] | null
          role?: Database["public"]["Enums"]["portal_role"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      screens: {
        Row: {
          body: string
          course_id: string
          id: string
          image_idea: string | null
          screen_number: number
          screen_title: string
          updated_at: string
        }
        Insert: {
          body?: string
          course_id: string
          id?: string
          image_idea?: string | null
          screen_number: number
          screen_title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          course_id?: string
          id?: string
          image_idea?: string | null
          screen_number?: number
          screen_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screens_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          claim: string | null
          course_id: string
          created_at: string
          id: string
          page: string | null
          reference: string | null
        }
        Insert: {
          claim?: string | null
          course_id: string
          created_at?: string
          id?: string
          page?: string | null
          reference?: string | null
        }
        Update: {
          claim?: string | null
          course_id?: string
          created_at?: string
          id?: string
          page?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_state: "pending" | "approved" | "rejected"
      code_state: "available" | "assigned" | "sent"
      course_status:
        | "assigned"
        | "in_progress"
        | "submitted"
        | "changes_requested"
        | "accepted"
        | "published"
      device_platform: "ios" | "android"
      portal_role: "admin" | "author"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      application_state: ["pending", "approved", "rejected"],
      code_state: ["available", "assigned", "sent"],
      course_status: [
        "assigned",
        "in_progress",
        "submitted",
        "changes_requested",
        "accepted",
        "published",
      ],
      device_platform: ["ios", "android"],
      portal_role: ["admin", "author"],
    },
  },
} as const
