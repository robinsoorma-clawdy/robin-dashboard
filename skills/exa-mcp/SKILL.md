---
name: exa-mcp
description: Advanced web search, code search, and AI research via Exa.ai MCP. Use when you need real-time web search, company research, code examples, deep research reports, or semantic search beyond Brave. Enables 8 tools: web search, advanced search, code context, crawling, company research, people search, and deep researcher.
homepage: https://exa.ai/mcp
metadata: {"openclaw":{"emoji":"🔎","requires":{"env":["EXA_API_KEY"]},"primaryEnv":"EXA_API_KEY"}}
---

# Exa MCP - Advanced AI Search

Connect OpenClaw to Exa's semantic web search, code search, and research capabilities.

## What It Does

- **Semantic web search** - Finds relevant content by meaning, not just keywords
- **Code context search** - Search GitHub, Stack Overflow, documentation
- **Company research** - Business info, news, insights
- **Deep researcher** - AI agent that writes detailed reports
- **People search** - Find professional profiles
- **Web crawling** - Extract full content from URLs

## Quick Start

### 1. Get API Key (Free)
Get your key at: https://dashboard.exa.ai/api-keys

### 2. Configure OpenClaw

Add to `~/.openclaw/openclaw.json`:

```json
{
  "mcpServers": {
    "exa": {
      "url": "https://mcp.exa.ai/mcp?tools=web_search_exa,web_search_advanced_exa,get_code_context_exa,crawling_exa,company_research_exa,people_search_exa,deep_researcher_start,deep_researcher_check"
    }
  }
}
```

Or use the full toolset:
```bash
# Using npx wrapper (recommended)
npx -y mcp-remote https://mcp.exa.ai/mcp?tools=web_search_exa,web_search_advanced_exa,get_code_context_exa,crawling_exa,company_research_exa,people_search_exa,deep_researcher_start,deep_researcher_check
```

### 3. Set Environment Variable

```bash
export EXA_API_KEY="your_api_key_here"
```

Or add to OpenClaw config:
```json
{
  "env": {
    "vars": {
      "EXA_API_KEY": "your_api_key_here"
    }
  }
}
```

## Available Tools

| Tool | When to Use |
|------|-------------|
| `web_search_exa` | General web search, news, articles |
| `web_search_advanced_exa` | Filtered search (date, domain, etc.) |
| `get_code_context_exa` | Code examples, docs, Stack Overflow |
| `crawling_exa` | Extract full content from a specific URL |
| `company_research_exa` | Business research, competitors, news |
| `people_search_exa` | Find professionals, LinkedIn profiles |
| `deep_researcher_start` | Start AI research agent for detailed reports |
| `deep_researcher_check` | Check status of deep research tasks |

## Usage Examples

### Web Search
```
"Search for recent React 19 features"
"Find articles about AI coding assistants 2025"
```

### Code Search
```
"Find React useState hook examples"
"Search Python pandas dataframe filtering"
"Get Next.js middleware documentation"
```

### Company Research
```
"Research Stripe's latest products"
"Find news about Anthropic funding"
```

### Deep Research
```
"Start deep research on quantum computing applications in finance"
"Check my research task status"
```

## Comparison with Brave Search

| Feature | Brave Search | Exa |
|---------|--------------|-----|
| Cost | Free tier | Free tier |
| Search type | Keyword | Semantic (meaning-based) |
| Code search | Limited | Excellent |
| Company research | Basic | Advanced |
| Deep research | No | Yes (AI agent) |
| Real-time | Yes | Yes |

## Security

- **API key required** - Stores in env var, never in code
- **HTTPS only** - All requests encrypted
- **Read-only** - No write access to your systems
- **Rate limits** - Free tier: 100 searches/month

## Troubleshooting

**"No API key" error:**
- Check `EXA_API_KEY` is set: `echo $EXA_API_KEY`
- Verify in OpenClaw config

**"Connection refused":**
- Check internet connection
- Verify MCP URL is correct

**Rate limited:**
- Free tier: 100 searches/month
- Upgrade at https://dashboard.exa.ai

## Resources

- Full docs: https://docs.exa.ai/reference/exa-mcp
- Get API key: https://dashboard.exa.ai/api-keys
- GitHub: https://github.com/exa-labs/exa-mcp-server
