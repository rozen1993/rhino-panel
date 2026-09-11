import type { AunorViews } from "@/lib/aunor";

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
          can_create_own_activities: boolean;
          must_change_password: boolean;
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
          can_create_own_activities?: boolean;
          must_change_password?: boolean;
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
          place: string;
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
      activity_messages: {
        Row: {
          id: string;
          activity_id: string;
          author_id: string;
          author_name: string;
          author_role: Database["public"]["Enums"]["app_role"];
          body: string;
          opens_thread: boolean;
          version: number;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      account_audit_events: {
        Row: {
          id: number;
          target_profile_id: string;
          actor_id: string;
          actor_name: string;
          action: string;
          detail: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: AunorViews;
    Functions: {
      access_directory_v1: {
        Args: Record<string, never>;
        Returns: { username: string; display_name: string; role: string }[];
      };
      aunor_mutate_v1: {
        Args: { p_command: string; p_activity_id: string; p_request_id: string; p_payload: Json };
        Returns: Json;
      };
      register_app_session: { Args: Record<string, never>; Returns: undefined };
      revoke_current_app_session: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      plan_activity_v2: Database["public"]["Functions"]["plan_activity_v1"];
      create_own_activity_v2: Database["public"]["Functions"]["create_own_activity_v1"];
      replan_activity_v2: Database["public"]["Functions"]["replan_activity_v1"];
      create_burson_request_v2: Database["public"]["Functions"]["create_burson_request_v1"];
      plan_activity_v1: {
        Args: {
          p_idempotency_key: string;
          p_responsible_id: string;
          p_type: Database["public"]["Enums"]["activity_type"];
          p_title: string;
          p_description: string;
          p_place: string;
          p_spans: Json;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
          replayed: boolean;
        }[];
      };
      create_own_activity_v1: {
        Args: {
          p_idempotency_key: string;
          p_type: Database["public"]["Enums"]["activity_type"];
          p_title: string;
          p_description: string;
          p_place: string;
          p_spans: Json;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
          replayed: boolean;
        }[];
      };
      create_burson_request_v1: {
        Args: {
          p_idempotency_key: string;
          p_type: Database["public"]["Enums"]["activity_type"];
          p_title: string;
          p_description: string;
          p_place: string;
          p_spans: Json;
          p_reference_link: string;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
          replayed: boolean;
        }[];
      };
      replan_activity_v1: {
        Args: {
          p_activity_id: string;
          p_expected_version: number;
          p_responsible_id: string;
          p_type: Database["public"]["Enums"]["activity_type"];
          p_title: string;
          p_description: string;
          p_place: string;
          p_spans: Json;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
        }[];
      };
      update_execution_v1: {
        Args: {
          p_activity_id: string;
          p_expected_version: number;
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
      soft_delete_activity_v1: {
        Args: {
          p_activity_id: string;
          p_expected_version: number;
          p_reason: string;
        };
        Returns: { activity_id: string; activity_version: number; deleted_at: string }[];
      };
      reset_activity_v1: {
        Args: {
          p_activity_id: string;
          p_expected_version: number;
          p_reason: string;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
        }[];
      };
      restore_activity_v1: {
        Args: {
          p_activity_id: string;
          p_expected_version: number;
          p_responsible_id: string | null;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
          responsible_id: string;
        }[];
      };
      post_activity_message_v1: {
        Args: {
          p_activity_id: string;
          p_expected_activity_version: number | null;
          p_body: string;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
          message_id: string;
          message_version: number;
          opened_at: string;
        }[];
      };
      edit_activity_message_v1: {
        Args: {
          p_message_id: string;
          p_expected_message_version: number;
          p_body: string;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
          message_id: string;
          message_version: number;
        }[];
      };
      delete_activity_message_v1: {
        Args: {
          p_message_id: string;
          p_expected_message_version: number;
        };
        Returns: {
          activity_id: string;
          activity_version: number;
          message_id: string;
          message_version: number;
        }[];
      };
      set_operator_creation_permission_v1: {
        Args: { p_operator_id: string; p_enabled: boolean };
        Returns: {
          profile_id: string;
          can_create_own_activities: boolean;
        }[];
      };
      create_account_profile_v1: {
        Args: {
          p_profile_id: string;
          p_username: string;
          p_display_name: string;
          p_role: Database["public"]["Enums"]["app_role"];
          p_is_burson_operator: boolean;
          p_can_create_own_activities: boolean;
          p_actor_id: string;
        };
        Returns: {
          profile_id: string;
          profile_updated_at: string;
        }[];
      };
      update_account_v1: {
        Args: {
          p_profile_id: string;
          p_expected_updated_at: string;
          p_display_name: string;
          p_role: Database["public"]["Enums"]["app_role"];
          p_is_active: boolean;
          p_is_burson_operator: boolean;
          p_can_create_own_activities: boolean;
        };
        Returns: {
          profile_id: string;
          profile_updated_at: string;
        }[];
      };
      prepare_temporary_password_reset_v1: {
        Args: { p_profile_id: string; p_actor_id: string };
        Returns: { profile_id: string }[];
      };
      confirm_temporary_password_reset_v1: {
        Args: { p_profile_id: string; p_actor_id: string };
        Returns: { profile_id: string }[];
      };
      complete_temporary_password_change_v1: {
        Args: { p_profile_id: string };
        Returns: { profile_id: string }[];
      };
    };
    Enums: {
      app_role: "operario" | "admin" | "burson" | "aunor";
      activity_status: "Programada" | "En proceso" | "Entregada";
      activity_type: "Grabación" | "Edición" | "Creatividad" | "Locución";
      activity_origin: "operario" | "burson";
    };
    CompositeTypes: Record<string, never>;
  };
};
