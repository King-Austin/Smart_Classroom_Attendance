-- Add avatar_url to profiles for student/lecturer profile pictures
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
