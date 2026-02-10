# Yahoo Finance API Documentation

## Endpoint
```
https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}?interval=1d&range=1d
```

## Response Format
```json
{
  "chart": {
    "result": [{
      "meta": {
        "regularMarketPrice": 185.50,
        "previousClose": 183.20,
        "currency": "USD",
        "symbol": "AAPL"
      }
    }]
  }
}
```

## Rate Limits
- **Unauthenticated**: ~2,000 requests/hour/IP
- **No API key required**: Uses public endpoints
- **Best practice**: Batch requests, cache results

## Supported Tickers
- US Stocks: `AAPL`, `NVDA`, `MSFT`, `GOOGL`
- ETFs: `VOO`, `VTI`, `QQQ`
- Crypto: `BTC-USD`, `ETH-USD`
- International: Add exchange suffix (e.g., `BHP.AX` for ASX)

## Error Handling
- `404`: Ticker not found
- `429`: Rate limited (wait 1 hour)
- `5xx`: Yahoo service error

## Security Notes
- No authentication required
- Read-only public data
- HTTPS enforced
- No personal data transmitted
