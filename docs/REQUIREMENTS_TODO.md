# Mantrify NextJS - Frontend Development Task List

This document provides a detailed, phase-based task list for building the Mantrify meditation application. Each task should be marked with `[x]` when completed. Commit changes to git after completing each phase.

---

## Phase 1: Project Setup & Configuration ✅

### 1.1 Initialize Next.js Project

- [x] Verify Next.js project structure with TypeScript
- [x] Configure `tsconfig.json` with path aliases (@/_ maps to src/_)
- [x] Set up `src/` directory structure per docs/NEXTJS_STRUCTURE.md
- [x] Install required dependencies: `react`, `next`, `typescript`, `tailwindcss`

### 1.2 Environment Configuration

- [x] Create `.env.local` file in project root
- [x] Add `NEXT_PUBLIC_API_BASE_URL` environment variable
- [x] Add Winston logging environment variables per docs/LOGGING_NODE_JS_V06.md:
  - `NEXT_PUBLIC_MODE` (development/testing/production)
  - `NAME_APP=Mantrify01NextJs`
  - `PATH_TO_LOGS` (absolute path)
  - `LOG_MAX_SIZE` (optional, default 5MB)
  - `LOG_MAX_FILES` (optional, default 5)
- [x] Create `.env.example` template file

### 1.3 Logging Configuration

- [x] Install Winston: `npm install winston`
- [x] Create logger configuration file in `src/config/logger.ts` per docs/LOGGING_NODE_JS_V06.md
- [x] Implement environment variable validation at startup
- [x] Configure Winston transports for development/testing/production modes
- [x] Set up single log file (not multiple files per requirements)
- [x] Test logging in all three modes

### 1.4 Tailwind CSS Setup

- [x] Install Tailwind CSS and dependencies
- [x] Create `tailwind.config.ts` with calming color scheme
- [x] Define color palette: blues, purples, soft greens for meditation theme
- [x] Configure `src/app/globals.css` with Tailwind directives
- [x] Import globals.css in `src/app/layout.tsx`

### 1.5 Static Assets

- [x] Verify logo exists at `public/images/mantrifyLogo02.png`
- [x] Verify favicon files exist at `public/images/favicon_io/`
- [x] Configure favicon in `src/app/layout.tsx`

---

## Phase 2: Core Infrastructure ✅

### 2.1 Redux State Management Setup

- [x] Install Redux Toolkit and React Redux: `npm install @reduxjs/toolkit react-redux`
- [x] Create `src/store/index.ts` for store configuration
- [x] Create `src/store/hooks.ts` with typed `useAppDispatch` and `useAppSelector`

### 2.2 Authentication State

- [x] Create `src/store/features/authSlice.ts`
- [x] Define auth state: `user` (id, email, isAdmin), `accessToken`, `isAuthenticated`
- [x] Implement actions: `login`, `logout`, `setUser`
- [x] Add Redux persist to maintain auth state across page refreshes

### 2.3 Meditation State

- [x] Create `src/store/features/meditationSlice.ts`
- [x] Define meditation state: `meditations` array, `loading`, `error`
- [x] Implement actions: `setMeditations`, `addMeditation`, `deleteMeditation`, `toggleFavorite`

### 2.4 API Client Setup

- [x] Create `src/lib/api/client.ts` for base API configuration
- [x] Implement axios instance with base URL from environment
- [x] Add request interceptor to attach JWT token from Redux state
- [x] Add response interceptor for global error handling
- [x] Implement retry logic for failed requests

### 2.5 API Service Modules

- [x] Create `src/lib/api/auth.ts`:
  - `register(email, password)`
  - `login(email, password)`
  - `forgotPassword(email)`
  - `resetPassword(token, newPassword)`
- [x] Create `src/lib/api/mantras.ts`:
  - `getAllMantras(includePrivate)`
  - `createMantra(mantraData)`
  - `streamMantra(id)` (returns stream URL)
  - `favoriteMantra(id, isFavorite)`
  - `deleteMantra(id)`
- [x] Create `src/lib/api/sounds.ts`:
  - `getSoundFiles()`
  - `uploadSoundFile(file, name, description)`
  - `deleteSoundFile(id)`
- [x] Create `src/lib/api/admin.ts`:
  - `getUsers()`
  - `deleteUser(id)`
  - `getAllMantras()`
  - `deleteMantraAdmin(id)`
  - `getQueuerRecords()`
  - `deleteQueuerRecord(id)`

### 2.6 Utility Functions

- [x] Create `src/lib/utils/validation.ts`:
  - Email validation
  - Password validation (min 6 characters)
- [x] Create `src/lib/utils/formatters.ts`:
  - Date formatting
  - Duration formatting (for pause_duration)
- [x] Create `src/lib/utils/auth.ts`:
  - Token storage helpers
  - Protected route checker

---

## Phase 3: Layout & Navigation

### 3.1 Root Layout

- [ ] Create `src/app/layout.tsx` with Redux Provider wrapper
- [ ] Add metadata: title, description, favicon
- [ ] Include global styles import
- [ ] Set up font configuration (clean, modern font)

### 3.2 Navigation Component

- [x] Create `src/components/Navigation.tsx`
- [x] Implement fixed top navigation bar
- [x] Add logo on the left (use public/images/mantrifyLogo02.png)
- [x] Add navigation links on the right:
  - Home
  - Admin (only visible if user.isAdmin === true)
  - Login/Logout button
- [x] Style with Tailwind CSS (sticky, transparent/solid background)

### 3.3 Mobile Navigation

- [x] Implement hamburger menu icon for small screens (< 768px)
- [x] Create slide-out panel from left side (75% screen width)
- [x] Add overlay background (clickable to close)
- [x] Include same navigation links in mobile menu
- [x] Add smooth transition animations
- [ ] Test responsiveness at various breakpoints

### 3.4 Login Modal

- [x] Create `src/components/modals/ModalLogin.tsx`
- [x] Design centered modal with backdrop
- [x] Add close button (X icon)
- [x] Include email input field
- [x] Include password input field
- [x] Add "Login" button
- [x] Add "Forgot Password?" link
- [x] Add "Don't have an account? Register" link
- [x] Implement form validation with error messages
- [x] Connect to `POST /users/login` endpoint (see docs/api-documentation/api/users.md)
- [x] On success: store token in Redux, close modal, update UI
- [x] Handle API errors (401, 403) and display to user

### 3.5 Register Modal

- [x] Create `src/components/modals/ModalRegister.tsx`
- [x] Similar design to ModalLogin
- [x] Include email and password fields
- [x] Add password confirmation field
- [x] Connect to `POST /users/register` endpoint
- [x] Show success message about verification email
- [x] Handle validation errors (400, 409)

### 3.6 Protected Route Component

- [x] Create `src/components/ProtectedRoute.tsx`
- [x] Check authentication state from Redux
- [x] Redirect to home if not authenticated
- [x] Check isAdmin for admin-only routes
- [x] Show loading state while checking auth

---

## Phase 4: Homepage - Meditation Table

### 4.1 Homepage Layout

- [x] Create `src/app/page.tsx`
- [x] Implement vertical stacked sections layout
- [x] Add responsive container with proper padding

### 4.2 Meditation Table Component (Non-Authenticated Users)

- [x] Create `src/components/tables/TableMeditation.tsx`
- [x] Implement expandable/collapsible section with "Meditations" heading
- [x] Default state: expanded
- [x] Fetch data from `GET /mantras/all` on component mount
- [x] Display columns for all users:
  - Title
  - Play button (▶)
  - Number of listens
- [x] Make table responsive:
  - Scrollable on small screens
  - Fixed header
  - Smaller text size for mobile
- [x] Implement loading state (spinner/skeleton)
- [x] Implement error state with retry button

### 4.3 Audio Player Integration

- [x] Create `src/components/AudioPlayer.tsx`
- [x] Implement HTML5 audio player
- [x] Connect to `GET /mantras/:id/stream` endpoint
- [x] Add token to Authorization header if user is authenticated
- [x] Support play/pause controls
- [x] Show loading state while buffering
- [x] Handle playback errors gracefully
- [x] Track when play button is clicked (automatically tracked by API)

### 4.4 Meditation Table (Authenticated Users)

- [x] Add "Favorite" column with star icon (⭐) for authenticated users
- [x] Display yellow star if favorited, white/outline if not
- [x] Fetch favorites status from API response
- [x] Implement star toggle functionality:
  - On click: call `POST /mantras/favorite/:mantraId/:trueOrFalse`
  - Toggle star color immediately (optimistic update)
  - Handle API errors and revert on failure
- [x] Show user's own meditations with "Delete" button
- [x] Filter to show public meditations + user's private meditations
- [x] Pass `includePrivate=true` when authenticated

### 4.5 Delete Meditation Functionality

- [x] Create `src/components/modals/ModalConfirmDelete.tsx`
- [x] Show confirmation dialog before deleting
- [x] Connect to `DELETE /mantras/:id` endpoint
- [x] Remove meditation from table on successful delete
- [x] Show success/error toast notification
- [x] Handle 403 error (not owner) and 404 (not found)

---

## Phase 5: Homepage - Create Meditation Form

### 5.1 Create Meditation Section Component

- [x] Create `src/components/forms/CreateMeditationForm.tsx`
- [x] Implement expandable/collapsible section with "Create New Meditation" heading
- [x] Default state: collapsed
- [x] Hide section completely if user is not logged in
- [x] Show section only for authenticated users

### 5.2 Meditation Metadata Fields

- [x] Add "Title" text input field (required)
- [x] Add "Description" textarea field (optional)
- [x] Add "Visibility" toggle/select (Public/Private)
- [x] Style with Tailwind CSS form controls
- [x] Add field validation (title required, max lengths)

### 5.3 Dynamic Row System

- [x] Display initial empty row on section expand
- [x] Implement "Add Row" button below the table
- [x] Each row has unique id (sequential: 1, 2, 3...)
- [x] Allow reordering rows (drag-and-drop or up/down buttons)
- [x] Add "Delete Row" button for each row

### 5.4 Row Type Dropdown

- [x] Add leftmost column with dropdown selector
- [x] Options: "Text", "Pause", "Sound File"
- [x] Default selection: "Text"
- [x] On change: show/hide relevant input fields
- [x] Style dropdown consistently with theme

### 5.5 Text Row Type

- [x] Show when dropdown is set to "Text"
- [x] Display textarea for text input (2 rows minimum)
- [x] Add optional "Speed" input (decimal, range 0.7-1.3)
- [x] Add small label: "Speed (0.7-1.3)"
- [x] Validate speed input on blur
- [x] Note: voice_id is omitted per requirements

### 5.6 Pause Row Type

- [x] Show when dropdown is set to "Pause"
- [x] Display number input for duration
- [x] Add label: "Duration (seconds)"
- [x] Accept decimal values (e.g., 3.0, 5.5)
- [x] Validate positive numbers only

### 5.7 Sound File Row Type

- [x] Show when dropdown is set to "Sound File"
- [x] Fetch sound files from `GET /sounds/sound_files` on page load
- [x] Create dropdown populated with sound file names
- [x] Store selected sound file's filename (not id)
- [x] Add label: "Select Sound File"
- [x] Handle loading and error states for sound files fetch

### 5.8 Form Submission

- [x] Add "Submit" button below the rows
- [x] Validate all rows before submission:
  - Text rows must have text content
  - Pause rows must have duration > 0
  - Sound File rows must have selection
- [x] Transform form data to match API format:
  ```json
  {
    "title": "string",
    "description": "string",
    "visibility": "public" | "private",
    "mantraArray": [
      { "id": 1, "pause_duration": "3.0" },
      { "id": 2, "text": "...", "speed": "0.85" },
      { "id": 3, "sound_file": "filename.mp3" }
    ]
  }
  ```
- [x] Connect to `POST /mantras/create` endpoint
- [x] Show loading state during submission
- [x] On success:
  - Show success message
  - Add new meditation to table
  - Reset form
  - Collapse section
- [x] On error: display validation errors inline

---

## Phase 6: Admin Page - Users Section

### 6.1 Admin Page Setup

- [x] Create `src/app/admin/page.tsx`
- [x] Wrap with ProtectedRoute component (require isAdmin=true)
- [x] Redirect to home if user is not admin
- [x] Implement vertical stacked sections layout

### 6.2 Users Section

- [x] Create expandable/collapsible section with "Users" heading
- [x] Default state: expanded
- [x] Fetch data from `GET /admin/users` on mount
- [x] Handle 401 (not authenticated) and 403 (not admin) errors

### 6.3 TableAdminUsers Component

- [x] Create `src/components/tables/TableAdminUsers.tsx`
- [x] Display columns:
  - ID
  - Username (if available, otherwise email)
  - Email
  - Delete button
- [x] Make table responsive with horizontal scroll on mobile
- [x] Style consistently with meditation table

### 6.4 Delete User Functionality

- [x] Add delete button (trash icon) for each user
- [x] Show confirmation modal before deleting
- [x] Connect to `DELETE /admin/users/:id` endpoint
- [x] Remove user from table on success
- [x] Show error if delete fails
- [x] Prevent deleting currently logged-in admin

---

## Phase 7: Admin Page - Sound Files Section

### 7.1 Sound Files Section

- [ ] Create expandable/collapsible section with "Sounds Files" heading
- [ ] Default state: collapsed
- [ ] Fetch data from `GET /sounds/sound_files` on expand
- [ ] Add "Upload Sound File" button in section header (right side)

### 7.2 TableAdminSoundsFiles Component

- [ ] Create `src/components/tables/TableAdminSoundsFiles.tsx`
- [ ] Display columns:
  - ID
  - Name
  - Delete button
- [ ] Make table responsive
- [ ] Show loading state while fetching

### 7.3 ModalUploadSoundFile Component

- [ ] Create `src/components/modals/ModalUploadSoundFile.tsx`
- [ ] Open modal when "Upload Sound File" button is clicked
- [ ] Add file input (accept only .mp3 files)
- [ ] Add name text input (optional)
- [ ] Add description textarea (optional)
- [ ] Add submit button
- [ ] Validate file type client-side
- [ ] Show file size limit: 50MB
- [ ] Connect to `POST /sounds/upload` endpoint (multipart/form-data)
- [ ] Show upload progress bar
- [ ] On success: close modal, refresh table, show success message
- [ ] Handle errors: 400 (validation), 409 (duplicate), 413 (too large)

### 7.4 Delete Sound File Functionality

- [ ] Add delete button for each sound file
- [ ] Show confirmation modal
- [ ] Connect to `DELETE /sounds/sound_file/:id` endpoint
- [ ] Remove from table on success
- [ ] Handle error if sound file is in use by mantras

---

## Phase 8: Admin Page - Meditations Section

### 8.1 Meditations Section

- [ ] Create expandable/collapsible section with "Meditations" heading
- [ ] Default state: collapsed
- [ ] Fetch data from `GET /admin/mantras` on expand

### 8.2 TableAdminMeditations Component

- [ ] Create `src/components/tables/TableAdminMeditations.tsx`
- [ ] Display columns:
  - ID
  - Title (use title from API response)
  - Visibility (public/private)
  - Listens
  - Delete button
- [ ] Make table responsive
- [ ] Show all meditations regardless of visibility/ownership

### 8.3 Delete Meditation (Admin)

- [ ] Add delete button for each meditation
- [ ] Show confirmation modal with warning (admin can delete any meditation)
- [ ] Connect to `DELETE /admin/mantras/:id` endpoint
- [ ] Remove from table on success
- [ ] Handle errors appropriately

---

## Phase 9: Admin Page - Queuer Section

### 9.1 Queuer Section

- [ ] Create expandable/collapsible section with "Queuer" heading
- [ ] Default state: collapsed
- [ ] Fetch data from `GET /admin/queuer` on expand

### 9.2 TableAdminQueuer Component

- [ ] Create `src/components/tables/TableAdminQueuer.tsx`
- [ ] Display columns:
  - ID
  - User ID
  - Status (queued, started, elevenlabs, concatenator, done)
  - Job Filename
  - Created At (formatted timestamp)
  - Delete button
- [ ] Color-code status values:
  - queued: gray
  - started: blue
  - elevenlabs: purple
  - concatenator: orange
  - done: green
- [ ] Make table responsive

### 9.3 Delete Queue Record Functionality

- [ ] Add delete button for each queue record
- [ ] Show confirmation modal
- [ ] Connect to `DELETE /admin/queuer/:id` endpoint
- [ ] Remove from table on success
- [ ] Note: This doesn't delete the meditation, just the queue record

---

## Phase 10: Authentication Features

### 10.1 Email Verification

- [ ] Create `src/app/verify/page.tsx`
- [ ] Extract token from URL query parameter
- [ ] Call `GET /users/verify?token=...` on page load
- [ ] Show success message if verified
- [ ] Show error message if token is invalid/expired
- [ ] Provide link to request new verification email
- [ ] Redirect to login after successful verification

### 10.2 Forgot Password Page

- [ ] Create `src/app/forgot-password/page.tsx`
- [ ] Add email input field
- [ ] Add submit button
- [ ] Connect to `POST /users/forgot-password` endpoint
- [ ] Show success message: "Password reset link sent to email"
- [ ] Handle 404 error (email not found)
- [ ] Provide link back to login

### 10.3 Reset Password Page

- [ ] Create `src/app/reset-password/[token]/page.tsx`
- [ ] Extract token from URL parameter
- [ ] Add new password input field
- [ ] Add confirm password input field
- [ ] Validate passwords match and meet requirements
- [ ] Connect to `POST /users/reset-password` endpoint
- [ ] Show success message and redirect to login
- [ ] Handle 401 (expired token) and show link to request new reset

### 10.4 Token Persistence

- [ ] Store JWT token in Redux state
- [ ] Persist auth state with redux-persist (localStorage)
- [ ] Restore auth state on app initialization
- [ ] Implement token refresh logic if needed
- [ ] Clear token on logout

### 10.5 Logout Functionality

- [ ] Add logout button in navigation
- [ ] On click: clear Redux auth state
- [ ] Clear persisted storage
- [ ] Redirect to homepage
- [ ] Show logout success message

---

## Phase 11: Testing & Polish

### 11.1 Error Handling & Toast Notifications

- [ ] Install toast library (react-hot-toast or react-toastify)
- [ ] Create toast wrapper component
- [ ] Add success toasts for:
  - Login/register
  - Meditation created
  - Meditation deleted
  - Sound file uploaded
  - Settings saved
- [ ] Add error toasts for:
  - API errors
  - Validation errors
  - Network errors
- [ ] Style toasts to match theme

### 11.2 Loading States

- [ ] Add loading spinners to all tables while fetching
- [ ] Add skeleton loaders for better UX
- [ ] Add loading state to submit buttons
- [ ] Disable buttons during API calls
- [ ] Show progress indicators for uploads

### 11.3 Responsive Design Testing

- [ ] Test on mobile devices (320px - 768px)
- [ ] Test on tablets (768px - 1024px)
- [ ] Test on desktop (1024px+)
- [ ] Verify navigation hamburger menu works
- [ ] Check table scrolling on small screens
- [ ] Test all modals on different screen sizes
- [ ] Verify form layouts adapt properly

### 11.4 Accessibility (a11y)

- [ ] Add ARIA labels to buttons and interactive elements
- [ ] Ensure keyboard navigation works (Tab, Enter, Esc)
- [ ] Add focus styles to all interactive elements
- [ ] Test with screen reader
- [ ] Ensure sufficient color contrast
- [ ] Add alt text to images and logo

### 11.5 Performance Optimization

- [ ] Implement lazy loading for modals
- [ ] Optimize image loading with Next.js Image component
- [ ] Implement pagination or infinite scroll for large tables
- [ ] Memoize expensive components with React.memo
- [ ] Use useCallback for event handlers
- [ ] Optimize Redux selectors with reselect

### 11.6 SEO & Metadata

- [ ] Add proper page titles for each route
- [ ] Add meta descriptions
- [ ] Configure Open Graph tags
- [ ] Add structured data where appropriate
- [ ] Create sitemap.xml
- [ ] Configure robots.txt

### 11.7 Documentation

- [ ] Create README.md using docs/README-format.md template
- [ ] Document all environment variables in .env.example
- [ ] Add inline code comments for complex logic
- [ ] Document component props with TypeScript interfaces
- [ ] Create API integration examples
- [ ] Document deployment process

### 11.8 Final Testing

- [ ] Test full user registration → verification → login flow
- [ ] Test meditation creation → playback → delete flow
- [ ] Test admin functionality (all CRUD operations)
- [ ] Test error scenarios (network failures, 401, 403, 404, 500)
- [ ] Verify all API integrations work correctly
- [ ] Test logout and re-login flow
- [ ] Test with slow network (throttling)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## Notes

- Reference API documentation in `docs/api-documentation/` for endpoint details
- Follow Next.js structure guidelines in `docs/NEXTJS_STRUCTURE.md`
- Implement logging per `docs/LOGGING_NODE_JS_V06.md`
- Use Tailwind CSS for all styling
- Commit changes to git after completing each phase
- Test thoroughly before moving to the next phase

## API Base URL

The API base URL should be configured in `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Adjust the URL for different environments (development, staging, production).
