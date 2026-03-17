export const FACULTIES = ["Engineering"] as const;

export const DEPARTMENTS: Record<string, string[]> = {
  Engineering: ["Electronic and Computer Engineering"],
} as const;

export const LEVELS = ["100", "200", "300", "400", "500"] as const;

export const SEMESTERS = ["1st Semester", "2nd Semester"] as const;

export const DEFAULT_DEPARTMENT = "Electronic and Computer Engineering";
export const DEFAULT_FACULTY = "Engineering";

export const ATTENDANCE_STATUS = {
  VERIFIED: "verified",
  FAILED: "failed",
  PENDING: "pending",
  MANUAL: "manual",
} as const;

export const SESSION_STATUS = {
  ACTIVE: "active",
  ENDED: "ended",
} as const;
