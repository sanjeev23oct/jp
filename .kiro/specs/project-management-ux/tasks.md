# Implementation Plan

- [x] 1. Set up IndexedDB database and schemas




  - Create database schema for Projects, ProjectVersions, and AppSettings tables
  - Set up Dexie.js wrapper with proper indexes
  - Create database initialization and migration logic
  - Add database utility functions for CRUD operations



  - _Requirements: 1.1, 2.3, 6.7_

- [ ] 2. Create Project Store
- [x] 2.1 Implement core project management



  - Create useProjectStore with Zustand
  - Implement loadProjects, createProject, openProject actions
  - Implement saveProject, deleteProject, duplicateProject actions
  - Add project metadata management (name, description, tags)
  - _Requirements: 1.2, 1.3, 1.4, 6.1, 6.2, 7.1, 7.2_

- [ ] 2.2 Implement auto-save functionality
  - Create debounced auto-save function (2s delay)
  - Integrate with editor code changes
  - Add "Saved" indicator UI component
  - Handle auto-save errors with retry logic
  - _Requirements: 2.1, 2.2, 2.5, 2.7_




- [ ] 2.3 Add version history management
  - Implement saveVersion action
  - Implement loadVersions and restoreVersion actions
  - Limit version history to last 10 versions
  - Auto-create version on AI generation
  - _Requirements: 11.1, 11.2, 11.5, 11.6, 11.7_

- [ ] 3. Build Home Page (Project List)
- [ ] 3.1 Create project list UI
  - Build HomePage component with grid layout
  - Create ProjectCard component with thumbnail, name, date
  - Add hover actions menu (Open, Rename, Delete, Duplicate)
  - Implement empty state with "Create first prototype" message
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [ ] 3.2 Add search and sort functionality
  - Implement search bar with filtering
  - Add sort dropdown (Recent, Name, Date Created)
  - Filter projects by name and description
  - _Requirements: 6.4, 6.6_

- [ ] 3.3 Implement project actions
  - Add delete confirmation modal
  - Implement rename inline editing
  - Add duplicate project functionality
  - Show loading states during operations
  - _Requirements: 1.7, 6.2, 7.3, 7.4, 7.7_

- [ ] 4. Implement resizable panels
  - Install and configure react-resizable-panels
  - Create ResizablePanels component wrapping chat and preview
  - Add resize handle with hover effects
  - Implement panel size persistence to localStorage
  - Add double-click to reset to 50/50 split
  - Set minimum panel widths (300px chat, 400px preview)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 5. Add "Open in New Window" feature
  - Create openInNewWindow function
  - Generate complete HTML document with inline CSS/JS
  - Open in new window with appropriate size (1024x768)
  - Store reference to preview window
  - Add "Reload preview" toast when code changes
  - Handle window close cleanup
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 6. Build Share and Export functionality
- [ ] 6.1 Create ShareModal component
  - Build modal UI with export options
  - Add tabs for different export formats
  - Show export progress indicators
  - Display success messages with download links
  - _Requirements: 5.1, 5.2, 12.7_

- [ ] 6.2 Implement export formats
  - Add "Export as Single HTML" with inline CSS/JS
  - Add "Export as ZIP" with separate files (using JSZip)
  - Add "Copy Share Link" with URL encoding (using LZString)
  - Add "Open in CodePen" integration
  - Add "Open in JSFiddle" integration
  - Include generation metadata in exports
  - _Requirements: 5.3, 5.4, 5.7, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 6.3 Implement share link functionality
  - Compress project data with LZString
  - Generate shareable URL with encoded data
  - Create /preview route for viewing shared prototypes
  - Add view-only mode for shared links
  - Copy link to clipboard functionality
  - _Requirements: 5.5, 5.6_

- [ ] 7. Add keyboard shortcuts
  - Create useKeyboardShortcuts hook
  - Implement Ctrl/Cmd+S for manual save
  - Implement Ctrl/Cmd+N for new project
  - Implement Ctrl/Cmd+O for open project list
  - Implement Ctrl/Cmd+Shift+P for open in new window
  - Implement Ctrl/Cmd+Shift+E for export
  - Implement ? for keyboard shortcuts help modal
  - Show toast notifications for shortcut actions
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 8. Create project templates
- [ ] 8.1 Define template data
  - Create templates array with Blank, Landing Page, Dashboard, Todo App
  - Add template HTML/CSS/JS code for each
  - Create template thumbnail images
  - Add template descriptions
  - _Requirements: 10.1, 10.3, 10.6_

- [ ] 8.2 Build template selection UI
  - Create TemplateModal component
  - Display template grid with thumbnails
  - Show template descriptions on hover
  - Handle template selection
  - Pre-populate project with template code
  - _Requirements: 10.2, 10.4, 10.5, 10.7_

- [ ] 9. Implement thumbnail capture
  - Create captureProjectThumbnail function using html2canvas
  - Capture preview iframe content
  - Compress thumbnail to <50KB
  - Save thumbnail to project in IndexedDB
  - Auto-capture on first save and periodically
  - _Requirements: 6.7_

- [ ] 10. Add version history UI
  - Create VersionHistoryPanel component
  - Display version list with timestamps and descriptions
  - Show generation prompts for AI-created versions
  - Add "Restore" button for each version
  - Implement restore confirmation dialog
  - Auto-create version on AI generation
  - _Requirements: 11.3, 11.4, 11.5, 11.6_

- [ ] 11. Implement responsive layout
  - Add media queries for tablet (768px-1024px)
  - Stack panels vertically on tablet
  - Add mobile detection and warning message (<768px)
  - Hide non-essential UI on small screens
  - Add touch-friendly controls for tablets
  - Test layout adaptation on window resize
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 12. Add settings and preferences
  - Create AppSettings store
  - Save last opened project ID
  - Save panel sizes preference
  - Save theme preference (light/dark)
  - Save keyboard shortcuts enabled/disabled
  - Restore settings on app load
  - _Requirements: 2.4, 3.4_

- [ ] 13. Implement data migration
  - Create migration utility for existing users
  - Detect code in localStorage
  - Show migration prompt
  - Create project from existing code
  - Clear old localStorage data
  - _Requirements: 2.3_

- [ ] 14. Add routing and navigation
  - Set up React Router with routes: /, /editor/:id, /preview
  - Implement navigation between home and editor
  - Handle deep linking to specific projects
  - Add browser back/forward support
  - Implement /preview route for shared links
  - _Requirements: 1.3, 5.6_

- [ ] 15. Polish and UX improvements
  - Add loading states for all async operations
  - Add error boundaries for graceful error handling
  - Implement toast notification system
  - Add confirmation dialogs for destructive actions
  - Add smooth transitions and animations
  - Ensure accessibility (ARIA labels, keyboard navigation)
  - _Requirements: All_

- [ ] 16. Testing and validation
  - Write unit tests for project store actions
  - Write unit tests for export functions
  - Write integration tests for project lifecycle
  - Test keyboard shortcuts
  - Test resizable panels persistence
  - Test share link generation and loading
  - Test on different browsers and screen sizes
  - _Requirements: All_

- [ ] 17. Documentation
  - Update README with new features
  - Add user guide for project management
  - Document keyboard shortcuts
  - Add export format documentation
  - Create troubleshooting guide
  - _Requirements: All_
