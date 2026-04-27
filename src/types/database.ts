export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      couple_members: {
        Row: {
          couple_id: string;
          id: string;
          joined_at: string;
          role: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Insert: {
          couple_id: string;
          id?: string;
          joined_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Update: {
          couple_id?: string;
          id?: string;
          joined_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
        ];
      };
      couples: {
        Row: {
          created_at: string;
          id: string;
          status: Database["public"]["Enums"]["couple_status"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["couple_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["couple_status"];
        };
        Relationships: [];
      };
      fixed_expense_instances: {
        Row: {
          couple_id: string;
          created_at: string;
          id: string;
          month: string;
          paid: boolean;
          template_id: string;
        };
        Insert: {
          couple_id: string;
          created_at?: string;
          id?: string;
          month: string;
          paid?: boolean;
          template_id: string;
        };
        Update: {
          couple_id?: string;
          created_at?: string;
          id?: string;
          month?: string;
          paid?: boolean;
          template_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fixed_expense_instances_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fixed_expense_instances_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "fixed_expense_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      fixed_expense_templates: {
        Row: {
          active: boolean;
          amount: number;
          couple_id: string;
          created_at: string;
          description: string;
          due_day: number;
          id: string;
        };
        Insert: {
          active?: boolean;
          amount: number;
          couple_id: string;
          created_at?: string;
          description: string;
          due_day: number;
          id?: string;
        };
        Update: {
          active?: boolean;
          amount?: number;
          couple_id?: string;
          created_at?: string;
          description?: string;
          due_day?: number;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fixed_expense_templates_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
        ];
      };
      incomes: {
        Row: {
          amount: number;
          couple_id: string;
          created_at: string;
          id: string;
          month: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          couple_id: string;
          created_at?: string;
          id?: string;
          month: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          couple_id?: string;
          created_at?: string;
          id?: string;
          month?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incomes_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
        ];
      };
      installment_purchases: {
        Row: {
          couple_id: string;
          created_at: string;
          description: string;
          first_payment_date: string;
          id: string;
          installments: number;
          paid_installments: number;
          total_amount: number;
        };
        Insert: {
          couple_id: string;
          created_at?: string;
          description: string;
          first_payment_date: string;
          id?: string;
          installments: number;
          paid_installments?: number;
          total_amount: number;
        };
        Update: {
          couple_id?: string;
          created_at?: string;
          description?: string;
          first_payment_date?: string;
          id?: string;
          installments?: number;
          paid_installments?: number;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "installment_purchases_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          couple_id: string;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          inviter_id: string;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          couple_id: string;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          inviter_id: string;
          token?: string;
        };
        Update: {
          accepted_at?: string | null;
          couple_id?: string;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          inviter_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
        ];
      };
      variable_expenses: {
        Row: {
          amount: number;
          couple_id: string;
          created_at: string;
          date: string;
          description: string;
          id: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          couple_id: string;
          created_at?: string;
          date?: string;
          description: string;
          id?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          couple_id?: string;
          created_at?: string;
          date?: string;
          description?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variable_expenses_couple_id_fkey";
            columns: ["couple_id"];
            isOneToOne: false;
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_couple_for_user: { Args: { p_user_id: string }; Returns: string };
      is_couple_member: { Args: { p_couple_id: string }; Returns: boolean };
    };
    Enums: {
      couple_status: "PENDING" | "ACTIVE";
      member_role: "OWNER" | "MEMBER";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      couple_status: ["PENDING", "ACTIVE"],
      member_role: ["OWNER", "MEMBER"],
    },
  },
} as const;
