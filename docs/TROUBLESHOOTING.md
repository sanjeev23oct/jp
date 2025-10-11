# Troubleshooting Guide

## Common Issues and Solutions

### 1. 404 Error on `/api/chat/stream`

**Symptoms:**
- Frontend shows 404 error when trying to generate code
- Error: "GET http://localhost:3001/api/chat/stream 404 (Not Found)"
- Backend server is running

**Cause:**
The backend server needs to be restarted after code changes, especially after timeout modifications.

**Solution:**
1. Stop the backend server (Ctrl+C in the terminal running it)
2. Restart the backend:
   ```bash
   cd backend
   npm run dev
   ```
3. Wait for the message: "Server started on port 3001"
4. Try generating code again

**Verification:**
Test the endpoint manually:
```bash
curl http://localhost:3001/api/health
```
Should return:
```json
{
  "status": "ok",
  "message": "Lovable.dev Clone - Backend Ready",
  "llmProvider": "deepseek",
  "timestamp": "..."
}
```

---

### 2. Timeout Errors for Bigger Apps

**Symptoms:**
- Generation starts but times out before completing
- Error: "Request timeout" or "Connection closed"
- Works for small apps but fails for complex ones

**Cause:**
The LLM needs more time to generate complex applications.

**Solution:**
The timeout has been increased to 10 minutes (as of commit 47171bd). If you still experience timeouts:

1. **Break down the request**: Instead of asking for everything at once, generate in stages:
   ```
   First: "create a basic dashboard with header and sidebar"
   Then: "add a data table with sample data"
   Then: "add charts to visualize the data"
   ```

2. **Use Surgical Edits**: For adding features to existing apps, use "✨ Quick Edit with AI" instead of regenerating

3. **Simplify the request**: Focus on core features first:
   ```
   Instead of: "create a full e-commerce site with products, cart, checkout, user auth, admin panel"
   Try: "create an e-commerce product catalog with cart functionality"
   ```

---

### 3. Visual Editing Screen Flicker

**Symptoms:**
- Screen flickers when changing text or colors
- Changes don't persist
- Preview reloads constantly

**Cause:**
Fixed in commit 5983b44. If you're still experiencing this, ensure you have the latest code.

**Solution:**
1. Pull the latest changes:
   ```bash
   git pull origin main
   ```
2. Restart both frontend and backend
3. Clear browser cache (Ctrl+Shift+Delete)

---

### 4. Undo/Redo Not Working

**Symptoms:**
- Clicking undo/redo buttons does nothing
- Preview disappears after undo
- Keyboard shortcuts (Ctrl+Z/Ctrl+Y) don't work

**Cause:**
Fixed in commit 5983b44. The command execution was being called twice.

**Solution:**
1. Pull the latest changes:
   ```bash
   git pull origin main
   ```
2. Restart the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

---

### 5. Generated Code Not Functional

**Symptoms:**
- Buttons don't work when clicked
- Forms don't submit
- Data doesn't save to localStorage
- Charts don't display data

**Cause:**
The LLM generated placeholder/dummy code instead of functional code.

**Solution:**

**Option 1: Use Surgical Edit (Quick Fix)**
1. Click "✨ Quick Edit with AI"
2. Describe the issue: "Fix the Add button - it should add items to the list and save to localStorage"
3. Apply the changes

**Option 2: Regenerate with Better Prompt**
Be more explicit in your request:
```
Instead of: "create a todo app"
Try: "create a fully functional todo app with working Add button, localStorage persistence, and delete functionality"
```

**Option 3: Manual Fix**
1. Click "💻 View Code"
2. Find the button/form in the HTML
3. Check if there's an event listener in the JavaScript
4. Add the missing functionality

---

### 6. Chart Data Not Displaying

**Symptoms:**
- "Generate Sample Data" button shows success message
- Counters stay at 0
- Charts remain empty
- Data is created but not visible

**Cause:**
Fixed in commit 8cfa505. The UI wasn't being updated after data generation.

**Solution:**
1. Pull the latest changes (includes enhanced prompt)
2. Regenerate the chart app with the same prompt
3. The new code will properly call `updateUI()` after data operations

**Quick Fix for Existing Code:**
Use surgical edit: "Fix the Generate Sample Data button - after creating data, call updateUI() to display the data in charts and update counters"

---

### 7. Port Already in Use

**Symptoms:**
- Error: "Port 3001 is already in use"
- Error: "Port 5189 is already in use"
- Server won't start

**Solution:**

**Windows:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F

# Same for frontend port 5189
netstat -ano | findstr :5189
taskkill /PID <PID> /F
```

**Alternative:**
Change the ports in the configuration files:
- Backend: `backend/src/config/index.ts` (change port)
- Frontend: `frontend/vite.config.ts` (change server.port)

---

### 8. CORS Errors

**Symptoms:**
- Error: "Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:5189' has been blocked by CORS policy"
- API calls fail with CORS errors

**Cause:**
CORS configuration issue in backend.

**Solution:**
Check `backend/src/config/index.ts`:
```typescript
cors: {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5189',
  credentials: true
}
```

If frontend is running on a different port, update the CORS_ORIGIN in `.env`:
```
CORS_ORIGIN=http://localhost:YOUR_FRONTEND_PORT
```

---

### 9. DeepSeek API Key Issues

**Symptoms:**
- Error: "Invalid API key"
- Error: "Unauthorized"
- Generation fails immediately

**Solution:**
1. Check if `.env` file exists in `backend/` directory
2. Verify the API key is correct:
   ```
   DEEPSEEK_API_KEY=your_actual_api_key_here
   ```
3. Get a new API key from https://platform.deepseek.com/
4. Restart the backend server after updating `.env`

---

### 10. Frontend Not Updating After Code Changes

**Symptoms:**
- Made changes to frontend code
- Browser still shows old version
- Changes not visible

**Solution:**
1. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear cache**: Ctrl+Shift+Delete → Clear cached images and files
3. **Restart dev server**:
   ```bash
   # Stop the frontend (Ctrl+C)
   cd frontend
   npm run dev
   ```
4. **Check if Vite is watching files**: Look for "hmr update" messages in the terminal

---

## Getting Help

If you're still experiencing issues:

1. **Check the logs**:
   - Backend logs: Look at the terminal running `npm run dev` in backend
   - Frontend logs: Open browser DevTools (F12) → Console tab

2. **Check recent commits**: See `docs/FIXES_2025-10-06.md` for recent bug fixes

3. **Verify versions**:
   ```bash
   node --version  # Should be 18.x or higher
   npm --version   # Should be 9.x or higher
   ```

4. **Clean install**:
   ```bash
   # Backend
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   
   # Frontend
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Quick Restart Guide

When in doubt, restart everything:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Wait for both to show "ready" messages, then refresh your browser.
