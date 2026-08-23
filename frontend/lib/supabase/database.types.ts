export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          role: Database["public"]["Enums"]["app_role"];
          is_active: boolean;
          is_burson_operator: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          role: Database["public"]["Enums"]["app_role"];
          is_active?: boolean;
          is_burson_operator?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      app_sessions: {
        Row: {
          session_id: string;
          user_id: string;
          started_at: string;
          expires_at: string;
          revoked_at: string | null;
        };
        Insert: {
          session_id: string;
          user_id: string;
          started_at?: string;
          expires_at?: string;
          revoked_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["app_sessions"]["Insert"]>;
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          origin: Database["public"]["Enums"]["activity_origin"];
          created_by: string;
          created_by_role: Database["public"]["Enums"]["app_role"];
          responsible_id: string;
          responsible_name: string;
          type: Database["public"]["Enums"]["activity_type"];
          title: string;
          description: string;
          place: string;
          status: Database["public"]["Enums"]["activity_status"];
          material_link: string;
          operator_opinion: string;
          reference_link: string;
          version: number;
          idempotency_key: string | null;
          idempotency_hash: string | null;
          thread_opened_at: string | null;
          delivered_at: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          deletion_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      activity_date_spans: {
        Row: {
          id: number;
          activity_id: string;
          position: number;
          start_date: string;
          end_date: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: number;
          activity_id: string;
          actor_id: string;
          actor_name: string;
          actor_role: Database["public"]["Enums"]["app_role"];
          action: string;
          detail: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      register_app_session: { Args: Record<string, never>; Returns: undefined };
      revoke_current_app_session: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      create_activity_v1: {
        Args: {
          p_idempotency_key: string;
          p_type: Database["public"]["Enums"]["activity_type"];
          p_title: string;
          p_description: string;
          p_place: string;
          p_spans: Json;
          p_material_link: string;
          p_operator_opinion: string;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
          replayed: boolean;
        }[];
      };
      edit_activity_v1: {
        Args: {
          p_activity_id: string;
          p_expected_version: number;
          p_type: Database["public"]["Enums"]["activity_type"];
          p_title: string;
          p_description: string;
          p_place: string;
          p_spans: Json;
          p_material_link: string;
          p_operator_opinion: string;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
        }[];
      };
      advance_activity_v1: {
        Args: { p_activity_id: string; p_expected_version: number };
        Returns: {
          activity_id: string;
          activity_version: number;
          activity_status: Database["public"]["Enums"]["activity_status"];
        }[];
      };
    };
    Enums: {
      app_role: "operario" | "admin" | "burson";
      activity_status: "Programada" | "En proceso" | "Entregada";
      activity_type: "Grabación" | "Edición" | "Creatividad" | "Locución";
      activity_origin: "operario" | "burson";
    };
    CompositeTypes: Record<string, never>;
  };
};
