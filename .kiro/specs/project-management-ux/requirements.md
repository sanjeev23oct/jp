# Requirements Document

## Introduction

This feature transforms the HTML Prototype Builder into a full-featured project management system similar to Lovable.dev, with the ability to save, load, and manage multiple prototypes. It also includes essential UX improvements like resizable panels, opening prototypes in new windows, and sharing capabilities. The goal is to provide a professional, production-ready experience for managing HTML prototypes.

## Requirements

### Requirement 1: Project List and Management

**User Story:** As a user, I want to see a list of all my previously created prototypes, so that I can easily access and manage my work.

#### Acceptance Criteria

1. WHEN a user opens the application THEN the system SHALL display a project list/dashboard as the home screen
2. WHEN viewing the project list THEN the system SHALL show project cards with thumbnail, name, description, and last modified date
3. WHEN a user clicks on a project card THEN the system SHALL open that project in the editor
4. WHEN a user creates a new prototype THEN the system SHALL automatically save it to IndexedDB with a unique ID
5. WHEN a user wants to create a new project THEN the system SHALL show a "New Project" button prominently
6. WHEN a user hovers over a project card THEN the system SHALL show action buttons (Open, Rename, Delete, Duplicate)
7. WHEN a user deletes a project THEN the system SHALL ask for confirmation before deleting

### Requirement 2: Auto-Save and Project Persistence

**User Story:** As a user working on a prototype, I want my changes to be automatically saved, so that I never lose my work.

#### Acceptance Criteria

1. WHEN a user makes changes to HTML/CSS/JS THEN the system SHALL auto-save after 2 seconds of inactivity
2. WHEN auto-save occurs THEN the system SHALL show a subtle "Saved" indicator
3. WHEN a user closes the browser THEN the system SHALL preserve all project data in IndexedDB
4. WHEN a user reopens the application THEN the system SHALL restore the last opened project
5. IF auto-save fails THEN the system SHALL show an error and retry
6. WHEN a user generates new code THEN the system SHALL save it as a new version
7. WHEN viewing a project THEN the system SHALL show the last saved timestamp

### Requirement 3: Resizable Panels

**User Story:** As a user working on a prototype, I want to resize the chat and preview panels, so that I can adjust my workspace to my needs.

#### Acceptance Criteria

1. WHEN a user is in the editor THEN the system SHALL show a draggable divider between chat and preview panels
2. WHEN a user drags the divider THEN the system SHALL resize both panels in real-time
3. WHEN a user resizes panels THEN the system SHALL remember the sizes in localStorage
4. WHEN a user reopens the application THEN the system SHALL restore the previous panel sizes
5. IF a user double-clicks the divider THEN the system SHALL reset to 50/50 split
6. WHEN panels are resized THEN the system SHALL ensure minimum widths (300px for chat, 400px for preview)
7. WHEN the window is resized THEN the system SHALL maintain the panel proportions

### Requirement 4: Open in New Window

**User Story:** As a user testing my prototype, I want to open it in a new window, so that I can test it in isolation and on different screen sizes.

#### Acceptance Criteria

1. WHEN viewing a prototype THEN the system SHALL show an "Open in New Window" button
2. WHEN a user clicks "Open in New Window" THEN the system SHALL open the prototype in a new browser window
3. WHEN opened in new window THEN the system SHALL show only the prototype (no editor UI)
4. WHEN opened in new window THEN the system SHALL include all HTML, CSS, and JS
5. IF the prototype uses IndexedDB THEN the system SHALL ensure data is accessible in the new window
6. WHEN the new window opens THEN the system SHALL set appropriate window size (1024x768 default)
7. WHEN a user makes changes in the editor THEN the system SHALL offer to refresh the preview window

### Requirement 5: Share Prototype

**User Story:** As a user who wants to share my prototype, I want to generate a shareable link or export it, so that others can view my work.

#### Acceptance Criteria

1. WHEN viewing a prototype THEN the system SHALL show a "Share" button
2. WHEN a user clicks "Share" THEN the system SHALL show sharing options (Export HTML, Copy Link, Generate QR Code)
3. WHEN a user selects "Export HTML" THEN the system SHALL download a standalone HTML file with inline CSS/JS
4. WHEN a user selects "Copy Link" THEN the system SHALL generate a shareable URL and copy it to clipboard
5. IF sharing via link THEN the system SHALL encode the prototype data in the URL (for small prototypes) or use a share ID
6. WHEN someone opens a shared link THEN the system SHALL load the prototype in view-only mode
7. WHEN exporting THEN the system SHALL ensure the HTML file works offline with no dependencies

### Requirement 6: Project Metadata and Organization

**User Story:** As a user with multiple prototypes, I want to organize them with names, descriptions, and tags, so that I can find them easily.

#### Acceptance Criteria

1. WHEN creating a project THEN the system SHALL prompt for a project name
2. WHEN viewing a project THEN the system SHALL allow editing the name and description
3. WHEN a user adds a description THEN the system SHALL save it with the project
4. WHEN viewing the project list THEN the system SHALL allow sorting by name, date created, or date modified
5. IF a user doesn't provide a name THEN the system SHALL generate one based on the prompt (e.g., "Todo App - Oct 13")
6. WHEN a user searches THEN the system SHALL filter projects by name or description
7. WHEN a project is created THEN the system SHALL capture a thumbnail screenshot of the preview

### Requirement 7: Project Duplication

**User Story:** As a user who wants to create variations, I want to duplicate an existing prototype, so that I can experiment without affecting the original.

#### Acceptance Criteria

1. WHEN viewing a project card THEN the system SHALL show a "Duplicate" action
2. WHEN a user clicks "Duplicate" THEN the system SHALL create a copy with " (Copy)" appended to the name
3. WHEN duplicating THEN the system SHALL copy all HTML, CSS, JS, and metadata
4. WHEN a duplicate is created THEN the system SHALL open it in the editor
5. IF duplication fails THEN the system SHALL show an error message
6. WHEN duplicating THEN the system SHALL assign a new unique ID
7. WHEN viewing the project list THEN the system SHALL show the duplicate immediately

### Requirement 8: Responsive Layout

**User Story:** As a user on different devices, I want the application to work well on tablets and desktops, so that I can work anywhere.

#### Acceptance Criteria

1. WHEN on a tablet (768px-1024px) THEN the system SHALL stack panels vertically
2. WHEN on desktop (>1024px) THEN the system SHALL show panels side-by-side
3. WHEN on mobile (<768px) THEN the system SHALL show a message suggesting desktop use
4. IF the screen is too small THEN the system SHALL hide non-essential UI elements
5. WHEN resizing the window THEN the system SHALL adapt the layout smoothly
6. WHEN on touch devices THEN the system SHALL ensure touch-friendly controls (larger buttons, swipe gestures)
7. WHEN the layout changes THEN the system SHALL preserve the user's work

### Requirement 9: Keyboard Shortcuts

**User Story:** As a power user, I want keyboard shortcuts for common actions, so that I can work more efficiently.

#### Acceptance Criteria

1. WHEN a user presses Ctrl+S (Cmd+S) THEN the system SHALL manually trigger save
2. WHEN a user presses Ctrl+N (Cmd+N) THEN the system SHALL create a new project
3. WHEN a user presses Ctrl+O (Cmd+O) THEN the system SHALL show the project list
4. WHEN a user presses Ctrl+Shift+P (Cmd+Shift+P) THEN the system SHALL open the preview in a new window
5. WHEN a user presses Ctrl+Shift+E (Cmd+Shift+E) THEN the system SHALL export the prototype
6. WHEN a user presses ? THEN the system SHALL show a keyboard shortcuts help modal
7. WHEN shortcuts are used THEN the system SHALL show a brief toast notification

### Requirement 10: Project Templates

**User Story:** As a user starting a new project, I want to choose from templates, so that I can start with a foundation.

#### Acceptance Criteria

1. WHEN creating a new project THEN the system SHALL show template options (Blank, Landing Page, Dashboard, Todo App, etc.)
2. WHEN a user selects a template THEN the system SHALL pre-populate the project with template code
3. WHEN templates are shown THEN the system SHALL display preview thumbnails
4. IF a user selects "Blank" THEN the system SHALL start with empty HTML/CSS/JS
5. WHEN a template is used THEN the system SHALL allow customization via chat
6. WHEN viewing templates THEN the system SHALL show descriptions of what each includes
7. WHEN a template is selected THEN the system SHALL create a new project with the template code

### Requirement 11: Version History (Basic)

**User Story:** As a user who wants to track changes, I want to see a history of my prototype versions, so that I can revert if needed.

#### Acceptance Criteria

1. WHEN a user generates new code THEN the system SHALL save it as a version snapshot
2. WHEN viewing a project THEN the system SHALL show a "History" button
3. WHEN a user clicks "History" THEN the system SHALL show a list of versions with timestamps
4. WHEN viewing a version THEN the system SHALL show a preview of that version's code
5. IF a user wants to restore a version THEN the system SHALL allow reverting to it
6. WHEN reverting THEN the system SHALL create a new version (not delete history)
7. WHEN viewing history THEN the system SHALL limit to the last 10 versions to save space

### Requirement 12: Export Options

**User Story:** As a user who wants to use my prototype elsewhere, I want multiple export formats, so that I can integrate with different workflows.

#### Acceptance Criteria

1. WHEN exporting THEN the system SHALL offer formats: Single HTML File, ZIP (separate files), CodePen, JSFiddle
2. WHEN exporting as Single HTML THEN the system SHALL inline all CSS and JS
3. WHEN exporting as ZIP THEN the system SHALL create separate index.html, styles.css, and script.js files
4. WHEN exporting to CodePen THEN the system SHALL open CodePen with the code pre-filled
5. IF exporting to JSFiddle THEN the system SHALL open JSFiddle with the code pre-filled
6. WHEN exporting THEN the system SHALL include a comment with generation date and source
7. WHEN export completes THEN the system SHALL show a success message with download link
