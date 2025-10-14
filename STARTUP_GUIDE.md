# Startup Guide

## Quick Start

### 1. Set up the Database

Make sure PostgreSQL is running on your machine, then run:

```bash
cd backend
npm run db:setup
```

This will:
- Create the `jp` database
- Run migrations to create tables (projects, project_versions, app_settings)

### 2. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will start on http://localhost:3001

### 3. Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on http://localhost:5173

### 4. Open the App

Navigate to http://localhost:5173 in your browser.

You should see the Home Page with the project list!

## Troubleshooting

### Database Connection Error

If you see database connection errors:
1. Make sure PostgreSQL is running
2. Check the credentials in `backend/.env`:
   - DB_HOST=localhost
   - DB_PORT=5432
   - DB_USER=postgres
   - DB_PASSWORD=postgres

### Port Already in Use

If port 3001 or 5173 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite will automatically suggest a different port

### 404 Errors

If you see 404 errors when creating projects:
- Make sure the backend server is running on port 3001
- Check the browser console for the exact error
- Verify the database is set up correctly

## What's Working

✅ Home Page with project list
✅ Create new project
✅ Open project in editor
✅ Auto-save (2 second debounce)
✅ Save indicator
✅ Delete project
✅ Duplicate project
✅ Search projects
✅ Back navigation

## Next Steps

Once everything is running, you can:
1. Click "New Prototype" to create a project
2. You'll be taken to the editor
3. Start chatting with the AI to generate HTML/CSS/JS
4. Changes auto-save every 2 seconds
5. Click the back arrow to return to the project list
