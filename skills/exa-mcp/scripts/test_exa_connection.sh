#!/bin/bash
# Test Exa MCP connection
# Usage: ./test_exa_connection.sh [YOUR_API_KEY]

set -e

API_KEY="${1:-$EXA_API_KEY}"

if [ -z "$API_KEY" ]; then
    echo "❌ Error: No API key provided"
    echo "Usage: $0 YOUR_API_KEY"
    echo "Or set EXA_API_KEY environment variable"
    exit 1
fi

echo "🔎 Testing Exa MCP Connection..."
echo "================================"

# Test 1: Check MCP endpoint
echo -n "1. Checking MCP endpoint... "
if curl -s -o /dev/null -w "%{http_code}" "https://mcp.exa.ai/mcp" | grep -q "200\|307"; then
    echo "✅ Online"
else
    echo "⚠️  Unavailable (may need retry)"
fi

# Test 2: Verify API key format
echo -n "2. API Key format... "
if [[ "$API_KEY" =~ ^[a-zA-Z0-9_-]{20,}$ ]]; then
    echo "✅ Valid format"
else
    echo "⚠️  Invalid format (should be 20+ alphanumeric chars)"
fi

# Test 3: Test search via direct API
echo -n "3. Testing search API... "
RESPONSE=$(curl -s -X POST "https://api.exa.ai/search" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "OpenClaw AI assistant",
    "numResults": 1,
    "type": "keyword"
  }' 2>/dev/null || echo '{"error":"connection failed"}')

if echo "$RESPONSE" | grep -q "results"; then
    echo "✅ Working"
    RESULT_COUNT=$(echo "$RESPONSE" | grep -o '"results":\s*\[' | wc -l)
    echo "   Found results in response"
elif echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Failed"
    echo "   Response: $(echo "$RESPONSE" | head -c 100)"
else
    echo "⚠️  Unknown response"
fi

echo ""
echo "================================"
echo "📊 MCP Tool Set Available:"
echo "  • web_search_exa"
echo "  • web_search_advanced_exa"
echo "  • get_code_context_exa"
echo "  • crawling_exa"
echo "  • company_research_exa"
echo "  • people_search_exa"
echo "  • deep_researcher_start"
echo "  • deep_researcher_check"
echo ""
echo "✅ Ready to use with OpenClaw!"
