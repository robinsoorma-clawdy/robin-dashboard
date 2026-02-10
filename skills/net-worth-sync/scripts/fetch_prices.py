#!/usr/bin/env python3
"""
Fetch daily closing prices from Yahoo Finance and update net worth tracker.
Security: Read-only public API, no auth required. Uses existing Supabase creds.
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import Dict, List, Optional
import urllib.request
import urllib.error

# Supabase REST API endpoint
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")


def fetch_yahoo_price(ticker: str) -> Optional[float]:
    """Fetch latest closing price from Yahoo Finance (public API)."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1d"
    
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            
            result = data.get("chart", {}).get("result", [{}])[0]
            meta = result.get("meta", {})
            
            # Try regularMarketPrice first, fall back to previousClose
            price = meta.get("regularMarketPrice") or meta.get("previousClose")
            return float(price) if price else None
            
    except Exception as e:
        print(f"Error fetching {ticker}: {e}", file=sys.stderr)
        return None


def get_portfolio_holdings() -> List[Dict]:
    """Fetch portfolio holdings from Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL and SUPABASE_ANON_KEY required", file=sys.stderr)
        return []
    
    url = f"{SUPABASE_URL}/rest/v1/portfolio_holdings?select=*"
    
    try:
        req = urllib.request.Request(
            url,
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching holdings: {e}", file=sys.stderr)
        return []


def update_net_worth_entry(category: str, amount: float, notes: str = "") -> bool:
    """Update net_worth_entries table in Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Check if entry exists for today
    check_url = f"{SUPABASE_URL}/rest/v1/net_worth_entries?date=eq.{today}&category=eq.{category}"
    
    try:
        # First check for existing entry
        req = urllib.request.Request(
            check_url,
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            }
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            existing = json.loads(response.read().decode())
        
        if existing:
            # Update existing
            update_url = f"{SUPABASE_URL}/rest/v1/net_worth_entries?id=eq.{existing[0]['id']}"
            data = json.dumps({
                "amount": amount,
                "notes": notes,
                "updated_at": datetime.now().isoformat()
            }).encode()
            
            req = urllib.request.Request(
                update_url,
                data=data,
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                method="PATCH"
            )
        else:
            # Insert new
            insert_url = f"{SUPABASE_URL}/rest/v1/net_worth_entries"
            data = json.dumps({
                "date": today,
                "category": category,
                "amount": amount,
                "notes": notes,
                "created_by": "clawdius"
            }).encode()
            
            req = urllib.request.Request(
                insert_url,
                data=data,
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                method="POST"
            )
        
        with urllib.request.urlopen(req, timeout=10):
            return True
            
    except Exception as e:
        print(f"Error updating net worth: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Fetch stock prices and update net worth")
    parser.add_argument("--tickers", help="Comma-separated tickers (default: from portfolio)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without updating")
    parser.add_argument("--ticker", help="Single ticker for manual update")
    parser.add_argument("--shares", type=float, help="Shares for manual update")
    parser.add_argument("--price", type=float, help="Price for manual update")
    
    args = parser.parse_args()
    
    print(f"🔄 Net Worth Sync - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("-" * 50)
    
    holdings = []
    
    if args.ticker and args.shares and args.price:
        # Manual override mode
        holdings = [{"ticker": args.ticker, "shares": args.shares, "price": args.price}]
    else:
        # Fetch from portfolio
        holdings = get_portfolio_holdings()
    
    if not holdings:
        print("No holdings found. Add stocks to portfolio_holdings table first.")
        return
    
    total_value = 0.0
    updates = []
    
    for holding in holdings:
        ticker = holding.get("ticker", "")
        shares = float(holding.get("shares", 0))
        
        # Use provided price or fetch from Yahoo
        price = holding.get("price") or fetch_yahoo_price(ticker)
        
        if price and shares:
            value = shares * price
            total_value += value
            updates.append({
                "ticker": ticker,
                "shares": shares,
                "price": price,
                "value": value
            })
            print(f"  {ticker}: {shares} shares × ${price:.2f} = ${value:,.2f}")
        else:
            print(f"  {ticker}: ⚠️ Could not fetch price")
    
    print("-" * 50)
    print(f"Total Investment Value: ${total_value:,.2f}")
    
    if args.dry_run:
        print("\n[DRY RUN] No changes made to database")
        return
    
    # Update net worth entry
    notes = f"Updated {len(updates)} positions: " + ", ".join(
        f"{u['ticker']}(${u['price']:.2f})" for u in updates[:3]
    )
    if len(updates) > 3:
        notes += f" +{len(updates)-3} more"
    
    if update_net_worth_entry("investments", total_value, notes):
        print(f"\n✅ Updated net_worth_entries: investments = ${total_value:,.2f}")
    else:
        print(f"\n❌ Failed to update database")
        sys.exit(1)


if __name__ == "__main__":
    main()
