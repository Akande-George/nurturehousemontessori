-- Initial schema for Montessori Management Application

-- 1. Custom Types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');

-- 2. Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'parent',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Classrooms
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Classroom Teachers Map
CREATE TABLE public.classroom_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(classroom_id, teacher_id)
);

-- 5. Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  enrollment_status TEXT NOT NULL DEFAULT 'enrolled',
  avatar_url TEXT,
  allergies TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Student Parent Map
CREATE TABLE public.student_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, parent_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Draft)

-- Profiles: Users can read their own profile. Admins can read all.
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING ( auth.uid() = id );

-- Students: Parents can view their own children. Teachers can view their classroom students. Admins all.
-- This requires complex queries in production, keeping simple for initial setup.
CREATE POLICY "Parents can view own children" 
  ON public.students FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.student_parents 
      WHERE student_parents.student_id = students.id 
      AND student_parents.parent_id = auth.uid()
    )
  );

-- Create profile on signup (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', COALESCE((new.raw_user_meta_data->>'role')::user_role, 'parent'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
