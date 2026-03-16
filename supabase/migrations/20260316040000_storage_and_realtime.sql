-- Enable Realtime for attendance_records
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('face-enrollments', 'face-enrollments', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('attendance-verifications', 'attendance-verifications', false);

-- Storage RLS Policies
-- face-enrollments: students can upload their own, lecturer can view all
CREATE POLICY "Users can upload their own enrollment image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'face-enrollments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Lecturers can view all enrollment images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'face-enrollments' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'lecturer'
));

-- attendance-verifications: students can upload their own check-in images
CREATE POLICY "Students can upload check-in images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attendance-verifications' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Lecturers can view session-related check-in images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attendance-verifications' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'lecturer'
));

-- Refine foreign keys to point to public.profiles for easier joining
-- Update attendance_sessions lecturer_id to point to public.profiles
ALTER TABLE public.attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_lecturer_id_fkey;
ALTER TABLE public.attendance_sessions ADD CONSTRAINT attendance_sessions_lecturer_id_fkey 
  FOREIGN KEY (lecturer_id) REFERENCES public.profiles(id);

-- Update attendance_records student_id to point to public.profiles
ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id);
