-- Relax Storage RLS for testing/enrollment
-- 1. Make buckets public
UPDATE storage.buckets SET public = true WHERE id IN ('face-enrollments', 'attendance-verifications');

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own enrollment image" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers can view all enrollment images" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload check-in images" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers can view session-related check-in images" ON storage.objects;

-- 3. Create permissive policies for development
CREATE POLICY "Public Access for face-enrollments"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'face-enrollments')
WITH CHECK (bucket_id = 'face-enrollments');

CREATE POLICY "Public Access for attendance-verifications"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'attendance-verifications')
WITH CHECK (bucket_id = 'attendance-verifications');
