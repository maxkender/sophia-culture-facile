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
    PostgrestVersion: "14.17"
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
      account_pool: {
        Row: {
          app_id: string | null
          assigned_creator_id: string | null
          created_at: string
          from_creator_id: string | null
          handle: string
          id: string
          note: string | null
          password_rotated_at: string | null
          platform: string
          status: string
        }
        Insert: {
          app_id?: string | null
          assigned_creator_id?: string | null
          created_at?: string
          from_creator_id?: string | null
          handle: string
          id?: string
          note?: string | null
          password_rotated_at?: string | null
          platform: string
          status?: string
        }
        Update: {
          app_id?: string | null
          assigned_creator_id?: string | null
          created_at?: string
          from_creator_id?: string | null
          handle?: string
          id?: string
          note?: string | null
          password_rotated_at?: string | null
          platform?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_pool_assigned_creator_id_fkey"
            columns: ["assigned_creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_pool_from_creator_id_fkey"
            columns: ["from_creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
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
      ad_tokens: {
        Row: {
          access_token: string
          advertiser_ids: string[]
          app_id: string
          channel: string
          scope: Json | null
          updated_at: string
        }
        Insert: {
          access_token: string
          advertiser_ids?: string[]
          app_id: string
          channel: string
          scope?: Json | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          advertiser_ids?: string[]
          app_id?: string
          channel?: string
          scope?: Json | null
          updated_at?: string
        }
        Relationships: []
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
          post_description: Json
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
          post_description?: Json
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
          post_description?: Json
          primary_color?: string | null
          short_description?: string | null
          slug?: string
          taap_url?: string | null
          tagline?: string | null
          users_line?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          app_id: string
          created_at: string
          created_by: string | null
          duration_s: number | null
          folder: string
          id: string
          kind: string
          mime: string | null
          role_default: string
          shot_note: string | null
          size_bytes: number | null
          status: string
          storage_path: string | null
          tags: string[]
          text_content: string | null
          thumbnail_url: string | null
          title: string
          url: string | null
        }
        Insert: {
          app_id: string
          created_at?: string
          created_by?: string | null
          duration_s?: number | null
          folder?: string
          id?: string
          kind: string
          mime?: string | null
          role_default?: string
          shot_note?: string | null
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          tags?: string[]
          text_content?: string | null
          thumbnail_url?: string | null
          title: string
          url?: string | null
        }
        Update: {
          app_id?: string
          created_at?: string
          created_by?: string | null
          duration_s?: number | null
          folder?: string
          id?: string
          kind?: string
          mime?: string | null
          role_default?: string
          shot_note?: string | null
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          tags?: string[]
          text_content?: string | null
          thumbnail_url?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
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
      brief_assets: {
        Row: {
          asset_id: string
          brief_id: string
          role: string
          sort_order: number
        }
        Insert: {
          asset_id: string
          brief_id: string
          role?: string
          sort_order?: number
        }
        Update: {
          asset_id?: string
          brief_id?: string
          role?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "brief_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_assets_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
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
      brief_snippets: {
        Row: {
          app_id: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          language: string
          source_url: string | null
          styles: Database["public"]["Enums"]["brief_style"][]
          tags: string[]
          text: string
          usage_count: number
          why: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          language?: string
          source_url?: string | null
          styles?: Database["public"]["Enums"]["brief_style"][]
          tags?: string[]
          text: string
          usage_count?: number
          why?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          language?: string
          source_url?: string | null
          styles?: Database["public"]["Enums"]["brief_style"][]
          tags?: string[]
          text?: string
          usage_count?: number
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brief_snippets_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
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
          audience_efforts: string[]
          beats: Json
          body: string
          brief_type: string
          campaign_id: string | null
          created_at: string
          created_by: string | null
          difficulty: number
          drop_at: string | null
          due_date: string | null
          duration_target: string | null
          effort: string | null
          format: string | null
          hook: string | null
          hook_text: string | null
          hook_visual: string | null
          hooks: string[]
          id: string
          inspiration_id: string | null
          language: string
          must_mention: string | null
          oral_hook: string | null
          parent_format_id: string | null
          pinned: boolean
          platform: string
          product_gesture: string | null
          product_moment: string | null
          product_second: number | null
          reference_video_ids: string[]
          rules_do: string[]
          rules_dont: string[]
          rules_text: string | null
          say_name: boolean
          score: number | null
          script: string | null
          sort_order: number | null
          source_course_id: string | null
          source_reference_id: string | null
          status: string
          style: Database["public"]["Enums"]["brief_style"] | null
          style_data: Json
          tags: string[]
          title: string
          translation_of: string | null
          updated_at: string
          variations: string | null
        }
        Insert: {
          angle?: string | null
          app?: string
          app_id?: string
          audience?: string
          audience_efforts?: string[]
          beats?: Json
          body?: string
          brief_type?: string
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: number
          drop_at?: string | null
          due_date?: string | null
          duration_target?: string | null
          effort?: string | null
          format?: string | null
          hook?: string | null
          hook_text?: string | null
          hook_visual?: string | null
          hooks?: string[]
          id?: string
          inspiration_id?: string | null
          language?: string
          must_mention?: string | null
          oral_hook?: string | null
          parent_format_id?: string | null
          pinned?: boolean
          platform?: string
          product_gesture?: string | null
          product_moment?: string | null
          product_second?: number | null
          reference_video_ids?: string[]
          rules_do?: string[]
          rules_dont?: string[]
          rules_text?: string | null
          say_name?: boolean
          score?: number | null
          script?: string | null
          sort_order?: number | null
          source_course_id?: string | null
          source_reference_id?: string | null
          status?: string
          style?: Database["public"]["Enums"]["brief_style"] | null
          style_data?: Json
          tags?: string[]
          title: string
          translation_of?: string | null
          updated_at?: string
          variations?: string | null
        }
        Update: {
          angle?: string | null
          app?: string
          app_id?: string
          audience?: string
          audience_efforts?: string[]
          beats?: Json
          body?: string
          brief_type?: string
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: number
          drop_at?: string | null
          due_date?: string | null
          duration_target?: string | null
          effort?: string | null
          format?: string | null
          hook?: string | null
          hook_text?: string | null
          hook_visual?: string | null
          hooks?: string[]
          id?: string
          inspiration_id?: string | null
          language?: string
          must_mention?: string | null
          oral_hook?: string | null
          parent_format_id?: string | null
          pinned?: boolean
          platform?: string
          product_gesture?: string | null
          product_moment?: string | null
          product_second?: number | null
          reference_video_ids?: string[]
          rules_do?: string[]
          rules_dont?: string[]
          rules_text?: string | null
          say_name?: boolean
          score?: number | null
          script?: string | null
          sort_order?: number | null
          source_course_id?: string | null
          source_reference_id?: string | null
          status?: string
          style?: Database["public"]["Enums"]["brief_style"] | null
          style_data?: Json
          tags?: string[]
          title?: string
          translation_of?: string | null
          updated_at?: string
          variations?: string | null
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
            foreignKeyName: "briefs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefs_inspiration_id_fkey"
            columns: ["inspiration_id"]
            isOneToOne: false
            referencedRelation: "inspirations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefs_parent_format_id_fkey"
            columns: ["parent_format_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefs_source_reference_id_fkey"
            columns: ["source_reference_id"]
            isOneToOne: false
            referencedRelation: "reference_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefs_translation_of_fkey"
            columns: ["translation_of"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assets: {
        Row: {
          asset_id: string
          campaign_id: string
          role: string
          sort_order: number
        }
        Insert: {
          asset_id: string
          campaign_id: string
          role?: string
          sort_order?: number
        }
        Update: {
          asset_id?: string
          campaign_id?: string
          role?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
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
      challenges: {
        Row: {
          app_id: string
          created_at: string
          description: string
          ends_at: string
          id: string
          reward_eur: number
          starts_at: string
          status: string
          title: string
          winner_creator_id: string | null
          winner_post_id: string | null
        }
        Insert: {
          app_id?: string
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          reward_eur?: number
          starts_at?: string
          status?: string
          title: string
          winner_creator_id?: string | null
          winner_post_id?: string | null
        }
        Update: {
          app_id?: string
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          reward_eur?: number
          starts_at?: string
          status?: string
          title?: string
          winner_creator_id?: string | null
          winner_post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_winner_creator_id_fkey"
            columns: ["winner_creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_winner_post_id_fkey"
            columns: ["winner_post_id"]
            isOneToOne: false
            referencedRelation: "creator_posts"
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
          ref_handle: string | null
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
          ref_handle?: string | null
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
          ref_handle?: string | null
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
      creator_assets: {
        Row: {
          asset_id: string
          creator_id: string
          role: string
        }
        Insert: {
          asset_id: string
          creator_id: string
          role?: string
        }
        Update: {
          asset_id?: string
          creator_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_assets_creator_id_fkey"
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
      creator_drafts: {
        Row: {
          admin_comment: string | null
          app_id: string | null
          brief_id: string
          created_at: string
          creator_id: string
          id: string
          link_url: string | null
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          version: number
          video_path: string | null
        }
        Insert: {
          admin_comment?: string | null
          app_id?: string | null
          brief_id: string
          created_at?: string
          creator_id: string
          id?: string
          link_url?: string | null
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          version?: number
          video_path?: string | null
        }
        Update: {
          admin_comment?: string | null
          app_id?: string | null
          brief_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          link_url?: string | null
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          version?: number
          video_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_drafts_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_drafts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_email_sequence: {
        Row: {
          created_at: string
          creator_id: string
          error: string | null
          id: string
          scheduled_at: string
          sent_at: string | null
          step: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          error?: string | null
          id?: string
          scheduled_at: string
          sent_at?: string | null
          step: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          error?: string | null
          id?: string
          scheduled_at?: string
          sent_at?: string | null
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_email_sequence_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
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
          auto_detected: boolean
          bonus_usd: number | null
          brief_id: string | null
          caption: string | null
          comments: number | null
          cover_url: string | null
          created_at: string
          creator_id: string
          draft_id: string | null
          effort: string | null
          external_id: string | null
          feedback: string | null
          format: string | null
          fraud_flags: string[]
          frozen_at: string | null
          guidelines_checked: string[]
          hold_reason: string | null
          id: string
          likes: number | null
          pay_amount: number | null
          pay_currency: string
          pay_flag: string | null
          pay_formula: string | null
          pay_status: string | null
          payout_item_id: string | null
          platform: string
          posted_on: string
          queued_period: string | null
          rate_id: string | null
          reference_video_id: string | null
          shares: number | null
          skip_reason: string | null
          status: string
          submitted_at: string | null
          url: string
          url_key: string | null
          validated_at: string | null
          validated_by: string | null
          views: number | null
          views_entered_at: string | null
          views_frozen: number | null
          views_screenshot_path: string | null
        }
        Insert: {
          amount_usd?: number | null
          app_id?: string
          auto_detected?: boolean
          bonus_usd?: number | null
          brief_id?: string | null
          caption?: string | null
          comments?: number | null
          cover_url?: string | null
          created_at?: string
          creator_id: string
          draft_id?: string | null
          effort?: string | null
          external_id?: string | null
          feedback?: string | null
          format?: string | null
          fraud_flags?: string[]
          frozen_at?: string | null
          guidelines_checked?: string[]
          hold_reason?: string | null
          id?: string
          likes?: number | null
          pay_amount?: number | null
          pay_currency?: string
          pay_flag?: string | null
          pay_formula?: string | null
          pay_status?: string | null
          payout_item_id?: string | null
          platform?: string
          posted_on?: string
          queued_period?: string | null
          rate_id?: string | null
          reference_video_id?: string | null
          shares?: number | null
          skip_reason?: string | null
          status?: string
          submitted_at?: string | null
          url: string
          url_key?: string | null
          validated_at?: string | null
          validated_by?: string | null
          views?: number | null
          views_entered_at?: string | null
          views_frozen?: number | null
          views_screenshot_path?: string | null
        }
        Update: {
          amount_usd?: number | null
          app_id?: string
          auto_detected?: boolean
          bonus_usd?: number | null
          brief_id?: string | null
          caption?: string | null
          comments?: number | null
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          draft_id?: string | null
          effort?: string | null
          external_id?: string | null
          feedback?: string | null
          format?: string | null
          fraud_flags?: string[]
          frozen_at?: string | null
          guidelines_checked?: string[]
          hold_reason?: string | null
          id?: string
          likes?: number | null
          pay_amount?: number | null
          pay_currency?: string
          pay_flag?: string | null
          pay_formula?: string | null
          pay_status?: string | null
          payout_item_id?: string | null
          platform?: string
          posted_on?: string
          queued_period?: string | null
          rate_id?: string | null
          reference_video_id?: string | null
          shares?: number | null
          skip_reason?: string | null
          status?: string
          submitted_at?: string | null
          url?: string
          url_key?: string | null
          validated_at?: string | null
          validated_by?: string | null
          views?: number | null
          views_entered_at?: string | null
          views_frozen?: number | null
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
            foreignKeyName: "creator_posts_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "creator_drafts"
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
          contract_lang: string | null
          contract_snapshot: string | null
          creator_id: string | null
          document_slug: string
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
          contract_lang?: string | null
          contract_snapshot?: string | null
          creator_id?: string | null
          document_slug?: string
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
          contract_lang?: string | null
          contract_snapshot?: string | null
          creator_id?: string | null
          document_slug?: string
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
            isOneToOne: false
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
          dormancy_reminders: Json
          dormant_at: string | null
          email: string
          email_pending: boolean
          examples_read_at: string | null
          fast_lane: boolean
          fast_lane_app_id: string | null
          fast_lane_entered_at: string | null
          fast_lane_expires_at: string | null
          fast_lane_job_id: string | null
          fast_lane_opened_at: string | null
          fast_lane_sent_at: string | null
          fast_lane_token: string | null
          fixed_monthly_override: number | null
          full_name: string
          guide_read_at: string | null
          guidelines_accepted_at: string | null
          id: string
          instagram_handle: string | null
          invite_sent_at: string | null
          invite_token: string | null
          is_test: boolean
          language: string | null
          last_post_at: string | null
          last_seen_at: string | null
          min_talking_head_per_month: number
          motivation_confirmed_at: string | null
          onboarding_completed_at: string | null
          per_post_override: number | null
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
          source: string | null
          starting_tier: string | null
          status: string
          sync_checked_at: string | null
          sync_error: string | null
          sync_status: string | null
          terms_text_en: string | null
          terms_text_fr: string | null
          terms_visible: boolean
          tier: string
          tier_locked: boolean
          tier_since: string
          tiktok_handle: string | null
          track: string
          ugc_status: string
          user_id: string | null
          warmup: Json
          weekly_target: number
          welcome_bonus: number | null
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
          dormancy_reminders?: Json
          dormant_at?: string | null
          email: string
          email_pending?: boolean
          examples_read_at?: string | null
          fast_lane?: boolean
          fast_lane_app_id?: string | null
          fast_lane_entered_at?: string | null
          fast_lane_expires_at?: string | null
          fast_lane_job_id?: string | null
          fast_lane_opened_at?: string | null
          fast_lane_sent_at?: string | null
          fast_lane_token?: string | null
          fixed_monthly_override?: number | null
          full_name: string
          guide_read_at?: string | null
          guidelines_accepted_at?: string | null
          id?: string
          instagram_handle?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          is_test?: boolean
          language?: string | null
          last_post_at?: string | null
          last_seen_at?: string | null
          min_talking_head_per_month?: number
          motivation_confirmed_at?: string | null
          onboarding_completed_at?: string | null
          per_post_override?: number | null
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
          source?: string | null
          starting_tier?: string | null
          status?: string
          sync_checked_at?: string | null
          sync_error?: string | null
          sync_status?: string | null
          terms_text_en?: string | null
          terms_text_fr?: string | null
          terms_visible?: boolean
          tier?: string
          tier_locked?: boolean
          tier_since?: string
          tiktok_handle?: string | null
          track?: string
          ugc_status?: string
          user_id?: string | null
          warmup?: Json
          weekly_target?: number
          welcome_bonus?: number | null
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
          dormancy_reminders?: Json
          dormant_at?: string | null
          email?: string
          email_pending?: boolean
          examples_read_at?: string | null
          fast_lane?: boolean
          fast_lane_app_id?: string | null
          fast_lane_entered_at?: string | null
          fast_lane_expires_at?: string | null
          fast_lane_job_id?: string | null
          fast_lane_opened_at?: string | null
          fast_lane_sent_at?: string | null
          fast_lane_token?: string | null
          fixed_monthly_override?: number | null
          full_name?: string
          guide_read_at?: string | null
          guidelines_accepted_at?: string | null
          id?: string
          instagram_handle?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          is_test?: boolean
          language?: string | null
          last_post_at?: string | null
          last_seen_at?: string | null
          min_talking_head_per_month?: number
          motivation_confirmed_at?: string | null
          onboarding_completed_at?: string | null
          per_post_override?: number | null
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
          source?: string | null
          starting_tier?: string | null
          status?: string
          sync_checked_at?: string | null
          sync_error?: string | null
          sync_status?: string | null
          terms_text_en?: string | null
          terms_text_fr?: string | null
          terms_visible?: boolean
          tier?: string
          tier_locked?: boolean
          tier_since?: string
          tiktok_handle?: string | null
          track?: string
          ugc_status?: string
          user_id?: string | null
          warmup?: Json
          weekly_target?: number
          welcome_bonus?: number | null
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
          effort: string | null
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
          effort?: string | null
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
          effort?: string | null
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
      go_clicks: {
        Row: {
          app_id: string | null
          country: string | null
          created_at: string
          creator_id: string | null
          device: string
          handle: string
          id: string
          user_agent: string | null
        }
        Insert: {
          app_id?: string | null
          country?: string | null
          created_at?: string
          creator_id?: string | null
          device: string
          handle: string
          id?: string
          user_agent?: string | null
        }
        Update: {
          app_id?: string | null
          country?: string | null
          created_at?: string
          creator_id?: string | null
          device?: string
          handle?: string
          id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "go_clicks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_managers: {
        Row: {
          active: boolean
          countries: string[]
          created_at: string
          profile_id: string
          tracks: string[]
        }
        Insert: {
          active?: boolean
          countries?: string[]
          created_at?: string
          profile_id: string
          tracks?: string[]
        }
        Update: {
          active?: boolean
          countries?: string[]
          created_at?: string
          profile_id?: string
          tracks?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "hiring_managers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
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
      inspiration_accounts: {
        Row: {
          app_ids: string[]
          avatar_path: string | null
          created_at: string
          display_name: string | null
          error: string | null
          followers: number | null
          handle: string
          id: string
          notes: string | null
          notion_page_id: string | null
          platform: string
          refreshed_at: string | null
          url: string
        }
        Insert: {
          app_ids?: string[]
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          error?: string | null
          followers?: number | null
          handle: string
          id?: string
          notes?: string | null
          notion_page_id?: string | null
          platform: string
          refreshed_at?: string | null
          url: string
        }
        Update: {
          app_ids?: string[]
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          error?: string | null
          followers?: number | null
          handle?: string
          id?: string
          notes?: string | null
          notion_page_id?: string | null
          platform?: string
          refreshed_at?: string | null
          url?: string
        }
        Relationships: []
      }
      inspirations: {
        Row: {
          analysis: Json | null
          app_fit: string | null
          app_id: string | null
          approved_style: string | null
          attempts: number
          author_handle: string | null
          batch_id: string | null
          caption: string | null
          comments: number | null
          cost: Json
          cover_path: string | null
          created_at: string
          created_by: string | null
          duration_s: number | null
          error: string | null
          hashtags: string[]
          hook_text: string | null
          hook_type: string | null
          id: string
          kind: string
          language: string | null
          likes: number | null
          next_try_at: string
          no_audio: boolean
          norm_key: string
          notion_format: string | null
          notion_notes: string | null
          notion_page_id: string | null
          platform: string
          posted_at: string | null
          proposed_style: string | null
          reference_id: string | null
          score: number | null
          shares: number | null
          status: string
          style_confidence: number | null
          tags: string[]
          transcript: string | null
          updated_at: string
          url: string
          video_path: string | null
          views: number | null
          words: Json | null
        }
        Insert: {
          analysis?: Json | null
          app_fit?: string | null
          app_id?: string | null
          approved_style?: string | null
          attempts?: number
          author_handle?: string | null
          batch_id?: string | null
          caption?: string | null
          comments?: number | null
          cost?: Json
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          duration_s?: number | null
          error?: string | null
          hashtags?: string[]
          hook_text?: string | null
          hook_type?: string | null
          id?: string
          kind?: string
          language?: string | null
          likes?: number | null
          next_try_at?: string
          no_audio?: boolean
          norm_key: string
          notion_format?: string | null
          notion_notes?: string | null
          notion_page_id?: string | null
          platform: string
          posted_at?: string | null
          proposed_style?: string | null
          reference_id?: string | null
          score?: number | null
          shares?: number | null
          status?: string
          style_confidence?: number | null
          tags?: string[]
          transcript?: string | null
          updated_at?: string
          url: string
          video_path?: string | null
          views?: number | null
          words?: Json | null
        }
        Update: {
          analysis?: Json | null
          app_fit?: string | null
          app_id?: string | null
          approved_style?: string | null
          attempts?: number
          author_handle?: string | null
          batch_id?: string | null
          caption?: string | null
          comments?: number | null
          cost?: Json
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          duration_s?: number | null
          error?: string | null
          hashtags?: string[]
          hook_text?: string | null
          hook_type?: string | null
          id?: string
          kind?: string
          language?: string | null
          likes?: number | null
          next_try_at?: string
          no_audio?: boolean
          norm_key?: string
          notion_format?: string | null
          notion_notes?: string | null
          notion_page_id?: string | null
          platform?: string
          posted_at?: string | null
          proposed_style?: string | null
          reference_id?: string | null
          score?: number | null
          shares?: number | null
          status?: string
          style_confidence?: number | null
          tags?: string[]
          transcript?: string | null
          updated_at?: string
          url?: string
          video_path?: string | null
          views?: number | null
          words?: Json | null
        }
        Relationships: []
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
      job_locks: {
        Row: {
          locked_until: string
          name: string
        }
        Insert: {
          locked_until: string
          name: string
        }
        Update: {
          locked_until?: string
          name?: string
        }
        Relationships: []
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
          closed_by_budget: boolean
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
          closed_by_budget?: boolean
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
          closed_by_budget?: boolean
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
      notion_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_kind: string | null
          error: string | null
          hub_status: string | null
          imported_count: number
          inspiration_id: string | null
          inspiration_ids: string[]
          kind: string
          norm_key: string | null
          notion_last_edited: string | null
          notion_page_id: string
          notion_props: Json
          profile_started_at: string | null
          profile_status: string | null
          profile_target: number | null
          pushed_at: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_kind?: string | null
          error?: string | null
          hub_status?: string | null
          imported_count?: number
          inspiration_id?: string | null
          inspiration_ids?: string[]
          kind?: string
          norm_key?: string | null
          notion_last_edited?: string | null
          notion_page_id: string
          notion_props?: Json
          profile_started_at?: string | null
          profile_status?: string | null
          profile_target?: number | null
          pushed_at?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_kind?: string | null
          error?: string | null
          hub_status?: string | null
          imported_count?: number
          inspiration_id?: string | null
          inspiration_ids?: string[]
          kind?: string
          norm_key?: string | null
          notion_last_edited?: string | null
          notion_page_id?: string
          notion_props?: Json
          profile_started_at?: string | null
          profile_status?: string | null
          profile_target?: number | null
          pushed_at?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notion_items_inspiration_id_fkey"
            columns: ["inspiration_id"]
            isOneToOne: false
            referencedRelation: "inspirations"
            referencedColumns: ["id"]
          },
        ]
      }
      os_calls: {
        Row: {
          action: string
          created_at: string
          error: string | null
          id: string
          ms: number | null
          ok: boolean
        }
        Insert: {
          action: string
          created_at?: string
          error?: string | null
          id?: string
          ms?: number | null
          ok: boolean
        }
        Update: {
          action?: string
          created_at?: string
          error?: string | null
          id?: string
          ms?: number | null
          ok?: boolean
        }
        Relationships: []
      }
      os_snapshots: {
        Row: {
          application_id: string
          dernier_post_at: string | null
          fetched_at: string
          id: string
          is_active: boolean | null
          lundi: string
          manques: number | null
          os_profile_id: string
          prevus: number | null
          publies: number | null
        }
        Insert: {
          application_id: string
          dernier_post_at?: string | null
          fetched_at?: string
          id?: string
          is_active?: boolean | null
          lundi: string
          manques?: number | null
          os_profile_id: string
          prevus?: number | null
          publies?: number | null
        }
        Update: {
          application_id?: string
          dernier_post_at?: string | null
          fetched_at?: string
          id?: string
          is_active?: boolean | null
          lundi?: string
          manques?: number | null
          os_profile_id?: string
          prevus?: number | null
          publies?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "os_snapshots_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "slideshow_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_zones: {
        Row: {
          ceiling_amount: number | null
          currency: string
          first_week_amount: number | null
          monthly_amount: number
          posts_per_day: number
          trial_amount: number
          updated_at: string
          weekly_amount: number | null
          zone: string
        }
        Insert: {
          ceiling_amount?: number | null
          currency?: string
          first_week_amount?: number | null
          monthly_amount: number
          posts_per_day?: number
          trial_amount: number
          updated_at?: string
          weekly_amount?: number | null
          zone: string
        }
        Update: {
          ceiling_amount?: number | null
          currency?: string
          first_week_amount?: number | null
          monthly_amount?: number
          posts_per_day?: number
          trial_amount?: number
          updated_at?: string
          weekly_amount?: number | null
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
          paid_at: string | null
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
          paid_at?: string | null
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
          paid_at?: string | null
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
          creator_links: Json
          creator_slug: string | null
          creator_status: string
          creator_verified: boolean
          declaration_accepted_at: string | null
          declaration_ip: string | null
          declaration_snapshot: Json | null
          declaration_user_agent: string | null
          display_name: string | null
          display_title: string | null
          email: string | null
          examples_reviewed_at: string | null
          fee: string | null
          first_name: string | null
          full_name: string
          guide_read_at: string | null
          id: string
          institution: string | null
          invite_expires_at: string | null
          invite_token: string | null
          invited_at: string | null
          is_test: boolean
          last_name: string | null
          onboarding_step: string | null
          orcid: string | null
          personal_site: string | null
          photo_url: string | null
          platform: Database["public"]["Enums"]["device_platform"] | null
          public_slug: string | null
          role: Database["public"]["Enums"]["portal_role"]
          scholar_url: string | null
          self_registered: boolean
          short_bio: string | null
          title: string | null
          updated_at: string
          upwork_status: string
          used_invite_token: string | null
          user_id: string | null
          writing_lang: string | null
        }
        Insert: {
          access_code?: string | null
          access_redeem_url?: string | null
          activated_at?: string | null
          admin_note?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          creator_links?: Json
          creator_slug?: string | null
          creator_status?: string
          creator_verified?: boolean
          declaration_accepted_at?: string | null
          declaration_ip?: string | null
          declaration_snapshot?: Json | null
          declaration_user_agent?: string | null
          display_name?: string | null
          display_title?: string | null
          email?: string | null
          examples_reviewed_at?: string | null
          fee?: string | null
          first_name?: string | null
          full_name: string
          guide_read_at?: string | null
          id?: string
          institution?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          is_test?: boolean
          last_name?: string | null
          onboarding_step?: string | null
          orcid?: string | null
          personal_site?: string | null
          photo_url?: string | null
          platform?: Database["public"]["Enums"]["device_platform"] | null
          public_slug?: string | null
          role?: Database["public"]["Enums"]["portal_role"]
          scholar_url?: string | null
          self_registered?: boolean
          short_bio?: string | null
          title?: string | null
          updated_at?: string
          upwork_status?: string
          used_invite_token?: string | null
          user_id?: string | null
          writing_lang?: string | null
        }
        Update: {
          access_code?: string | null
          access_redeem_url?: string | null
          activated_at?: string | null
          admin_note?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          creator_links?: Json
          creator_slug?: string | null
          creator_status?: string
          creator_verified?: boolean
          declaration_accepted_at?: string | null
          declaration_ip?: string | null
          declaration_snapshot?: Json | null
          declaration_user_agent?: string | null
          display_name?: string | null
          display_title?: string | null
          email?: string | null
          examples_reviewed_at?: string | null
          fee?: string | null
          first_name?: string | null
          full_name?: string
          guide_read_at?: string | null
          id?: string
          institution?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          is_test?: boolean
          last_name?: string | null
          onboarding_step?: string | null
          orcid?: string | null
          personal_site?: string | null
          photo_url?: string | null
          platform?: Database["public"]["Enums"]["device_platform"] | null
          public_slug?: string | null
          role?: Database["public"]["Enums"]["portal_role"]
          scholar_url?: string | null
          self_registered?: boolean
          short_bio?: string | null
          title?: string | null
          updated_at?: string
          upwork_status?: string
          used_invite_token?: string | null
          user_id?: string | null
          writing_lang?: string | null
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
      reference_library: {
        Row: {
          app_id: string
          category: string | null
          created_at: string
          id: string
          kind: string
          note: string
          platform: string
          tags: string[]
          title: string
          url: string | null
        }
        Insert: {
          app_id?: string
          category?: string | null
          created_at?: string
          id?: string
          kind: string
          note?: string
          platform: string
          tags?: string[]
          title: string
          url?: string | null
        }
        Update: {
          app_id?: string
          category?: string | null
          created_at?: string
          id?: string
          kind?: string
          note?: string
          platform?: string
          tags?: string[]
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      reference_videos: {
        Row: {
          active: boolean
          ad_copy: string | null
          ad_end_date: string | null
          ad_id: string | null
          ad_platforms: string[]
          ad_start_date: string | null
          advertiser: string | null
          analysis: Json | null
          app_id: string
          category: string
          created_at: string
          format_notes: string | null
          id: string
          is_winner: boolean
          landing_url: string | null
          note: string | null
          pinned: boolean
          platform: string
          score: number | null
          source: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string | null
          url: string
          why_it_works: string | null
        }
        Insert: {
          active?: boolean
          ad_copy?: string | null
          ad_end_date?: string | null
          ad_id?: string | null
          ad_platforms?: string[]
          ad_start_date?: string | null
          advertiser?: string | null
          analysis?: Json | null
          app_id?: string
          category?: string
          created_at?: string
          format_notes?: string | null
          id?: string
          is_winner?: boolean
          landing_url?: string | null
          note?: string | null
          pinned?: boolean
          platform?: string
          score?: number | null
          source?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string | null
          url: string
          why_it_works?: string | null
        }
        Update: {
          active?: boolean
          ad_copy?: string | null
          ad_end_date?: string | null
          ad_id?: string | null
          ad_platforms?: string[]
          ad_start_date?: string | null
          advertiser?: string | null
          analysis?: Json | null
          app_id?: string
          category?: string
          created_at?: string
          format_notes?: string | null
          id?: string
          is_winner?: boolean
          landing_url?: string | null
          note?: string | null
          pinned?: boolean
          platform?: string
          score?: number | null
          source?: string | null
          tags?: string[]
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
      referrals: {
        Row: {
          created_at: string
          earned: number
          ends_at: string
          id: string
          rate: number
          ref_handle: string
          referee_creator_id: string
          referrer_creator_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          earned?: number
          ends_at?: string
          id?: string
          rate?: number
          ref_handle: string
          referee_creator_id: string
          referrer_creator_id: string
          starts_at?: string
        }
        Update: {
          created_at?: string
          earned?: number
          ends_at?: string
          id?: string
          rate?: number
          ref_handle?: string
          referee_creator_id?: string
          referrer_creator_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_creator_id_fkey"
            columns: ["referee_creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_creator_id_fkey"
            columns: ["referrer_creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_templates: {
        Row: {
          app_id: string | null
          body: string
          created_at: string
          id: string
          kind: string
          name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          app_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
          name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          subject?: string | null
          updated_at?: string
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
      sidekick_messages: {
        Row: {
          content: string
          created_at: string
          data: Json
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          data?: Json
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          data?: Json
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidekick_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "sidekick_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      sidekick_threads: {
        Row: {
          app_id: string | null
          created_at: string
          id: string
          profile_id: string
          title: string
          updated_at: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          id?: string
          profile_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidekick_threads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      slideshow_applications: {
        Row: {
          accepted_at: string | null
          ack_sent_at: string | null
          admin_notes: string | null
          agreement_signed_at: string | null
          app_id: string
          applications: string[]
          assigned_hm_id: string | null
          consent_at: string
          contract_signed_at: string | null
          country: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          deux_telephones: boolean | null
          dropped_at: string | null
          email: string
          expired_at: string | null
          full_name: string
          guide_figures_shown: Json | null
          guide_opened_at: string | null
          guide_token: string | null
          guide_zone_shown: string | null
          has_upwork: boolean | null
          hm_notified_at: string | null
          id: string
          is_adult: boolean
          langue: string | null
          manager_email: string | null
          manager_name: string | null
          os_created_at: string | null
          os_email: string | null
          os_error: string | null
          os_langue: string | null
          os_profile_id: string | null
          payout_channel: string | null
          payout_method: string | null
          payout_token: string | null
          payout_token_expires_at: string | null
          paypal_email: string | null
          phone: string | null
          pool_at: string | null
          q_country_now: string | null
          q_hours_per_day: string | null
          q_previous_content: string | null
          q_tiktok_daily: string | null
          ref: string | null
          referral_name: string | null
          referral_source: string | null
          referred: boolean | null
          rejected_reason: string | null
          rejection_reason: string | null
          ruul_added_at: string | null
          ruul_email: string | null
          signing_token: string | null
          signing_token_created_at: string | null
          start_monday: string | null
          started_at: string | null
          status: string
          stripe_account_id: string | null
          stripe_onboarded: boolean
          submit_ip_hash: string | null
          timeline: Json
          unsubscribed_at: string | null
          unswipe_code_id: string | null
          upwork_profile_url: string | null
          wise_email: string | null
          zone: string | null
          zone_note: string | null
          zone_override: boolean
        }
        Insert: {
          accepted_at?: string | null
          ack_sent_at?: string | null
          admin_notes?: string | null
          agreement_signed_at?: string | null
          app_id?: string
          applications?: string[]
          assigned_hm_id?: string | null
          consent_at?: string
          contract_signed_at?: string | null
          country: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          deux_telephones?: boolean | null
          dropped_at?: string | null
          email: string
          expired_at?: string | null
          full_name: string
          guide_figures_shown?: Json | null
          guide_opened_at?: string | null
          guide_token?: string | null
          guide_zone_shown?: string | null
          has_upwork?: boolean | null
          hm_notified_at?: string | null
          id?: string
          is_adult: boolean
          langue?: string | null
          manager_email?: string | null
          manager_name?: string | null
          os_created_at?: string | null
          os_email?: string | null
          os_error?: string | null
          os_langue?: string | null
          os_profile_id?: string | null
          payout_channel?: string | null
          payout_method?: string | null
          payout_token?: string | null
          payout_token_expires_at?: string | null
          paypal_email?: string | null
          phone?: string | null
          pool_at?: string | null
          q_country_now?: string | null
          q_hours_per_day?: string | null
          q_previous_content?: string | null
          q_tiktok_daily?: string | null
          ref?: string | null
          referral_name?: string | null
          referral_source?: string | null
          referred?: boolean | null
          rejected_reason?: string | null
          rejection_reason?: string | null
          ruul_added_at?: string | null
          ruul_email?: string | null
          signing_token?: string | null
          signing_token_created_at?: string | null
          start_monday?: string | null
          started_at?: string | null
          status?: string
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          submit_ip_hash?: string | null
          timeline?: Json
          unsubscribed_at?: string | null
          unswipe_code_id?: string | null
          upwork_profile_url?: string | null
          wise_email?: string | null
          zone?: string | null
          zone_note?: string | null
          zone_override?: boolean
        }
        Update: {
          accepted_at?: string | null
          ack_sent_at?: string | null
          admin_notes?: string | null
          agreement_signed_at?: string | null
          app_id?: string
          applications?: string[]
          assigned_hm_id?: string | null
          consent_at?: string
          contract_signed_at?: string | null
          country?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          deux_telephones?: boolean | null
          dropped_at?: string | null
          email?: string
          expired_at?: string | null
          full_name?: string
          guide_figures_shown?: Json | null
          guide_opened_at?: string | null
          guide_token?: string | null
          guide_zone_shown?: string | null
          has_upwork?: boolean | null
          hm_notified_at?: string | null
          id?: string
          is_adult?: boolean
          langue?: string | null
          manager_email?: string | null
          manager_name?: string | null
          os_created_at?: string | null
          os_email?: string | null
          os_error?: string | null
          os_langue?: string | null
          os_profile_id?: string | null
          payout_channel?: string | null
          payout_method?: string | null
          payout_token?: string | null
          payout_token_expires_at?: string | null
          paypal_email?: string | null
          phone?: string | null
          pool_at?: string | null
          q_country_now?: string | null
          q_hours_per_day?: string | null
          q_previous_content?: string | null
          q_tiktok_daily?: string | null
          ref?: string | null
          referral_name?: string | null
          referral_source?: string | null
          referred?: boolean | null
          rejected_reason?: string | null
          rejection_reason?: string | null
          ruul_added_at?: string | null
          ruul_email?: string | null
          signing_token?: string | null
          signing_token_created_at?: string | null
          start_monday?: string | null
          started_at?: string | null
          status?: string
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          submit_ip_hash?: string | null
          timeline?: Json
          unsubscribed_at?: string | null
          unswipe_code_id?: string | null
          upwork_profile_url?: string | null
          wise_email?: string | null
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
      slideshow_payouts: {
        Row: {
          amount: number | null
          application_id: string
          approved_at: string | null
          approved_by: string | null
          carried_in: number
          created_at: string
          first_week: boolean
          id: string
          manques: number | null
          note: string | null
          paid_at: string | null
          prevus: number | null
          publies: number | null
          rate: number | null
          ruul_ref: string | null
          skip_reason: string | null
          status: string
          stripe_transfer_id: string | null
          suggested: number | null
          week_start: string
          zone: string | null
        }
        Insert: {
          amount?: number | null
          application_id: string
          approved_at?: string | null
          approved_by?: string | null
          carried_in?: number
          created_at?: string
          first_week?: boolean
          id?: string
          manques?: number | null
          note?: string | null
          paid_at?: string | null
          prevus?: number | null
          publies?: number | null
          rate?: number | null
          ruul_ref?: string | null
          skip_reason?: string | null
          status?: string
          stripe_transfer_id?: string | null
          suggested?: number | null
          week_start: string
          zone?: string | null
        }
        Update: {
          amount?: number | null
          application_id?: string
          approved_at?: string | null
          approved_by?: string | null
          carried_in?: number
          created_at?: string
          first_week?: boolean
          id?: string
          manques?: number | null
          note?: string | null
          paid_at?: string | null
          prevus?: number | null
          publies?: number | null
          rate?: number | null
          ruul_ref?: string | null
          skip_reason?: string | null
          status?: string
          stripe_transfer_id?: string | null
          suggested?: number | null
          week_start?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slideshow_payouts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "slideshow_applications"
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
      studio_courses: {
        Row: {
          accepted_at: string | null
          app_course_id: string | null
          author_id: string
          created_at: string
          description: string
          glossary: Json
          hero: Json
          id: string
          job_status: string | null
          languages: Json
          last_job_id: string | null
          origin_lang: string
          precheck: Json | null
          published_at: string | null
          quiz: Json | null
          review_comment: string | null
          sections: Json
          sources: Json
          status: string
          subcategory: string | null
          subject: string | null
          submitted_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          accepted_at?: string | null
          app_course_id?: string | null
          author_id: string
          created_at?: string
          description?: string
          glossary?: Json
          hero?: Json
          id?: string
          job_status?: string | null
          languages?: Json
          last_job_id?: string | null
          origin_lang?: string
          precheck?: Json | null
          published_at?: string | null
          quiz?: Json | null
          review_comment?: string | null
          sections?: Json
          sources?: Json
          status?: string
          subcategory?: string | null
          subject?: string | null
          submitted_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          accepted_at?: string | null
          app_course_id?: string | null
          author_id?: string
          created_at?: string
          description?: string
          glossary?: Json
          hero?: Json
          id?: string
          job_status?: string | null
          languages?: Json
          last_job_id?: string | null
          origin_lang?: string
          precheck?: Json | null
          published_at?: string | null
          quiz?: Json | null
          review_comment?: string | null
          sections?: Json
          sources?: Json
          status?: string
          subcategory?: string | null
          subject?: string | null
          submitted_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "studio_courses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_jobs: {
        Row: {
          app_course_id: string | null
          created_at: string
          events: Json
          job_id: string
          status: string | null
          steps: Json
          studio_course_id: string
          summary: Json | null
          updated_at: string
        }
        Insert: {
          app_course_id?: string | null
          created_at?: string
          events?: Json
          job_id: string
          status?: string | null
          steps?: Json
          studio_course_id: string
          summary?: Json | null
          updated_at?: string
        }
        Update: {
          app_course_id?: string | null
          created_at?: string
          events?: Json
          job_id?: string
          status?: string | null
          steps?: Json
          studio_course_id?: string
          summary?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_jobs_studio_course_id_fkey"
            columns: ["studio_course_id"]
            isOneToOne: false
            referencedRelation: "studio_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_stats_cache: {
        Row: {
          fetched_at: string
          key: string
          payload: Json
        }
        Insert: {
          fetched_at?: string
          key: string
          payload: Json
        }
        Update: {
          fetched_at?: string
          key?: string
          payload?: Json
        }
        Relationships: []
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
          meta: Json | null
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
          meta?: Json | null
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
          meta?: Json | null
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
      ugc_formats: {
        Row: {
          description: string
          example_inspiration_ids: string[]
          id: string
          key: string
          name_en: string
          name_fr: string
          sort_order: number
          structure: Json
          tips: string
          when_to_use: string
        }
        Insert: {
          description?: string
          example_inspiration_ids?: string[]
          id?: string
          key: string
          name_en: string
          name_fr: string
          sort_order?: number
          structure?: Json
          tips?: string
          when_to_use?: string
        }
        Update: {
          description?: string
          example_inspiration_ids?: string[]
          id?: string
          key?: string
          name_en?: string
          name_fr?: string
          sort_order?: number
          structure?: Json
          tips?: string
          when_to_use?: string
        }
        Relationships: []
      }
      ugc_guidelines: {
        Row: {
          active: boolean
          app_id: string | null
          body_en: string
          body_fr: string
          created_at: string
          id: string
          image_data: string | null
          sort_order: number
          title_en: string
          title_fr: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          app_id?: string | null
          body_en?: string
          body_fr?: string
          created_at?: string
          id?: string
          image_data?: string | null
          sort_order?: number
          title_en: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          app_id?: string | null
          body_en?: string
          body_fr?: string
          created_at?: string
          id?: string
          image_data?: string | null
          sort_order?: number
          title_en?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ugc_guidelines_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
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
          draft_required: boolean
          hold_days: number
          id: number
          min_payout: number
          monthly_budget_cap: number | null
          notion_auto: boolean
          notion_database_id: string
          notion_last_error: string | null
          notion_last_full_sync: string | null
          notion_last_sync: string | null
          notion_videos_per_profile: number
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
          draft_required?: boolean
          hold_days?: number
          id?: number
          min_payout?: number
          monthly_budget_cap?: number | null
          notion_auto?: boolean
          notion_database_id?: string
          notion_last_error?: string | null
          notion_last_full_sync?: string | null
          notion_last_sync?: string | null
          notion_videos_per_profile?: number
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
          draft_required?: boolean
          hold_days?: number
          id?: number
          min_payout?: number
          monthly_budget_cap?: number | null
          notion_auto?: boolean
          notion_database_id?: string
          notion_last_error?: string | null
          notion_last_full_sync?: string | null
          notion_last_sync?: string | null
          notion_videos_per_profile?: number
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
          cap_per_post: number
          cpm: number
          id: string
          label: string
          monthly_cap: number
          per_post: number
          per_post_pov: number
          per_post_reaction: number
          per_post_talking_head: number
          rule: string
          tier: string
        }
        Insert: {
          app_id: string
          cap_per_post?: number
          cpm?: number
          id?: string
          label: string
          monthly_cap?: number
          per_post?: number
          per_post_pov?: number
          per_post_reaction?: number
          per_post_talking_head?: number
          rule?: string
          tier: string
        }
        Update: {
          app_id?: string
          cap_per_post?: number
          cpm?: number
          id?: string
          label?: string
          monthly_cap?: number
          per_post?: number
          per_post_pov?: number
          per_post_reaction?: number
          per_post_talking_head?: number
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
      weekly_installs: {
        Row: {
          app_id: string | null
          created_at: string
          handle: string
          id: string
          installs: number
          spend: number
          week_start: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          handle: string
          id?: string
          installs?: number
          spend?: number
          week_start: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          handle?: string
          id?: string
          installs?: number
          spend?: number
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_month_public: {
        Row: {
          earnings: number | null
          posts: number | null
          pseudonym: string | null
          rank: number | null
          views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      creator_enrolled: { Args: { _app: string }; Returns: boolean }
      influencer_can_see_brief: {
        Args: { _brief_id: string }
        Returns: boolean
      }
      inspiration_queue_arm: { Args: never; Returns: undefined }
      inspiration_queue_disarm: { Args: never; Returns: undefined }
      leaderboard_month: {
        Args: { _app?: string }
        Returns: {
          creator_id: string
          earnings: number
          posts: number
          pseudonym: string
          rank: number
          views: number
        }[]
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
      ugc_draft_required: { Args: never; Returns: boolean }
      unaccent_fallback: { Args: { value: string }; Returns: string }
    }
    Enums: {
      application_state: "pending" | "approved" | "rejected"
      brief_style:
        | "reaction_demo"
        | "broll_stickers"
        | "sole_footage"
        | "talked_hook_demo"
        | "educational"
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
      brief_style: [
        "reaction_demo",
        "broll_stickers",
        "sole_footage",
        "talked_hook_demo",
        "educational",
      ],
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
