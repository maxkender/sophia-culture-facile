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
          assigned_creator_id: string | null
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
          assigned_creator_id?: string | null
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
          assigned_creator_id?: string | null
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
      admin_ui_prefs: {
        Row: {
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Update: {
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
      brief_assignments: {
        Row: {
          brief_id: string
          created_at: string
          creator_id: string
          id: string
        }
        Insert: {
          brief_id: string
          created_at?: string
          creator_id: string
          id?: string
        }
        Update: {
          brief_id?: string
          created_at?: string
          creator_id?: string
          id?: string
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
          app: string
          audience: string
          body: string
          created_at: string
          created_by: string | null
          due_date: string | null
          hook: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          app?: string
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          hook?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          app?: string
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          hook?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          body: string
          created_at: string
          id: string
          title: string
          track: string | null
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          title: string
          track?: string | null
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          title?: string
          track?: string | null
        }
        Relationships: []
      }
      creator_applications: {
        Row: {
          acceptance_email_sent_at: string | null
          admin_notes: string | null
          age: number
          assigned_hm_id: string | null
          consent_at: string
          country: string
          created_at: string
          created_creator_id: string | null
          decided_at: string | null
          decided_by: string | null
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
          status: string
          submit_ip_hash: string | null
          tiktok_url: string | null
          video_file_path: string | null
          video_url: string | null
        }
        Insert: {
          acceptance_email_sent_at?: string | null
          admin_notes?: string | null
          age: number
          assigned_hm_id?: string | null
          consent_at?: string
          country: string
          created_at?: string
          created_creator_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
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
          status?: string
          submit_ip_hash?: string | null
          tiktok_url?: string | null
          video_file_path?: string | null
          video_url?: string | null
        }
        Update: {
          acceptance_email_sent_at?: string | null
          admin_notes?: string | null
          age?: number
          assigned_hm_id?: string | null
          consent_at?: string
          country?: string
          created_at?: string
          created_creator_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
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
          status?: string
          submit_ip_hash?: string | null
          tiktok_url?: string | null
          video_file_path?: string | null
          video_url?: string | null
        }
        Relationships: [
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
          created_at: string
          creator_id: string
          id: string
          method: string
          paypal_email: string | null
          stripe_account_id: string | null
          stripe_onboarded: boolean
          updated_at: string
          wise_email: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          method?: string
          paypal_email?: string | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          updated_at?: string
          wise_email?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          method?: string
          paypal_email?: string | null
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
        }
        Insert: {
          amount_usd?: number | null
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
        }
        Update: {
          amount_usd?: number | null
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
        }
        Relationships: [
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
          country: string | null
          created_at: string
          device: string | null
          email: string | null
          followers: number | null
          handle: string | null
          id: string
          instagram_handle: string | null
          language: string | null
          name: string | null
          next_action_on: string | null
          notes: string | null
          phone: string | null
          platform: string
          presentation: string | null
          source: string
          status: string
          tags: string[]
          target_app: string | null
          tiktok_handle: string | null
          track: string | null
        }
        Insert: {
          age?: number | null
          applied_at?: string | null
          assigned_hm_id?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          followers?: number | null
          handle?: string | null
          id?: string
          instagram_handle?: string | null
          language?: string | null
          name?: string | null
          next_action_on?: string | null
          notes?: string | null
          phone?: string | null
          platform?: string
          presentation?: string | null
          source?: string
          status?: string
          tags?: string[]
          target_app?: string | null
          tiktok_handle?: string | null
          track?: string | null
        }
        Update: {
          age?: number | null
          applied_at?: string | null
          assigned_hm_id?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          followers?: number | null
          handle?: string | null
          id?: string
          instagram_handle?: string | null
          language?: string | null
          name?: string | null
          next_action_on?: string | null
          notes?: string | null
          phone?: string | null
          platform?: string
          presentation?: string | null
          source?: string
          status?: string
          tags?: string[]
          target_app?: string | null
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
        ]
      }
      creator_rates: {
        Row: {
          country: string | null
          created_at: string
          effective_from: string
          id: string
          rate_usd: number
          track: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          effective_from?: string
          id?: string
          rate_usd: number
          track: string
        }
        Update: {
          country?: string | null
          created_at?: string
          effective_from?: string
          id?: string
          rate_usd?: number
          track?: string
        }
        Relationships: []
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
            foreignKeyName: "creator_social_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_weekly_guides: {
        Row: {
          body: string
          created_at: string
          id: string
          published: boolean
          title: string
          track: string | null
          week_start: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          published?: boolean
          title: string
          track?: string | null
          week_start: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          published?: boolean
          title?: string
          track?: string | null
          week_start?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          access_code: string | null
          access_redeem_url: string | null
          admin_notes: string | null
          application_id: string | null
          assigned_hm_id: string | null
          country: string | null
          created_at: string
          email: string
          examples_read_at: string | null
          full_name: string
          guide_read_at: string | null
          id: string
          invite_sent_at: string | null
          invite_token: string | null
          motivation_confirmed_at: string | null
          onboarding_completed_at: string | null
          phone: string | null
          photo_path: string | null
          platform: string | null
          profile_picture_confirmed: boolean
          rules_accepted_at: string | null
          rules_version: number | null
          setup_guide_checks: Json
          slack_joined_at: string | null
          social_account_created_at: string | null
          social_bio: string | null
          social_handle: string | null
          status: string
          track: string
          user_id: string | null
          warmup: Json
          weekly_target: number
        }
        Insert: {
          access_code?: string | null
          access_redeem_url?: string | null
          admin_notes?: string | null
          application_id?: string | null
          assigned_hm_id?: string | null
          country?: string | null
          created_at?: string
          email: string
          examples_read_at?: string | null
          full_name: string
          guide_read_at?: string | null
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          motivation_confirmed_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          photo_path?: string | null
          platform?: string | null
          profile_picture_confirmed?: boolean
          rules_accepted_at?: string | null
          rules_version?: number | null
          setup_guide_checks?: Json
          slack_joined_at?: string | null
          social_account_created_at?: string | null
          social_bio?: string | null
          social_handle?: string | null
          status?: string
          track?: string
          user_id?: string | null
          warmup?: Json
          weekly_target?: number
        }
        Update: {
          access_code?: string | null
          access_redeem_url?: string | null
          admin_notes?: string | null
          application_id?: string | null
          assigned_hm_id?: string | null
          country?: string | null
          created_at?: string
          email?: string
          examples_read_at?: string | null
          full_name?: string
          guide_read_at?: string | null
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          motivation_confirmed_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          photo_path?: string | null
          platform?: string | null
          profile_picture_confirmed?: boolean
          rules_accepted_at?: string | null
          rules_version?: number | null
          setup_guide_checks?: Json
          slack_joined_at?: string | null
          social_account_created_at?: string | null
          social_bio?: string | null
          social_handle?: string | null
          status?: string
          track?: string
          user_id?: string | null
          warmup?: Json
          weekly_target?: number
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
          amount_usd: number
          batch_id: string
          created_at: string
          creator_id: string
          id: string
          note: string | null
          posts_count: number
          rate_usd: number
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount_usd?: number
          batch_id: string
          created_at?: string
          creator_id: string
          id?: string
          note?: string | null
          posts_count?: number
          rate_usd?: number
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount_usd?: number
          batch_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          note?: string | null
          posts_count?: number
          rate_usd?: number
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
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
          category: string
          created_at: string
          id: string
          note: string | null
          pinned: boolean
          platform: string
          thumbnail_url: string | null
          url: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          pinned?: boolean
          platform?: string
          thumbnail_url?: string | null
          url: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          pinned?: boolean
          platform?: string
          thumbnail_url?: string | null
          url?: string
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
      slideshow_applications: {
        Row: {
          admin_notes: string | null
          agreement_signed_at: string | null
          assigned_hm_id: string | null
          consent_at: string
          country: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          email: string
          full_name: string
          has_upwork: boolean
          id: string
          is_adult: boolean
          phone: string
          referral_source: string | null
          rejection_reason: string | null
          signing_token: string | null
          signing_token_created_at: string | null
          status: string
          submit_ip_hash: string | null
          upwork_profile_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          agreement_signed_at?: string | null
          assigned_hm_id?: string | null
          consent_at?: string
          country: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email: string
          full_name: string
          has_upwork?: boolean
          id?: string
          is_adult: boolean
          phone: string
          referral_source?: string | null
          rejection_reason?: string | null
          signing_token?: string | null
          signing_token_created_at?: string | null
          status?: string
          submit_ip_hash?: string | null
          upwork_profile_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          agreement_signed_at?: string | null
          assigned_hm_id?: string | null
          consent_at?: string
          country?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email?: string
          full_name?: string
          has_upwork?: boolean
          id?: string
          is_adult?: boolean
          phone?: string
          referral_source?: string | null
          rejection_reason?: string | null
          signing_token?: string | null
          signing_token_created_at?: string | null
          status?: string
          submit_ip_hash?: string | null
          upwork_profile_url?: string | null
        }
        Relationships: [
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
          country: string
          rate_usd: number
          updated_at: string
        }
        Insert: {
          country: string
          rate_usd: number
          updated_at?: string
        }
        Update: {
          country?: string
          rate_usd?: number
          updated_at?: string
        }
        Relationships: []
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
