-- Add missing columns and unique constraint to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS credit_units INTEGER;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.courses ADD CONSTRAINT courses_code_unique UNIQUE (code);

-- Clear existing mock courses if any (optional, but good for testing)
-- DELETE FROM public.courses;

-- Seed Electronics and Computer Engineering Courses
INSERT INTO public.courses (code, name, level, semester, credit_units, department, faculty, category)
VALUES
('MAT101', 'General Mathematics', '100', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('PHY101', 'General Physics', '100', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ICH111', 'Inorganic Chemistry', '100', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ICH101', 'Organic Chemistry', '100', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG101', 'Engineering Mathematics', '100', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('PHY107', 'Practical Physics', '100', '1st Semester', 1, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('BUS101', 'Introduction To Business', '100', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('GST101', 'English', '100', '1st Semester', 1, 'Electronics and Computer Engineering', 'Engineering', 'gss'),
('GST109', 'Igbo', '100', '1st Semester', 1, 'Electronics and Computer Engineering', 'Engineering', 'gss'),
('GST107', 'Nigeria People And Culture', '100', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'gss'),
('GST105', 'Humanity', '100', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'gss'),

('MAT102', 'General Mathematics 2', '100', '2nd Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('PHY102', 'General Physics 2', '100', '2nd Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ICH102', 'Physical Chemistry', '100', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ICH112', 'Practical Chemistry', '100', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('PHY108', 'Practical Physics', '100', '2nd Semester', 1, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG102', 'Engineering Mathematics 2', '100', '2nd Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG103', 'Circuit Theory 1', '100', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('GST102', 'English', '100', '2nd Semester', 1, 'Electronics and Computer Engineering', 'Engineering', 'gss'),
('GST110', 'Igbo', '100', '2nd Semester', 1, 'Electronics and Computer Engineering', 'Engineering', 'gss'),
('GST106', 'Social Science', '100', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'gss'),

('FEG201', 'Basic Electricity 1', '200', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG211', 'Applied Mechanics', '200', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG250', 'Principles Of Material', '200', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG221', 'Fluid Mechanics', '200', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG213', 'Engineering Drawing', '200', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ICH221', 'Applied Chemistry', '200', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('CSC201', 'Computer Programming 1', '200', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('MAT201', 'Linear Algebra', '200', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG281', 'Workshop Practice', '200', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),

('MAT202', 'Elementary Mathematics', '200', '2nd Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG202', 'Basic Electricity 2', '200', '2nd Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG212', 'Applied Mechanics 2', '200', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG242', 'Thermodynamics', '200', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG282', 'Workshop Practice 2', '200', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG215', 'Strength Of Material', '200', '2nd Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG214', 'Engineering Drawing 2', '200', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('BUS204', 'Principles Of Management', '200', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG280', 'Engineers In Society', '200', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('CSC202', 'Computer Programming 2', '200', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),

('GST301', 'Entrepreneurship', '300', '1st Semester', 1, 'Electronics and Computer Engineering', 'Engineering', 'gss'),
('ECE333', 'Digital System 1', '300', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE331', 'Signals And Systems', '300', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE323', 'Electronic Devices And Circuits', '300', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE321', 'Principles Of Telecommunications 1', '300', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE353', 'Power System', '300', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE343', 'Electromechanical Device And Machine', '300', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE341', 'Electromagnetic Field And Wave', '300', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE311', 'Circuit Theory 1', '300', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG303', 'Engineering Mathematics 3', '300', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),

('ELE312', 'Circuit Theory 3', '300', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE372', 'Instrumentation And Measurement', '300', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE382', 'Feedback And Control System', '300', '2nd Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE344', 'Electromechanical Device And Machine 2', '300', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE342', 'Electrodynamics', '300', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE328', 'Electronics Device And Circuit 2', '300', '2nd Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE334', 'Digital System Design 2', '300', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE322', 'Principles Of Telecommunications 2', '300', '2nd Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE326', 'Physical Electronics', '300', '2nd Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),

('ECE427', 'Advanced Circuit Technique', '400', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE431', 'Fundamental Of Digital Communication', '400', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE403', 'Circuit Theory IV', '400', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ELE473', 'Instrumentation And Measurements', '400', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE421', 'Assembly Language Programming', '400', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE405', 'Microprocessors And Microcomputers', '400', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('CVE421', 'Engineering Contract And Specification', '400', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('FEG404', 'Engineering Mathematics IV', '400', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),

('FEG400', 'Industrial Training (SIWES)', '400', '2nd Semester', 6, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),

('ECE505', 'Computer Aided Design', '500', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE537', 'Digital Signal Processing', '500', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE517', 'Real Time Computing And Control', '500', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE527', 'Solid State Electronics', '500', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE539', 'Computer Architecture And Organisation', '500', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE541', 'AI And Robotics', '500', '1st Semester', 3, 'Electronics and Computer Engineering', 'Engineering', 'faculty'),
('ECE500-SEM', 'Seminar', '500', '1st Semester', 2, 'Electronics and Computer Engineering', 'Engineering', 'faculty')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  semester = EXCLUDED.semester,
  credit_units = EXCLUDED.credit_units,
  department = EXCLUDED.department,
  faculty = EXCLUDED.faculty,
  category = EXCLUDED.category;
