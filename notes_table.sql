-- Create notes table for persistence
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT DEFAULT 'robin'
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations (simplest for now)
CREATE POLICY "Enable all access" ON notes
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default note if none exists
INSERT INTO notes (content, updated_by)
SELECT '', 'robin'
WHERE NOT EXISTS (SELECT 1 FROM notes);
