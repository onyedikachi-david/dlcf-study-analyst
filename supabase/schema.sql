-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  faculty TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  accountability_partner TEXT DEFAULT '',
  avatar_url TEXT
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- STUDY SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  week_start_date DATE NOT NULL,
  day_name TEXT NOT NULL,
  session_number INTEGER NOT NULL CHECK (session_number IN (1, 2, 3)),
  start_time TEXT NOT NULL,
  stop_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0 NOT NULL,
  topics TEXT DEFAULT '',
  self_rating INTEGER DEFAULT 0 CHECK (self_rating >= 0 AND self_rating <= 10),
  efficiency_notes TEXT DEFAULT ''
);

-- Create index for faster queries
CREATE INDEX idx_study_sessions_user_week ON study_sessions(user_id, week_start_date);

-- Enable RLS for study_sessions
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Study sessions policies
CREATE POLICY "Users can view their own study sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions"
  ON study_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TIMER SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS timer_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  subject TEXT NOT NULL,
  duration_mins INTEGER NOT NULL,
  elapsed_mins INTEGER NOT NULL,
  started_at BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('work', 'break')),
  status TEXT NOT NULL CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
  pomodoro_count INTEGER DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX idx_timer_sessions_user ON timer_sessions(user_id, created_at DESC);

-- Enable RLS for timer_sessions
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;

-- Timer sessions policies
CREATE POLICY "Users can view their own timer sessions"
  ON timer_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timer sessions"
  ON timer_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timer sessions"
  ON timer_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- LEADERBOARD ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  week_start_date DATE NOT NULL,
  name TEXT NOT NULL,
  faculty TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  total_minutes INTEGER NOT NULL,
  pinned_at BIGINT NOT NULL,
  cheers INTEGER DEFAULT 0,
  fire INTEGER DEFAULT 0,
  star INTEGER DEFAULT 0,
  heart INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  UNIQUE(user_id, week_start_date)
);

-- Create index for faster queries
CREATE INDEX idx_leaderboard_week ON leaderboard_entries(week_start_date, total_minutes DESC);

-- Enable RLS for leaderboard_entries
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Leaderboard policies
CREATE POLICY "Anyone can view leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own leaderboard entries"
  ON leaderboard_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entries"
  ON leaderboard_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can update reactions"
  ON leaderboard_entries FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- ARCHIVES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS archives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  week_start_date DATE NOT NULL,
  total_minutes INTEGER NOT NULL,
  most_studied_topic TEXT NOT NULL,
  rank_on_board INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}'
);

-- Create index for faster queries
CREATE INDEX idx_archives_user ON archives(user_id, week_start_date DESC);

-- Enable RLS for archives
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

-- Archives policies
CREATE POLICY "Users can view their own archives"
  ON archives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own archives"
  ON archives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REALTIME PUBLICATIONS
-- ============================================
-- Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard_entries;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Create avatars bucket (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Anyone can upload an avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can update their own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own avatar"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profiles.updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, faculty, department, level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'faculty', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'level', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
