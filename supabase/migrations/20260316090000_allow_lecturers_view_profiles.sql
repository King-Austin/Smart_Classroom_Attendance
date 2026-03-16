-- Allow lecturers to view student profiles for attendance verification
CREATE POLICY "Lecturers can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'lecturer'
  )
);
