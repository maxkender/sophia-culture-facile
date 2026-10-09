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
          app_id: string
          assigned_at: string | null
          assigned_creator_id: string | null
          assigned_to: string | null
          batch_label: string | null
          code: string
          created_at: string
          id: string
          platform: Database["public"]["Enums"]["device_platform"]
          redeem_url: string | null
          state: Database["public"]["Enums"]["code_state"]
        }
        Insert: {
          app_id?: string
          assigned_at?: string | null
          assigned_creator_id?: string | null
          assigned_to?: string | null
          batch_label?: string | null
          code: string
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["device_platform"]
          redeem_url?: string | null
          state?: Database["public"]["Enums"]["code_state"]
        }
        Update: {
          app_id?: string
          assigned_at?: string | null
          assigned_creator_id?: string | null
          assigned_to?: string | null
          batch_label?: string | null
          code?: string
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["device_platform"]
          redeem_url?: string | null
          state?: Database["public"]["Enums"]["code_state"]
        }
        Relationships: [
          {
            foreignKeyName: "access_codes_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_codes_assigned_creator_id_fkey"
            columns: ["assigned_creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
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
      ad_candidates: {
        Row: {
          app_id: string
          bonus_paid_at: string | null
          caption: string | null
          channel: string
          country: string
          created_at: string
          created_by: string | null
          creator_id: string | null
          cta: string
          daily_budget: number | null
          duration_days: number | null
          ended_at: string | null
          external_ids: Json
          hook: string | null
          id: string
          landing_url: string | null
          notes: string | null
          objective: string
          post_id: string
          raw_file_path: string | null
          spark_code: string | null
          spark_valid_until: string | null
          started_at: string | null
          status: string
          updated_at: string
          winner: boolean
        }
        Insert: {
          app_id: string
          bonus_paid_at?: string | null
          caption?: string | null
          channel?: string
          country?: string
          created_at?: string
          created_by?: string | null
          creator_id?: string | null
          cta?: string
          daily_budget?: number | null
          duration_days?: number | null
          ended_at?: string | null
          external_ids?: Json
          hook?: string | null
          id?: string
          landing_url?: string | null
          notes?: string | null
          objective?: string
          post_id: string
          raw_file_path?: string | null
          spark_code?: string | null
          spark_valid_until?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          winner?: boolean
        }
        Update: {
          app_id?: string
          bonus_paid_at?: string | null
          caption?: string | null
          channel?: string
          country?: string
          created_at?: string
          created_by?: string | null
          creator_id?: string | null
          cta?: string
          daily_budget?: number | null
          duration_days?: number | null
          ended_at?: string | null
          external_ids?: Json
          hook?: string | null
          id?: string
          landing_url?: string | null
          notes?: string | null
          objective?: string
          post_id?: string
          raw_file_path?: string | null
          spark_code?: string | null
          spark_valid_until?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          winner?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ad_candidates_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_connections: {
        Row: {
          account_id: string | null
          app_id: string
          channel: string
          config: Json
          connected_at: string | null
          id: string
        }
        Insert: {
          account_id?: string | null
          app_id: string
          channel: string
          config?: Json
          connected_at?: string | null
          id?: string
        }
        Update: {
          account_id?: string | null
          app_id?: string
          channel?: string
          config?: Json
          connected_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_connections_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_metrics_daily: {
        Row: {
          ad_id: string
          clicks: number
          day: string
          id: string
          impressions: number
          installs: number
          source: string
          spend: number
        }
        Insert: {
          ad_id: string
          clicks?: number
          day: string
          id?: string
          impressions?: number
          installs?: number
          source?: string
          spend?: number
        }
        Update: {
          ad_id?: string
          clicks?: number
          day?: string
          id?: string
          impressions?: number
          installs?: number
          source?: string
          spend?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_metrics_daily_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ad_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_ui_prefs: {
        Row: {
          creators_app: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          creators_app?: string
          key: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Update: {
          creators_app?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      ai_reviews: {
        Row: {
          content_hash: string
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          model: string
          result: Json
          shared_with_author: boolean
        }
        Insert: {
          content_hash: string
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          model: string
          result: Json
          shared_with_author?: boolean
        }
        Update: {
          content_hash?: string
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          model?: string
          result?: Json
          shared_with_author?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_reviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          profile_id: string
          read_at: string
        }
        Insert: {
          announcement_id: string
          id?: string
          profile_id: string
          read_at?: string
        }
        Update: {
          announcement_id?: string
          id?: string
          profile_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string | null
          dismissible: boolean
          ends_at: string | null
          id: string
          starts_at: string
          target_profile_ids: string[]
          title: string
        }
        Insert: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          dismissible?: boolean
          ends_at?: string | null
          id?: string
          starts_at?: string
          target_profile_ids?: string[]
          title: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          dismissible?: boolean
          ends_at?: string | null
          id?: string
          starts_at?: string
          target_profile_ids?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
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
      apps: {
        Row: {
          accent_color: string | null
          active: boolean
          app_store_url: string | null
          created_at: string
          creators_line: string | null
          domain: string | null
          id: string
          logo_path: string | null
          name: string
          play_store_url: string | null
          primary_color: string | null
          short_description: string | null
          slug: string
          taap_url: string | null
          tagline: string | null
          users_line: string | null
        }
        Insert: {
          accent_color?: string | null
          active?: boolean
          app_store_url?: string | null
          created_at?: string
          creators_line?: string | null
          domain?: string | null
          id?: string
          logo_path?: string | null
          name: string
          play_store_url?: string | null
          primary_color?: string | null
          short_description?: string | null
          slug: string
          taap_url?: string | null
          tagline?: string | null
          users_line?: string | null
        }
        Update: {
          accent_color?: string | null
          active?: boolean
          app_store_url?: string | null
          created_at?: string
          creators_line?: string | null
          domain?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          play_store_url?: string | null
          primary_color?: string | null
          short_description?: string | null
          slug?: string
          taap_url?: string | null
          tagline?: string | null
          users_line?: string | null
        }
        Relationships: []
      }
      awards: {
        Row: {
          awarded_at: string
          creator_id: string
          id: string
          kind: string
          period: string
        }
        Insert: {
          awarded_at?: string
          creator_id: string
          id?: string
          kind: string
          period?: string
        }
        Update: {
          awarded_at?: string
          creator_id?: string
          id?: string
          kind?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "awards_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_assignments: {
        Row: {
          brief_id: string
          created_at: string
          creator_id: string
          decline_reason: string | null
          declined_at: string | null
          id: string
          published_at: string | null
          replacement_brief_id: string | null
          replaces_assignment_id: string | null
          target_date: string | null
          week_start: string | null
        }
        Insert: {
          brief_id: string
          created_at?: string
          creator_id: string
          decline_reason?: string | null
          declined_at?: string | null
          id?: string
          published_at?: string | null
          replacement_brief_id?: string | null
          replaces_assignment_id?: string | null
          target_date?: string | null
          week_start?: string | null
        }
        Update: {
          brief_id?: string
          created_at?: string
          creator_id?: string
          decline_reason?: string | null
          declined_at?: string | null
          id?: string
          published_at?: string | null
          replacement_brief_id?: string | null
          replaces_assignment_id?: string | null
          target_date?: string | null
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brief_assignments_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_assignments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_assignments_replacement_brief_id_fkey"
            columns: ["replacement_brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_assignments_replaces_assignment_id_fkey"
            columns: ["replaces_assignment_id"]
            isOneToOne: false
            referencedRelation: "brief_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_reads: {
        Row: {
          brief_id: string
          creator_id: string
          id: string
          seen_at: string
          skip_reason: string | null
          skipped_at: string | null
        }
        Insert: {
          brief_id: string
          creator_id: string
          id?: string
          seen_at?: string
          skip_reason?: string | null
          skipped_at?: string | null
        }
        Update: {
          brief_id?: string
          creator_id?: string
          id?: string
          seen_at?: string
          skip_reason?: string | null
          skipped_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brief_reads_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_reads_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      briefs: {
        Row: {
          angle: string | null
          app: string
          app_id: string
          audience: string
          body: string
          brief_type: string
          created_at: string
          created_by: string | null
          difficulty: number
          due_date: string | null
          duration_target: string | null
          format: string | null
          hook: string | null
          id: string
          must_mention: string | null
          platform: string
          reference_video_ids: string[]
          script: string | null
          status: string
          tags: string[]
          title: string
        }
        Insert: {
          angle?: string | null
          app?: string
          app_id?: string
          audience?: string
          body?: string
          brief_type?: string
          created_at?: string
          created_by?: string | null
          difficulty?: number
          due_date?: string | null
          duration_target?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          must_mention?: string | null
          platform?: string
          reference_video_ids?: string[]
          script?: string | null
          status?: string
          tags?: string[]
          title: string
        }
        Update: {
          angle?: string | null
          app?: string
          app_id?: string
          audience?: string
          body?: string
          brief_type?: string
          created_at?: string
          created_by?: string | null
          difficulty?: number
          due_date?: string | null
          duration_target?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          must_mention?: string | null
          platform?: string
          reference_video_ids?: string[]
          script?: string | null
          status?: string
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          app_id: string
          brief_md: string
          created_at: string
          created_by: string | null
          distribution: Json
          ends_at: string | null
          id: string
          monthly_budget: number | null
          name: string
          ongoing: boolean
          requirements: Json
          settings: Json
          starts_at: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          app_id: string
          brief_md?: string
          created_at?: string
          created_by?: string | null
          distribution?: Json
          ends_at?: string | null
          id?: string
          monthly_budget?: number | null
          name: string
          ongoing?: boolean
          requirements?: Json
          settings?: Json
          starts_at?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          brief_md?: string
          created_at?: string
          created_by?: string | null
          distribution?: Json
          ends_at?: string | null
          id?: string
          monthly_budget?: number | null
          name?: string
          ongoing?: boolean
          requirements?: Json
          settings?: Json
          starts_at?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
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
      conversations: {
        Row: {
          admin_unread: number
          author_unread: number
          course_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          profile_id: string
        }
        Insert: {
          admin_unread?: number
          author_unread?: number
          course_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          profile_id: string
        }
        Update: {
          admin_unread?: number
          author_unread?: number
          course_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      country_zones: {
        Row: {
          ceiling_applies: boolean
          country_code: string
          country_name: string
          created_at: string
          zone: string
        }
        Insert: {
          ceiling_applies?: boolean
          country_code: string
          country_name: string
          created_at?: string
          zone: string
        }
        Update: {
          ceiling_applies?: boolean
          country_code?: string
          country_name?: string
          created_at?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "country_zones_zone_fkey"
            columns: ["zone"]
            isOneToOne: false
            referencedRelation: "pay_zones"
            referencedColumns: ["zone"]
          },
        ]
      }
      course_proposals: {
        Row: {
          course_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decline_reason: string | null
          id: string
          profile_id: string
          reveal: string
          status: string
          subject_area: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          id?: string
          profile_id: string
          reveal: string
          status?: string
          subject_area?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          id?: string
          profile_id?: string
          reveal?: string
          status?: string
          subject_area?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_proposals_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_proposals_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_proposals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_requests: {
        Row: {
          course_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decline_reason: string | null
          id: string
          note: string
          profile_id: string
          status: string
        }
        Insert: {
          course_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          id?: string
          note?: string
          profile_id: string
          status?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          id?: string
          note?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          admin_note: string | null
          alternate_slug: string | null
          author_id: string | null
          brief_note: string | null
          created_at: string
          did_you_know: string[]
          due_date: string | null
          fee_usd: number
          id: string
          language: string
          lot_code: string | null
          lot_name: string | null
          order_index: number
          public_full_text: boolean
          published_at: string | null
          released_at: string | null
          released_from: string | null
          review_comment: string | null
          slug: string | null
          status: Database["public"]["Enums"]["course_status"]
          subject_area: string | null
          submitted_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          alternate_slug?: string | null
          author_id?: string | null
          brief_note?: string | null
          created_at?: string
          did_you_know?: string[]
          due_date?: string | null
          fee_usd?: number
          id?: string
          language?: string
          lot_code?: string | null
          lot_name?: string | null
          order_index?: number
          public_full_text?: boolean
          published_at?: string | null
          released_at?: string | null
          released_from?: string | null
          review_comment?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          subject_area?: string | null
          submitted_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          alternate_slug?: string | null
          author_id?: string | null
          brief_note?: string | null
          created_at?: string
          did_you_know?: string[]
          due_date?: string | null
          fee_usd?: number
          id?: string
          language?: string
          lot_code?: string | null
          lot_name?: string | null
          order_index?: number
          public_full_text?: boolean
          published_at?: string | null
          released_at?: string | null
          released_from?: string | null
          review_comment?: string | null
          slug?: string | null
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
          {
            foreignKeyName: "courses_released_from_fkey"
            columns: ["released_from"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_announcements: {
        Row: {
          active: boolean
          app_id: string
          body: string
          created_at: string
          id: string
          title: string
          track: string | null
        }
        Insert: {
          active?: boolean
          app_id?: string
          body: string
          created_at?: string
          id?: string
          title: string
          track?: string | null
        }
        Update: {
          active?: boolean
          app_id?: string
          body?: string
          created_at?: string
          id?: string
          title?: string
          track?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_announcements_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_applications: {
        Row: {
          acceptance_email_sent_at: string | null
          admin_notes: string | null
          age: number
          app_id: string
          assigned_hm_id: string | null
          consent_at: string
          country: string
          created_at: string
          created_creator_id: string | null
          decided_at: string | null
          decided_by: string | null
          decline_email_message_id: string | null
          decline_email_sent_at: string | null
          email: string
          full_name: string
          id: string
          instagram_url: string | null
          interview_at: string | null
          meets_criteria: boolean
          occupation: string
          other_links: string | null
          phone: string
          referral_source: string
          rejection_reason: string | null
          source: string | null
          status: string
          submit_ip_hash: string | null
          tiktok_url: string | null
          video_file_path: string | null
          video_url: string | null
          welcome_email_error: string | null
          welcome_email_message_id: string | null
          welcome_email_provider: string | null
        }
        Insert: {
          acceptance_email_sent_at?: string | null
          admin_notes?: string | null
          age: number
          app_id?: string
          assigned_hm_id?: string | null
          consent_at?: string
          country: string
          created_at?: string
          created_creator_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decline_email_message_id?: string | null
          decline_email_sent_at?: string | null
          email: string
          full_name: string
          id?: string
          instagram_url?: string | null
          interview_at?: string | null
          meets_criteria?: boolean
          occupation: string
          other_links?: string | null
          phone: string
          referral_source: string
          rejection_reason?: string | null
          source?: string | null
          status?: string
          submit_ip_hash?: string | null
          tiktok_url?: string | null
          video_file_path?: string | null
          video_url?: string | null
          welcome_email_error?: string | null
          welcome_email_message_id?: string | null
          welcome_email_provider?: string | null
        }
        Update: {
          acceptance_email_sent_at?: string | null
          admin_notes?: string | null
          age?: number
          app_id?: string
          assigned_hm_id?: string | null
          consent_at?: string
          country?: string
          created_at?: string
          created_creator_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decline_email_message_id?: string | null
          decline_email_sent_at?: string | null
          email?: string
          full_name?: string
          id?: string
          instagram_url?: string | null
          interview_at?: string | null
          meets_criteria?: boolean
          occupation?: string
          other_links?: string | null
          phone?: string
          referral_source?: string
          rejection_reason?: string | null
          source?: string | null
          status?: string
          submit_ip_hash?: string | null
          tiktok_url?: string | null
          video_file_path?: string | null
          video_url?: string | null
          welcome_email_error?: string | null
          welcome_email_message_id?: string | null
          welcome_email_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_applications_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_applications_assigned_hm_id_fkey"
            columns: ["assigned_hm_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_applications_created_creator_id_fkey"
            columns: ["created_creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_apps: {
        Row: {
          app_id: string
          creator_id: string
          enrolled_at: string
          status: string
        }
        Insert: {
          app_id: string
          creator_id: string
          enrolled_at?: string
          status?: string
        }
        Update: {
          app_id?: string
          creator_id?: string
          enrolled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_apps_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_apps_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_call_rsvps: {
        Row: {
          answer: string
          attended: boolean | null
          call_id: string
          created_at: string
          creator_id: string
          id: string
          reminded_at: string | null
        }
        Insert: {
          answer?: string
          attended?: boolean | null
          call_id: string
          created_at?: string
          creator_id: string
          id?: string
          reminded_at?: string | null
        }
        Update: {
          answer?: string
          attended?: boolean | null
          call_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          reminded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_call_rsvps_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "creator_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_call_rsvps_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_calls: {
        Row: {
          created_at: string
          id: string
          link: string | null
          notes: string | null
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          notes?: string | null
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          notes?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      creator_email_settings: {
        Row: {
          button_label: string
          created_at: string
          id: string
          instructions: string
          intro: string
          subject: string
          template_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          button_label: string
          created_at?: string
          id?: string
          instructions: string
          intro: string
          subject: string
          template_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          button_label?: string
          created_at?: string
          id?: string
          instructions?: string
          intro?: string
          subject?: string
          template_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_email_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_guide_media: {
        Row: {
          caption: string | null
          created_at: string
          file_path: string | null
          guide_id: string
          id: string
          url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_path?: string | null
          guide_id: string
          id?: string
          url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_path?: string | null
          guide_id?: string
          id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_guide_media_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "creator_weekly_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_messages: {
        Row: {
          body: string
          created_at: string
          creator_id: string
          from_admin: boolean
          id: string
          post_id: string | null
          read_at: string | null
        }
        Insert: {
          body: string
          created_at?: string
          creator_id: string
          from_admin: boolean
          id?: string
          post_id?: string | null
          read_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          creator_id?: string
          from_admin?: boolean
          id?: string
          post_id?: string | null
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_messages_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_messages_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_notifications: {
        Row: {
          body: string
          created_at: string
          creator_id: string
          id: string
          read_at: string | null
        }
        Insert: {
          body: string
          created_at?: string
          creator_id: string
          id?: string
          read_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          creator_id?: string
          id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_notifications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_payout_profiles: {
        Row: {
          bank_holder: string | null
          bank_iban: string | null
          created_at: string
          creator_id: string
          id: string
          method: string
          paypal_email: string | null
          siret: string | null
          stripe_account_id: string | null
          stripe_onboarded: boolean
          updated_at: string
          wise_email: string | null
        }
        Insert: {
          bank_holder?: string | null
          bank_iban?: string | null
          created_at?: string
          creator_id: string
          id?: string
          method?: string
          paypal_email?: string | null
          siret?: string | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          updated_at?: string
          wise_email?: string | null
        }
        Update: {
          bank_holder?: string | null
          bank_iban?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          method?: string
          paypal_email?: string | null
          siret?: string | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          updated_at?: string
          wise_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_payout_profiles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_posts: {
        Row: {
          amount_usd: number | null
          app_id: string
          bonus_usd: number | null
          brief_id: string | null
          created_at: string
          creator_id: string
          feedback: string | null
          id: string
          likes: number | null
          pay_status: string | null
          platform: string
          posted_on: string
          rate_id: string | null
          reference_video_id: string | null
          skip_reason: string | null
          status: string
          url: string
          views: number | null
          views_entered_at: string | null
          views_screenshot_path: string | null
        }
        Insert: {
          amount_usd?: number | null
          app_id?: string
          bonus_usd?: number | null
          brief_id?: string | null
          created_at?: string
          creator_id: string
          feedback?: string | null
          id?: string
          likes?: number | null
          pay_status?: string | null
          platform?: string
          posted_on?: string
          rate_id?: string | null
          reference_video_id?: string | null
          skip_reason?: string | null
          status?: string
          url: string
          views?: number | null
          views_entered_at?: string | null
          views_screenshot_path?: string | null
        }
        Update: {
          amount_usd?: number | null
          app_id?: string
          bonus_usd?: number | null
          brief_id?: string | null
          created_at?: string
          creator_id?: string
          feedback?: string | null
          id?: string
          likes?: number | null
          pay_status?: string | null
          platform?: string
          posted_on?: string
          rate_id?: string | null
          reference_video_id?: string | null
          skip_reason?: string | null
          status?: string
          url?: string
          views?: number | null
          views_entered_at?: string | null
          views_screenshot_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_posts_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_posts_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_posts_rate_id_fkey"
            columns: ["rate_id"]
            isOneToOne: false
            referencedRelation: "creator_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_posts_reference_video_id_fkey"
            columns: ["reference_video_id"]
            isOneToOne: false
            referencedRelation: "reference_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_prospects: {
        Row: {
          age: number | null
          applied_at: string | null
          assigned_hm_id: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          email: string | null
          face_cam: boolean | null
          followers: number | null
          gender: string | null
          handle: string | null
          id: string
          instagram_handle: string | null
          language: string | null
          last_seen_at: string | null
          name: string | null
          next_action_on: string | null
          niche: string | null
          notes: string | null
          phone: string | null
          platform: string
          presentation: string | null
          school_or_job: string | null
          source: string
          status: string
          tags: string[]
          target_app: string | null
          target_app_id: string | null
          tiktok_handle: string | null
          track: string | null
        }
        Insert: {
          age?: number | null
          applied_at?: string | null
          assigned_hm_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          face_cam?: boolean | null
          followers?: number | null
          gender?: string | null
          handle?: string | null
          id?: string
          instagram_handle?: string | null
          language?: string | null
          last_seen_at?: string | null
          name?: string | null
          next_action_on?: string | null
          niche?: string | null
          notes?: string | null
          phone?: string | null
          platform?: string
          presentation?: string | null
          school_or_job?: string | null
          source?: string
          status?: string
          tags?: string[]
          target_app?: string | null
          target_app_id?: string | null
          tiktok_handle?: string | null
          track?: string | null
        }
        Update: {
          age?: number | null
          applied_at?: string | null
          assigned_hm_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          face_cam?: boolean | null
          followers?: number | null
          gender?: string | null
          handle?: string | null
          id?: string
          instagram_handle?: string | null
          language?: string | null
          last_seen_at?: string | null
          name?: string | null
          next_action_on?: string | null
          niche?: string | null
          notes?: string | null
          phone?: string | null
          platform?: string
          presentation?: string | null
          school_or_job?: string | null
          source?: string
          status?: string
          tags?: string[]
          target_app?: string | null
          target_app_id?: string | null
          tiktok_handle?: string | null
          track?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_prospects_assigned_hm_id_fkey"
            columns: ["assigned_hm_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_prospects_target_app_id_fkey"
            columns: ["target_app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_rates: {
        Row: {
          app_id: string
          country: string | null
          created_at: string
          effective_from: string
          id: string
          rate_usd: number
          track: string
        }
        Insert: {
          app_id?: string
          country?: string | null
          created_at?: string
          effective_from?: string
          id?: string
          rate_usd: number
          track: string
        }
        Update: {
          app_id?: string
          country?: string | null
          created_at?: string
          effective_from?: string
          id?: string
          rate_usd?: number
          track?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_rates_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_requests: {
        Row: {
          body: string
          created_at: string
          creator_id: string
          id: string
          reply: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          creator_id: string
          id?: string
          reply?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type?: string
        }
        Update: {
          body?: string
          created_at?: string
          creator_id?: string
          id?: string
          reply?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_signatures: {
        Row: {
          creator_id: string | null
          document_version: string
          id: string
          signature_ip: string | null
          signed_at: string
          signed_name: string
          slideshow_application_id: string | null
          user_agent: string | null
          variant: string
        }
        Insert: {
          creator_id?: string | null
          document_version: string
          id?: string
          signature_ip?: string | null
          signed_at?: string
          signed_name: string
          slideshow_application_id?: string | null
          user_agent?: string | null
          variant: string
        }
        Update: {
          creator_id?: string | null
          document_version?: string
          id?: string
          signature_ip?: string | null
          signed_at?: string
          signed_name?: string
          slideshow_application_id?: string | null
          user_agent?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_signatures_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_signatures_slideshow_application_id_fkey"
            columns: ["slideshow_application_id"]
            isOneToOne: true
            referencedRelation: "slideshow_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_social_accounts: {
        Row: {
          account_email: string
          app_id: string
          creator_id: string
          device: string | null
          handle: string
          id: string
          password_encrypted: string
          phone: string | null
          registered_at: string
          updated_at: string
        }
        Insert: {
          account_email: string
          app_id?: string
          creator_id: string
          device?: string | null
          handle: string
          id?: string
          password_encrypted: string
          phone?: string | null
          registered_at?: string
          updated_at?: string
        }
        Update: {
          account_email?: string
          app_id?: string
          creator_id?: string
          device?: string | null
          handle?: string
          id?: string
          password_encrypted?: string
          phone?: string | null
          registered_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_social_accounts_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_social_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_tasks: {
        Row: {
          ad_candidate_id: string | null
          created_at: string
          creator_id: string
          done_at: string | null
          file_path: string | null
          id: string
          instructions: string
          response: string | null
          status: string
          title: string
          type: string
          valid_until: string | null
        }
        Insert: {
          ad_candidate_id?: string | null
          created_at?: string
          creator_id: string
          done_at?: string | null
          file_path?: string | null
          id?: string
          instructions?: string
          response?: string | null
          status?: string
          title: string
          type: string
          valid_until?: string | null
        }
        Update: {
          ad_candidate_id?: string | null
          created_at?: string
          creator_id?: string
          done_at?: string | null
          file_path?: string | null
          id?: string
          instructions?: string
          response?: string | null
          status?: string
          title?: string
          type?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_tasks_ad_candidate_id_fkey"
            columns: ["ad_candidate_id"]
            isOneToOne: false
            referencedRelation: "ad_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_tasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_weekly_guides: {
        Row: {
          app_id: string
          body: string
          created_at: string
          id: string
          published: boolean
          title: string
          track: string | null
          week_start: string
        }
        Insert: {
          app_id?: string
          body?: string
          created_at?: string
          id?: string
          published?: boolean
          title: string
          track?: string | null
          week_start: string
        }
        Update: {
          app_id?: string
          body?: string
          created_at?: string
          id?: string
          published?: boolean
          title?: string
          track?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_weekly_guides_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          access_code: string | null
          access_redeem_url: string | null
          accounts_confirmed_at: string | null
          admin_notes: string | null
          application_id: string | null
          assigned_hm_id: string | null
          cap_override: number | null
          country: string | null
          created_at: string
          email: string
          examples_read_at: string | null
          fixed_monthly_override: number | null
          full_name: string
          guide_read_at: string | null
          id: string
          instagram_handle: string | null
          invite_sent_at: string | null
          invite_token: string | null
          last_seen_at: string | null
          motivation_confirmed_at: string | null
          onboarding_completed_at: string | null
          phone: string | null
          photo_path: string | null
          platform: string | null
          posts_per_month: number | null
          profile_picture_confirmed: boolean
          required_platforms: string
          resign_required_at: string | null
          rpm_override: number | null
          rules_accepted_at: string | null
          rules_version: number | null
          setup_guide_checks: Json
          slack_joined_at: string | null
          social_account_created_at: string | null
          social_bio: string | null
          social_handle: string | null
          status: string
          sync_checked_at: string | null
          sync_error: string | null
          sync_status: string | null
          tier: string
          tier_locked: boolean
          tier_since: string
          tiktok_handle: string | null
          track: string
          ugc_status: string
          user_id: string | null
          warmup: Json
          weekly_target: number
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          access_code?: string | null
          access_redeem_url?: string | null
          accounts_confirmed_at?: string | null
          admin_notes?: string | null
          application_id?: string | null
          assigned_hm_id?: string | null
          cap_override?: number | null
          country?: string | null
          created_at?: string
          email: string
          examples_read_at?: string | null
          fixed_monthly_override?: number | null
          full_name: string
          guide_read_at?: string | null
          id?: string
          instagram_handle?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          last_seen_at?: string | null
          motivation_confirmed_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          photo_path?: string | null
          platform?: string | null
          posts_per_month?: number | null
          profile_picture_confirmed?: boolean
          required_platforms?: string
          resign_required_at?: string | null
          rpm_override?: number | null
          rules_accepted_at?: string | null
          rules_version?: number | null
          setup_guide_checks?: Json
          slack_joined_at?: string | null
          social_account_created_at?: string | null
          social_bio?: string | null
          social_handle?: string | null
          status?: string
          sync_checked_at?: string | null
          sync_error?: string | null
          sync_status?: string | null
          tier?: string
          tier_locked?: boolean
          tier_since?: string
          tiktok_handle?: string | null
          track?: string
          ugc_status?: string
          user_id?: string | null
          warmup?: Json
          weekly_target?: number
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          access_code?: string | null
          access_redeem_url?: string | null
          accounts_confirmed_at?: string | null
          admin_notes?: string | null
          application_id?: string | null
          assigned_hm_id?: string | null
          cap_override?: number | null
          country?: string | null
          created_at?: string
          email?: string
          examples_read_at?: string | null
          fixed_monthly_override?: number | null
          full_name?: string
          guide_read_at?: string | null
          id?: string
          instagram_handle?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          last_seen_at?: string | null
          motivation_confirmed_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          photo_path?: string | null
          platform?: string | null
          posts_per_month?: number | null
          profile_picture_confirmed?: boolean
          required_platforms?: string
          resign_required_at?: string | null
          rpm_override?: number | null
          rules_accepted_at?: string | null
          rules_version?: number | null
          setup_guide_checks?: Json
          slack_joined_at?: string | null
          social_account_created_at?: string | null
          social_bio?: string | null
          social_handle?: string | null
          status?: string
          sync_checked_at?: string | null
          sync_error?: string | null
          sync_status?: string | null
          tier?: string
          tier_locked?: boolean
          tier_since?: string
          tiktok_handle?: string | null
          track?: string
          ugc_status?: string
          user_id?: string | null
          warmup?: Json
          weekly_target?: number
          whatsapp_opt_in?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_assigned_hm_id_fkey"
            columns: ["assigned_hm_id"]
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
      education_records: {
        Row: {
          created_at: string
          degree: string | null
          field: string | null
          id: string
          institution: string | null
          order_index: number
          profile_id: string
          year: string | null
        }
        Insert: {
          created_at?: string
          degree?: string | null
          field?: string | null
          id?: string
          institution?: string | null
          order_index?: number
          profile_id: string
          year?: string | null
        }
        Update: {
          created_at?: string
          degree?: string | null
          field?: string | null
          id?: string
          institution?: string | null
          order_index?: number
          profile_id?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_posts: {
        Row: {
          brief_id: string | null
          caption: string | null
          comments: number | null
          comments_7d: number | null
          cover_url: string | null
          creator_id: string
          duration: number | null
          exclude_reason: string | null
          excluded: boolean
          external_id: string
          first_seen_at: string
          id: string
          last_synced_at: string
          likes: number | null
          likes_7d: number | null
          logged_post_id: string | null
          manual_accepted_at: string | null
          manual_screenshot_path: string | null
          manual_submitted_at: string | null
          manual_views_7d: number | null
          platform: string
          posted_at: string | null
          shares: number | null
          shares_7d: number | null
          url: string | null
          views: number | null
          views_30d: number | null
          views_30d_at: string | null
          views_7d: number | null
          views_7d_at: string | null
          views_7d_source: string | null
        }
        Insert: {
          brief_id?: string | null
          caption?: string | null
          comments?: number | null
          comments_7d?: number | null
          cover_url?: string | null
          creator_id: string
          duration?: number | null
          exclude_reason?: string | null
          excluded?: boolean
          external_id: string
          first_seen_at?: string
          id?: string
          last_synced_at?: string
          likes?: number | null
          likes_7d?: number | null
          logged_post_id?: string | null
          manual_accepted_at?: string | null
          manual_screenshot_path?: string | null
          manual_submitted_at?: string | null
          manual_views_7d?: number | null
          platform: string
          posted_at?: string | null
          shares?: number | null
          shares_7d?: number | null
          url?: string | null
          views?: number | null
          views_30d?: number | null
          views_30d_at?: string | null
          views_7d?: number | null
          views_7d_at?: string | null
          views_7d_source?: string | null
        }
        Update: {
          brief_id?: string | null
          caption?: string | null
          comments?: number | null
          comments_7d?: number | null
          cover_url?: string | null
          creator_id?: string
          duration?: number | null
          exclude_reason?: string | null
          excluded?: boolean
          external_id?: string
          first_seen_at?: string
          id?: string
          last_synced_at?: string
          likes?: number | null
          likes_7d?: number | null
          logged_post_id?: string | null
          manual_accepted_at?: string | null
          manual_screenshot_path?: string | null
          manual_submitted_at?: string | null
          manual_views_7d?: number | null
          platform?: string
          posted_at?: string | null
          shares?: number | null
          shares_7d?: number | null
          url?: string | null
          views?: number | null
          views_30d?: number | null
          views_30d_at?: string | null
          views_7d?: number | null
          views_7d_at?: string | null
          views_7d_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_posts_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_posts_logged_post_id_fkey"
            columns: ["logged_post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_applications: {
        Row: {
          accepts_recurring: string
          admin_notes: string | null
          age: number
          agency_contact: string | null
          agency_name: string | null
          app_id: string
          assigned_hm_id: string | null
          city: string
          consent_at: string
          country: string
          created_at: string
          created_influencer_id: string | null
          decided_at: string | null
          decided_by: string | null
          email: string
          full_name: string
          has_agency: boolean
          id: string
          instagram_followers: number | null
          instagram_url: string | null
          languages: string[]
          media_kit_path: string | null
          media_kit_url: string | null
          niche_tags: string[]
          phone: string
          proud_links: string[]
          rate_reel: number | null
          rate_tiktok: number
          referral_source: string | null
          rejection_reason: string | null
          status: string
          submit_ip_hash: string | null
          tiktok_avg_views: number | null
          tiktok_followers: number | null
          tiktok_url: string | null
          youtube_subscribers: number | null
          youtube_url: string | null
        }
        Insert: {
          accepts_recurring?: string
          admin_notes?: string | null
          age: number
          agency_contact?: string | null
          agency_name?: string | null
          app_id?: string
          assigned_hm_id?: string | null
          city: string
          consent_at?: string
          country: string
          created_at?: string
          created_influencer_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          email: string
          full_name: string
          has_agency?: boolean
          id?: string
          instagram_followers?: number | null
          instagram_url?: string | null
          languages?: string[]
          media_kit_path?: string | null
          media_kit_url?: string | null
          niche_tags?: string[]
          phone: string
          proud_links?: string[]
          rate_reel?: number | null
          rate_tiktok: number
          referral_source?: string | null
          rejection_reason?: string | null
          status?: string
          submit_ip_hash?: string | null
          tiktok_avg_views?: number | null
          tiktok_followers?: number | null
          tiktok_url?: string | null
          youtube_subscribers?: number | null
          youtube_url?: string | null
        }
        Update: {
          accepts_recurring?: string
          admin_notes?: string | null
          age?: number
          agency_contact?: string | null
          agency_name?: string | null
          app_id?: string
          assigned_hm_id?: string | null
          city?: string
          consent_at?: string
          country?: string
          created_at?: string
          created_influencer_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          email?: string
          full_name?: string
          has_agency?: boolean
          id?: string
          instagram_followers?: number | null
          instagram_url?: string | null
          languages?: string[]
          media_kit_path?: string | null
          media_kit_url?: string | null
          niche_tags?: string[]
          phone?: string
          proud_links?: string[]
          rate_reel?: number | null
          rate_tiktok?: number
          referral_source?: string | null
          rejection_reason?: string | null
          status?: string
          submit_ip_hash?: string | null
          tiktok_avg_views?: number | null
          tiktok_followers?: number | null
          tiktok_url?: string | null
          youtube_subscribers?: number | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_applications_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_applications_assigned_hm_id_fkey"
            columns: ["assigned_hm_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_applications_created_fk"
            columns: ["created_influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_apps: {
        Row: {
          app_id: string
          enrolled_at: string
          influencer_id: string
          status: string
        }
        Insert: {
          app_id: string
          enrolled_at?: string
          influencer_id: string
          status?: string
        }
        Update: {
          app_id?: string
          enrolled_at?: string
          influencer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_apps_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_apps_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_attribution: {
        Row: {
          code_redemptions: number | null
          deal_id: string | null
          entered_at: string
          entered_by: string | null
          id: string
          influencer_id: string
          installs: number | null
          link_clicks: number | null
          period_end: string
          period_start: string
          subscriptions: number | null
        }
        Insert: {
          code_redemptions?: number | null
          deal_id?: string | null
          entered_at?: string
          entered_by?: string | null
          id?: string
          influencer_id: string
          installs?: number | null
          link_clicks?: number | null
          period_end: string
          period_start: string
          subscriptions?: number | null
        }
        Update: {
          code_redemptions?: number | null
          deal_id?: string | null
          entered_at?: string
          entered_by?: string | null
          id?: string
          influencer_id?: string
          installs?: number | null
          link_clicks?: number | null
          period_end?: string
          period_start?: string
          subscriptions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_attribution_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "influencer_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_attribution_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_attribution_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_brief_interest: {
        Row: {
          brief_id: string
          created_at: string
          id: string
          influencer_id: string
        }
        Insert: {
          brief_id: string
          created_at?: string
          id?: string
          influencer_id: string
        }
        Update: {
          brief_id?: string
          created_at?: string
          id?: string
          influencer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_brief_interest_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "influencer_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_brief_interest_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_briefs: {
        Row: {
          angle: string | null
          app_id: string
          body: string
          brief_type: string
          budget_max: number | null
          budget_min: number | null
          created_at: string
          created_by: string | null
          deliverables: Json
          draft_approval_required: boolean
          earliest_post_date: string | null
          exclusivity_days: number
          id: string
          latest_post_date: string | null
          must_mention: string[]
          reference_video_ids: string[]
          rights_package: string
          status: string
          target_languages: string[]
          target_niches: string[]
          target_tiers: string[]
          title: string
        }
        Insert: {
          angle?: string | null
          app_id?: string
          body?: string
          brief_type?: string
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by?: string | null
          deliverables?: Json
          draft_approval_required?: boolean
          earliest_post_date?: string | null
          exclusivity_days?: number
          id?: string
          latest_post_date?: string | null
          must_mention?: string[]
          reference_video_ids?: string[]
          rights_package?: string
          status?: string
          target_languages?: string[]
          target_niches?: string[]
          target_tiers?: string[]
          title: string
        }
        Update: {
          angle?: string | null
          app_id?: string
          body?: string
          brief_type?: string
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by?: string | null
          deliverables?: Json
          draft_approval_required?: boolean
          earliest_post_date?: string | null
          exclusivity_days?: number
          id?: string
          latest_post_date?: string | null
          must_mention?: string[]
          reference_video_ids?: string[]
          rights_package?: string
          status?: string
          target_languages?: string[]
          target_niches?: string[]
          target_tiers?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_briefs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_briefs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_deals: {
        Row: {
          agreed_price: number
          app_id: string
          brief_id: string
          cancelled_reason: string | null
          completed_at: string | null
          created_at: string
          deadline: string | null
          deal_sheet_signed_at: string | null
          deal_sheet_signed_name: string | null
          deal_sheet_snapshot: Json | null
          deliverables: Json
          extended_count: number
          id: string
          influencer_id: string
          offer_id: string
          rights_package: string
          spark_ads_code: string | null
          split_payment: boolean
          status: string
        }
        Insert: {
          agreed_price: number
          app_id?: string
          brief_id: string
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          deal_sheet_signed_at?: string | null
          deal_sheet_signed_name?: string | null
          deal_sheet_snapshot?: Json | null
          deliverables?: Json
          extended_count?: number
          id?: string
          influencer_id: string
          offer_id: string
          rights_package: string
          spark_ads_code?: string | null
          split_payment?: boolean
          status?: string
        }
        Update: {
          agreed_price?: number
          app_id?: string
          brief_id?: string
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          deal_sheet_signed_at?: string | null
          deal_sheet_signed_name?: string | null
          deal_sheet_snapshot?: Json | null
          deliverables?: Json
          extended_count?: number
          id?: string
          influencer_id?: string
          offer_id?: string
          rights_package?: string
          spark_ads_code?: string | null
          split_payment?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_deals_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_deals_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "influencer_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_deals_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_deals_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "influencer_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_deliverable_metrics: {
        Row: {
          checkpoint: string
          comments: number | null
          deliverable_id: string
          id: string
          likes: number | null
          reported_at: string
          reported_by: string
          saves: number | null
          screenshot_path: string | null
          shares: number | null
          views: number | null
        }
        Insert: {
          checkpoint: string
          comments?: number | null
          deliverable_id: string
          id?: string
          likes?: number | null
          reported_at?: string
          reported_by: string
          saves?: number | null
          screenshot_path?: string | null
          shares?: number | null
          views?: number | null
        }
        Update: {
          checkpoint?: string
          comments?: number | null
          deliverable_id?: string
          id?: string
          likes?: number | null
          reported_at?: string
          reported_by?: string
          saves?: number | null
          screenshot_path?: string | null
          shares?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_deliverable_metrics_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "influencer_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_deliverables: {
        Row: {
          deal_id: string
          draft_approved_at: string | null
          draft_feedback: string | null
          draft_file_path: string | null
          draft_submitted_at: string | null
          draft_url: string | null
          format: string
          id: string
          platform: string
          post_url: string | null
          posted_at: string | null
          status: string
          verified_at: string | null
        }
        Insert: {
          deal_id: string
          draft_approved_at?: string | null
          draft_feedback?: string | null
          draft_file_path?: string | null
          draft_submitted_at?: string | null
          draft_url?: string | null
          format: string
          id?: string
          platform: string
          post_url?: string | null
          posted_at?: string | null
          status?: string
          verified_at?: string | null
        }
        Update: {
          deal_id?: string
          draft_approved_at?: string | null
          draft_feedback?: string | null
          draft_file_path?: string | null
          draft_submitted_at?: string | null
          draft_url?: string | null
          format?: string
          id?: string
          platform?: string
          post_url?: string | null
          posted_at?: string | null
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_deliverables_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "influencer_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_invoices: {
        Row: {
          amount: number
          created_at: string
          deal_id: string | null
          file_path: string
          id: string
          influencer_id: string
          paid_on: string | null
          paid_reference: string | null
          payee: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          deal_id?: string | null
          file_path: string
          id?: string
          influencer_id: string
          paid_on?: string | null
          paid_reference?: string | null
          payee?: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          deal_id?: string | null
          file_path?: string
          id?: string
          influencer_id?: string
          paid_on?: string | null
          paid_reference?: string | null
          payee?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "influencer_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_invoices_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_messages: {
        Row: {
          body: string
          created_at: string
          from_admin: boolean
          id: string
          influencer_id: string
          read_at: string | null
        }
        Insert: {
          body: string
          created_at?: string
          from_admin?: boolean
          id?: string
          influencer_id: string
          read_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          from_admin?: boolean
          id?: string
          influencer_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_messages_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_offers: {
        Row: {
          app_id: string
          brief_id: string
          counter_message: string | null
          counter_price: number | null
          counter_round: number
          created_at: string
          created_by: string | null
          currency: string
          deadline: string | null
          decline_reason: string | null
          deliverables: Json
          expires_at: string | null
          id: string
          influencer_id: string
          message: string | null
          price: number
          price_breakdown: Json
          responded_at: string | null
          rights_package: string
          split_payment: boolean
          status: string
          viewed_at: string | null
        }
        Insert: {
          app_id?: string
          brief_id: string
          counter_message?: string | null
          counter_price?: number | null
          counter_round?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          decline_reason?: string | null
          deliverables?: Json
          expires_at?: string | null
          id?: string
          influencer_id: string
          message?: string | null
          price: number
          price_breakdown?: Json
          responded_at?: string | null
          rights_package: string
          split_payment?: boolean
          status?: string
          viewed_at?: string | null
        }
        Update: {
          app_id?: string
          brief_id?: string
          counter_message?: string | null
          counter_price?: number | null
          counter_round?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          decline_reason?: string | null
          deliverables?: Json
          expires_at?: string | null
          id?: string
          influencer_id?: string
          message?: string | null
          price?: number
          price_breakdown?: Json
          responded_at?: string | null
          rights_package?: string
          split_payment?: boolean
          status?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_offers_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_offers_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "influencer_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_offers_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_payout_items: {
        Row: {
          amount: number
          app_id: string
          created_at: string
          currency: string
          deal_id: string
          id: string
          influencer_id: string
          invoice_id: string | null
          method: string
          paid_on: string | null
          paid_reference: string | null
          part: string
          payee: string
          status: string
        }
        Insert: {
          amount: number
          app_id?: string
          created_at?: string
          currency?: string
          deal_id: string
          id?: string
          influencer_id: string
          invoice_id?: string | null
          method?: string
          paid_on?: string | null
          paid_reference?: string | null
          part?: string
          payee?: string
          status?: string
        }
        Update: {
          amount?: number
          app_id?: string
          created_at?: string
          currency?: string
          deal_id?: string
          id?: string
          influencer_id?: string
          invoice_id?: string | null
          method?: string
          paid_on?: string | null
          paid_reference?: string | null
          part?: string
          payee?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_payout_items_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_payout_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "influencer_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_payout_items_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_payout_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "influencer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_settings: {
        Row: {
          disclosure: Json
          id: number
          niches: string[]
          offer_expiry_days: number
          rights_fee_pct: Json
          split_threshold: number
          tier_bounds: Json
          updated_at: string
        }
        Insert: {
          disclosure?: Json
          id?: number
          niches?: string[]
          offer_expiry_days?: number
          rights_fee_pct?: Json
          split_threshold?: number
          tier_bounds?: Json
          updated_at?: string
        }
        Update: {
          disclosure?: Json
          id?: number
          niches?: string[]
          offer_expiry_days?: number
          rights_fee_pct?: Json
          split_threshold?: number
          tier_bounds?: Json
          updated_at?: string
        }
        Relationships: []
      }
      influencer_signatures: {
        Row: {
          deal_id: string | null
          document_version: string
          id: string
          influencer_id: string
          kind: string
          signature_ip: string | null
          signed_at: string
          signed_name: string
          snapshot: Json | null
          user_agent: string | null
        }
        Insert: {
          deal_id?: string | null
          document_version: string
          id?: string
          influencer_id: string
          kind: string
          signature_ip?: string | null
          signed_at?: string
          signed_name: string
          snapshot?: Json | null
          user_agent?: string | null
        }
        Update: {
          deal_id?: string | null
          document_version?: string
          id?: string
          influencer_id?: string
          kind?: string
          signature_ip?: string | null
          signed_at?: string
          signed_name?: string
          snapshot?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_signatures_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "influencer_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_signatures_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencers: {
        Row: {
          accepts_recurring: string | null
          admin_notes: string | null
          agency_contact: string | null
          agency_name: string | null
          agreement_signed_at: string | null
          application_id: string | null
          assigned_hm_id: string | null
          availability: string
          booked_until: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          instagram_followers: number | null
          instagram_url: string | null
          invite_sent_at: string | null
          invite_token: string | null
          languages: string[]
          legal_name: string | null
          media_kit_path: string | null
          media_kit_url: string | null
          niche_tags: string[]
          payee: string
          payout_details: Json
          payout_method: string | null
          payout_setup_at: string | null
          phone: string | null
          photo_path: string | null
          promo_code: string | null
          rate_reel: number | null
          rate_tiktok: number | null
          rate_youtube: number | null
          rules_accepted_at: string | null
          status: string
          stripe_account_id: string | null
          stripe_onboarded: boolean
          tier: string
          tier_override: boolean
          tiktok_avg_views: number | null
          tiktok_followers: number | null
          tiktok_url: string | null
          tracked_link: string | null
          user_id: string | null
          youtube_subscribers: number | null
          youtube_url: string | null
        }
        Insert: {
          accepts_recurring?: string | null
          admin_notes?: string | null
          agency_contact?: string | null
          agency_name?: string | null
          agreement_signed_at?: string | null
          application_id?: string | null
          assigned_hm_id?: string | null
          availability?: string
          booked_until?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name: string
          email: string
          id?: string
          instagram_followers?: number | null
          instagram_url?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          languages?: string[]
          legal_name?: string | null
          media_kit_path?: string | null
          media_kit_url?: string | null
          niche_tags?: string[]
          payee?: string
          payout_details?: Json
          payout_method?: string | null
          payout_setup_at?: string | null
          phone?: string | null
          photo_path?: string | null
          promo_code?: string | null
          rate_reel?: number | null
          rate_tiktok?: number | null
          rate_youtube?: number | null
          rules_accepted_at?: string | null
          status?: string
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          tier?: string
          tier_override?: boolean
          tiktok_avg_views?: number | null
          tiktok_followers?: number | null
          tiktok_url?: string | null
          tracked_link?: string | null
          user_id?: string | null
          youtube_subscribers?: number | null
          youtube_url?: string | null
        }
        Update: {
          accepts_recurring?: string | null
          admin_notes?: string | null
          agency_contact?: string | null
          agency_name?: string | null
          agreement_signed_at?: string | null
          application_id?: string | null
          assigned_hm_id?: string | null
          availability?: string
          booked_until?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          instagram_followers?: number | null
          instagram_url?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          languages?: string[]
          legal_name?: string | null
          media_kit_path?: string | null
          media_kit_url?: string | null
          niche_tags?: string[]
          payee?: string
          payout_details?: Json
          payout_method?: string | null
          payout_setup_at?: string | null
          phone?: string | null
          photo_path?: string | null
          promo_code?: string | null
          rate_reel?: number | null
          rate_tiktok?: number | null
          rate_youtube?: number | null
          rules_accepted_at?: string | null
          status?: string
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          tier?: string
          tier_override?: boolean
          tiktok_avg_views?: number | null
          tiktok_followers?: number | null
          tiktok_url?: string | null
          tracked_link?: string | null
          user_id?: string | null
          youtube_subscribers?: number | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "influencer_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencers_assigned_hm_id_fkey"
            columns: ["assigned_hm_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          answers: Json
          application_id: string | null
          contract_signed_at: string | null
          created_at: string
          creator_id: string | null
          decided_at: string | null
          decided_by: string | null
          decline_reason: string | null
          id: string
          job_id: string
          shortlisted: boolean
          status: string
        }
        Insert: {
          answers?: Json
          application_id?: string | null
          contract_signed_at?: string | null
          created_at?: string
          creator_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          id?: string
          job_id: string
          shortlisted?: boolean
          status?: string
        }
        Update: {
          answers?: Json
          application_id?: string | null
          contract_signed_at?: string | null
          created_at?: string
          creator_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          id?: string
          job_id?: string
          shortlisted?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          creator_id: string | null
          email: string | null
          id: string
          job_id: string
          opened_at: string | null
          prospect_id: string | null
          sent_at: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          creator_id?: string | null
          email?: string | null
          id?: string
          job_id: string
          opened_at?: string | null
          prospect_id?: string | null
          sent_at?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          creator_id?: string | null
          email?: string | null
          id?: string
          job_id?: string
          opened_at?: string | null
          prospect_id?: string | null
          sent_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_invites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          access: string
          account_type: string
          age_max: number | null
          age_min: number | null
          app_id: string
          application_items: Json
          base_amount: number
          base_mode: string
          bonus_goals: Json
          campaign_id: string | null
          content_type: string | null
          countries: string[]
          cover_image_path: string | null
          cpm_rate: number
          created_at: string
          details_md: string
          id: string
          open: boolean
          payment_type: string
          platforms: string[]
          position: string
          posting_frequency_n: number | null
          posting_frequency_unit: string | null
          product_type: string | null
          retainer_frequency: string | null
          slots: number | null
          slug: string
          status: string
          title: string
          updated_at: string
          verified_country: boolean
          video_length_s: number | null
          weekly_hours: string | null
        }
        Insert: {
          access?: string
          account_type?: string
          age_max?: number | null
          age_min?: number | null
          app_id: string
          application_items?: Json
          base_amount?: number
          base_mode?: string
          bonus_goals?: Json
          campaign_id?: string | null
          content_type?: string | null
          countries?: string[]
          cover_image_path?: string | null
          cpm_rate?: number
          created_at?: string
          details_md?: string
          id?: string
          open?: boolean
          payment_type?: string
          platforms?: string[]
          position?: string
          posting_frequency_n?: number | null
          posting_frequency_unit?: string | null
          product_type?: string | null
          retainer_frequency?: string | null
          slots?: number | null
          slug?: string
          status?: string
          title: string
          updated_at?: string
          verified_country?: boolean
          video_length_s?: number | null
          weekly_hours?: string | null
        }
        Update: {
          access?: string
          account_type?: string
          age_max?: number | null
          age_min?: number | null
          app_id?: string
          application_items?: Json
          base_amount?: number
          base_mode?: string
          bonus_goals?: Json
          campaign_id?: string | null
          content_type?: string | null
          countries?: string[]
          cover_image_path?: string | null
          cpm_rate?: number
          created_at?: string
          details_md?: string
          id?: string
          open?: boolean
          payment_type?: string
          platforms?: string[]
          position?: string
          posting_frequency_n?: number | null
          posting_frequency_unit?: string | null
          product_type?: string | null
          retainer_frequency?: string | null
          slots?: number | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          verified_country?: boolean
          video_length_s?: number | null
          weekly_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          course_id: string | null
          created_at: string
          id: string
          profile_id: string
          read_at: string | null
          type: string
        }
        Insert: {
          body: string
          course_id?: string | null
          created_at?: string
          id?: string
          profile_id: string
          read_at?: string | null
          type: string
        }
        Update: {
          body?: string
          course_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          read_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_zones: {
        Row: {
          ceiling_amount: number | null
          currency: string
          monthly_amount: number
          posts_per_day: number
          trial_amount: number
          updated_at: string
          zone: string
        }
        Insert: {
          ceiling_amount?: number | null
          currency?: string
          monthly_amount: number
          posts_per_day?: number
          trial_amount: number
          updated_at?: string
          zone: string
        }
        Update: {
          ceiling_amount?: number | null
          currency?: string
          monthly_amount?: number
          posts_per_day?: number
          trial_amount?: number
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      payout_adjustments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          creator_id: string
          id: string
          period: string
          reason: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          creator_id: string
          id?: string
          period: string
          reason: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          creator_id?: string
          id?: string
          period?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_adjustments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batches: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          paid_at: string | null
          period: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          paid_at?: string | null
          period: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          paid_at?: string | null
          period?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_items: {
        Row: {
          adjustments_part: number | null
          amount: number | null
          amount_usd: number
          app_id: string
          batch_id: string
          bonus_part: number | null
          breakdown: Json | null
          created_at: string
          creator_id: string
          currency: string
          fixed_part: number | null
          hold_reason: string | null
          id: string
          note: string | null
          period: string | null
          posts_count: number
          rate_usd: number
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          adjustments_part?: number | null
          amount?: number | null
          amount_usd?: number
          app_id?: string
          batch_id: string
          bonus_part?: number | null
          breakdown?: Json | null
          created_at?: string
          creator_id: string
          currency?: string
          fixed_part?: number | null
          hold_reason?: string | null
          id?: string
          note?: string | null
          period?: string | null
          posts_count?: number
          rate_usd?: number
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          adjustments_part?: number | null
          amount?: number | null
          amount_usd?: number
          app_id?: string
          batch_id?: string
          bonus_part?: number | null
          breakdown?: Json | null
          created_at?: string
          creator_id?: string
          currency?: string
          fixed_part?: number | null
          hold_reason?: string | null
          id?: string
          note?: string | null
          period?: string | null
          posts_count?: number
          rate_usd?: number
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics_daily: {
        Row: {
          app_id: string | null
          comments: number
          created_at: string
          day: string
          id: string
          likes: number
          post_id: string
          shares: number
          views: number
        }
        Insert: {
          app_id?: string | null
          comments?: number
          created_at?: string
          day?: string
          id?: string
          likes?: number
          post_id: string
          shares?: number
          views?: number
        }
        Update: {
          app_id?: string | null
          comments?: number
          created_at?: string
          day?: string
          id?: string
          likes?: number
          post_id?: string
          shares?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_daily_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_code: string | null
          access_redeem_url: string | null
          activated_at: string | null
          admin_note: string | null
          bio: string | null
          country: string | null
          created_at: string
          declaration_accepted_at: string | null
          declaration_ip: string | null
          declaration_snapshot: Json | null
          declaration_user_agent: string | null
          display_name: string | null
          display_title: string | null
          email: string | null
          examples_reviewed_at: string | null
          fee: string | null
          full_name: string
          guide_read_at: string | null
          id: string
          institution: string | null
          invite_expires_at: string | null
          invite_token: string | null
          invited_at: string | null
          is_test: boolean
          orcid: string | null
          personal_site: string | null
          photo_url: string | null
          platform: Database["public"]["Enums"]["device_platform"] | null
          public_slug: string | null
          role: Database["public"]["Enums"]["portal_role"]
          scholar_url: string | null
          short_bio: string | null
          title: string | null
          updated_at: string
          upwork_status: string
          used_invite_token: string | null
          user_id: string | null
        }
        Insert: {
          access_code?: string | null
          access_redeem_url?: string | null
          activated_at?: string | null
          admin_note?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          declaration_accepted_at?: string | null
          declaration_ip?: string | null
          declaration_snapshot?: Json | null
          declaration_user_agent?: string | null
          display_name?: string | null
          display_title?: string | null
          email?: string | null
          examples_reviewed_at?: string | null
          fee?: string | null
          full_name: string
          guide_read_at?: string | null
          id?: string
          institution?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          is_test?: boolean
          orcid?: string | null
          personal_site?: string | null
          photo_url?: string | null
          platform?: Database["public"]["Enums"]["device_platform"] | null
          public_slug?: string | null
          role?: Database["public"]["Enums"]["portal_role"]
          scholar_url?: string | null
          short_bio?: string | null
          title?: string | null
          updated_at?: string
          upwork_status?: string
          used_invite_token?: string | null
          user_id?: string | null
        }
        Update: {
          access_code?: string | null
          access_redeem_url?: string | null
          activated_at?: string | null
          admin_note?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          declaration_accepted_at?: string | null
          declaration_ip?: string | null
          declaration_snapshot?: Json | null
          declaration_user_agent?: string | null
          display_name?: string | null
          display_title?: string | null
          email?: string | null
          examples_reviewed_at?: string | null
          fee?: string | null
          full_name?: string
          guide_read_at?: string | null
          id?: string
          institution?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          is_test?: boolean
          orcid?: string | null
          personal_site?: string | null
          photo_url?: string | null
          platform?: Database["public"]["Enums"]["device_platform"] | null
          public_slug?: string | null
          role?: Database["public"]["Enums"]["portal_role"]
          scholar_url?: string | null
          short_bio?: string | null
          title?: string | null
          updated_at?: string
          upwork_status?: string
          used_invite_token?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      prospect_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      prospect_touches: {
        Row: {
          channel: string
          created_at: string
          id: string
          message: string | null
          prospect_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          message?: string | null
          prospect_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message?: string | null
          prospect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_touches_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "creator_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_videos: {
        Row: {
          active: boolean
          app_id: string
          category: string
          created_at: string
          format_notes: string | null
          id: string
          note: string | null
          pinned: boolean
          platform: string
          thumbnail_url: string | null
          title: string | null
          url: string
          why_it_works: string | null
        }
        Insert: {
          active?: boolean
          app_id?: string
          category?: string
          created_at?: string
          format_notes?: string | null
          id?: string
          note?: string | null
          pinned?: boolean
          platform?: string
          thumbnail_url?: string | null
          title?: string | null
          url: string
          why_it_works?: string | null
        }
        Update: {
          active?: boolean
          app_id?: string
          category?: string
          created_at?: string
          format_notes?: string | null
          id?: string
          note?: string | null
          pinned?: boolean
          platform?: string
          thumbnail_url?: string | null
          title?: string | null
          url?: string
          why_it_works?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_videos_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
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
      slideshow_applications: {
        Row: {
          admin_notes: string | null
          agreement_signed_at: string | null
          app_id: string
          assigned_hm_id: string | null
          consent_at: string
          country: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          email: string
          full_name: string
          guide_figures_shown: Json | null
          guide_opened_at: string | null
          guide_token: string | null
          guide_zone_shown: string | null
          has_upwork: boolean
          id: string
          is_adult: boolean
          phone: string | null
          referral_source: string | null
          rejection_reason: string | null
          signing_token: string | null
          signing_token_created_at: string | null
          status: string
          submit_ip_hash: string | null
          upwork_profile_url: string | null
          zone: string | null
          zone_note: string | null
          zone_override: boolean
        }
        Insert: {
          admin_notes?: string | null
          agreement_signed_at?: string | null
          app_id?: string
          assigned_hm_id?: string | null
          consent_at?: string
          country: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email: string
          full_name: string
          guide_figures_shown?: Json | null
          guide_opened_at?: string | null
          guide_token?: string | null
          guide_zone_shown?: string | null
          has_upwork?: boolean
          id?: string
          is_adult: boolean
          phone?: string | null
          referral_source?: string | null
          rejection_reason?: string | null
          signing_token?: string | null
          signing_token_created_at?: string | null
          status?: string
          submit_ip_hash?: string | null
          upwork_profile_url?: string | null
          zone?: string | null
          zone_note?: string | null
          zone_override?: boolean
        }
        Update: {
          admin_notes?: string | null
          agreement_signed_at?: string | null
          app_id?: string
          assigned_hm_id?: string | null
          consent_at?: string
          country?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email?: string
          full_name?: string
          guide_figures_shown?: Json | null
          guide_opened_at?: string | null
          guide_token?: string | null
          guide_zone_shown?: string | null
          has_upwork?: boolean
          id?: string
          is_adult?: boolean
          phone?: string | null
          referral_source?: string | null
          rejection_reason?: string | null
          signing_token?: string | null
          signing_token_created_at?: string | null
          status?: string
          submit_ip_hash?: string | null
          upwork_profile_url?: string | null
          zone?: string | null
          zone_note?: string | null
          zone_override?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "slideshow_applications_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slideshow_applications_assigned_hm_id_fkey"
            columns: ["assigned_hm_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slideshow_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      slideshow_country_rates: {
        Row: {
          app_id: string
          country: string
          rate_usd: number
          updated_at: string
        }
        Insert: {
          app_id?: string
          country: string
          rate_usd: number
          updated_at?: string
        }
        Update: {
          app_id?: string
          country?: string
          rate_usd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slideshow_country_rates_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
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
      sync_runs: {
        Row: {
          cost_usd: number
          creator_id: string | null
          error: string | null
          finished_at: string | null
          id: string
          items: number
          job: string
          started_at: string
          status: string
        }
        Insert: {
          cost_usd?: number
          creator_id?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          items?: number
          job: string
          started_at?: string
          status?: string
        }
        Update: {
          cost_usd?: number
          creator_id?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          items?: number
          job?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      ugc_rate_cards: {
        Row: {
          app_id: string
          cap_per_video: number
          created_at: string
          currency: string
          effective_from: string
          fixed_monthly: number
          id: string
          prorate_fixed_by_quota: boolean
          rpm_eur_per_1000: number
        }
        Insert: {
          app_id?: string
          cap_per_video?: number
          created_at?: string
          currency?: string
          effective_from?: string
          fixed_monthly?: number
          id?: string
          prorate_fixed_by_quota?: boolean
          rpm_eur_per_1000?: number
        }
        Update: {
          app_id?: string
          cap_per_video?: number
          created_at?: string
          currency?: string
          effective_from?: string
          fixed_monthly?: number
          id?: string
          prorate_fixed_by_quota?: boolean
          rpm_eur_per_1000?: number
        }
        Relationships: []
      }
      ugc_settings: {
        Row: {
          ad_selection_bonus: number
          apify_instagram_actor: string
          apify_price_per_result_usd: number
          apify_tiktok_actor: string
          cpi_target: number
          cron_token: string
          default_posts_per_month: number
          hold_days: number
          id: number
          min_payout: number
          monthly_budget_cap: number | null
          payday_day: number
          posts_per_profile_call: number
          streak30_bonus: number
          streak7_bonus: number
          ten_post_bonus: number
          updated_at: string
        }
        Insert: {
          ad_selection_bonus?: number
          apify_instagram_actor?: string
          apify_price_per_result_usd?: number
          apify_tiktok_actor?: string
          cpi_target?: number
          cron_token?: string
          default_posts_per_month?: number
          hold_days?: number
          id?: number
          min_payout?: number
          monthly_budget_cap?: number | null
          payday_day?: number
          posts_per_profile_call?: number
          streak30_bonus?: number
          streak7_bonus?: number
          ten_post_bonus?: number
          updated_at?: string
        }
        Update: {
          ad_selection_bonus?: number
          apify_instagram_actor?: string
          apify_price_per_result_usd?: number
          apify_tiktok_actor?: string
          cpi_target?: number
          cron_token?: string
          default_posts_per_month?: number
          hold_days?: number
          id?: number
          min_payout?: number
          monthly_budget_cap?: number | null
          payday_day?: number
          posts_per_profile_call?: number
          streak30_bonus?: number
          streak7_bonus?: number
          ten_post_bonus?: number
          updated_at?: string
        }
        Relationships: []
      }
      ugc_tiers: {
        Row: {
          app_id: string
          cpm: number
          id: string
          label: string
          monthly_cap: number
          per_post: number
          rule: string
          tier: string
        }
        Insert: {
          app_id: string
          cpm?: number
          id?: string
          label: string
          monthly_cap?: number
          per_post?: number
          rule?: string
          tier: string
        }
        Update: {
          app_id?: string
          cpm?: number
          id?: string
          label?: string
          monthly_cap?: number
          per_post?: number
          rule?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "ugc_tiers_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      creator_enrolled: { Args: { _app: string }; Returns: boolean }
      influencer_can_see_brief: {
        Args: { _brief_id: string }
        Returns: boolean
      }
      lookup_country_zone: { Args: { _country: string }; Returns: string }
      my_influencer_id: { Args: never; Returns: string }
      notify_author: {
        Args: {
          _body: string
          _course_id: string
          _profile_id: string
          _type: string
        }
        Returns: undefined
      }
      slugify: { Args: { value: string }; Returns: string }
      unaccent_fallback: { Args: { value: string }; Returns: string }
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
        | "unassigned"
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
        "unassigned",
      ],
      device_platform: ["ios", "android"],
      portal_role: ["admin", "author"],
    },
  },
} as const
