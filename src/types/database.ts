export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          faculty: string;
          department: string;
          level: string;
          accountability_partner: string;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          faculty: string;
          department: string;
          level: string;
          accountability_partner?: string;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          faculty?: string;
          department?: string;
          level?: string;
          accountability_partner?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          week_start_date: string;
          day_name: string;
          session_number: number;
          start_time: string;
          stop_time: string;
          duration_minutes: number;
          topics: string;
          self_rating: number;
          efficiency_notes: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          week_start_date: string;
          day_name: string;
          session_number: number;
          start_time: string;
          stop_time: string;
          duration_minutes: number;
          topics?: string;
          self_rating?: number;
          efficiency_notes?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          week_start_date?: string;
          day_name?: string;
          session_number?: number;
          start_time?: string;
          stop_time?: string;
          duration_minutes?: number;
          topics?: string;
          self_rating?: number;
          efficiency_notes?: string;
        };
        Relationships: [];
      };
      timer_sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          subject: string;
          duration_mins: number;
          elapsed_mins: number;
          started_at: number;
          type: "work" | "break";
          status: "running" | "paused" | "completed" | "cancelled";
          pomodoro_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          subject: string;
          duration_mins: number;
          elapsed_mins: number;
          started_at: number;
          type: "work" | "break";
          status: "running" | "paused" | "completed" | "cancelled";
          pomodoro_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          subject?: string;
          duration_mins?: number;
          elapsed_mins?: number;
          started_at?: number;
          type?: "work" | "break";
          status?: "running" | "paused" | "completed" | "cancelled";
          pomodoro_count?: number;
        };
        Relationships: [];
      };
      leaderboard_entries: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          week_start_date: string;
          name: string;
          faculty: string;
          department: string;
          level: string;
          total_minutes: number;
          pinned_at: number;
          cheers: number;
          fire: number;
          star: number;
          heart: number;
          badges: string[];
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          week_start_date: string;
          name: string;
          faculty: string;
          department: string;
          level: string;
          total_minutes: number;
          pinned_at: number;
          cheers?: number;
          fire?: number;
          star?: number;
          heart?: number;
          badges?: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          week_start_date?: string;
          name?: string;
          faculty?: string;
          department?: string;
          level?: string;
          total_minutes?: number;
          pinned_at?: number;
          cheers?: number;
          fire?: number;
          star?: number;
          heart?: number;
          badges?: string[];
        };
        Relationships: [];
      };
      archives: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          week_start_date: string;
          total_minutes: number;
          most_studied_topic: string;
          rank_on_board: number;
          badges: string[];
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          week_start_date: string;
          total_minutes: number;
          most_studied_topic: string;
          rank_on_board?: number;
          badges?: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          week_start_date?: string;
          total_minutes?: number;
          most_studied_topic?: string;
          rank_on_board?: number;
          badges?: string[];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ----- Convenience aliases -----

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Reaction column names on leaderboard_entries
export type ReactionColumn = "cheers" | "fire" | "star" | "heart";
