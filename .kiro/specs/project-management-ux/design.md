# Design Document

## Overview

This design document outlines the architecture for transforming the HTML Prototype Builder into a full-featured project management system with Lovable.dev-like UX. The system will support multiple projects, auto-save, resizable panels, sharing, and export capabilities.

### Core Design Principles

1. **Local-First (Phase 1)**: All data stored in IndexedDB, no backend required
   - **Phase 2**: Migrate to PostgreSQL for permanent storage, user accounts, and cloud sync
2. **Auto-Save Everything**: Never lose work
3. **Intuitive UX**: Familiar patterns from Lovable.dev and VS Code
4. **Fast and Responsive**: Smooth interactions, no lag
5. **Shareable**: Easy export and sharing options

### Implementation Phases

**Phase 1 (Current Spec)**: Local-First with IndexedDB
- All projects stored in browser's IndexedDB
- No authentication required
- Works offline
- Data stays on user's device

**Phase 2 (Future)**: PostgreSQL Backend
- User authentication and accounts
- Projects stored in PostgreSQL database
- Cloud sync across devices
- Collaboration features
- Public project gallery
- Data persistence and backup

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Application                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Home Page  │  │ Editor Page  │  │ Preview Page │ │
│  │  (Projects)  │  │ (Workspace)  │  │  (Fullscreen)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                   State Management                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Project Store│  │ Editor Store │  │  UI Store    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│                   Data Layer (IndexedDB)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Projects   │  │   Versions   │  │  Settings    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Project Database Schema

**Database**: `PrototypeBuilderDB`

**Tables**:

```typescript
interface Project {
  id: string;                    // UUID
  name: string;                  // User-defined or auto-generated
  description?: string;          // Optional description
  html: string;                  // Current HTML code
  css: string;                   // Current CSS code
  js: string;                    // Current JavaScript code
  thumbnail?: string;            // Base64 encoded screenshot
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last modified timestamp
  lastOpenedAt?: Date;          // Last time project was opened
  tags?: string[];              // For future organization
  template?: string;            // Template used (if any)
}

interface ProjectVersion {
  id: string;                    // UUID
  projectId: string;            // Foreign key to Project
  html: string;
  css: string;
  js: string;
  createdAt: Date;
  description?: string;          // What changed
  generationPrompt?: string;     // The prompt that created this version
}

interface AppSettings {
  id: string;                    // Always 'settings'
  lastOpenedProjectId?: string;
  panelSizes?: {
    chat: number;                // Percentage
    preview: number;             // Percentage
  };
  theme?: 'light' | 'dark';
  keyboardShortcutsEnabled: boolean;
}
```

### 2. Project Store

**Store**: `useProjectStore.ts`

```typescript
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProjects: () => Promise<void>;
  createProject: (name?: string, template?: string) => Promise<Project>;
  openProject: (id: string) => Promise<void>;
  saveProject: (updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project>;
  renameProject: (id: string, name: string) => Promise<void>;
  updateProjectCode: (html: string, css: string, js: string) => Promise<void>;
  captureProjectThumbnail: () => Promise<void>;
  
  // Version history
  saveVersion: (description?: string) => Promise<void>;
  loadVersions: (projectId: string) => Promise<ProjectVersion[]>;
  restoreVersion: (versionId: string) => Promise<void>;
}
```

**Auto-Save Implementation**:
```typescript
// Debounced auto-save
const debouncedSave = debounce(async (html: string, css: string, js: string) => {
  await useProjectStore.getState().updateProjectCode(html, css, js);
  showToast('Saved', 'success');
}, 2000);

// Call on every code change
useEffect(() => {
  if (html || css || js) {
    debouncedSave(html, css, js);
  }
}, [html, css, js]);
```


### 3. Home Page (Project List)

**Component**: `HomePage.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  HTML Prototype Builder                    [+ New]      │
├─────────────────────────────────────────────────────────┤
│  [Search projects...]                    [Sort: Recent] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ [Thumb]  │  │ [Thumb]  │  │ [Thumb]  │             │
│  │ Todo App │  │ CRM Dash │  │ Landing  │             │
│  │ 2h ago   │  │ 1d ago   │  │ 3d ago   │             │
│  │ [⋮]      │  │ [⋮]      │  │ [⋮]      │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  ┌──────────┐  ┌──────────┐                            │
│  │ [Thumb]  │  │ [Thumb]  │                            │
│  │ Portfolio│  │ Blog     │                            │
│  │ 1w ago   │  │ 2w ago   │                            │
│  │ [⋮]      │  │ [⋮]      │                            │
│  └──────────┘  └──────────┘                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Grid layout with project cards
- Hover shows action menu (Open, Rename, Delete, Duplicate)
- Click card to open project
- Search and sort functionality
- Empty state with "Create your first prototype" message

### 4. Resizable Panels

**Component**: `ResizablePanels.tsx`

**Implementation using react-resizable-panels**:
```typescript
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

<PanelGroup direction="horizontal" onLayout={savePanelSizes}>
  <Panel defaultSize={40} minSize={20} maxSize={60}>
    <ChatPanel />
  </Panel>
  
  <PanelResizeHandle className="resize-handle">
    <div className="resize-handle-inner" />
  </PanelResizeHandle>
  
  <Panel defaultSize={60} minSize={40}>
    <PreviewPanel />
  </Panel>
</PanelGroup>
```

**Styling**:
```css
.resize-handle {
  width: 4px;
  background: var(--border-color);
  cursor: col-resize;
  transition: background 0.2s;
}

.resize-handle:hover {
  background: var(--primary-color);
}

.resize-handle-inner {
  width: 100%;
  height: 100%;
}
```

**Persistence**:
```typescript
const savePanelSizes = (sizes: number[]) => {
  localStorage.setItem('panelSizes', JSON.stringify({
    chat: sizes[0],
    preview: sizes[1]
  }));
};

const loadPanelSizes = () => {
  const saved = localStorage.getItem('panelSizes');
  return saved ? JSON.parse(saved) : { chat: 40, preview: 60 };
};
```

### 5. Open in New Window

**Component**: `PreviewWindow.tsx`

**Implementation**:
```typescript
const openInNewWindow = () => {
  const { html, css, js } = useEditorStore.getState();
  
  // Create complete HTML document
  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentProject?.name || 'Preview'}</title>
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}</script>
</body>
</html>
  `;
  
  // Open in new window
  const previewWindow = window.open('', '_blank', 'width=1024,height=768');
  if (previewWindow) {
    previewWindow.document.write(fullHTML);
    previewWindow.document.close();
  }
};
```

**Live Reload**:
```typescript
// Store reference to preview window
let previewWindowRef: Window | null = null;

const openInNewWindow = () => {
  // ... create window
  previewWindowRef = previewWindow;
};

// On code change, offer to reload
useEffect(() => {
  if (previewWindowRef && !previewWindowRef.closed) {
    showToast('Preview window detected. Reload?', 'info', {
      action: () => {
        previewWindowRef?.location.reload();
      }
    });
  }
}, [html, css, js]);
```

### 6. Share and Export

**Component**: `ShareModal.tsx`

**Export as Single HTML**:
```typescript
const exportAsSingleHTML = () => {
  const { html, css, js } = useEditorStore.getState();
  const { name } = useProjectStore.getState().currentProject!;
  
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <!-- Generated by HTML Prototype Builder on ${new Date().toISOString()} -->
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  </script>
</body>
</html>`;
  
  // Download
  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Export as ZIP**:
```typescript
import JSZip from 'jszip';

const exportAsZIP = async () => {
  const { html, css, js } = useEditorStore.getState();
  const { name } = useProjectStore.getState().currentProject!;
  
  const zip = new JSZip();
  
  // Add files
  zip.file('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${html}
  <script src="script.js"></script>
</body>
</html>`);
  
  zip.file('styles.css', css);
  zip.file('script.js', js);
  zip.file('README.md', `# ${name}\n\nGenerated by HTML Prototype Builder\nDate: ${new Date().toISOString()}\n\n## Usage\n\nOpen index.html in a web browser.`);
  
  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Share via URL**:
```typescript
const generateShareLink = () => {
  const { html, css, js } = useEditorStore.getState();
  const { name } = useProjectStore.getState().currentProject!;
  
  // Encode project data
  const projectData = {
    name,
    html,
    css,
    js
  };
  
  // Compress and encode
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(projectData));
  
  // Generate URL
  const shareUrl = `${window.location.origin}/preview?data=${compressed}`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(shareUrl);
  showToast('Link copied to clipboard!', 'success');
  
  return shareUrl;
};
```

### 7. Keyboard Shortcuts

**Hook**: `useKeyboardShortcuts.ts`

```typescript
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (modifier && e.key === 's') {
        e.preventDefault();
        useProjectStore.getState().saveProject({});
        showToast('Saved', 'success');
      }
      
      if (modifier && e.key === 'n') {
        e.preventDefault();
        navigate('/');
        useProjectStore.getState().createProject();
      }
      
      if (modifier && e.key === 'o') {
        e.preventDefault();
        navigate('/');
      }
      
      if (modifier && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        openInNewWindow();
      }
      
      if (modifier && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        exportAsSingleHTML();
      }
      
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        showKeyboardShortcutsModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

### 8. Project Templates

**Templates Data**:
```typescript
const templates = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch',
    thumbnail: '/templates/blank.png',
    html: '',
    css: '',
    js: ''
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Modern landing page with hero section',
    thumbnail: '/templates/landing.png',
    html: `<!-- Hero section, features, CTA -->`,
    css: `/* Modern landing page styles */`,
    js: `// Smooth scroll, animations`
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Admin dashboard with sidebar and charts',
    thumbnail: '/templates/dashboard.png',
    html: `<!-- Dashboard layout -->`,
    css: `/* Dashboard styles */`,
    js: `// Chart initialization`
  },
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'Simple todo list with localStorage',
    thumbnail: '/templates/todo.png',
    html: `<!-- Todo app UI -->`,
    css: `/* Todo app styles */`,
    js: `// Todo CRUD operations`
  }
];
```

**Template Selection Modal**:
```typescript
const TemplateModal = ({ onSelect }: { onSelect: (template: Template) => void }) => {
  return (
    <Modal>
      <h2>Choose a Template</h2>
      <div className="template-grid">
        {templates.map(template => (
          <div key={template.id} className="template-card" onClick={() => onSelect(template)}>
            <img src={template.thumbnail} alt={template.name} />
            <h3>{template.name}</h3>
            <p>{template.description}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
};
```


### 9. Version History

**Component**: `VersionHistoryPanel.tsx`

```typescript
interface VersionHistoryProps {
  projectId: string;
}

const VersionHistoryPanel = ({ projectId }: VersionHistoryProps) => {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  
  useEffect(() => {
    loadVersions(projectId).then(setVersions);
  }, [projectId]);
  
  const restoreVersion = async (versionId: string) => {
    if (confirm('Restore this version? Current changes will be saved as a new version.')) {
      await useProjectStore.getState().restoreVersion(versionId);
      showToast('Version restored', 'success');
    }
  };
  
  return (
    <div className="version-history">
      <h3>Version History</h3>
      <div className="version-list">
        {versions.map(version => (
          <div key={version.id} className="version-item">
            <div className="version-info">
              <span className="version-date">{formatDate(version.createdAt)}</span>
              {version.description && <span className="version-desc">{version.description}</span>}
              {version.generationPrompt && <span className="version-prompt">"{version.generationPrompt}"</span>}
            </div>
            <button onClick={() => restoreVersion(version.id)}>Restore</button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Auto-Version on Generation**:
```typescript
// In ChatStreamService, after successful generation
if (event.type === 'Custom' && event.name === 'code_generated') {
  const { html, css, js } = event.value;
  
  // Save as new version
  await useProjectStore.getState().saveVersion(
    `Generated from: "${userPrompt.substring(0, 50)}..."`
  );
  
  // Update current code
  useEditorStore.getState().setCode({ html, css, js });
}
```

## Data Flow

### Project Creation Flow
```
User clicks "New Project"
  ↓
Show template selection modal
  ↓
User selects template
  ↓
Create project in IndexedDB with template code
  ↓
Navigate to editor with new project
  ↓
Auto-save enabled
```

### Auto-Save Flow
```
User edits code
  ↓
Debounce timer starts (2s)
  ↓
Timer expires
  ↓
Save to IndexedDB
  ↓
Show "Saved" indicator
  ↓
Update project.updatedAt
```

### Share Flow
```
User clicks "Share"
  ↓
Show share modal with options
  ↓
User selects export format
  ↓
Generate export (HTML/ZIP/Link)
  ↓
Download or copy to clipboard
  ↓
Show success message
```

## UI/UX Design

### Color Scheme (Lovable.dev inspired)
```css
:root {
  --primary: #6366f1;        /* Indigo */
  --primary-hover: #4f46e5;
  --background: #ffffff;
  --surface: #f9fafb;
  --border: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
}

[data-theme="dark"] {
  --background: #111827;
  --surface: #1f2937;
  --border: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
}
```

### Typography
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

h1 { font-size: 24px; font-weight: 600; }
h2 { font-size: 20px; font-weight: 600; }
h3 { font-size: 16px; font-weight: 600; }
```

### Spacing System
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
```

## Performance Considerations

1. **IndexedDB Optimization**
   - Index on `updatedAt` for sorting
   - Limit version history to 10 entries per project
   - Compress thumbnails to <50KB

2. **Lazy Loading**
   - Load project list on demand (paginate if >50 projects)
   - Load versions only when history panel is opened
   - Defer thumbnail generation until idle

3. **Debouncing**
   - Auto-save: 2s debounce
   - Search: 300ms debounce
   - Thumbnail capture: 5s debounce

4. **Memory Management**
   - Clear preview window reference on close
   - Unsubscribe from stores on unmount
   - Limit undo/redo stack to 50 entries

## Testing Strategy

### Unit Tests
- Project CRUD operations
- Auto-save debouncing
- Export functions (HTML, ZIP)
- Version history management

### Integration Tests
- Create project → Edit → Save → Reload
- Duplicate project → Verify independence
- Export → Import → Verify integrity
- Resize panels → Reload → Verify persistence

### E2E Tests
- Complete user flow: Create → Edit → Save → Share
- Keyboard shortcuts
- Multi-window interaction
- Template selection

## Migration Strategy

### Existing Users
1. Detect if user has code in editor but no project
2. Show migration prompt: "Save your work as a project?"
3. Create project from current code
4. Migrate to new project-based workflow

### Data Migration
```typescript
const migrateExistingData = async () => {
  // Check if there's code in localStorage
  const existingCode = {
    html: localStorage.getItem('lastHtml'),
    css: localStorage.getItem('lastCss'),
    js: localStorage.getItem('lastJs')
  };
  
  if (existingCode.html || existingCode.css || existingCode.js) {
    // Create a project from existing code
    await useProjectStore.getState().createProject('Untitled Project', 'blank');
    await useProjectStore.getState().updateProjectCode(
      existingCode.html || '',
      existingCode.css || '',
      existingCode.js || ''
    );
    
    // Clear old localStorage
    localStorage.removeItem('lastHtml');
    localStorage.removeItem('lastCss');
    localStorage.removeItem('lastJs');
    
    showToast('Your work has been saved as a project!', 'success');
  }
};
```

## Conclusion

This design provides a complete project management system that matches Lovable.dev's UX while maintaining the simplicity of a local-first application. The resizable panels, auto-save, and sharing features make it production-ready for professional use.


## Phase 2: PostgreSQL Migration Plan

### Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  html TEXT NOT NULL,
  css TEXT NOT NULL,
  js TEXT NOT NULL,
  thumbnail TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  template VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_opened_at TIMESTAMP
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX idx_projects_is_public ON projects(is_public) WHERE is_public = TRUE;

-- Project versions table
CREATE TABLE project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  html TEXT NOT NULL,
  css TEXT NOT NULL,
  js TEXT NOT NULL,
  description TEXT,
  generation_prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_versions_project_id ON project_versions(project_id);
CREATE INDEX idx_versions_created_at ON project_versions(created_at DESC);

-- Shared links table
CREATE TABLE shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shared_links_short_code ON shared_links(short_code);
```

### API Endpoints (Phase 2)

```typescript
// Authentication
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

// Projects
GET    /api/projects              // List user's projects
POST   /api/projects              // Create new project
GET    /api/projects/:id          // Get project details
PUT    /api/projects/:id          // Update project
DELETE /api/projects/:id          // Delete project
POST   /api/projects/:id/duplicate // Duplicate project

// Versions
GET    /api/projects/:id/versions // List project versions
POST   /api/projects/:id/versions // Create new version
POST   /api/versions/:id/restore  // Restore version

// Sharing
POST   /api/projects/:id/share    // Create share link
GET    /api/share/:code           // Get shared project
GET    /api/public                // Browse public projects

// Export
POST   /api/projects/:id/export   // Export project (HTML/ZIP)
```

### Migration Strategy (IndexedDB → PostgreSQL)

```typescript
const migrateToCloud = async (userId: string) => {
  // 1. Get all projects from IndexedDB
  const localProjects = await db.projects.toArray();
  
  // 2. Upload each project to PostgreSQL
  for (const project of localProjects) {
    await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...project,
        user_id: userId
      })
    });
  }
  
  // 3. Mark migration as complete
  localStorage.setItem('migrated_to_cloud', 'true');
  
  // 4. Optionally clear local data
  if (confirm('Migration complete! Clear local data?')) {
    await db.delete();
  }
};
```

### Hybrid Mode (Phase 1.5)

Before full PostgreSQL migration, implement hybrid mode:
- **Offline-first**: Continue using IndexedDB
- **Background sync**: Sync to PostgreSQL when online
- **Conflict resolution**: Last-write-wins or manual merge
- **Graceful degradation**: Works offline, syncs when online

```typescript
const syncToCloud = async () => {
  if (!navigator.onLine) return;
  
  const localProjects = await db.projects.toArray();
  const cloudProjects = await fetch('/api/projects').then(r => r.json());
  
  // Sync logic
  for (const local of localProjects) {
    const cloud = cloudProjects.find(p => p.id === local.id);
    
    if (!cloud) {
      // Upload new project
      await uploadProject(local);
    } else if (local.updated_at > cloud.updated_at) {
      // Update cloud version
      await updateProject(local);
    } else if (cloud.updated_at > local.updated_at) {
      // Download cloud version
      await db.projects.put(cloud);
    }
  }
};
```

This approach allows:
1. **Phase 1**: Ship quickly with IndexedDB (no backend needed)
2. **Phase 1.5**: Add optional cloud sync (hybrid mode)
3. **Phase 2**: Full PostgreSQL migration with authentication
