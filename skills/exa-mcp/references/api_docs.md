# Exa API Reference

## Base URLs

- **MCP Server**: `https://mcp.exa.ai/mcp`
- **Full Tools**: `https://mcp.exa.ai/mcp?tools=web_search_exa,web_search_advanced_exa,get_code_context_exa,crawling_exa,company_research_exa,people_search_exa,deep_researcher_start,deep_researcher_check`
- **REST API**: `https://api.exa.ai`

## Authentication

Header: `Authorization: Bearer YOUR_API_KEY`

## MCP Tools Detail

### web_search_exa
Basic semantic web search.

**Use for:**
- General information queries
- News articles
- Blog posts
- Documentation

**Example query:** "Latest React 19 features announced"

### web_search_advanced_exa
Advanced search with filters.

**Parameters:**
- `dateRange`: Filter by date (e.g., "past week")
- `domains`: Restrict to specific domains
- `excludeDomains`: Exclude domains
- `type`: "keyword" | "neural" | "auto"

### get_code_context_exa
Code-focused semantic search.

**Use for:**
- Programming examples
- API documentation
- Stack Overflow solutions
- GitHub code snippets

**Example query:** "Python pandas groupby aggregate examples"

### crawling_exa
Extract full content from URL.

**Use when:**
- You have a specific URL
- Need full article content
- Web scraping a known page

### company_research_exa
Business and company research.

**Use for:**
- Company information
- Funding news
- Product announcements
- Competitive analysis

### people_search_exa
Professional profile search.

**Use for:**
- Finding LinkedIn profiles
- Professional background
- Contact information

### deep_researcher_start
Launch AI research agent.

**Use for:**
- Complex research topics
- Multi-step investigations
- Report generation

**Returns:** Task ID

### deep_researcher_check
Check research task status.

**Use with:** Task ID from deep_researcher_start

## Rate Limits

| Tier | Searches/Month | Price |
|------|----------------|-------|
| Free | 100 | $0 |
| Pro | 5,000 | $25/mo |
| Enterprise | Custom | Contact |

## Response Format

```json
{
  "results": [
    {
      "title": "Page Title",
      "url": "https://example.com",
      "author": "Author Name",
      "publishedDate": "2024-01-15",
      "text": "Content snippet...",
      "score": 0.95
    }
  ],
  "autoprompt": "Expanded query...",
  "cost": {
    "cents": 1.5,
    "search": 1.0,
    "contents": 0.5
  }
}
```

## Error Codes

- `400` - Bad request (invalid params)
- `401` - Unauthorized (bad API key)
- `429` - Rate limit exceeded
- `500` - Server error

## Best Practices

1. **Use semantic search** for broad topics
2. **Use keyword search** for specific terms
3. **Start with web_search_exa**, escalate to advanced if needed
4. **Cache results** to avoid duplicate searches
5. **Check rate limits** before batch operations
