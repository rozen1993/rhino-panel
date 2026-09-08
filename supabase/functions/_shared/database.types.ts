export type EdgeDatabase = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          role: EdgeDatabase["public"]["Enums"]["app_role"];
          is_active: boolean;
          is_burson_operator: boolean;
          can_create_own_activities: boolean;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_account_profile_v1: {
        Args: {
          p_profile_id: string;
          p_username: string;
          p_display_name: string;
          p_role: EdgeDatabase["public"]["Enums"]["app_role"];
          p_is_burson_operator: boolean;
          p_can_create_own_activities: boolean;
          p_actor_id: string;
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
    };
    CompositeTypes: Record<string, never>;
  };
};
