# Design Document

## Overview

This design document outlines the architecture for transforming the HTML Prototype Builder into a comprehensive Lovable.dev-like platform for creating HTML5 applications. The platform will feature advanced visual editing, intelligent surgical code modifications, drag-and-drop components, and real-time collaboration - all optimized for non-technical users to build production-quality HTML5 apps.

### Core Design Principles

1. **Visual-First Workflow**: Visual editing is the primary interface, with code editing as a secondary option
2. **Surgical Precision**: All edits should be minimal, targeted, and preserve user customizations
3. **Progressive Enhancement**: Start simple, add complexity as needed
4. **Real-Time Feedback**: All changes should be visible instantly in the preview
5. **Intelligent Assistance**: AI should suggest improvements but never override user intent
6. **Component-Based**: Everything is a reusable, composable component
7. **Responsive by Default**: All designs work across devices automatically

## Architecture

### High-Level System Architecture

The system consists of three main layers:

1. **Frontend Layer** (React + Vite)
   - Visual Editor with click-to-edit
   - Component Palette with drag-and-drop
   - Property Panel for editing
   - Live Preview with iframe isolation
   - Code Editor (Monaco)
   - Design Token Manager
   - Responsive Tools

2. **State Management Layer** (Zustand + IndexedDB)
   - Editor Store (current code, selection, viewport)
   - Project Store (pages, components, settings)
   - Design Store (tokens, themes)
   - History Store (undo/redo, versions)

3. **Backend Layer** (Node.js + Express)
   - Surgical Edit Service
   - AI Generation Service
   - Component Library Service
   - Export Service
   - Collaboration Service (WebSocket)
   - LLM Integration Layer



## Components and Interfaces

### 1. Visual Editor System

#### Element Selection and Highlighting

**Component**: `VisualEditor.tsx`

**Key Features**:
- Click-to-select any element in iframe
- Hover preview with tag name tooltip
- Multi-select with Shift+Click
- Parent selection with Alt+Click
- Breadcrumb navigation for nested elements
- Visual handles for resize/move operations

**State Interface**:
```typescript
interface VisualEditorState {
  selectedElements: SelectedElement[];
  hoveredElement: HTMLElement | null;
  selectionMode: 'single' | 'multi' | 'parent';
  isEditMode: boolean;
}

interface SelectedElement {
  element: HTMLElement;
  selector: string;
  path: string[];
  computedStyles: CSSStyleDeclaration;
  boundingBox: DOMRect;
}
```

#### Property Panel

**Component**: `PropertyPanel.tsx`

**Property Categories**:
1. Element Info (Tag, Class, ID)
2. Content (Text, HTML, Attributes)
3. Typography (Font family, size, weight, line height, letter spacing, text align)
4. Colors (Text color, background, border color, shadow)
5. Layout (Display, position, flex/grid properties)
6. Spacing (Padding, margin with visual box model)
7. Sizing (Width, height, min/max dimensions)
8. Border (Width, style, radius)
9. Effects (Shadow, opacity, transform, transition)
10. Interactions (Click actions, hover states, animations)

**Interface**:
```typescript
interface PropertyPanelProps {
  selectedElements: SelectedElement[];
  onUpdate: (updates: PropertyUpdate[]) => void;
  onSave: () => void;
}

interface PropertyUpdate {
  selector: string;
  property: string;
  value: string;
  category: 'style' | 'attribute' | 'content';
}
```

### 2. Drag-and-Drop System

#### Component Palette

**Component**: `ComponentPalette.tsx`

**Component Categories**:
- Layout: Container, Grid, Flexbox, Section, Divider
- Navigation: Navbar, Sidebar, Breadcrumb, Tabs, Pagination
- Content: Heading, Paragraph, Image, Video, Icon
- Forms: Input, Textarea, Select, Checkbox, Radio, Button, Form Group
- Data Display: Table, List, Card, Badge, Avatar, Progress
- Feedback: Alert, Toast, Modal, Tooltip, Popover
- Interactive: Accordion, Carousel, Dropdown, Toggle, Slider
- E-commerce: Product Card, Cart, Checkout, Pricing Table
- Marketing: Hero, Feature Grid, Testimonial, CTA, Footer

**Component Interface**:
```typescript
interface Component {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  html: string;
  css: string;
  js?: string;
  props?: ComponentProp[];
  variants?: ComponentVariant[];
}

interface ComponentProp {
  name: string;
  type: 'text' | 'color' | 'number' | 'boolean' | 'select';
  default: any;
  options?: string[];
}
```

#### Drop Zone Manager

**Component**: `DropZoneManager.tsx`

**Drop Strategies**:
- Before: Insert before target element
- After: Insert after target element
- Inside: Append as child of target element
- Replace: Replace target element

**Interface**:
```typescript
interface DropZone {
  element: HTMLElement;
  position: 'before' | 'after' | 'inside' | 'replace';
  indicator: HTMLElement;
}

interface DragState {
  component: Component | null;
  ghostElement: HTMLElement | null;
  validDropZones: DropZone[];
  currentDropZone: DropZone | null;
}
```

### 3. Surgical Edit Engine

#### Edit Strategy Selector

**Service**: `EditStrategyService.ts`

**Edit Strategies** (ordered by speed):

1. **CSS Selector Edit** (Fastest - 200-500 tokens)
   - Use case: Style changes only
   - Example: "Make button blue" → `{ selector: '.btn', property: 'background-color', value: 'blue' }`

2. **Attribute Edit** (Fast - 100-300 tokens)
   - Use case: HTML attribute changes
   - Example: "Change button text" → `{ selector: '.btn', attribute: 'textContent', value: 'Click Me' }`

3. **SEARCH/REPLACE Edit** (Medium - 500-1500 tokens)
   - Use case: Targeted content/structure changes
   - Example: "Update heading" → Search for exact text, replace with new text

4. **AST-Based Edit** (Advanced - 1000-2000 tokens)
   - Use case: Complex structural changes
   - Example: "Wrap buttons in a div" → Parse HTML, modify AST, regenerate

5. **Whole File Regeneration** (Slowest - 2000-8000 tokens)
   - Use case: Major refactoring
   - Example: "Redesign the entire page"

**Decision Tree**:
```
Is it a style change?
  └─ Yes → CSS Selector Edit
  └─ No → Is it a simple attribute/content change?
      └─ Yes → Attribute Edit
      └─ No → Is it a targeted change with clear search text?
          └─ Yes → SEARCH/REPLACE Edit
          └─ No → Is it a structural change?
              └─ Yes → AST-Based Edit
              └─ No → Whole File Regeneration
```

#### Edit Applier

**Service**: `EditApplierService.ts`

**Responsibilities**:
- Apply edits to code
- Validate changes
- Maintain code formatting
- Preserve user comments
- Handle conflicts
- Rollback on failure

**Interface**:
```typescript
interface EditApplier {
  applyCSSEdit(css: string, edit: CSSEdit): string;
  applyAttributeEdit(html: string, edit: AttributeEdit): string;
  applySearchReplaceEdit(code: string, edit: SearchReplaceEdit): string;
  applyASTEdit(html: string, edit: ASTEdit): string;
  validateEdit(before: string, after: string): boolean;
  rollback(snapshot: CodeSnapshot): void;
}

interface CodeSnapshot {
  html: string;
  css: string;
  js: string;
  timestamp: number;
  description: string;
}
```

### 4. Layout and Positioning Tools

#### Flexbox Visual Editor

**Component**: `FlexboxEditor.tsx`

**Controls**:
- Container: flex-direction, justify-content, align-items, flex-wrap, gap
- Item: flex-grow, flex-shrink, flex-basis, align-self, order

**UI Features**:
- Visual diagram showing flex axis
- Drag handles for gap adjustment
- Alignment buttons with icons
- Order drag-and-drop for items

#### Grid Visual Editor

**Component**: `GridEditor.tsx`

**Controls**:
- Container: grid-template-columns, grid-template-rows, gap, justify-items, align-items
- Item: grid-column, grid-row, justify-self, align-self

**UI Features**:
- Visual grid overlay on preview
- Drag handles for column/row sizes
- Click-and-drag to span cells
- Preset grids (2-col, 3-col, sidebar, etc.)

#### Responsive Breakpoint Manager

**Component**: `BreakpointManager.tsx`

**Breakpoints**:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1439px
- Large Desktop: 1440px+
- Custom breakpoints

**Interface**:
```typescript
interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  icon: string;
}

interface ResponsiveStyle {
  breakpoint: string;
  selector: string;
  styles: Record<string, string>;
}
```

### 5. Design System Manager

#### Design Token Store

**Store**: `useDesignStore.ts`

**Token Categories**:
```typescript
interface DesignSystem {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    neutral: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    info: ColorScale;
  };
  typography: {
    fontFamilies: FontFamily[];
    fontSizes: FontSizeScale;
    fontWeights: FontWeightScale;
    lineHeights: LineHeightScale;
    letterSpacings: LetterSpacingScale;
  };
  spacing: SpacingScale;
  shadows: ShadowScale;
  radii: RadiusScale;
  breakpoints: Breakpoint[];
}

interface ColorScale {
  50: string;
  100: string;
  200: string;
  // ... up to 900
}
```

#### Design Token Editor

**Component**: `DesignTokenEditor.tsx`

**Features**:
- Generate color scales from base color
- Preview tokens in context
- Import from Figma/Tailwind
- Export as CSS/SCSS/JSON
- Light/dark mode switching



### 6. Undo/Redo System

#### History Manager

**Store**: `useHistoryStore.ts`

**Architecture**:
The undo/redo system uses a command pattern with a history stack. Each action is encapsulated as a command with execute/undo methods.

**Core Interfaces**:
```typescript
interface HistoryCommand {
  id: string;
  type: 'visual-edit' | 'surgical-edit' | 'agent-generation' | 'component-add' | 'component-delete';
  timestamp: number;
  description: string;
  execute: () => void;
  undo: () => void;
  redo: () => void;
}

interface HistoryState {
  undoStack: HistoryCommand[];
  redoStack: HistoryCommand[];
  maxStackSize: number; // 50 entries
  currentIndex: number;
}

interface CodeSnapshot {
  html: string;
  css: string;
  js: string;
  selectedElement: string | null;
  viewport: 'mobile' | 'tablet' | 'desktop';
}
```

**Command Types**:

1. **VisualEditCommand**:
```typescript
class VisualEditCommand implements HistoryCommand {
  constructor(
    private beforeSnapshot: CodeSnapshot,
    private afterSnapshot: CodeSnapshot,
    private description: string
  ) {}
  
  execute() {
    applySnapshot(this.afterSnapshot);
  }
  
  undo() {
    applySnapshot(this.beforeSnapshot);
  }
  
  redo() {
    this.execute();
  }
}
```

2. **SurgicalEditCommand**:
```typescript
class SurgicalEditCommand implements HistoryCommand {
  constructor(
    private fileType: 'html' | 'css' | 'js',
    private beforeContent: string,
    private afterContent: string,
    private editType: string,
    private description: string
  ) {}
  
  execute() {
    updateCode(this.fileType, this.afterContent);
  }
  
  undo() {
    updateCode(this.fileType, this.beforeContent);
  }
  
  redo() {
    this.execute();
  }
}
```

3. **AgentGenerationCommand**:
```typescript
class AgentGenerationCommand implements HistoryCommand {
  constructor(
    private beforeSnapshot: CodeSnapshot,
    private afterSnapshot: CodeSnapshot,
    private prompt: string
  ) {}
  
  execute() {
    applySnapshot(this.afterSnapshot);
  }
  
  undo() {
    applySnapshot(this.beforeSnapshot);
  }
  
  redo() {
    this.execute();
  }
}
```

**History Timeline Component**:

**Component**: `HistoryTimeline.tsx`

**Features**:
- Visual timeline with icons for each command type
- Timestamps and descriptions
- Click to jump to any point in history
- Search/filter history
- Branch visualization for non-linear history

**UI Layout**:
```
┌─────────────────────────────────────┐
│  History Timeline                   │
├─────────────────────────────────────┤
│  🎨 Visual Edit: Changed button     │
│     color to blue                   │
│     2 minutes ago                   │
├─────────────────────────────────────┤
│  ✂️ Surgical Edit: Updated heading  │
│     text                            │
│     5 minutes ago                   │
├─────────────────────────────────────┤
│  🤖 Agent Generation: Created       │
│     login form                      │
│     10 minutes ago                  │
└─────────────────────────────────────┘
```

**Keyboard Shortcuts**:
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Shift+Z`: Redo
- `Ctrl+H` / `Cmd+H`: Open history timeline

**Performance Optimization**:
- Store only diffs for large files (not full snapshots)
- Compress old history entries
- Limit stack to 50 entries (configurable)
- Use IndexedDB for persistent history across sessions

### 7. Diff Preview System

#### Diff Viewer Component

**Component**: `DiffViewer.tsx`

**Architecture**:
Uses a diff algorithm (similar to git diff) to compute line-by-line changes and display them with syntax highlighting.

**Core Interfaces**:
```typescript
interface DiffResult {
  fileType: 'html' | 'css' | 'js';
  changes: DiffChange[];
  stats: DiffStats;
}

interface DiffChange {
  type: 'add' | 'remove' | 'unchanged';
  lineNumber: number;
  content: string;
  highlighted: boolean;
}

interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
}

interface DiffViewerProps {
  before: string;
  after: string;
  fileType: 'html' | 'css' | 'js';
  viewMode: 'side-by-side' | 'inline';
  onApply: () => void;
  onCancel: () => void;
}
```

**Diff Algorithm**:
Uses Myers' diff algorithm (same as git) for optimal line-by-line comparison:

```typescript
class DiffEngine {
  computeDiff(before: string, after: string): DiffChange[] {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    
    // Myers' diff algorithm implementation
    const lcs = this.longestCommonSubsequence(beforeLines, afterLines);
    return this.buildDiffFromLCS(beforeLines, afterLines, lcs);
  }
  
  private longestCommonSubsequence(a: string[], b: string[]): number[][] {
    // LCS dynamic programming implementation
  }
  
  private buildDiffFromLCS(before: string[], after: string[], lcs: number[][]): DiffChange[] {
    // Build diff changes from LCS matrix
  }
}
```

**View Modes**:

1. **Side-by-Side View**:
```
┌──────────────────┬──────────────────┐
│  Before          │  After           │
├──────────────────┼──────────────────┤
│ 1  <div>         │ 1  <div>         │
│ 2    <h1>Old</h1>│ 2    <h1>New</h1>│
│ 3  </div>        │ 3  </div>        │
└──────────────────┴──────────────────┘
```

2. **Inline View**:
```
┌─────────────────────────────────────┐
│  1  <div>                           │
│  2-   <h1>Old</h1>                  │
│  2+   <h1>New</h1>                  │
│  3  </div>                          │
└─────────────────────────────────────┘
```

**Syntax Highlighting**:
- Integrate with Monaco Editor's tokenizer
- Apply language-specific highlighting
- Highlight changed portions within lines (word-level diff)

**Interactive Features**:
- Hover over change to see tooltip with details
- Click line number to jump to that line in editor
- Expand/collapse unchanged sections
- Search within diff
- Copy before/after snippets

**Integration with Surgical Edits**:

**Flow**:
```
User requests edit
    ↓
Surgical Edit Service generates edit
    ↓
Diff Preview shows changes
    ↓
User reviews and approves
    ↓
Edit applied + added to undo stack
```

**Component**: `SurgicalEditWithPreview.tsx`

```typescript
const SurgicalEditWithPreview = () => {
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  
  const handleEditRequest = async (description: string) => {
    const edit = await surgicalEditService.generateEdit(description);
    setPendingEdit(edit);
    setShowDiff(true);
  };
  
  const handleApply = () => {
    if (pendingEdit) {
      applyEdit(pendingEdit);
      addToHistory(pendingEdit);
      setShowDiff(false);
    }
  };
  
  return (
    <>
      <SurgicalEditPanel onSubmit={handleEditRequest} />
      {showDiff && pendingEdit && (
        <DiffViewer
          before={pendingEdit.before}
          after={pendingEdit.after}
          fileType={pendingEdit.fileType}
          onApply={handleApply}
          onCancel={() => setShowDiff(false)}
        />
      )}
    </>
  );
};
```

### 8. Edit Templates System

#### Template Manager

**Store**: `useTemplateStore.ts`

**Architecture**:
Templates are pre-defined surgical edit patterns that can be parameterized and applied with one click.

**Core Interfaces**:
```typescript
interface EditTemplate {
  id: string;
  name: string;
  description: string;
  category: 'responsive' | 'dark-mode' | 'accessibility' | 'animations' | 'performance' | 'custom';
  icon: string;
  parameters: TemplateParameter[];
  edits: TemplateEdit[];
  preview?: string;
}

interface TemplateParameter {
  name: string;
  type: 'text' | 'number' | 'color' | 'select' | 'boolean';
  label: string;
  default: any;
  options?: string[];
  validation?: (value: any) => boolean;
}

interface TemplateEdit {
  fileType: 'html' | 'css' | 'js';
  editType: 'css-selector' | 'search-replace' | 'append' | 'prepend';
  target?: string; // CSS selector or search string
  content: string | ((params: Record<string, any>) => string);
}
```

**Built-in Templates**:

1. **Make Responsive Template**:
```typescript
{
  id: 'make-responsive',
  name: 'Make Responsive',
  description: 'Add responsive breakpoints and flexible layouts',
  category: 'responsive',
  parameters: [
    {
      name: 'mobileBreakpoint',
      type: 'number',
      label: 'Mobile Breakpoint (px)',
      default: 768
    },
    {
      name: 'tabletBreakpoint',
      type: 'number',
      label: 'Tablet Breakpoint (px)',
      default: 1024
    }
  ],
  edits: [
    {
      fileType: 'css',
      editType: 'append',
      content: (params) => `
        @media (max-width: ${params.mobileBreakpoint}px) {
          body { padding: 1rem; }
          .container { width: 100%; }
        }
        
        @media (min-width: ${params.mobileBreakpoint + 1}px) and (max-width: ${params.tabletBreakpoint}px) {
          .container { width: 90%; }
        }
      `
    }
  ]
}
```

2. **Add Dark Mode Template**:
```typescript
{
  id: 'add-dark-mode',
  name: 'Add Dark Mode',
  description: 'Add dark mode support with CSS variables and toggle',
  category: 'dark-mode',
  parameters: [
    {
      name: 'darkBackground',
      type: 'color',
      label: 'Dark Background',
      default: '#1a1a1a'
    },
    {
      name: 'darkText',
      type: 'color',
      label: 'Dark Text Color',
      default: '#ffffff'
    }
  ],
  edits: [
    {
      fileType: 'css',
      editType: 'prepend',
      content: (params) => `
        :root {
          --bg-color: #ffffff;
          --text-color: #000000;
        }
        
        [data-theme="dark"] {
          --bg-color: ${params.darkBackground};
          --text-color: ${params.darkText};
        }
        
        body {
          background-color: var(--bg-color);
          color: var(--text-color);
          transition: background-color 0.3s, color 0.3s;
        }
      `
    },
    {
      fileType: 'html',
      editType: 'append',
      content: `
        <button id="theme-toggle" style="position: fixed; top: 1rem; right: 1rem;">
          🌙 Toggle Theme
        </button>
      `
    },
    {
      fileType: 'js',
      editType: 'append',
      content: `
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', newTheme);
          localStorage.setItem('theme', newTheme);
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
      `
    }
  ]
}
```

3. **Improve Accessibility Template**:
```typescript
{
  id: 'improve-accessibility',
  name: 'Improve Accessibility',
  description: 'Add ARIA labels, semantic HTML, and keyboard navigation',
  category: 'accessibility',
  parameters: [],
  edits: [
    {
      fileType: 'html',
      editType: 'search-replace',
      target: '<div class="nav">',
      content: '<nav role="navigation" aria-label="Main navigation">'
    },
    {
      fileType: 'css',
      editType: 'append',
      content: `
        /* Focus styles for keyboard navigation */
        *:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }
        
        /* Skip to main content link */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: #000;
          color: #fff;
          padding: 8px;
          text-decoration: none;
          z-index: 100;
        }
        
        .skip-link:focus {
          top: 0;
        }
      `
    }
  ]
}
```

4. **Add Animations Template**:
```typescript
{
  id: 'add-animations',
  name: 'Add Animations',
  description: 'Add smooth transitions and entrance animations',
  category: 'animations',
  parameters: [
    {
      name: 'duration',
      type: 'select',
      label: 'Animation Duration',
      default: '0.3s',
      options: ['0.15s', '0.3s', '0.5s', '1s']
    }
  ],
  edits: [
    {
      fileType: 'css',
      editType: 'append',
      content: (params) => `
        /* Fade in animation */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-in {
          animation: fadeIn ${params.duration} ease-out;
        }
        
        /* Smooth transitions */
        * {
          transition: all ${params.duration} ease;
        }
        
        /* Hover effects */
        button:hover, a:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
      `
    }
  ]
}
```

**Template UI Component**:

**Component**: `TemplateLibrary.tsx`

```
┌─────────────────────────────────────┐
│  Edit Templates                     │
├─────────────────────────────────────┤
│  [Search templates...]              │
├─────────────────────────────────────┤
│  📱 Responsive Design               │
│  ├─ Make Responsive                 │
│  ├─ Mobile-First Layout             │
│  └─ Fluid Typography                │
│                                     │
│  🌙 Dark Mode                       │
│  ├─ Add Dark Mode                   │
│  └─ Theme Switcher                  │
│                                     │
│  ♿ Accessibility                   │
│  ├─ Improve Accessibility           │
│  ├─ Keyboard Navigation             │
│  └─ Screen Reader Support           │
│                                     │
│  ✨ Animations                      │
│  ├─ Add Animations                  │
│  ├─ Scroll Animations               │
│  └─ Loading States                  │
│                                     │
│  ⚡ Performance                     │
│  ├─ Lazy Load Images                │
│  ├─ Code Splitting                  │
│  └─ Optimize Assets                 │
│                                     │
│  🎨 Custom Templates                │
│  ├─ My Template 1                   │
│  └─ [+ Create New]                  │
└─────────────────────────────────────┘
```

**Template Application Flow**:
```
User selects template
    ↓
Show parameter form (if needed)
    ↓
User fills parameters
    ↓
Generate edits with parameters
    ↓
Show diff preview
    ↓
User approves
    ↓
Apply all edits atomically
    ↓
Add to undo stack
```

**Custom Template Creator**:

**Component**: `TemplateCreator.tsx`

**Features**:
- Record a series of edits as a template
- Define parameters from recorded edits
- Test template with different parameters
- Export/import templates as JSON
- Share templates with team

### 9. Enhanced Component Library

#### Component Library Architecture

**Service**: `ComponentLibraryService.ts`

**Core Interfaces**:
```typescript
interface Component {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  tags: string[];
  thumbnail: string;
  previewUrl?: string;
  
  // Code
  html: string;
  css: string;
  js?: string;
  
  // Metadata
  variants: ComponentVariant[];
  props: ComponentProp[];
  dependencies: string[];
  responsive: boolean;
  accessible: boolean;
  
  // Usage
  usageCount: number;
  lastUsed?: Date;
  isFavorite: boolean;
  isCustom: boolean;
}

interface ComponentVariant {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  html: string;
  css: string;
  js?: string;
}

interface ComponentProp {
  name: string;
  type: 'text' | 'color' | 'number' | 'boolean' | 'select' | 'image';
  label: string;
  default: any;
  options?: string[];
  description?: string;
}

type ComponentCategory = 
  | 'layout'
  | 'navigation'
  | 'forms'
  | 'data-display'
  | 'feedback'
  | 'media'
  | 'interactive'
  | 'ecommerce'
  | 'marketing';
```

**Component Categories with Examples**:

1. **Layout** (10 components):
   - Container, Grid, Flexbox, Section, Divider, Spacer, Stack, Columns, Sidebar Layout, Hero Section

2. **Navigation** (8 components):
   - Navbar, Sidebar, Breadcrumb, Tabs, Pagination, Menu, Dropdown Menu, Footer

3. **Forms** (12 components):
   - Input, Textarea, Select, Checkbox, Radio, Button, Form Group, File Upload, Date Picker, Search Bar, Toggle Switch, Slider

4. **Data Display** (8 components):
   - Table, List, Card, Badge, Avatar, Progress Bar, Stats, Timeline

5. **Feedback** (6 components):
   - Alert, Toast, Modal, Tooltip, Popover, Loading Spinner

6. **Media** (4 components):
   - Image, Video Player, Gallery, Icon

7. **Interactive** (6 components):
   - Accordion, Carousel, Dropdown, Toggle, Slider, Tabs

8. **E-commerce** (4 components):
   - Product Card, Cart, Checkout Form, Pricing Table

9. **Marketing** (4 components):
   - Hero, Feature Grid, Testimonial, CTA Banner

**Total: 62 pre-built components**

**Component Palette UI**:

**Component**: `ComponentPalette.tsx`

```
┌─────────────────────────────────────┐
│  Components                    [×]  │
├─────────────────────────────────────┤
│  [Search components...]        🔍   │
│  [All] [Favorites] [Recent]         │
├─────────────────────────────────────┤
│  📐 Layout (10)                     │
│  ┌───┐ ┌───┐ ┌───┐                 │
│  │   │ │   │ │   │                 │
│  └───┘ └───┘ └───┘                 │
│  Container Grid  Flex               │
│                                     │
│  🧭 Navigation (8)                  │
│  ┌───┐ ┌───┐ ┌───┐                 │
│  │≡≡≡│ │ │ │ │...│                 │
│  └───┘ └───┘ └───┘                 │
│  Navbar Sidebar Breadcrumb          │
│                                     │
│  📝 Forms (12)                      │
│  ┌───┐ ┌───┐ ┌───┐                 │
│  │___│ │▭▭▭│ │▼ │                 │
│  └───┘ └───┘ └───┘                 │
│  Input Textarea Select              │
│                                     │
│  [Show More...]                     │
└─────────────────────────────────────┘
```

**Component Detail View**:

**Component**: `ComponentDetail.tsx`

```
┌─────────────────────────────────────┐
│  Button Component              [×]  │
├─────────────────────────────────────┤
│  [Preview]                          │
│  ┌─────────────────────────────┐   │
│  │  [Click Me]                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  Variants:                          │
│  ○ Primary  ○ Secondary  ○ Outline │
│                                     │
│  Properties:                        │
│  Text:     [Click Me        ]       │
│  Color:    [🎨 #0066cc      ]       │
│  Size:     [○ Small ● Medium        │
│             ○ Large]                │
│  Disabled: [☐]                      │
│                                     │
│  [Insert Component]                 │
└─────────────────────────────────────┘
```

**Drag and Drop Implementation**:

**Component**: `DraggableComponent.tsx`

```typescript
const DraggableComponent = ({ component }: { component: Component }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create ghost element
    const ghost = createGhostElement(component);
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
  };
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="component-item"
    >
      <img src={component.thumbnail} alt={component.name} />
      <span>{component.name}</span>
    </div>
  );
};
```

**Drop Zone Detection**:

**Hook**: `useDropZones.ts`

```typescript
const useDropZones = (iframe: HTMLIFrameElement) => {
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  
  useEffect(() => {
    const doc = iframe.contentDocument;
    if (!doc) return;
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      
      const target = e.target as HTMLElement;
      const zones = calculateDropZones(target);
      setDropZones(zones);
      
      // Show visual indicators
      zones.forEach(zone => {
        showDropIndicator(zone);
      });
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      
      const componentData = e.dataTransfer?.getData('component');
      if (!componentData) return;
      
      const component = JSON.parse(componentData);
      const dropZone = findClosestDropZone(e.clientX, e.clientY, dropZones);
      
      if (dropZone) {
        insertComponent(component, dropZone);
      }
    };
    
    doc.addEventListener('dragover', handleDragOver);
    doc.addEventListener('drop', handleDrop);
    
    return () => {
      doc.removeEventListener('dragover', handleDragOver);
      doc.removeEventListener('drop', handleDrop);
    };
  }, [iframe]);
  
  return dropZones;
};
```

**Component Insertion Service**:

**Service**: `ComponentInsertionService.ts`

```typescript
class ComponentInsertionService {
  insertComponent(
    component: Component,
    dropZone: DropZone,
    designTokens: DesignSystem
  ): SurgicalEdit {
    // Adapt component to design system
    const adaptedHTML = this.adaptToDesignSystem(component.html, designTokens);
    const adaptedCSS = this.adaptToDesignSystem(component.css, designTokens);
    
    // Generate surgical edit
    const edit: SurgicalEdit = {
      type: 'component-insertion',
      fileType: 'html',
      editType: 'insert',
      position: dropZone.position,
      target: dropZone.element,
      content: adaptedHTML
    };
    
    // Add CSS if needed
    if (component.css) {
      edit.cssEdit = {
        fileType: 'css',
        editType: 'append',
        content: adaptedCSS
      };
    }
    
    // Add JS if needed
    if (component.js) {
      edit.jsEdit = {
        fileType: 'js',
        editType: 'append',
        content: component.js
      };
    }
    
    return edit;
  }
  
  private adaptToDesignSystem(code: string, tokens: DesignSystem): string {
    // Replace hardcoded values with design tokens
    let adapted = code;
    
    // Replace colors
    adapted = adapted.replace(/#[0-9a-f]{6}/gi, (match) => {
      const tokenColor = this.findClosestColor(match, tokens.colors);
      return `var(--color-${tokenColor})`;
    });
    
    // Replace spacing
    adapted = adapted.replace(/(\d+)px/g, (match, value) => {
      const tokenSpacing = this.findClosestSpacing(parseInt(value), tokens.spacing);
      return `var(--spacing-${tokenSpacing})`;
    });
    
    return adapted;
  }
}
```

**Custom Component Creator**:

**Component**: `CustomComponentCreator.tsx`

**Features**:
- Select elements in preview to extract as component
- Define component name, category, description
- Specify which parts are configurable (props)
- Generate thumbnail automatically
- Save to personal library
- Export as reusable package

**Flow**:
```
User selects elements in preview
    ↓
Click "Save as Component"
    ↓
System extracts HTML/CSS/JS
    ↓
User defines metadata (name, category, props)
    ↓
System generates thumbnail
    ↓
Component saved to library
    ↓
Available for reuse
```

### 10. Multi-Page Application Management

#### Page Manager

**Store**: `usePageStore.ts`

**Interfaces**:
```typescript
interface Page {
  id: string;
  name: string;
  path: string;
  title: string;
  html: string;
  css: string;
  js: string;
  meta: PageMeta;
  parent?: string;
  children: string[];
}

interface PageMeta {
  description: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
}

interface Navigation {
  id: string;
  type: 'navbar' | 'sidebar' | 'footer';
  items: NavigationItem[];
}

interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
}
```

**Page Management Service**:

**Service**: `PageManagementService.ts`

```typescript
class PageManagementService {
  createPage(name: string, template?: string): Page {
    const page: Page = {
      id: generateId(),
      name,
      path: `/${slugify(name)}`,
      title: name,
      html: template || this.getDefaultTemplate(),
      css: '',
      js: '',
      meta: {
        description: '',
        keywords: []
      },
      children: []
    };
    
    // Update navigation across all pages
    this.updateNavigationLinks(page);
    
    return page;
  }
  
  deletePage(pageId: string): void {
    // Remove page
    // Update navigation in all pages
    // Remove references
  }
  
  updateNavigationLinks(newPage: Page): void {
    // Find all navigation elements across pages
    // Add link to new page
    // Apply surgical edits to update navigation
  }
}
```

## Data Models

### Core Data Structures

#### Project Model
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Pages
  pages: Page[];
  currentPageId: string;
  
  // Design System
  designSystem: DesignSystem;
  
  // Components
  customComponents: Component[];
  
  // Settings
  settings: ProjectSettings;
  
  // Collaboration
  collaborators: Collaborator[];
  versions: Version[];
}

interface ProjectSettings {
  viewport: 'mobile' | 'tablet' | 'desktop';
  theme: 'light' | 'dark';
  autoSave: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
}
```

#### Version Model
```typescript
interface Version {
  id: string;
  timestamp: Date;
  description: string;
  author: string;
  snapshot: ProjectSnapshot;
  parent?: string;
}

interface ProjectSnapshot {
  pages: Page[];
  designSystem: DesignSystem;
  customComponents: Component[];
}
```

#### Collaborator Model
```typescript
interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  cursor?: CursorPosition;
  selection?: string;
  lastActive: Date;
}

interface CursorPosition {
  pageId: string;
  x: number;
  y: number;
  color: string;
}
```

## Error Handling

### Error Types

```typescript
enum ErrorType {
  SURGICAL_EDIT_FAILED = 'SURGICAL_EDIT_FAILED',
  COMPONENT_INSERTION_FAILED = 'COMPONENT_INSERTION_FAILED',
  INVALID_HTML = 'INVALID_HTML',
  INVALID_CSS = 'INVALID_CSS',
  INVALID_JS = 'INVALID_JS',
  LLM_API_ERROR = 'LLM_API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  recoverable: boolean;
  recovery?: () => void;
}
```

### Error Recovery Strategies

1. **Surgical Edit Failures**:
   - Rollback to previous state
   - Show diff of what failed
   - Offer alternative edit strategies
   - Allow manual code editing

2. **Component Insertion Failures**:
   - Validate HTML before insertion
   - Check for conflicts
   - Offer to fix conflicts automatically
   - Fallback to manual insertion

3. **LLM API Errors**:
   - Retry with exponential backoff
   - Cache previous successful responses
   - Fallback to simpler edit strategies
   - Show user-friendly error messages

4. **Validation Errors**:
   - Highlight invalid code
   - Suggest fixes
   - Allow ignoring warnings
   - Provide documentation links

## Testing Strategy

### Unit Tests

**Test Coverage**:
- Diff algorithm correctness
- History command execute/undo/redo
- Template parameter substitution
- Component adaptation to design system
- Surgical edit strategy selection
- Drop zone calculation

**Testing Framework**: Vitest

**Example Test**:
```typescript
describe('DiffEngine', () => {
  it('should compute correct diff for simple changes', () => {
    const before = '<div>Hello</div>';
    const after = '<div>World</div>';
    
    const diff = diffEngine.computeDiff(before, after);
    
    expect(diff.changes).toHaveLength(3);
    expect(diff.changes[0].type).toBe('unchanged');
    expect(diff.changes[1].type).toBe('remove');
    expect(diff.changes[2].type).toBe('add');
  });
});
```

### Integration Tests

**Test Scenarios**:
- Complete undo/redo cycle
- Apply template with parameters
- Drag and drop component
- Multi-file surgical edit
- Diff preview and apply
- Navigation update across pages

**Testing Framework**: Playwright

**Example Test**:
```typescript
test('should undo and redo visual edit', async ({ page }) => {
  await page.goto('/');
  
  // Make a visual edit
  await page.click('[data-testid="enable-visual-edit"]');
  await page.frameLocator('iframe').locator('.button').click();
  await page.fill('[data-testid="bg-color"]', '#ff0000');
  await page.click('[data-testid="save-changes"]');
  
  // Undo
  await page.keyboard.press('Control+Z');
  const bgColor = await page.frameLocator('iframe')
    .locator('.button')
    .evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bgColor).not.toBe('rgb(255, 0, 0)');
  
  // Redo
  await page.keyboard.press('Control+Y');
  const bgColorAfterRedo = await page.frameLocator('iframe')
    .locator('.button')
    .evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bgColorAfterRedo).toBe('rgb(255, 0, 0)');
});
```

### E2E Tests

**Test Flows**:
- Complete user journey: Generate → Edit → Template → Export
- Collaboration: Multiple users editing simultaneously
- Version control: Create version → Restore → Branch
- Component library: Browse → Customize → Insert → Save

## Performance Optimization

### Frontend Optimizations

1. **Virtual Scrolling**: For large component libraries and history timelines
2. **Code Splitting**: Lazy load heavy components (Monaco Editor, Diff Viewer)
3. **Memoization**: React.memo for expensive components
4. **Debouncing**: Debounce visual edit updates
5. **Web Workers**: Run diff algorithm in background thread
6. **IndexedDB**: Persist history and projects locally

### Backend Optimizations

1. **Caching**: Cache LLM responses for common edits
2. **Rate Limiting**: Prevent API abuse
3. **Compression**: Gzip responses
4. **Connection Pooling**: Reuse HTTP connections
5. **Streaming**: Stream large responses

### LLM Optimizations

1. **Token Reduction**: Minimize context sent to LLM
2. **Strategy Selection**: Use cheapest strategy that works
3. **Batching**: Batch multiple edits when possible
4. **Caching**: Cache template expansions
5. **Fallback**: Use client-side edits when possible (visual editing)

## Security Considerations

### XSS Prevention

1. **Sanitize HTML**: Use DOMPurify for user-generated HTML
2. **CSP Headers**: Strict Content Security Policy
3. **Iframe Sandboxing**: Sandbox preview iframe
4. **Input Validation**: Validate all user inputs

### Code Injection Prevention

1. **Template Validation**: Validate template code before execution
2. **JS Execution**: Run user JS in isolated context
3. **CSS Injection**: Sanitize CSS before injection

### API Security

1. **Authentication**: JWT tokens for API access
2. **Authorization**: Role-based access control
3. **Rate Limiting**: Prevent abuse
4. **Input Validation**: Validate all API inputs

## Deployment Architecture

### Frontend Deployment

- **Platform**: Vercel / Netlify
- **CDN**: CloudFlare
- **Build**: Vite production build
- **Environment**: Environment variables for API URL

### Backend Deployment

- **Platform**: Railway / Render / AWS
- **Database**: PostgreSQL for projects, Redis for sessions
- **File Storage**: S3 for assets
- **WebSocket**: Socket.io for collaboration

### Monitoring

- **Error Tracking**: Sentry
- **Analytics**: PostHog / Mixpanel
- **Performance**: Web Vitals
- **Logging**: Winston + CloudWatch

## Migration Strategy

### Phase 1: Foundation (Current → Enhanced Visual Editing)
- Enhance existing visual editor with breadcrumb navigation
- Add tree view for nested element selection
- Improve property panel with more categories

### Phase 2: History & Preview (Undo/Redo + Diff)
- Implement history store with command pattern
- Add undo/redo functionality
- Build diff viewer component
- Integrate diff preview with surgical edits

### Phase 3: Templates & Components (Edit Templates + Component Library)
- Build template system with built-in templates
- Create component library with 50+ components
- Implement drag-and-drop
- Add custom component creator

### Phase 4: Advanced Features (Multi-page + Collaboration)
- Add page management
- Implement navigation sync
- Build collaboration features
- Add version control

### Phase 5: Polish & Optimization
- Performance optimization
- Comprehensive testing
- Documentation
- User onboarding

## API Endpoints

### Surgical Edit API

```
POST /api/surgical-edit
Body: {
  description: string;
  currentCode: { html, css, js };
  selectedElement?: string;
}
Response: {
  edit: SurgicalEdit;
  preview: { before, after };
}

POST /api/surgical-edit/apply
Body: {
  edit: SurgicalEdit;
}
Response: {
  success: boolean;
  updatedCode: { html, css, js };
}
```

### Template API

```
GET /api/templates
Response: EditTemplate[]

GET /api/templates/:id
Response: EditTemplate

POST /api/templates/:id/apply
Body: {
  parameters: Record<string, any>;
  currentCode: { html, css, js };
}
Response: {
  edits: SurgicalEdit[];
  preview: { before, after };
}

POST /api/templates/custom
Body: EditTemplate
Response: { id: string }
```

### Component Library API

```
GET /api/components
Query: { category?, search?, tags? }
Response: Component[]

GET /api/components/:id
Response: Component

POST /api/components/:id/insert
Body: {
  dropZone: DropZone;
  variant?: string;
  props?: Record<string, any>;
  designSystem: DesignSystem;
}
Response: {
  edit: SurgicalEdit;
  preview: string;
}

POST /api/components/custom
Body: Component
Response: { id: string }
```

### Project API

```
GET /api/projects
Response: Project[]

GET /api/projects/:id
Response: Project

POST /api/projects
Body: { name, description, template? }
Response: Project

PUT /api/projects/:id
Body: Partial<Project>
Response: Project

DELETE /api/projects/:id
Response: { success: boolean }
```

### Page API

```
GET /api/projects/:projectId/pages
Response: Page[]

POST /api/projects/:projectId/pages
Body: { name, template? }
Response: Page

PUT /api/projects/:projectId/pages/:pageId
Body: Partial<Page>
Response: Page

DELETE /api/projects/:projectId/pages/:pageId
Response: { success: boolean }
```

### Collaboration API (WebSocket)

```
// Events
connect: { projectId, userId }
disconnect: { userId }
cursor-move: { userId, position }
selection-change: { userId, selection }
edit: { userId, edit }
presence: { users: Collaborator[] }
```

## Conclusion

This design provides a comprehensive architecture for transforming the HTML Prototype Builder into a Lovable.dev-like platform. The key innovations are:

1. **Command Pattern for Undo/Redo**: Enables reliable history tracking
2. **Diff Preview System**: Gives users confidence before applying changes
3. **Template System**: Accelerates common modifications
4. **Enhanced Component Library**: 50+ pre-built, customizable components
5. **Surgical Edit Engine**: Preserves user customizations
6. **Multi-Page Support**: Build complete applications
7. **Real-Time Collaboration**: Work together seamlessly

The architecture is designed to be:
- **Scalable**: Can handle large projects with many pages
- **Performant**: Optimized for speed and responsiveness
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new features
- **User-Friendly**: Visual-first workflow for non-technical users
  