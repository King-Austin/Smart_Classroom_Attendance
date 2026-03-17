import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  bound_device_id?: string | null;
};
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
  has_marked?: boolean;
  attendee_count?: number;
  attendance_records?: {
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
  }[];
}

export interface AttendanceRecordWithProfile extends AttendanceRecord {
  profiles?: {
    full_name: string;
    reg_number: string;
    avatar_url: string | null;
  };
}

export type UserRole = "student" | "lecturer";

export interface DashboardStats {
  totalStudents: number;
  courseCount: number;
  avgRate: number;
}
