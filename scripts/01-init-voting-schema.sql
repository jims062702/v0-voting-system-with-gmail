-- Create users table (extends Supabase auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create candidates table (party list or independent)
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  party_name TEXT NOT NULL,
  is_independent BOOLEAN DEFAULT FALSE,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create voting_status table
CREATE TABLE public.voting_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table (1 vote per user)
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Candidates table policies
CREATE POLICY "Anyone can view candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Only admins can insert candidates" ON public.candidates FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);
CREATE POLICY "Only admins can update candidates" ON public.candidates FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);
CREATE POLICY "Only admins can delete candidates" ON public.candidates FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- Voting status policies
CREATE POLICY "Anyone can view voting status" ON public.voting_status FOR SELECT USING (true);
CREATE POLICY "Only admins can update voting status" ON public.voting_status FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);
CREATE POLICY "Only admins can insert voting status" ON public.voting_status FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- Votes table policies
CREATE POLICY "Users can view their own votes" ON public.votes FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);
CREATE POLICY "Users can insert their own votes" ON public.votes FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "Users cannot update their votes" ON public.votes FOR UPDATE USING (false);
CREATE POLICY "Only admins can delete votes" ON public.votes FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- Create indexes for performance
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_candidate_id ON public.votes(candidate_id);
CREATE INDEX idx_users_role ON public.users(role);
