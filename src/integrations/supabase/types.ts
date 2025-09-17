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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      course_assessments: {
        Row: {
          assessment_type: string
          assessor_id: string | null
          certificate_url: string | null
          completion_date: string | null
          course_id: string
          created_at: string
          employee_id: string
          feedback: string | null
          grade: string | null
          id: string
          is_mandatory: boolean | null
          passing_score: number | null
          percentage: number | null
          status: string | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          assessment_type?: string
          assessor_id?: string | null
          certificate_url?: string | null
          completion_date?: string | null
          course_id: string
          created_at?: string
          employee_id: string
          feedback?: string | null
          grade?: string | null
          id?: string
          is_mandatory?: boolean | null
          passing_score?: number | null
          percentage?: number | null
          status?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          assessment_type?: string
          assessor_id?: string | null
          certificate_url?: string | null
          completion_date?: string | null
          course_id?: string
          created_at?: string
          employee_id?: string
          feedback?: string | null
          grade?: string | null
          id?: string
          is_mandatory?: boolean | null
          passing_score?: number | null
          percentage?: number | null
          status?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assessments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completion_date: string | null
          course_id: string
          created_at: string | null
          employee_id: string
          enrolled_date: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          course_id: string
          created_at?: string | null
          employee_id: string
          enrolled_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          course_id?: string
          created_at?: string | null
          employee_id?: string
          enrolled_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          content_path: string | null
          content_type: string | null
          content_url: string | null
          course_id: string
          created_at: string
          estimated_duration_minutes: number | null
          id: string
          module_description: string | null
          module_name: string
          module_order: number
          updated_at: string
        }
        Insert: {
          content_path?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id: string
          created_at?: string
          estimated_duration_minutes?: number | null
          id?: string
          module_description?: string | null
          module_name: string
          module_order: number
          updated_at?: string
        }
        Update: {
          content_path?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id?: string
          created_at?: string
          estimated_duration_minutes?: number | null
          id?: string
          module_description?: string | null
          module_name?: string
          module_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          completion_rule: string | null
          course_description: string | null
          course_name: string
          course_type: string | null
          created_at: string
          created_by: string | null
          difficulty_level: string | null
          id: string
          is_mandatory: boolean | null
          learning_objectives: string | null
          minimum_passing_percentage: number | null
          target_role: string | null
          updated_at: string
        }
        Insert: {
          completion_rule?: string | null
          course_description?: string | null
          course_name: string
          course_type?: string | null
          created_at?: string
          created_by?: string | null
          difficulty_level?: string | null
          id?: string
          is_mandatory?: boolean | null
          learning_objectives?: string | null
          minimum_passing_percentage?: number | null
          target_role?: string | null
          updated_at?: string
        }
        Update: {
          completion_rule?: string | null
          course_description?: string | null
          course_name?: string
          course_type?: string | null
          created_at?: string
          created_by?: string | null
          difficulty_level?: string | null
          id?: string
          is_mandatory?: boolean | null
          learning_objectives?: string | null
          minimum_passing_percentage?: number | null
          target_role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          employee_id: string
          file_path: string
          id: string
          is_verified: boolean | null
          updated_at: string
          uploaded_by: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          employee_id: string
          file_path: string
          id?: string
          is_verified?: boolean | null
          updated_at?: string
          uploaded_by: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          employee_id?: string
          file_path?: string
          id?: string
          is_verified?: boolean | null
          updated_at?: string
          uploaded_by?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_status: string
          date_of_joining: string | null
          department: string | null
          designation: string | null
          employee_code: string | null
          first_name: string | null
          id: string
          last_name: string | null
          manager_id: string | null
          phone: string | null
          role_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_status?: string
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          employee_code?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          manager_id?: string | null
          phone?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_status?: string
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          employee_code?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          manager_id?: string | null
          phone?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_evaluations: {
        Row: {
          areas_for_improvement: string | null
          communication_score: number | null
          employee_id: string
          evaluation_date: string | null
          evaluator_id: string
          id: string
          innovation_score: number | null
          milestone_id: string | null
          overall_score: number | null
          project_id: string
          quality_score: number | null
          strengths: string | null
          technical_score: number | null
          timeline_score: number | null
        }
        Insert: {
          areas_for_improvement?: string | null
          communication_score?: number | null
          employee_id: string
          evaluation_date?: string | null
          evaluator_id: string
          id?: string
          innovation_score?: number | null
          milestone_id?: string | null
          overall_score?: number | null
          project_id: string
          quality_score?: number | null
          strengths?: string | null
          technical_score?: number | null
          timeline_score?: number | null
        }
        Update: {
          areas_for_improvement?: string | null
          communication_score?: number | null
          employee_id?: string
          evaluation_date?: string | null
          evaluator_id?: string
          id?: string
          innovation_score?: number | null
          milestone_id?: string | null
          overall_score?: number | null
          project_id?: string
          quality_score?: number | null
          strengths?: string | null
          technical_score?: number | null
          timeline_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_evaluations_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_evaluations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completion_date: string | null
          created_at: string
          due_date: string | null
          id: string
          milestone_description: string | null
          milestone_name: string
          milestone_order: number
          project_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          milestone_description?: string | null
          milestone_name: string
          milestone_order: number
          project_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          milestone_description?: string | null
          milestone_name?: string
          milestone_order?: number
          project_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          deliverables: string | null
          duration_days: number | null
          id: string
          instructions: string | null
          project_description: string | null
          project_name: string
          project_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          deliverables?: string | null
          duration_days?: number | null
          id?: string
          instructions?: string | null
          project_description?: string | null
          project_name: string
          project_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          deliverables?: string | null
          duration_days?: number | null
          id?: string
          instructions?: string | null
          project_description?: string | null
          project_name?: string
          project_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          role_description: string | null
          role_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_description?: string | null
          role_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          role_description?: string | null
          role_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          attendees: Json | null
          course_id: string | null
          created_at: string
          created_by: string | null
          end_datetime: string
          id: string
          meeting_link: string | null
          meeting_platform: string | null
          session_name: string
          session_type: string | null
          start_datetime: string
          status: string | null
          trainer_id: string | null
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          end_datetime: string
          id?: string
          meeting_link?: string | null
          meeting_platform?: string | null
          session_name: string
          session_type?: string | null
          start_datetime: string
          status?: string | null
          trainer_id?: string | null
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          end_datetime?: string
          id?: string
          meeting_link?: string | null
          meeting_platform?: string | null
          session_name?: string
          session_type?: string | null
          start_datetime?: string
          status?: string | null
          trainer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_trainer_id_fkey"
            columns: ["trainer_id"]
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
      check_course_completion: {
        Args: { p_course_id: string; p_employee_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
