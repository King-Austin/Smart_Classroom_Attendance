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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          ble_rssi: number | null
          created_at: string
          device_id: string | null
          face_score: number | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          is_manual: boolean | null
          reason: string | null
          session_id: string
          status: string
          student_id: string
        }
        Insert: {
          ble_rssi?: number | null
          created_at?: string
          device_id?: string | null
          face_score?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          is_manual?: boolean | null
          reason?: string | null
          session_id: string
          status?: string
          student_id: string
        }
        Update: {
          ble_rssi?: number | null
          created_at?: string
          device_id?: string | null
          face_score?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          is_manual?: boolean | null
          reason?: string | null
          session_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          ble_token: string | null
          course_id: string
          created_at: string
          day_number: number
          ended_at: string | null
          geo_radius_meters: number | null
          id: string
          lecturer_id: string
          lecturer_lat: number | null
          lecturer_lng: number | null
          started_at: string
          status: string
          topic: string | null
          verification_rules: Json
        }
        Insert: {
          ble_token?: string | null
          course_id: string
          created_at?: string
          day_number: number
          ended_at?: string | null
          geo_radius_meters?: number | null
          id?: string
          lecturer_id: string
          lecturer_lat?: number | null
          lecturer_lng?: number | null
          started_at?: string
          status?: string
          topic?: string | null
          verification_rules?: Json
        }
        Update: {
          ble_token?: string | null
          course_id?: string
          created_at?: string
          day_number?: number
          ended_at?: string | null
          geo_radius_meters?: number | null
          id?: string
          lecturer_id?: string
          lecturer_lat?: number | null
          lecturer_lng?: number | null
          started_at?: string
          status?: string
          topic?: string | null
          verification_rules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lecturer_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lecturer_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lecturer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          department: string
          faculty: string
          id: string
          level: string
          name: string
          semester: string
        }
        Insert: {
          code: string
          created_at?: string
          department: string
          faculty: string
          id?: string
          level: string
          name: string
          semester: string
        }
        Update: {
          code?: string
          created_at?: string
          department?: string
          faculty?: string
          id?: string
          level?: string
          name?: string
          semester?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          device_binding: boolean | null
          device_info: string | null
          face_embeddings: Json | null
          face_enrolled: boolean | null
          faculty: string | null
          full_name: string
          id: string
          level: string | null
          parent_phone: string | null
          reg_number: string | null
          role: string
          semester: string | null
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          device_binding?: boolean | null
          device_info?: string | null
          face_embeddings?: Json | null
          face_enrolled?: boolean | null
          faculty?: string | null
          full_name: string
          id: string
          level?: string | null
          parent_phone?: string | null
          reg_number?: string | null
          role: string
          semester?: string | null
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          device_binding?: boolean | null
          device_info?: string | null
          face_embeddings?: Json | null
          face_enrolled?: boolean | null
          faculty?: string | null
          full_name?: string
          id?: string
          level?: string | null
          parent_phone?: string | null
          reg_number?: string | null
          role?: string
          semester?: string | null
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
