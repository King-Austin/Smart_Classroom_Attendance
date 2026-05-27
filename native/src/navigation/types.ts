/**
 * Smart Campus Presence — Navigation ParamList types
 *
 * Every navigator in the app is typed here so that
 * `useNavigation` / `useRoute` calls are fully type-safe.
 */

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

/**
 * The top-level stack.  Exactly one of these is shown at a time depending on
 * the user's auth state and role.
 */
export type RootStackParamList = {
  /** Unauthenticated flow */
  AuthStack: undefined;
  /** Authenticated student tabs */
  StudentTabs: undefined;
  /** Authenticated lecturer tabs */
  LecturerTabs: undefined;
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Screens available to unauthenticated users.
 * RegisterStack is a nested navigator — its own ParamList is below.
 */
export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  /** Nested student-registration flow */
  RegisterStack: undefined;
  LecturerRegister: undefined;
};

/**
 * Shared registration data passed between registration steps.
 */
export type StudentRegistrationParams = {
  fullName: string;
  email: string;
  password: string;
  regNumber: string;
  faculty: string;
  department: string;
  level: string;
  semester: string;
};

/**
 * The multi-step student registration sub-stack.
 */
export type RegisterStackParamList = {
  BasicInfo: undefined;
  CourseSelect: StudentRegistrationParams;
  FaceEnroll: StudentRegistrationParams & { courseIds: string[] };
};

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

/**
 * Screens accessible from within the Student "Home" tab.
 * The root is the dashboard; sessions push on top of it.
 */
export type StudentStackParamList = {
  StudentDashboard: undefined;
  AttendanceVerification: { sessionId: string };
  /**
   * sessionId is optional: when accessed from the History tab there is no
   * specific session — the screen shows the full personal history instead.
   */
  AttendanceLedger: { sessionId?: string };
};

// ---------------------------------------------------------------------------
// Lecturer
// ---------------------------------------------------------------------------

/**
 * Screens accessible from within the Lecturer "Dashboard" tab.
 */
export type LecturerStackParamList = {
  LecturerDashboard: undefined;
  CreateSession: undefined;
  LiveSession: { sessionId: string };
};
