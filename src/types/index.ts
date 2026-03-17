import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Session = Database["public"]["Tables"]["attendance_sessions"]["Row"];
export type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"];
export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"];

export interface SessionWithDetails extends Session {
  courses?: {
    name: string;
    code: string;
  };
  lecturer?: {
    full_name: string;
  };
}

export interface AttendanceRecordWithProfile extends AttendanceRecord {
  profiles?: {
    full_name: string;
    reg_number: string;
  };
}

export type UserRole = "student" | "lecturer";

export interface DashboardStats {
  totalStudents: number;
  courseCount: number;
  avgRate: number;
}
