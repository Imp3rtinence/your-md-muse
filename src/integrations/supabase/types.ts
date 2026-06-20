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
      aura_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          ref_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          ref_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          ref_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aura_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          ai_reason: string | null
          created_at: string
          description: string | null
          icon: string | null
          is_personal: boolean
          name: string
          owner_user_id: string | null
          slug: string
        }
        Insert: {
          ai_reason?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          is_personal?: boolean
          name: string
          owner_user_id?: string | null
          slug: string
        }
        Update: {
          ai_reason?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          is_personal?: boolean
          name?: string
          owner_user_id?: string | null
          slug?: string
        }
        Relationships: []
      }
      challenge_translations: {
        Row: {
          challenge_id: string
          created_at: string
          description: string
          lang: string
          title: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          description: string
          lang: string
          title: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          description?: string
          lang?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_translations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          category: Database["public"]["Enums"]["challenge_category"]
          created_at: string
          created_by_ai: boolean
          creator_id: string
          description: string | null
          difficulty: string | null
          embedding: string | null
          expires_at: string | null
          hero_image_url: string | null
          id: string
          is_daily: boolean
          parent_challenge_id: string | null
          participant_count: number
          region: string | null
          tags: string[]
          title: string
          visibility: Database["public"]["Enums"]["challenge_visibility"]
        }
        Insert: {
          category: Database["public"]["Enums"]["challenge_category"]
          created_at?: string
          created_by_ai?: boolean
          creator_id: string
          description?: string | null
          difficulty?: string | null
          embedding?: string | null
          expires_at?: string | null
          hero_image_url?: string | null
          id?: string
          is_daily?: boolean
          parent_challenge_id?: string | null
          participant_count?: number
          region?: string | null
          tags?: string[]
          title: string
          visibility?: Database["public"]["Enums"]["challenge_visibility"]
        }
        Update: {
          category?: Database["public"]["Enums"]["challenge_category"]
          created_at?: string
          created_by_ai?: boolean
          creator_id?: string
          description?: string | null
          difficulty?: string | null
          embedding?: string | null
          expires_at?: string | null
          hero_image_url?: string | null
          id?: string
          is_daily?: boolean
          parent_challenge_id?: string | null
          participant_count?: number
          region?: string | null
          tags?: string[]
          title?: string
          visibility?: Database["public"]["Enums"]["challenge_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "challenges_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_parent_challenge_id_fkey"
            columns: ["parent_challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          challenge_id: string
          created_at: string
          id: string
          parent_comment_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          challenge_id: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          challenge_id?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          group_id: string
          id: string
          max_uses: number | null
          token: string
          use_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          group_id: string
          id?: string
          max_uses?: number | null
          token: string
          use_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          group_id?: string
          id?: string
          max_uses?: number | null
          token?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          embedding: string | null
          emoji: string
          id: string
          kind: string
          members_can_invite: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          embedding?: string | null
          emoji?: string
          id?: string
          kind?: string
          members_can_invite?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          embedding?: string | null
          emoji?: string
          id?: string
          kind?: string
          members_can_invite?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aura: number
          avatar_url: string | null
          bio: string | null
          birth_year: number | null
          bot_persona: Json | null
          created_at: string
          display_name: string | null
          id: string
          interests: string[]
          is_ai_bot: boolean
          is_private: boolean
          last_active_date: string | null
          league_tier: number
          onboarded_at: string | null
          streak_days: number
          updated_at: string
          username: string
          week_start: string
          weekly_aura: number
        }
        Insert: {
          aura?: number
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          bot_persona?: Json | null
          created_at?: string
          display_name?: string | null
          id: string
          interests?: string[]
          is_ai_bot?: boolean
          is_private?: boolean
          last_active_date?: string | null
          league_tier?: number
          onboarded_at?: string | null
          streak_days?: number
          updated_at?: string
          username: string
          week_start?: string
          weekly_aura?: number
        }
        Update: {
          aura?: number
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          bot_persona?: Json | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[]
          is_ai_bot?: boolean
          is_private?: boolean
          last_active_date?: string | null
          league_tier?: number
          onboarded_at?: string | null
          streak_days?: number
          updated_at?: string
          username?: string
          week_start?: string
          weekly_aura?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          challenge_id: string | null
          created_at: string
          id: string
          sticker: string
          submission_id: string | null
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string
          id?: string
          sticker: string
          submission_id?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          created_at?: string
          id?: string
          sticker?: string
          submission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          caption: string | null
          challenge_id: string
          created_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          challenge_id: string
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          challenge_id?: string
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_profile: {
        Row: {
          created_at: string
          interest_embedding: string | null
          suggested_challenges: Json
          suggested_crew_kinds: Json
          summary: string | null
          top_categories: Json
          traits: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          interest_embedding?: string | null
          suggested_challenges?: Json
          suggested_crew_kinds?: Json
          summary?: string | null
          top_categories?: Json
          traits?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          interest_embedding?: string | null
          suggested_challenges?: Json
          suggested_crew_kinds?: Json
          summary?: string | null
          top_categories?: Json
          traits?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_slug: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_slug: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_slug_fkey"
            columns: ["badge_slug"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_recaps: {
        Row: {
          created_at: string
          stats: Json
          suggestion: string
          summary: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          stats?: Json
          suggestion: string
          summary: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          stats?: Json
          suggestion?: string
          summary?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_recaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_friend_to_group: {
        Args: { _friend: string; _group: string }
        Returns: undefined
      }
      are_friends: { Args: { a: string; b: string }; Returns: boolean }
      bump_weekly_aura: {
        Args: { _amount: number; _user: string }
        Returns: undefined
      }
      current_week_start: { Args: never; Returns: string }
      is_group_member: {
        Args: { _group: string; _user: string }
        Returns: boolean
      }
      is_group_owner: {
        Args: { _group: string; _user: string }
        Returns: boolean
      }
      join_group_with_token: { Args: { _token: string }; Returns: string }
      list_dm_threads: {
        Args: never
        Returns: {
          last_at: string
          last_body: string
          last_sender_id: string
          other_avatar_url: string
          other_display_name: string
          other_id: string
          other_username: string
          unread_count: number
        }[]
      }
      mark_dm_thread_read: { Args: { _other: string }; Returns: undefined }
      match_challenges: {
        Args: {
          exclude_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          category: Database["public"]["Enums"]["challenge_category"]
          creator_id: string
          description: string
          hero_image_url: string
          id: string
          participant_count: number
          similarity: number
          title: string
        }[]
      }
      match_crews: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          description: string
          emoji: string
          id: string
          kind: string
          member_count: number
          name: string
          similarity: number
        }[]
      }
      preview_group_invite: {
        Args: { _token: string }
        Returns: {
          emoji: string
          expired: boolean
          group_id: string
          group_name: string
          member_count: number
        }[]
      }
      process_weekly_leagues: { Args: never; Returns: undefined }
      respond_friend_request: {
        Args: { _accept: boolean; _other: string }
        Returns: undefined
      }
      search_users: {
        Args: { _q: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          username: string
        }[]
      }
      send_friend_request: { Args: { _other: string }; Returns: undefined }
    }
    Enums: {
      challenge_category:
        | "creative"
        | "active"
        | "friendly"
        | "skill"
        | "learning"
      challenge_visibility: "friends" | "group" | "public"
      friendship_status: "pending" | "accepted" | "blocked"
      report_status: "open" | "reviewed" | "dismissed"
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
      challenge_category: [
        "creative",
        "active",
        "friendly",
        "skill",
        "learning",
      ],
      challenge_visibility: ["friends", "group", "public"],
      friendship_status: ["pending", "accepted", "blocked"],
      report_status: ["open", "reviewed", "dismissed"],
    },
  },
} as const
