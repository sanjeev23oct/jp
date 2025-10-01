# Mock Mode & Response Caching Guide

## Overview

The app now has a **Mock Mode** that allows you to test the UI without using LLM tokens. It automatically saves real LLM responses and reuses them for testing.

## How It Works

### 1. **Mock Mode Toggle**
- Located at the top of the chat interface
- **🧪 Mock Mode (Fast Testing)** - Uses cached responses, instant, no tokens
- **🚀 Real Mode (Uses LLM)** - Calls actual LLM API, uses tokens

### 2. **Response Caching**
When you use **Real Mode**, every LLM response is automatically saved to:
```
backend/llm-responses/
```

Each response is saved as a JSON file with:
- Original prompt
- Generated HTML/CSS/JS
- Timestamp
- Metadata (file sizes)

### 3. **Smart Matching**
When you use **Mock Mode**, the system:
1. Tries to find an exact match for your prompt
2. If no exact match, uses fuzzy matching based on keywords
3. Falls back to hardcoded examples if no cache found

## Usage Workflow

### Step 1: Build Your Cache (One-time)
1. Switch to **🚀 Real Mode**
2. Generate a few prototypes with different prompts:
   - "create a button"
   - "create a landing page"
   - "create a todo app"
   - "create a pricing section"
   - etc.
3. Each response is automatically saved

### Step 2: Fast Testing (Ongoing)
1. Switch to **🧪 Mock Mode**
2. Use similar prompts to test UI changes
3. Get instant responses without using tokens
4. Iterate quickly on UI fixes

### Step 3: View Cached Responses
1. Click the **📦 Cached Responses** button (bottom-right)
2. See all saved responses with:
   - Original prompt
   - Timestamp
   - File sizes
3. Refresh to reload
4. Clear all if needed

## API Endpoints

### List Cached Responses
```bash
GET http://localhost:3001/api/chat/cached-responses
```

Response:
```json
{
  "count": 5,
  "responses": [
    {
      "prompt": "create a button",
      "timestamp": "2025-10-01T12:00:00.000Z",
      "metadata": {
        "htmlLength": 45,
        "cssLength": 320,
        "jsLength": 85
      }
    }
  ]
}
```

### Clear Cache
```bash
DELETE http://localhost:3001/api/chat/cache
```

## File Structure

```
backend/
  llm-responses/           # Cached responses directory
    create-a-button.json
    create-landing-page.json
    todo-app.json
  src/
    services/
      response-cache.service.ts  # Cache management
    routes/
      chat-mock.routes.ts        # Mock endpoints
      chat-stream.routes.ts      # Real LLM endpoints
```

## Benefits

✅ **Save Tokens** - Test UI without calling LLM every time
✅ **Fast Iteration** - Instant responses for quick testing
✅ **Consistent Testing** - Same responses for regression testing
✅ **Offline Development** - Work without internet/API access
✅ **Build Test Suite** - Collect diverse examples over time

## Tips

1. **Build a diverse cache** - Generate different types of components in Real Mode
2. **Use descriptive prompts** - Helps with fuzzy matching
3. **Periodically refresh cache** - Regenerate with improved prompts
4. **Share cache files** - Commit to git for team testing
5. **Mock by default** - Only switch to Real Mode when needed

## Example Workflow

```bash
# Day 1: Build cache
1. Switch to Real Mode
2. "create a hero section" → Saved to cache
3. "create a pricing table" → Saved to cache
4. "create a contact form" → Saved to cache

# Day 2-N: Fast testing
1. Switch to Mock Mode
2. "create a hero section" → Instant response from cache
3. Test UI changes quickly
4. Only use Real Mode for new components
```

## Troubleshooting

**Q: Mock mode returns fallback instead of cached response?**
- Check if prompt is similar to cached prompts
- View cached responses to see what's available
- Try exact prompt from cache

**Q: Want to regenerate a cached response?**
- Delete the specific JSON file from `backend/llm-responses/`
- Or clear entire cache and rebuild

**Q: Cache not working?**
- Check backend logs for cache operations
- Verify `backend/llm-responses/` directory exists
- Check file permissions

## Future Enhancements

- [ ] UI to browse and edit cached responses
- [ ] Import/export cache collections
- [ ] Tag responses by category
- [ ] Search cached responses
- [ ] Preview cached response before using

