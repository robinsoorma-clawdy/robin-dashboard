---
name: net-worth-sync
description: Sync daily stock/crypto prices to net worth tracker dashboard. Fetches closing prices from Yahoo Finance, calculates portfolio value, updates Supabase. Use when updating investment values, fetching stock prices, calculating net worth changes, or automating daily portfolio tracking.
metadata:
  {"openclaw": {"requires": {"env": ["SUPABASE_URL", "SUPABASE_ANON_KEY"]}, "primaryEnv": "SUPABASE_ANON_KEY"}}
---

# Net Worth Sync

Automatically fetch daily closing prices and update your net worth dashboard.

## Quick Start

```bash
# Fetch all tracked stocks and update net worth
python {baseDir}/scripts/fetch_prices.py

# Fetch specific tickers
python {baseDir}/scripts/fetch_prices.py --tickers AAPL,NVDA,MSFT

# Dry run (see what would update without writing)
python {baseDir}/scripts/fetch_prices.py --dry-run
```

## How It Works

1. Reads portfolio holdings from Supabase `portfolio_holdings` table
2. Fetches closing prices from Yahoo Finance (free API)
3. Calculates total value per position
4. Updates `net_worth_entries` with new investment total
5. Logs activity for audit trail

## Portfolio Holdings Schema

The skill expects this table structure:

```sql
CREATE TABLE portfolio_holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  shares DECIMAL(12, 4) NOT NULL,
  avg_cost DECIMAL(12, 2),
  category TEXT DEFAULT 'investments',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security

- **Read-only API**: Yahoo Finance public endpoints only
- **No credentials stored**: Uses your existing Supabase env vars
- **Local execution**: All processing happens on your machine
- **Audit trail**: Every update logged with timestamp

## Daily Automation

Add to your crons for daily 6 PM updates:

```json
{
  "name": "Daily Net Worth Sync",
  "schedule": {"kind": "cron", "expr": "0 18 * * *", "tz": "Australia/Perth"},
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "Run net-worth-sync skill to fetch daily closing prices and update the dashboard"
  }
}
```

## Manual Override

To manually update a specific holding:

```bash
python {baseDir}/scripts/fetch_prices.py --ticker AAPL --shares 50 --price 185.50
```

## Troubleshooting

See [references/api_docs.md](references/api_docs.md) for Yahoo Finance API details and rate limits.
