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
          menu_mode?: "static" | "hybrid" | "responsive" | string | null;
          menu_data?: Json | null;
          screen_width?: number | null;
          screen_height?: number | null;
          aspect_ratio?: string | null;
          orientation?: string | null;
          last_seen_at?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          pairing_code: string;
          paired_at?: string | null;
          current_menu_url?: string | null;
          menu_mode?: "static" | "hybrid" | "responsive" | string | null;
          menu_data?: Json | null;
          screen_width?: number | null;
          screen_height?: number | null;
          aspect_ratio?: string | null;
          orientation?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          pairing_code?: string;
          paired_at?: string | null;
          current_menu_url?: string | null;
          menu_mode?: "static" | "hybrid" | "responsive" | string | null;
          menu_data?: Json | null;
          screen_width?: number | null;
          screen_height?: number | null;
          aspect_ratio?: string | null;
          orientation?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tvs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      menus: {
        Row: {
          id: string;
          tv_id: string;
          image_url: string;
          menu_mode?: "static" | "hybrid" | "responsive" | string | null;
          menu_data?: Json | null;
          pushed_at: string;
          pushed_by: string | null;
        };
        Insert: {
          id?: string;
          tv_id: string;
          image_url: string;
          menu_mode?: "static" | "hybrid" | "responsive" | string | null;
          menu_data?: Json | null;
          pushed_at?: string;
          pushed_by?: string | null;
        };
        Update: {
          id?: string;
          tv_id?: string;
          image_url?: string;
          menu_mode?: "static" | "hybrid" | "responsive" | string | null;
          menu_data?: Json | null;
          pushed_at?: string;
          pushed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "menus_tv_id_fkey";
            columns: ["tv_id"];
            isOneToOne: false;
            referencedRelation: "tvs";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "api_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      screen_groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "screen_groups_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tv_group_memberships: {
        Row: {
          id: string;
          group_id: string;
          tv_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          tv_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          tv_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tv_group_memberships_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "screen_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tv_group_memberships_tv_id_fkey";
            columns: ["tv_id"];
            isOneToOne: false;
            referencedRelation: "tvs";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
