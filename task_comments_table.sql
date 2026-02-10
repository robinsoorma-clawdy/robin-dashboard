-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'robin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at ASC);

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Permissive policies
CREATE POLICY "Allow all select on task_comments" ON task_comments FOR SELECT USING (true);
CREATE POLICY "Allow all insert on task_comments" ON task_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on task_comments" ON task_comments FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on task_comments" ON task_comments FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
