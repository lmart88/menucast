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
      tvs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          pairing_code: string;
          paired_at: string | null;
          current_menu_url: string | null;
          screen_width?: number | null;
          screen_height?: number | null;
          aspect_ratio?: string | null;
          orientation?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          pairing_code: string;
          paired_at?: string | null;
          current_menu_url?: string | null;
          screen_width?: number | null;
          screen_height?: number | null;
          aspect_ratio?: string | null;
          orientation?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          pairing_code?: string;
          paired_at?: string | null;
          current_menu_url?: string | null;
          screen_width?: number | null;
          screen_height?: number | null;
          aspect_ratio?: string | null;
          orientation?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      menus: {
        Row: {
          id: string;
          tv_id: string;
          image_url: string;
          pushed_at: string;
          pushed_by: string | null;
        };
        Insert: {
          id?: string;
          tv_id: string;
          image_url: string;
          pushed_at?: string;
          pushed_by?: string | null;
        };
        Update: {
          id?: string;
          tv_id?: string;
          image_url?: string;
          pushed_at?: string;
          pushed_by?: string | null;
        };
        Relationships: [];
      };
      api_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          name: string;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          token?: string;
          name?: string;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          name?: string;
          created_at?: string;
          last_used_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
