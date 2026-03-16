-- Resolve infinite recursion detected in policy for relation "profiles"
-- This happens when a policy subquery references the same table it's protecting.
-- We'll consolidate into a single, simple policy for public visibility (view only).

-- 1. Drop all potentially conflicting SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Lecturers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profile viewing" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;

-- 2. Create one definitive, non-recursive policy for viewing
-- This allows any authenticated user to see profile details (Full Name, Reg Number, etc.)
CREATE POLICY "authenticated_view_all_profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);
