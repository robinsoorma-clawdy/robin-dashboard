-- Portfolio Holdings Table
-- Tracks individual stock positions for net worth calculation

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  shares DECIMAL(12, 4) NOT NULL,
  avg_cost DECIMAL(12, 2),
  category TEXT DEFAULT 'investments',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_portfolio_holdings_ticker ON portfolio_holdings(ticker);

-- Enable RLS
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON portfolio_holdings FOR ALL USING (true) WITH CHECK (true);

-- Sample data (remove after testing)
INSERT INTO portfolio_holdings (ticker, shares, avg_cost, notes) VALUES
  ('AAPL', 10, 175.00, 'Apple Inc'),
  ('NVDA', 5, 450.00, 'NVIDIA Corp'),
  ('VTI', 25, 220.00, 'Vanguard Total Stock Market ETF');
