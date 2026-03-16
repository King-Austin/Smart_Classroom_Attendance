-- Ensure profiles.reg_number is unique
-- This migration ensures that if the constraint was somehow missed or removed, it is explicitly reapplied.

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'profiles_reg_number_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_reg_number_key UNIQUE (reg_number);
    END IF;
END $$;

-- Also ensuring staff_id is unique for lecturers
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'profiles_staff_id_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_staff_id_key UNIQUE (staff_id);
    END IF;
END $$;
