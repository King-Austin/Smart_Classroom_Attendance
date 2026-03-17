-- Add bound_device_id to profiles for strict device binding
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bound_device_id TEXT;
