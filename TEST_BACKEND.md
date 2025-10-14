# Test Backend API

## Start the Backend

Open a terminal and run:

```bash
cd backend
npm run dev
```

You should see:
```
Server started on port 3001
Connected to PostgreSQL database
```

## Test the API

### 1. Health Check

Open http://localhost:3001/api/health in your browser or run:

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Lovable.dev Clone - Backend Ready",
  "llmProvider": "deepseek",
  "timestamp": "2025-10-13T..."
}
```

### 2. Create a Project

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Project\",\"description\":\"My first project\"}"
```

Expected response:
```json
{
  "project": {
    "id": "...",
    "name": "Test Project",
    "description": "My first project",
    "html": "",
    "css": "",
    "js": "",
    ...
  }
}
```

### 3. Get All Projects

```bash
curl http://localhost:3001/api/projects
```

Expected response:
```json
{
  "projects": [...],
  "total": 1
}
```

## If Backend Starts Successfully

Once the backend is running:

1. Keep the backend terminal open
2. Open a NEW terminal
3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
4. Open http://localhost:5173
5. Click "New Prototype" - it should work now!

## Common Issues

### Port 3001 Already in Use

If you see "EADDRINUSE: address already in use :::3001":
- Another process is using port 3001
- Kill it or change the port in `backend/.env`

### Database Connection Error

If you see "connection refused" or "database does not exist":
- Make sure PostgreSQL is running
- Run `npm run db:setup` in the backend folder

### Module Not Found

If you see "Cannot find module":
- Run `npm install` in the backend folder
