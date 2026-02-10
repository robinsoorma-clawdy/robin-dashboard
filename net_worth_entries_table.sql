-- Net Worth Entries Table
-- Tracks net worth across different asset categories over time

CREATE TABLE IF NOT EXISTS net_worth_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN ('salary', 'super', 'investments', 'cash', 'crypto', 'property', 'other')),
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL DEFAULT 'robin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date-range queries
CREATE INDEX idx_net_worth_entries_date ON net_worth_entries(date DESC);
CREATE INDEX idx_net_worth_entries_category ON net_worth_entries(category);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_net_worth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER net_worth_entries_updated_at
  BEFORE UPDATE ON net_worth_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_net_worth_updated_at();

-- Enable Row Level Security
ALTER TABLE net_worth_entries ENABLE ROW LEVEL SECURITY;

-- Permissive policies (matching existing pattern)
CREATE POLICY "Allow all reads on net_worth_entries"
  ON net_worth_entries FOR SELECT USING (true);

CREATE POLICY "Allow all inserts on net_worth_entries"
  ON net_worth_entries FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all updates on net_worth_entries"
  ON net_worth_entries FOR UPDATE USING (true);

CREATE POLICY "Allow all deletes on net_worth_entries"
  ON net_worth_entries FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE net_worth_entries;

-- Seed with initial placeholder data
INSERT INTO net_worth_entries (date, category, amount, notes, created_by) VALUES
  ('2025-01-01', 'salary', 80000, 'Annual salary', 'robin'),
  ('2025-01-01', 'super', 35000, 'Superannuation balance', 'robin'),
  ('2025-01-01', 'investments', 15000, 'Stock portfolio', 'robin'),
  ('2025-01-01', 'cash', 25000, 'Savings accounts', 'robin'),
  ('2025-01-01', 'crypto', 5000, 'Bitcoin + ETH', 'robin'),
  ('2025-01-01', 'property', 0, 'No property yet', 'robin'),
  ('2025-02-01', 'salary', 80000, 'Annual salary', 'robin'),
  ('2025-02-01', 'super', 36200, 'Employer contributions', 'robin'),
  ('2025-02-01', 'investments', 15800, 'Market gains', 'robin'),
  ('2025-02-01', 'cash', 27500, 'Savings growth', 'robin'),
  ('2025-02-01', 'crypto', 5200, 'Slight gain', 'robin'),
  ('2025-03-01', 'salary', 80000, 'Annual salary', 'robin'),
  ('2025-03-01', 'super', 37400, 'Employer contributions', 'robin'),
  ('2025-03-01', 'investments', 16500, 'Market gains', 'robin'),
  ('2025-03-01', 'cash', 30000, 'Savings growth', 'robin'),
  ('2025-03-01', 'crypto', 4800, 'Market dip', 'robin'),
  ('2025-04-01', 'salary', 80000, 'Annual salary', 'robin'),
  ('2025-04-01', 'super', 38600, 'Employer contributions', 'robin'),
  ('2025-04-01', 'investments', 17200, 'Steady growth', 'robin'),
  ('2025-04-01', 'cash', 32000, 'Savings growth', 'robin'),
  ('2025-04-01', 'crypto', 5500, 'Recovery', 'robin'),
  ('2025-05-01', 'salary', 80000, 'Annual salary', 'robin'),
  ('2025-05-01', 'super', 39800, 'Employer contributions', 'robin'),
  ('2025-05-01', 'investments', 18000, 'Steady growth', 'robin'),
  ('2025-05-01', 'cash', 34000, 'Savings growth', 'robin'),
  ('2025-05-01', 'crypto', 6000, 'Bull run', 'robin'),
  ('2025-06-01', 'salary', 80000, 'Annual salary', 'robin'),
  ('2025-06-01', 'super', 41000, 'Employer contributions', 'robin'),
  ('2025-06-01', 'investments', 19500, 'Dividend reinvestment', 'robin'),
  ('2025-06-01', 'cash', 36000, 'Savings growth', 'robin'),
  ('2025-06-01', 'crypto', 6200, 'Holding steady', 'robin');
