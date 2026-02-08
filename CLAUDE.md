# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Go Lightly** (formerly GoLightly) - A Next.js TypeScript web application for creating personalized guided meditations combining affirmations and contemplative silences. The app communicates with a separate Express API (GoLightly01API) which orchestrates audio file generation through ElevenLabs TTS and audio concatenation services.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture Overview

### State Management

Redux Toolkit with Redux Persist:

- **Auth slice** (`src/store/features/authSlice.ts`): User authentication, JWT tokens, admin status
- **Meditation slice** (`src/store/features/meditationSlice.ts`): Meditation/meditation data and creation state
- Only auth state is persisted to localStorage
- Store configuration in `src/store/index.ts`
- Typed hooks exported from `src/store/hooks.ts`

### API Communication

The app is a **frontend-only client** that communicates with a separate API backend:

- API client: `src/lib/api/client.ts` (axios instance with interceptors)
- Base URL from `NEXT_PUBLIC_API_BASE_URL` environment variable
- JWT tokens automatically injected via request interceptor (reads from Redux persist in localStorage)
- Response interceptor handles 401s by clearing auth state
- **Important**: This Next.js app does NOT contain API routes - all backend logic lives in the separate GoLightly01API Express application

### Authentication Flow

- JWT-based authentication with access tokens
- Tokens stored in Redux and persisted to localStorage
- Protected routes use `ProtectedRoute` component (`src/components/ProtectedRoute.tsx`)
- Admin routes check `isAdmin` flag and redirect non-admin users
- Auth verification page (`/verify`) and password reset flow (`/forgot-password`, `/reset-password/[token]`)

### Form Submission Pattern

Meditation creation form (`src/components/forms/MeditationForm.tsx`) implements a critical pattern:

- **All form controls must be disabled during submission** to prevent double-submission
- CSV-like row structure: each row can be Text (with optional speed 0.7-1.3), Pause (duration in seconds), or Sound File (dropdown)
- Submit creates meditation via API, which queues audio generation job

### Meditation Creation Workflow

Users build meditations row-by-row where each row is one of:

1. **Text**: Affirmation text + optional speed (0.7-1.3x, sent to ElevenLabs for TTS)
2. **Pause**: Silent duration in seconds
3. **Sound File**: Background audio (fetched from `GET /sounds/sound_files`)

The form mirrors the CSV format used by the backend queuer service, which orchestrates:

- RequesterElevenLabs01 (TTS generation)
- AudioFileConcatenator01 (combines segments into final MP3)

## Page Structure

- **Homepage** (`src/app/page.tsx`): Meditation table (public + user's private) and creation form
- **Admin page** (`src/app/admin/page.tsx`): Admin-only sections for Users, Sound Files, Meditations, and Queuer management
- **Verify** (`src/app/verify/page.tsx`): Email verification landing
- **Password reset** (`/forgot-password`, `/reset-password/[token]`): Password recovery flow

## Path Aliases

Configure in `tsconfig.json`:

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/lib/*` → `src/lib/*`
- `@/store/*` → `src/store/*`
- `@/config/*` → `src/config/*`
- `@/styles/*` → `src/styles/*`

## Error Handling Standards

Follow `docs/ERROR_REQUIREMENTS.md` - all API errors must use this structure:

```json
{
  "error": {
    "code": "ERROR_CODE_HERE",
    "message": "User-facing error message",
    "details": "Additional context (optional)",
    "status": 500
  }
}
```

Common codes: `VALIDATION_ERROR`, `AUTH_FAILED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR`

## Logging Implementation

Follow `docs/LOGGING_NODE_JS_V06.md`:

- Winston logger configured in `src/config/logger.ts`
- Modes: development (console only), testing (console + files), production (files only)
- Required env vars: `NEXT_PUBLIC_MODE`, `NEXT_PUBLIC_NAME_APP`, `NEXT_PUBLIC_PATH_TO_LOGS`
- Log file: `[NEXT_PUBLIC_NAME_APP].log` with rotation
- **Critical**: Use async IIFE pattern with 100ms delay before early exits to ensure logs flush to disk

## Component Organization

- `src/components/forms/` - Form components (MeditationForm, LoginForm, etc.)
- `src/components/modals/` - Modal dialogs
- `src/components/tables/` - Table components for admin sections
- `src/components/ui/` - Reusable UI primitives
- Top-level: AppShell, AudioPlayer, Navigation, ProtectedRoute, Toast

## Navigation

- Fixed top navbar with logo, homepage/admin links, login/logout
- Hamburger menu on mobile (75% width slide-out panel with overlay)
- Admin link only visible to users with `isAdmin: true`

## Database Schema Reference

See `docs/DATABASE_OVERVIEW.md` for complete schema. Key tables:

- **Users**: email, password (bcrypt), isEmailVerified, isAdmin
- **Meditations**: title, description, visibility (public/private), filename, filePath, listenCount
- **ContractUsersMeditations**: Junction table linking users to their meditations
- **ContractUserMeditationListens**: Tracks registered user listen counts and favorites
- **SoundFiles**: Background audio options for meditations
- **Queue**: Job queue status (queued, started, elevenlabs, concatenator, done)

## API Documentation

See `docs/api-documentation/`:

- `API_REFERENCE.md` - Overview and endpoint format standards
- `api/users.md` - Authentication endpoints
- `api/meditations.md` - Meditation CRUD and streaming
- `api/sounds.md` - Sound file management

## Environment Variables

Required:

- `NEXT_PUBLIC_API_BASE_URL` - Backend API base URL
- `NEXT_PUBLIC_MODE` - development/testing/production
- `NEXT_PUBLIC_NAME_APP` - App identifier for logging
- `NEXT_PUBLIC_PATH_TO_LOGS` - Log directory path

## Styling

- Tailwind CSS configured in `tailwind.config.js`
- Global styles in `src/styles/globals.css`
- Modern, clean, calming color scheme
- Fully responsive design
- Logo: `public/images/golightlyLogo02.png`
- Favicon: `public/images/favicon_io/`
