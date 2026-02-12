-- =============================================
-- Kişisel Ajanda - Supabase Database Schema
-- =============================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'waiting', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  tags TEXT[] DEFAULT '{}',
  start_date DATE,
  due_date DATE,
  estimated_hours REAL,
  actual_hours REAL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  repeat_rule TEXT DEFAULT 'none' CHECK (repeat_rule IN ('none', 'daily', 'weekly', 'monthly')),
  depends_on UUID REFERENCES tasks(id) ON DELETE SET NULL,
  archived BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transactions (finance)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  note TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  repeat_rule TEXT DEFAULT 'none' CHECK (repeat_rule IN ('none', 'daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL CHECK (target_amount > 0),
  current_saved REAL DEFAULT 0,
  target_date DATE,
  monthly_plan_amount REAL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Goal Transactions
CREATE TABLE IF NOT EXISTS goal_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT DEFAULT ''
);

-- 7. Task Notes
CREATE TABLE IF NOT EXISTS task_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  content TEXT DEFAULT '',
  color TEXT DEFAULT '#fef3c7',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  importance TEXT DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high')),
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  repeat_rule TEXT DEFAULT 'none' CHECK (repeat_rule IN ('none', 'daily', 'weekly', 'monthly')),
  linked_type TEXT CHECK (linked_type IN ('task', 'goal', 'note')),
  linked_id UUID,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
  monthly_income_estimate REAL DEFAULT 15000,
  notification_email BOOLEAN DEFAULT FALSE,
  notification_in_app BOOLEAN DEFAULT TRUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  accent_palette TEXT DEFAULT 'violet',
  custom_palettes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Generic RLS policies for all user-data tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['projects', 'tasks', 'transactions', 'goals', 'goal_transactions', 'task_notes', 'notes', 'reminders'])
  LOOP
    EXECUTE format('CREATE POLICY "Users can view own %1$s" ON %1$s FOR SELECT USING (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %1$s" ON %1$s FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "Users can update own %1$s" ON %1$s FOR UPDATE USING (auth.uid() = user_id)', tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %1$s" ON %1$s FOR DELETE USING (auth.uid() = user_id)', tbl);
  END LOOP;
END
$$;

-- User settings
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_datetime ON reminders(datetime);
