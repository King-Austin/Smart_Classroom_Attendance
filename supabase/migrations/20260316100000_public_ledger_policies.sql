-- Enable public read access for profiles and attendance records to support the Public Ledger feature
-- Note: This is read-only and restricted to authenticated users.

-- 1. Profiles: Allow all authenticated users to view names/registration numbers
CREATE POLICY "Public profile viewing" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Attendance Records: Allow all authenticated users to see who was present for sessions
CREATE POLICY "Public attendance ledger viewing" 
ON public.attendance_records 
FOR SELECT 
TO authenticated 
USING (true);
