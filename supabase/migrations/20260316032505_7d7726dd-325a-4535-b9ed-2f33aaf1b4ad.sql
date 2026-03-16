-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer')),
  reg_number TEXT UNIQUE,
  staff_id TEXT UNIQUE,
  level TEXT,
  semester TEXT,
  faculty TEXT,
  department TEXT,
  parent_phone TEXT,
  device_binding BOOLEAN DEFAULT false,
  device_info TEXT,
  face_enrolled BOOLEAN DEFAULT false,
  face_embeddings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  level TEXT NOT NULL,
  semester TEXT NOT NULL,
  department TEXT NOT NULL,
  faculty TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view courses" ON public.courses FOR SELECT TO authenticated USING (true);

-- Student course enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own enrollments" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Lecturer course assignments
CREATE TABLE public.course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lecturer_id, course_id)
);

ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecturers can view own assignments" ON public.course_assignments FOR SELECT USING (auth.uid() = lecturer_id);
CREATE POLICY "Lecturers can insert own assignments" ON public.course_assignments FOR INSERT WITH CHECK (auth.uid() = lecturer_id);

-- Attendance sessions
CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  lecturer_id UUID NOT NULL REFERENCES auth.users(id),
  day_number INTEGER NOT NULL,
  topic TEXT,
  verification_rules JSONB NOT NULL DEFAULT '{"face": true, "gps": true, "ble": true}',
  ble_token TEXT,
  lecturer_lat DOUBLE PRECISION,
  lecturer_lng DOUBLE PRECISION,
  geo_radius_meters INTEGER DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecturers can manage own sessions" ON public.attendance_sessions FOR ALL USING (auth.uid() = lecturer_id);
CREATE POLICY "Students can view active sessions" ON public.attendance_sessions FOR SELECT TO authenticated USING (status = 'active');

-- Attendance records
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id),
  face_score DOUBLE PRECISION,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  ble_rssi INTEGER,
  device_id TEXT,
  is_manual BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'failed', 'manual')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, session_id)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own records" ON public.attendance_records FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own records" ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Lecturers can view session records" ON public.attendance_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.attendance_sessions WHERE id = session_id AND lecturer_id = auth.uid())
);
CREATE POLICY "Lecturers can insert manual records" ON public.attendance_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.attendance_sessions WHERE id = session_id AND lecturer_id = auth.uid())
);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();