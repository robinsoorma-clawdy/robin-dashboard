-- Enable Row Level Security
alter table if exists tasks enable row level security;

-- Drop existing table if recreating
-- drop table if exists tasks;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  category TEXT NOT NULL CHECK (category IN ('work', 'project', 'career', 'finance', 'personal')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- Enable realtime
alter publication supabase_realtime add table tasks;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON tasks
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON tasks
  FOR DELETE USING (true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
