# Admin Database Backup Management - TODO

This document outlines the tasks needed to implement database backup management functionality in the admin page.

## Phase 1: API Client Functions

### Task 1.1: Create database API client
- [x] Create `src/lib/api/database.ts`
- [x] Add TypeScript interfaces for API responses:
  - `BackupFile` interface (filename, size, sizeFormatted, createdAt)
  - `GetBackupsResponse` interface (backups array, count)
  - `CreateBackupResponse` interface
  - `DeleteBackupResponse` interface
  - `RestoreDatabaseResponse` interface
- [x] Implement `getBackupsList()` - GET /database/backups-list
- [x] Implement `createBackup()` - POST /database/create-backup
- [x] Implement `downloadBackup(filename)` - GET /database/download-backup/:filename
  - Return blob for file download
  - Handle browser download trigger
- [x] Implement `deleteBackup(filename)` - DELETE /database/delete-backup/:filename
- [x] Implement `replenishDatabase(file)` - POST /database/replenish-database
  - Use FormData for file upload
  - Set appropriate headers for multipart/form-data

## Phase 2: Table Component

### Task 2.1: Create TableAdminDatabase component
- [ ] Create `src/components/tables/TableAdminDatabase.tsx`
- [ ] Component props:
  - `backups: BackupFile[]`
  - `onDownload: (filename: string) => void`
  - `onDelete: (filename: string) => void`
- [ ] Table structure:
  - Column 1: Filename (as clickable link/button)
  - Column 2: Size (formatted, e.g., "1.02 MB")
  - Column 3: Created Date (formatted timestamp)
  - Column 4: Delete button (red "X")
- [ ] Style filename as hyperlink with hover effect
- [ ] Style delete button as red "X" with hover effect
- [ ] Handle empty state ("No backups available")
- [ ] Make responsive for small screens

## Phase 3: Admin Page Integration

### Task 3.1: Add Database section to admin page
- [ ] Add state variables to `src/app/admin/page.tsx`:
  - `isDatabaseExpanded` (boolean)
  - `backups` (BackupFile[])
  - `databaseLoading` (boolean)
  - `databaseError` (string | null)
  - `uploadFile` (File | null)
- [ ] Create `fetchBackups()` callback function
  - Call `getBackupsList()` API
  - Update state with backups
  - Handle errors
- [ ] Add useEffect to fetch backups when section expands
  - Similar pattern to Sounds/Meditations/Queuer sections
  - Only fetch if `isDatabaseExpanded` and `backups.length === 0`

### Task 3.2: Create collapsible Database section UI
- [ ] Add new `<section>` after Queuer section
- [ ] Add toggle button with:
  - Title: "Database"
  - Subtitle: "Backup and restore database"
  - Expand/collapse arrow icon (conditionally hide if no backups)
- [ ] Add "Create Backup" button in section header (like "Upload Sound File")
  - Position to the left of expand/collapse arrow
  - Call `handleCreateBackup()` onClick
  - Prevent event propagation (stopPropagation)

### Task 3.3: Render content when expanded
- [ ] Show loading skeleton when `databaseLoading === true`
- [ ] Show error message with retry button when `databaseError !== null`
- [ ] Show TableAdminDatabase when `!databaseLoading && !databaseError`
- [ ] Pass backups, onDownload, and onDelete handlers

### Task 3.4: Add file upload section
- [ ] Add file upload UI below the table
- [ ] Create file input with:
  - Accept only `.zip` files
  - Label: "Upload Backup (.zip)"
  - Display selected filename when file is chosen
- [ ] Add "Restore Database" button
  - Disabled if no file selected
  - Call `handleRestoreDatabase()` onClick
- [ ] Show warning text: "⚠️ Warning: Restoring will replace all current data"

## Phase 4: Action Handlers

### Task 4.1: Implement handleCreateBackup
- [ ] Show LoadingOverlay with message "Creating database backup..."
- [ ] Call `createBackup()` API
- [ ] On success:
  - Refresh backups list
  - Show success Toast
  - Hide LoadingOverlay
- [ ] On error:
  - Show error Toast
  - Hide LoadingOverlay

### Task 4.2: Implement handleDownload
- [ ] Show LoadingOverlay with message "Downloading backup..."
- [ ] Call `downloadBackup(filename)` API
- [ ] Trigger browser download using blob URL
- [ ] Create temporary anchor element and click it
- [ ] Cleanup blob URL after download
- [ ] Hide LoadingOverlay
- [ ] On error:
  - Show error Toast
  - Hide LoadingOverlay

### Task 4.3: Implement handleDelete
- [ ] Call `deleteBackup(filename)` API (no confirmation)
- [ ] On success:
  - Remove backup from local state
  - Show success Toast
- [ ] On error:
  - Show error Toast

### Task 4.4: Implement handleRestoreDatabase
- [ ] Show LoadingOverlay with message "Restoring database..."
- [ ] Call `replenishDatabase(uploadFile)` API
- [ ] On success:
  - Clear file input
  - Show success Toast with row counts
  - Refresh backups list
  - Hide LoadingOverlay
- [ ] On error:
  - Show error Toast
  - Hide LoadingOverlay

## Phase 5: Testing & Polish

### Task 5.1: Manual testing
- [ ] Test creating backup
- [ ] Test listing backups
- [ ] Test downloading backup (verify file downloads correctly)
- [ ] Test deleting backup
- [ ] Test uploading and restoring backup
- [ ] Test error handling for all operations
- [ ] Test LoadingOverlay appears/disappears correctly
- [ ] Test responsive design on mobile

### Task 5.2: Edge cases
- [ ] Handle empty backups list
- [ ] Handle network errors
- [ ] Handle large file uploads
- [ ] Verify only .zip files can be selected
- [ ] Test with multiple rapid clicks (race conditions)

### Task 5.3: Accessibility
- [ ] Verify ARIA labels on buttons
- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility

## Notes

- All endpoints require admin authentication (isAdmin=true)
- Use LoadingOverlay from `src/store/features/uiSlice` with `showLoading()` and `hideLoading()`
- Follow existing admin section patterns (Users, Sounds, Meditations, Queuer)
- Backup filenames follow format: `database_backup_YYYYMMDD_HHMMSS.zip`
- File download should use blob URL approach (similar to streaming audio)
- No confirmation modal needed for delete (per requirements)
- Warning message should be visible for restore operation

## Implementation Order

1. Start with Phase 1 (API client)
2. Then Phase 2 (Table component)
3. Then Phase 3 (Admin page integration)
4. Then Phase 4 (Action handlers)
5. Finally Phase 5 (Testing)

Each phase should be committed separately for easier review and rollback if needed.
