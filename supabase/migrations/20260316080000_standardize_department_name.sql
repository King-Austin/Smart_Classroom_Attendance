-- Standardize department name to "Electronic and Computer Engineering"
UPDATE public.courses 
SET department = 'Electronic and Computer Engineering' 
WHERE department = 'Electronics and Computer Engineering';

-- Update any existing profiles too just in case
UPDATE public.profiles
SET department = 'Electronic and Computer Engineering'
WHERE department = 'Electronics and Computer Engineering';
