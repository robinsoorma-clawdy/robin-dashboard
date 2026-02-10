-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  category TEXT NOT NULL CHECK (category IN ('work', 'project', 'career', 'finance', 'personal')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL
);

-- Activity log table
CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notes FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
