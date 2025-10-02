# Technical Context - HTML Prototype Builder
**Date:** October 2, 2025  
**Purpose:** Concise technical reference for future coding sessions

---

## 🏗️ System Architecture

### High-Level Overview
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ◄─SSE─► │   Backend   │ ◄─API─► │  DeepSeek   │
│   (React)   │         │  (Express)  │         │     LLM     │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │
      │                        │
      ▼                        ▼
┌─────────────┐         ┌─────────────┐
│   Zustand   │         │   Winston   │
│   (State)   │         │  (Logging)  │
└─────────────┘         └─────────────┘
```

### Tech Stack
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Monaco Editor, Zustand
- **Backend:** Node.js, Express, TypeScript, Winston
- **LLM:** DeepSeek API (8192 token limit)
- **Testing:** Playwright
- **Streaming:** Server-Sent Events (SSE)

---

## 🌊 Streaming Architecture

### Server-Sent Events (SSE)

**Why SSE?**
- Unidirectional server-to-client streaming
- Built-in reconnection
- Simple text-based protocol
- Works over HTTP (no WebSocket needed)
- Perfect for LLM token streaming

**How It Works:**
```
Client                    Backend                   DeepSeek API
  │                          │                           │
  ├─POST /api/chat/stream───►│                           │
  │                          ├─Stream request───────────►│
  │                          │                           │
  │◄─event: RunStarted───────┤                           │
  │                          │◄─token chunk──────────────┤
  │◄─event: TextMessageContent│                          │
  │                          │◄─token chunk──────────────┤
  │◄─event: TextMessageContent│                          │
  │                          │◄─done─────────────────────┤
  │◄─event: RunFinished──────┤                           │
  │                          │                           │
```

**SSE Format:**
```
event: TextMessageContent
data: {"content":"Hello"}

event: RunFinished
data: {"status":"complete"}
```

**Implementation:**
- **Backend:** `res.setHeader('Content-Type', 'text/event-stream')`
- **Frontend:** `EventSource` API or manual fetch with `ReadableStream`

**Files:**
- Backend: `backend/src/services/chat-stream.service.ts`
- Frontend: `frontend/src/store/useChatStore.ts`

---

## 📡 AG-UI Protocol

### What is AG-UI?

**AG-UI** (Augment UI Protocol) is an event-based protocol for streaming chat interactions between LLM backends and frontends.

### Event Types

| Event | Purpose | Data |
|-------|---------|------|
| `RunStarted` | Indicates LLM processing started | `{ runId, timestamp }` |
| `TextMessageStart` | New message begins | `{ messageId, role }` |
| `TextMessageContent` | Message content chunk | `{ content: string }` |
| `TextMessageEnd` | Message complete | `{ messageId }` |
| `Custom` | Custom events (e.g., code generation) | `{ type, data }` |
| `RunFinished` | LLM processing complete | `{ status, finishReason }` |

### Event Flow

**Agent Mode (Code Generation):**
```
1. RunStarted
2. TextMessageStart (role: assistant)
3. TextMessageContent (chunk 1: "{")
4. TextMessageContent (chunk 2: "\"html\":")
5. TextMessageContent (chunk 3: "\"<div>...")
   ... (many chunks)
N. TextMessageEnd
N+1. RunFinished (finishReason: "stop" or "length")
```

**Chat Mode (Conversation):**
```
1. RunStarted
2. TextMessageStart
3. TextMessageContent (multiple chunks)
4. TextMessageEnd
5. RunFinished
```

### Implementation Details

**Backend Event Emission:**
```typescript
const sendEvent = (event: string, data: any) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

sendEvent('RunStarted', { runId: uuid() });
sendEvent('TextMessageContent', { content: chunk });
sendEvent('RunFinished', { status: 'complete' });
```

**Frontend Event Handling:**
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse event: and data: lines
  // Dispatch to appropriate handler
}
```

**Files:**
- Backend: `backend/src/services/chat-stream.service.ts`
- Frontend: `frontend/src/store/useChatStore.ts`

---

## 🤖 LLM Integration

### DeepSeek API

**Provider:** DeepSeek  
**Model:** deepseek-chat  
**Token Limit:** 8192 (hard limit)  
**API Endpoint:** `https://api.deepseek.com/v1/chat/completions`

**Configuration:**
```typescript
{
  model: 'deepseek-chat',
  messages: [...],
  stream: true,
  max_tokens: 8192,
  temperature: 0.7 // Agent Mode
  temperature: 0.3 // Surgical Edits
}
```

**Streaming Response Format:**
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

**Token Limit Handling:**
- Monitor `finishReason` in response
- `"stop"` = Normal completion
- `"length"` = Hit token limit (truncated)
- Implement JSON parsing with truncation recovery

**Files:**
- `backend/src/llm/providers/deepseek.ts`
- `backend/src/llm/base.ts`

---

## 🎨 Agent Mode Prompts

### System Prompt Strategy

**Purpose:** Guide LLM to generate production-quality prototypes

**Key Instructions:**
1. Output ONLY valid JSON (no markdown)
2. HTML: Body content only (no DOCTYPE, html, head tags)
3. Beautiful modern design (gradients, animations)
4. Fully functional (all buttons/forms work)
5. IndexedDB for data persistence
6. Pre-populated sample data

**JSON Output Format:**
```json
{
  "html": "body content only",
  "css": "complete CSS",
  "js": "complete JavaScript",
  "explanation": "what was built",
  "suggestions": ["next steps"]
}
```

**Temperature Settings:**
- **Agent Mode:** 0.7 (creative, varied designs)
- **Surgical Edits:** 0.3 (precise, deterministic)
- **Chat Mode:** 0.7 (conversational)

**Files:**
- `backend/src/llm/prompts/agent-mode.ts`

---

## 🔧 Surgical Edits Architecture

### Three-Strategy Approach

**1. CSS Selector-Based Edits**
```typescript
{
  type: 'css-selector',
  selector: '.button',
  property: 'background-color',
  value: 'blue'
}
```
- **When:** Style changes detected (color, size, spacing keywords)
- **How:** Direct CSS property modification
- **Tokens:** 200-500
- **Speed:** ⚡⚡⚡

**2. SEARCH/REPLACE Blocks**
```typescript
{
  type: 'search-replace',
  file: 'html',
  search: '<h1>Old Title</h1>',
  replace: '<h1>New Title</h1>'
}
```
- **When:** Targeted changes (change, replace, update keywords)
- **How:** Exact string matching and replacement
- **Tokens:** 500-1500
- **Speed:** ⚡⚡
- **Format:** Git merge conflict style (LLM-friendly)

**3. Whole File Replacement**
```typescript
{
  type: 'whole-file',
  file: 'html',
  content: 'complete new content...'
}
```
- **When:** Complex changes, major refactoring
- **How:** Regenerate entire file
- **Tokens:** 2000-8000
- **Speed:** ⚡

### Strategy Selection Logic

```typescript
analyzeEditType(description, selectedElement) {
  // Check for style keywords
  if (hasStyleKeywords && selectedElement) {
    return 'css-selector';
  }
  
  // Check for targeted keywords
  if (hasTargetedKeywords) {
    return 'search-replace';
  }
  
  // Default to whole file
  return 'whole-file';
}
```

**Files:**
- `backend/src/services/surgical-edit.service.ts`
- `backend/src/routes/surgical-edit.routes.ts`

---

## 🎯 Visual Editing Architecture

### Click-to-Select Mechanism

**How It Works:**
1. User enables Visual Edit Mode
2. Click listeners added to iframe `contentDocument`
3. Click event captures target element
4. Extract computed styles via `window.getComputedStyle()`
5. Display in PropertyPanel
6. User edits properties
7. Apply as inline styles immediately
8. Save to HTML code on demand

**Key Challenge:** Iframe Reload
- **Problem:** Iframe reload loses element references and listeners
- **Solution:** Separate effects for rendering vs listeners
- **Solution:** Don't reload iframe for style-only changes

**Event Listener Setup:**
```typescript
const doc = iframe.contentDocument;
doc.addEventListener('click', handleClick, true); // Capture phase
doc.addEventListener('mouseover', handleHover, true);
```

**Style Application:**
```typescript
// Immediate (inline styles)
element.style.backgroundColor = 'blue';

// Saved to code (on demand)
const html = iframe.contentDocument.body.innerHTML;
updateHtml(html);
```

**Files:**
- `frontend/src/hooks/useVisualEditor.ts`
- `frontend/src/components/PropertyPanel.tsx`
- `frontend/src/components/editor/LivePreview.tsx`

---

## 📦 State Management (Zustand)

### EditorStore

**Purpose:** Manage current code and editor state

**State:**
```typescript
{
  currentCode: { html, css, js },
  selectedElement: string | null,
  viewport: 'mobile' | 'tablet' | 'desktop'
}
```

**Actions:**
- `setCode()` - Update all code
- `updateHtml()` - Update HTML only
- `updateCss()` - Update CSS only
- `updateJs()` - Update JS only
- `setViewport()` - Change viewport

**File:** `frontend/src/store/useEditorStore.ts`

### ChatStore

**Purpose:** Manage chat messages and streaming state

**State:**
```typescript
{
  messages: Message[],
  isStreaming: boolean,
  mode: 'agent' | 'chat',
  currentStreamingMessage: string
}
```

**Actions:**
- `sendMessage()` - Send message and handle streaming
- `setMode()` - Switch between agent/chat mode
- `clearMessages()` - Reset conversation

**File:** `frontend/src/store/useChatStore.ts`

---

## 🔍 JSON Parsing with Truncation Handling

### The Problem

DeepSeek has 8192 token limit. Large prototypes get truncated mid-JSON:
```json
{
  "html": "<div>...</div>",
  "css": ".button { color: blue; backgr
```

### The Solution

**Brace Counting Algorithm:**
```typescript
function parseAgentResponse(content: string) {
  // Count braces while respecting strings
  let depth = 0;
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (char === '\\') {
      escape = true;
      continue;
    }
    
    if (char === '"' && !inString) {
      inString = true;
    } else if (char === '"' && inString) {
      inString = false;
    }
    
    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') depth--;
      
      if (depth === 0) {
        // Found complete JSON
        return JSON.parse(content.substring(0, i + 1));
      }
    }
  }
  
  // Incomplete JSON - try to extract what we have
  throw new Error('Truncated JSON');
}
```

**File:** `backend/src/services/chat-stream.service.ts`

---

## 🧪 Testing Infrastructure

### Playwright E2E Tests

**Test Files:**
- `tests/e2e/chat-and-generation.spec.ts`

**Test Coverage:**
- Agent Mode generation
- Chat Mode conversation
- Streaming responses
- Error handling

**Mock Mode:**
- `backend/src/routes/chat-mock.routes.ts`
- Returns pre-defined responses
- No LLM tokens used
- Fast testing

**Running Tests:**
```bash
npx playwright test --headed
npx playwright test --grep "Agent Mode"
```

---

## 🔐 Environment Configuration

### Required Environment Variables

**Backend (.env):**
```
DEEPSEEK_API_KEY=your_api_key_here
PORT=3001
NODE_ENV=development
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3001
```

**Files:**
- `backend/.env.example`
- `frontend/.env.example`

---

## 🚀 Development Workflow

### Starting the Application

**Backend:**
```bash
cd backend
npm install
npm run dev  # Runs on port 3001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Runs on port 5189
```

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

---

## 📊 Performance Considerations

### Token Usage Optimization

| Operation | Tokens | Strategy |
|-----------|--------|----------|
| Agent Mode (full) | 4000-8192 | Streaming, truncation handling |
| Surgical Edit (CSS) | 200-500 | Minimal context |
| Surgical Edit (SEARCH) | 500-1500 | Limited code context |
| Surgical Edit (Whole) | 2000-8000 | Full file context |
| Visual Edit | 0 | No LLM (client-side only) |

### Streaming Benefits

- **Perceived Performance:** Users see progress immediately
- **Token Efficiency:** Can handle responses up to token limit
- **Error Recovery:** Partial responses still usable
- **User Experience:** Real-time feedback

---

## 🐛 Common Issues & Solutions

### Issue 1: "Unterminated string in JSON"
**Cause:** Response truncated at token limit  
**Solution:** Brace counting algorithm extracts valid JSON portion

### Issue 2: Visual editing stops working after first change
**Cause:** Iframe reload loses listeners  
**Solution:** Separate effects, don't reload on style changes

### Issue 3: SEARCH/REPLACE fails
**Cause:** Whitespace mismatch  
**Solution:** Use exact match, consider fuzzy matching (future)

### Issue 4: CORS errors
**Cause:** Frontend/backend on different ports  
**Solution:** CORS configured in `backend/src/index.ts`

---

**End of Technical Context**

