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
      assignments: {
        Row: {
          brief: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          id: string
          status: Database["public"]["Enums"]["assignment_state"]
          teacher_id: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          brief?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          id?: string
          status?: Database["public"]["Enums"]["assignment_state"]
          teacher_id: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          brief?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          id?: string
          status?: Database["public"]["Enums"]["assignment_state"]
          teacher_id?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      author_payment_details: {
        Row: {
          address: string
          bic: string | null
          created_at: string
          iban: string
          legal_name: string
          legal_status: Database["public"]["Enums"]["author_legal_status"]
          siret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          bic?: string | null
          created_at?: string
          iban: string
          legal_name: string
          legal_status?: Database["public"]["Enums"]["author_legal_status"]
          siret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          bic?: string | null
          created_at?: string
          iban?: string
          legal_name?: string
          legal_status?: Database["public"]["Enums"]["author_legal_status"]
          siret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_signatures: {
        Row: {
          accepted: boolean
          contract_version: string
          created_at: string
          id: string
          signed_at: string
          signed_name: string
          user_id: string
        }
        Insert: {
          accepted?: boolean
          contract_version?: string
          created_at?: string
          id?: string
          signed_at?: string
          signed_name: string
          user_id: string
        }
        Update: {
          accepted?: boolean
          contract_version?: string
          created_at?: string
          id?: string
          signed_at?: string
          signed_name?: string
          user_id?: string
        }
        Relationships: []
      }
      course_submissions: {
        Row: {
          admin_feedback: string | null
          author_id: string
          content: Json
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          title: string | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          admin_feedback?: string | null
          author_id: string
          content?: Json
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          title?: string | null
          topic_id: string
          updated_at?: string
        }
        Update: {
          admin_feedback?: string | null
          author_id?: string
          content?: Json
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          title?: string | null
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_submissions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          assignment_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          label: string
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_state"]
          teacher_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          assignment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          label: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_state"]
          teacher_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          assignment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          label?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_state"]
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string
          created_at: string
          email: string
          first_name: string
          id: string
          institution: string
          language: string
          last_name: string
          specialty: string
          study_country: string
          subject_taught: string
          teaching_level: string
          updated_at: string
        }
        Insert: {
          avatar_path: string
          created_at?: string
          email: string
          first_name: string
          id: string
          institution?: string
          language: string
          last_name: string
          specialty?: string
          study_country: string
          subject_taught: string
          teaching_level: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          institution?: string
          language?: string
          last_name?: string
          specialty?: string
          study_country?: string
          subject_taught?: string
          teaching_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      topic_applications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          status: Database["public"]["Enums"]["application_state"]
          teacher_id: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["application_state"]
          teacher_id: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["application_state"]
          teacher_id?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_applications_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          admin_feedback: string | null
          category: Database["public"]["Enums"]["topic_category"]
          created_at: string
          description: string | null
          id: string
          language: string
          proposed_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["topic_status"]
          title: string
          updated_at: string
        }
        Insert: {
          admin_feedback?: string | null
          category?: Database["public"]["Enums"]["topic_category"]
          created_at?: string
          description?: string | null
          id?: string
          language: string
          proposed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["topic_status"]
          title: string
          updated_at?: string
        }
        Update: {
          admin_feedback?: string | null
          category?: Database["public"]["Enums"]["topic_category"]
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          proposed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["topic_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "teacher"
      application_state: "pending" | "accepted" | "rejected"
      assignment_state:
        | "attribue"
        | "en_cours"
        | "soumis"
        | "termine"
        | "annule"
      author_legal_status: "droits_auteur" | "independant"
      payment_kind: "acompte" | "solde" | "complement"
      payment_state: "a_venir" | "paye"
      submission_status:
        | "draft"
        | "submitted"
        | "approved"
        | "changes_requested"
        | "rejected"
      topic_category:
        | "histoire"
        | "science"
        | "litterature"
        | "art"
        | "mythologie"
        | "geopolitique"
      topic_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "teacher"],
      application_state: ["pending", "accepted", "rejected"],
      assignment_state: ["attribue", "en_cours", "soumis", "termine", "annule"],
      author_legal_status: ["droits_auteur", "independant"],
      payment_kind: ["acompte", "solde", "complement"],
      payment_state: ["a_venir", "paye"],
      submission_status: [
        "draft",
        "submitted",
        "approved",
        "changes_requested",
        "rejected",
      ],
      topic_category: [
        "histoire",
        "science",
        "litterature",
        "art",
        "mythologie",
        "geopolitique",
      ],
      topic_status: ["pending", "approved", "rejected"],
    },
  },
} as const
