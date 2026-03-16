-- Enable public read access for enrollments to support accurate student counts in the Live Monitor
-- This allows lecturers to see the total number of students enrolled in their courses.

CREATE POLICY "Public enrollment viewing" 
ON public.enrollments 
FOR SELECT 
TO authenticated 
USING (true);
