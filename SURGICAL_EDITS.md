# Surgical Edits - Hybrid Approach

## Overview

Surgical Edits is a feature that allows targeted, precise modifications to HTML prototypes without regenerating the entire codebase. It uses a **hybrid approach** combining three different edit strategies based on the type of change requested.

## 🎯 Three Edit Strategies

### 1. **CSS Selector-Based Edits** (Style Changes)
**Best for:** Color, size, spacing, typography, and other style modifications

**How it works:**
- Detects style-related keywords (color, background, font, size, padding, margin, border, etc.)
- Uses CSS selectors to target specific elements
- Modifies only the CSS properties that need to change
- Fastest and most precise for visual changes

**Example:**
```json
{
  "type": "css-selector",
  "selector": ".login-btn",
  "property": "background-color",
  "value": "blue"
}
```

**Advantages:**
- ✅ Very fast (no HTML parsing needed)
- ✅ Precise targeting using CSS selectors
- ✅ Minimal token usage
- ✅ No risk of breaking HTML structure

### 2. **SEARCH/REPLACE Blocks** (Targeted Changes)
**Best for:** Content updates, renaming, small structural changes

**How it works:**
- Uses exact string matching to find code sections
- Replaces only the matched sections
- Similar to git merge conflict format (familiar to LLMs)
- Works across HTML, CSS, and JS files

**Example:**
```json
{
  "type": "search-replace",
  "file": "html",
  "search": "<h1>Welcome</h1>",
  "replace": "<h1>Hello World</h1>"
}
```

**Format (inspired by Aider/Cline):**
```
<<<<<<< SEARCH
old code here
=======
new code here
>>>>>>> REPLACE
```

**Advantages:**
- ✅ No line numbers needed (resilient to changes)
- ✅ LLMs trained on this format (git conflicts)
- ✅ Works even if file was modified elsewhere
- ✅ Industry standard (used by Cline, Roo Code, Aider)

**Disadvantages:**
- ❌ Requires exact match (whitespace sensitive)
- ❌ Can fail if search string doesn't match

### 3. **Whole File Replacement** (Complex Changes)
**Best for:** Major refactoring, adding new features, complex structural changes

**How it works:**
- Regenerates the entire file content
- Used as fallback when other methods aren't suitable
- Similar to Agent Mode but for single files

**Example:**
```json
{
  "type": "whole-file",
  "file": "html",
  "content": "complete new HTML content..."
}
```

**Advantages:**
- ✅ Can handle any type of change
- ✅ No risk of partial updates
- ✅ Good for major refactoring

**Disadvantages:**
- ❌ Slower (more tokens)
- ❌ Can lose manual edits
- ❌ More expensive

## 🔄 How the System Chooses

The system automatically selects the best approach based on:

1. **Keywords in the request:**
   - Style keywords → CSS Selector
   - Targeted keywords (change, replace, update) → SEARCH/REPLACE
   - Complex requests → Whole File

2. **Selected element:**
   - If element is selected → Prefer CSS Selector for style changes

3. **Scope of change:**
   - Single property → CSS Selector
   - Few lines → SEARCH/REPLACE
   - Multiple sections → Whole File

## 📝 Usage

### From UI (Quick Edit Panel)

1. Click **"✨ Quick Edit with AI"** button in the preview toolbar
2. Type your request (e.g., "Make the button blue")
3. Or use quick actions for common changes
4. Click **"✨ Apply Edit"**

### From Visual Editor

1. Enable Visual Edit Mode
2. Click an element to select it
3. Open Quick Edit panel
4. The selected element context is automatically included

### Programmatic Usage

```typescript
import { useSurgicalEdit } from '../hooks/useSurgicalEdit';

const { applySurgicalEdit } = useSurgicalEdit();

const result = await applySurgicalEdit({
  description: 'Make the button blue',
  selectedElement: {
    selector: '.login-btn',
    tagName: 'button',
    className: 'login-btn',
  }
});
```

## 🎨 Examples

### Example 1: Style Change (CSS Selector)
**Request:** "Make the header background blue"

**LLM Response:**
```json
{
  "edits": [
    {
      "type": "css-selector",
      "selector": ".header",
      "property": "background",
      "value": "blue"
    }
  ],
  "explanation": "Changed header background to blue"
}
```

### Example 2: Content Update (SEARCH/REPLACE)
**Request:** "Change the title from 'Welcome' to 'Hello World'"

**LLM Response:**
```json
{
  "edits": [
    {
      "type": "search-replace",
      "file": "html",
      "search": "<h1>Welcome</h1>",
      "replace": "<h1>Hello World</h1>"
    }
  ],
  "explanation": "Updated page title"
}
```

### Example 3: Multiple Style Changes
**Request:** "Make the button bigger and add shadow"

**LLM Response:**
```json
{
  "edits": [
    {
      "type": "css-selector",
      "selector": ".button",
      "property": "font-size",
      "value": "18px"
    },
    {
      "type": "css-selector",
      "selector": ".button",
      "property": "box-shadow",
      "value": "0 4px 6px rgba(0,0,0,0.1)"
    }
  ],
  "explanation": "Increased button size and added shadow"
}
```

## 🏗️ Architecture

### Backend

**Service:** `backend/src/services/surgical-edit.service.ts`
- Analyzes edit requests
- Generates appropriate prompts for LLM
- Parses LLM responses
- Applies edits to code

**Routes:** `backend/src/routes/surgical-edit.routes.ts`
- `POST /api/surgical-edit` - Standard request/response
- `POST /api/surgical-edit/stream` - Server-Sent Events streaming

### Frontend

**Hook:** `frontend/src/hooks/useSurgicalEdit.ts`
- React hook for surgical edits
- Handles API communication
- Updates editor state

**Component:** `frontend/src/components/SurgicalEditPanel.tsx`
- UI for quick edits
- Quick action buttons
- Progress feedback

## 🔬 Technical Details

### LLM Prompts

Different prompts for each edit type:

1. **CSS Selector Prompt:**
   - Includes selected element info
   - Shows relevant CSS excerpt
   - Requests JSON with selector/property/value

2. **SEARCH/REPLACE Prompt:**
   - Includes code context (limited to 2000 chars)
   - Emphasizes exact matching
   - Requests JSON with search/replace blocks

3. **Whole File Prompt:**
   - Includes complete current code
   - Requests full updated file content

### Temperature Setting

Uses `temperature: 0.3` (lower than Agent Mode's 0.7) for:
- More deterministic outputs
- Precise, targeted changes
- Less creativity, more accuracy

## 🚀 Performance

### Token Usage Comparison

| Edit Type | Avg Tokens | Speed | Cost |
|-----------|-----------|-------|------|
| CSS Selector | 200-500 | ⚡ Fast | 💰 Cheap |
| SEARCH/REPLACE | 500-1500 | ⚡ Fast | 💰 Moderate |
| Whole File | 2000-8000 | 🐌 Slow | 💰💰 Expensive |

### When to Use Each

- **CSS Selector:** 90% of style changes
- **SEARCH/REPLACE:** Content updates, small refactors
- **Whole File:** Major changes, new features

## 🔮 Future Enhancements

1. **Undo/Redo:** Track edit history
2. **Batch Edits:** Apply multiple edits at once
3. **Smart Context:** Better code section extraction
4. **Diff Preview:** Show changes before applying
5. **Edit Templates:** Common edit patterns
6. **Multi-file Edits:** Edit HTML, CSS, JS together

## 📚 References

- **Aider:** https://aider.chat/docs/more/edit-formats.html
- **Cline:** https://github.com/cline/cline
- **Roo Code:** https://github.com/paulbatum/Roo-Code

## 🎯 Best Practices

1. **Be specific:** "Make the login button blue" > "Change colors"
2. **Use visual editor:** Select element first for better context
3. **Start small:** Test with simple changes first
4. **Review changes:** Check the result before continuing
5. **Use quick actions:** Faster than typing for common changes

## 🐛 Troubleshooting

### "Diff Edit Failed"
- Search string doesn't match exactly
- Try being more specific
- Or use whole file replacement

### "No changes applied"
- Check if selector exists in CSS
- Verify element is in the DOM
- Try refreshing the preview

### "Unexpected results"
- LLM misunderstood the request
- Be more specific in description
- Include element context

