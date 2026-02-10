-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('task_created', 'task_moved', 'task_completed', 'task_deleted', 'task_updated')),
  task_id UUID,
  task_title TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  details TEXT,
  created_by TEXT NOT NULL DEFAULT 'robin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task_id ON activity_logs(task_id);

-- Create RLS policies (open access to match tasks table pattern)
CREATE POLICY "Enable read access for all users" ON activity_logs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON activity_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON activity_logs
  FOR DELETE USING (true);
