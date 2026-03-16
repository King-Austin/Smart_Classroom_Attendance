-- Universal Read Access Migration
-- This migration simplifies the security architecture by allowing any authenticated user 
-- to view data across all system tables. Write permissions remain strictly controlled.

-- List of tables to apply universal read access to
DO $$ 
DECLARE 
    t text;
    tables_to_update text[] := ARRAY['profiles', 'courses', 'enrollments', 'course_assignments', 'attendance_sessions', 'attendance_records'];
BEGIN 
    FOREACH t IN ARRAY tables_to_update LOOP
        -- 1. Drop all existing SELECT policies for the table
        EXECUTE format('DROP POLICY IF EXISTS "Public profile viewing" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Lecturers can view all profiles" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view own profile" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "authenticated_view_all_profiles" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Anyone authenticated can view courses" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Students can view own enrollments" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public enrollment viewing" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Lecturers can view own assignments" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Students can view active sessions" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Students can view own records" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Lecturers can view session records" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public attendance ledger viewing" ON public.%I', t);
        
        -- Generic drop for any previous attempts at naming these
        EXECUTE format('DROP POLICY IF EXISTS "Universal read access" ON public.%I', t);

        -- 2. Create the one definitive policy
        EXECUTE format('CREATE POLICY "Universal read access" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    END LOOP;
END $$;
