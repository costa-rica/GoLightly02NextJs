# Go Lightly Project Architecture Overview

This document provides a holistic view of the Go Lightly ecosystem, describing how all components work together to create a meditation audio generation and streaming platform.

## Executive Summary

Go Lightly is a meditation creation platform that enables users to build custom guided meditations by combining affirmations (converted to speech via AI), contemplative silences, and background audio. The system consists of a Next.js web frontend, an Express API backend, a job orchestration service (Queuer), two specialized microservices for audio processing, and a shared SQLite database.

## System Architecture

### Component Overview

The Go Lightly ecosystem consists of six main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                            │
│                    ┌──────────────────────┐                     │
│                    │  GoLightly02NextJs   │                     │
│                    │  (Next.js Frontend)  │                     │
│                    └──────────┬───────────┘                     │
└───────────────────────────────┼─────────────────────────────────┘
                                │ HTTP/REST
                                ↓
                    ┌──────────────────────┐
                    │   GoLightly02API     │
                    │   (Express API)      │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ↓              ↓              ↓
      ┌─────────────┐  ┌──────────────┐  Database
      │ GoLightly02 │  │ GoLightly02  │  Operations
      │   Queuer    │  │     Db       │
      │  (Express)  │  │  (Package)   │
      └──────┬──────┘  └──────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ↓                 ↓
┌───────────────┐  ┌───────────────────────┐
│ RequesterE... │  │ AudioFileConcate...   │
│ (TTS Service) │  │ (Audio Combiner)      │
└───────────────┘  └───────────────────────┘
```

### 1. GoLightly02NextJs (Web Frontend)

**Technology**: Next.js 14, TypeScript, Redux Toolkit, Tailwind CSS

**Purpose**: User-facing web application for meditation creation, playback, and account management

**Key Responsibilities**:
- User authentication (login, registration, email verification, password reset)
- Meditation creation interface with CSV-like row structure
- Audio playback with streaming support
- Meditation library management (view, edit, delete)
- Admin interface for users, sound files, meditations, and queue management

**State Management**:
- Redux Toolkit with Redux Persist
- Auth slice: User credentials, JWT tokens, admin status
- Meditation slice: Meditation data and creation state
- Only auth state persisted to localStorage

**API Communication**:
- Axios client (`src/lib/api/client.ts`) with request/response interceptors
- Base URL from `NEXT_PUBLIC_API_BASE_URL` environment variable
- JWT tokens automatically injected via request interceptor
- Response interceptor handles 401s by clearing auth state

**Important**: This is a frontend-only client. It does NOT contain API routes. All backend logic lives in GoLightly02API.

**Reference**: `CLAUDE.md` in GoLightly02NextJs project root

### 2. GoLightly02API (Backend API)

**Technology**: Express.js, TypeScript, Sequelize, SQLite

**Purpose**: Main backend API handling authentication, meditation CRUD operations, and orchestration

**Key Responsibilities**:
- User registration with email verification (30-minute token expiration)
- JWT-based authentication (access tokens with no expiration)
- Password hashing with bcrypt
- Password reset flow with email tokens
- Meditation CRUD operations (create, read, update, delete)
- Meditation streaming with HTTP range request support
- Listen tracking (both authenticated and anonymous users)
- Favorite management for authenticated users
- Sound file management
- Admin operations (user management, database queries)
- Forwards meditation creation requests to GoLightly02Queuer

**Authentication Flow**:
1. User registers → email verification sent (Nodemailer + Gmail SMTP)
2. User verifies email via token → account activated
3. User logs in → JWT access token returned
4. Token included in Authorization header for protected routes

**Email Service**:
- Nodemailer configured with Gmail SMTP
- HTML email templates (`src/templates/`)
- Verification emails with 30-minute expiration
- Password reset emails with secure tokens

**Communication with Queuer**:
- Sends POST requests to `URL_MANTRIFY01QUEUER/meditations/new`
- Forwards `meditationArray`, `title`, and `description`
- Waits for response and returns queue ID and file path

**Logging**: Winston logger following `docs/LOGGING_NODE_JS_V06.md`
- Development: Console only
- Testing: Console + rotating files
- Production: Rotating files only

**Error Handling**: Standardized error responses following `docs/ERROR_REQUIREMENTS.md`

**Reference**: `docs/references/REQUIREMENTS_TODO_API.md`, `docs/api-documentation/`

### 3. GoLightly02Queuer (Job Orchestrator)

**Technology**: Express.js, TypeScript, Sequelize, SQLite

**Purpose**: Orchestrates meditation audio creation by coordinating two microservices in a multi-stage pipeline

**Key Responsibilities**:
- Receives meditation creation requests from GoLightly02API
- Manages FIFO queue using database Queue table
- Generates CSV files for child processes
- Spawns and manages child processes (RequesterElevenLabs01, AudioFileConcatenator01)
- Parses microservice output to extract file paths
- Creates Meditation database records with final file information
- Links meditations to users via ContractUsersMeditations table

**Workflow Pipeline**:

1. **Input Parsing**: Accepts `filenameCsv` or `meditationArray` in request body
2. **Queue Creation**: Creates queue record with status "queued"
3. **Status: started**: Updates queue status
4. **ElevenLabs Stage**:
   - Generates CSV for text-to-speech entries (id, text, voice_id, speed)
   - Spawns RequesterElevenLabs01 as child process
   - Parses stdout for lines matching `Audio file created successfully: <path>`
5. **Status: elevenlabs**: Updates queue status
6. **AudioConcatenator Stage**:
   - Generates CSV mapping all elements (ElevenLabs files, pauses, sound files)
   - Spawns AudioFileConcatenator01 as child process
   - Parses stdout for final MP3 path
7. **Status: concatenator**: Updates queue status
8. **Database Update**:
   - Creates Meditation record with parsed file path/name
   - Creates ContractUsersMeditations linking userId to meditationId
9. **Status: done**: Marks queue complete and returns final file path

**Meditation Input Types** (mutually exclusive per element):
- **text** (+ optional voice_id, speed): Sent to ElevenLabs for TTS
- **pause_duration**: Generates silence in seconds
- **sound_file**: Pre-existing MP3 filename from `PATH_MP3_SOUND_FILES`

**Child Process Management**:
- Generic spawner captures stdout/stderr
- Environment variables inherited + child-specific overrides
- Output parsing extracts file paths from standardized log messages

**File Path Parsing**:
When saving Meditation records, full path from AudioConcatenator is parsed:
- Input: `/path/to/output_20260202_153045.mp3`
- **filePath**: `/path/to/` (directory with trailing slash)
- **filename**: `output_20260202_153045.mp3` (basename)
- **title**: `output_20260202_153045` (filename without extension, or provided title if available)

**Reference**: `docs/references/CLAUDE_GoLightly02Queuer.md`, `docs/references/REQUIREMENTS_GoLightly02Queuer.md`

### 4. RequesterElevenLabs01 (TTS Microservice)

**Technology**: TypeScript, ElevenLabs API, Winston

**Purpose**: Converts text to speech using ElevenLabs API

**Key Responsibilities**:
- Accepts CSV with id, text, voice_id, speed columns
- Validates voice IDs against ElevenLabs API
- Validates speed parameters (0.7-1.2 range)
- Converts text to speech via ElevenLabs API
- Saves MP3 files with structured naming convention
- Organizes output into date-based subdirectories

**Processing Workflow**:
1. Parse CSV file from `PATH_USER_ELEVENLABS_CSV_FILES`
2. For each row: validate speed and voice_id
3. Make TTS request to ElevenLabs API
4. Save audio file to date-organized subdirectory
5. Log file path with standardized message format

**File Organization**:
- Output: `PATH_SAVED_ELEVENLABS_AUDIO_MP3_OUTPUT/YYYYMMDD/[filename].mp3`
- Filename format: `[VoiceName]_[First10CharsOfText]_[YYYYMMDD_HHMMSS].mp3`
- Voice name extracted up to first space or max 10 characters
- Text portion has spaces replaced with underscores
- Timestamp in YYYYMMDD_HHMMSS format

**Output Format**: Logs to stdout with messages like:
```
Audio file created successfully: /path/to/audio/20260126/Alice_Third_time_20260126_181045.mp3
```

**Environment Variables**:
- `NAME_APP`: Set by parent process to `NAME_CHILD_PROCESS_ELEVENLABS`
- `API_KEY_ELEVEN_LABS`: ElevenLabs API key
- `PATH_SAVED_ELEVENLABS_AUDIO_MP3_OUTPUT`: Output directory
- `PATH_USER_ELEVENLABS_CSV_FILES`: CSV input directory
- `PATH_TO_LOGS`: Log file directory

**Reference**: `docs/references/README_RequesterElevenLabs01.md`

### 5. AudioFileConcatenator01 (Audio Combiner Microservice)

**Technology**: TypeScript, FFmpeg, fluent-ffmpeg, Winston

**Purpose**: Combines audio files with configurable pauses to create final meditation MP3

**Key Responsibilities**:
- Reads CSV with audio sequence (audio files and pause durations)
- Validates that audio files exist and output directory is writable
- Generates silent MP3 files for pause durations using FFmpeg
- Concatenates all audio segments into single MP3
- Cleans up temporary files after processing

**System Requirements**: FFmpeg must be installed on the system

**Processing Workflow**:
1. Parse CSV file from `PATH_AND_FILENAME_AUDIO_CSV_FILE`
2. Validate output directory and all audio files exist
3. Create `temporary_deletable` directory for temp files
4. Generate silent MP3 files for pause durations using FFmpeg's `anullsrc` filter
5. Create concat list file for FFmpeg
6. Use FFmpeg's concat demuxer with `-c:a copy` for efficient concatenation
7. Clean up temporary files (in `finally` block)
8. Return output path and total audio duration

**CSV Format**:
- Columns: id, audio_file_name_and_path, pause_duration
- Each row has either `audio_file_name_and_path` OR `pause_duration`, not both

**File Organization**:
- Output: `PATH_MP3_OUTPUT/YYYYMMDD/output_YYYYMMDD_HHMMSS.mp3`
- Date subdirectories automatically created
- Example: `PATH_MP3_OUTPUT/20260126/output_20260126_154530.mp3`

**Output Format**: Logs to stdout with messages like:
```
Output|Saved to|Created: /path/to/output/20260126/output_20260126_154530.mp3
```

**Environment Variables**:
- `NAME_APP`: Set by parent process to `NAME_CHILD_PROCESS_AUDIO_FILE_CONCATENATOR`
- `PATH_AND_FILENAME_AUDIO_CSV_FILE`: Full path to input CSV (set by parent)
- `PATH_MP3_OUTPUT`: Base directory for output files
- `PATH_PROJECT_RESOURCES`: Base path for temporary files

**Reference**: `docs/references/CLAUDE_AudioFileConcatenator01.md`

### 6. GoLightly02Db (Database Package)

**Technology**: Sequelize, SQLite, TypeScript

**Purpose**: Shared database models and connection for all backend services

**Key Responsibilities**:
- Defines all database models with Sequelize ORM
- Manages model associations and relationships
- Provides database connection and initialization
- Ensures consistent schema across all services

**Database Tables**:
- **Users**: Email, password (bcrypt), isEmailVerified, emailVerifiedAt, isAdmin
- **Meditations**: title, description, visibility (public/private), filename, filePath, listenCount
- **ContractUsersMeditations**: Junction table linking users to their meditations
- **ContractUserMeditationsListens**: Tracks registered user listen counts and favorites
- **Queue**: Job queue status (queued, started, elevenlabs, concatenator, done)
- **SoundFiles**: Background audio options for meditations
- **ElevenLabsFiles**: Individual TTS-generated audio files
- **ContractMeditationsElevenLabsFiles**: Links meditations to ElevenLabs files
- **ContractMeditationsSoundFiles**: Links meditations to sound files

**Usage Pattern**:
```typescript
import { initModels, sequelize, User, Meditation, Queue } from "golightly02db";

// Initialize all models and their associations
initModels();

// Create tables if they don't exist
await sequelize.sync();
```

**Installation**: Installed via npm from local file system:
```bash
npm install file:/Users/nick/Documents/GoLightly02Db
```

**Environment Variables**:
- `PATH_DATABASE`: Directory path where SQLite database file will be stored
- `NAME_DB`: Database filename (default: "database.sqlite")

**Reference**: `docs/references/CLAUDE_GoLightly02Db.md`, `docs/DATABASE_OVERVIEW.md`

## Data Flow: Meditation Creation

This section traces the complete journey of a meditation from user input to final playback.

### Step-by-Step Flow

1. **User Input (GoLightly02NextJs)**:
   - User builds meditation row-by-row in MeditationForm component
   - Each row is Text (affirmation), Pause (silence), or Sound File (background audio)
   - Form controls disabled during submission to prevent double-submission
   - Sends POST request to `NEXT_PUBLIC_API_BASE_URL/meditations/create`

2. **API Request (GoLightly02API)**:
   - Receives authenticated request at `/meditations/create`
   - Validates JWT token and extracts userId
   - Validates meditationArray exists
   - Forwards request to `URL_MANTRIFY01QUEUER/meditations/new`

3. **Queue Creation (GoLightly02Queuer)**:
   - Creates Queue record with status "queued" and jobFilename
   - Updates status to "started"
   - Parses meditationArray to identify text entries

4. **TTS Generation (RequesterElevenLabs01)**:
   - Queuer generates CSV with text entries (id, text, voice_id, speed)
   - Spawns RequesterElevenLabs01 as child process with CSV filename
   - Microservice validates voice_id and speed for each entry
   - Converts text to speech via ElevenLabs API
   - Saves MP3 files to date-based subdirectory
   - Logs each file path to stdout
   - Queuer parses stdout to extract MP3 paths
   - Updates Queue status to "elevenlabs"

5. **Audio Combination (AudioFileConcatenator01)**:
   - Queuer generates CSV mapping all meditation elements:
     - Text entries → ElevenLabs MP3 paths
     - Pause entries → pause_duration values
     - Sound file entries → full path from PATH_MP3_SOUND_FILES + filename
   - Spawns AudioFileConcatenator01 with CSV path in environment variable
   - Microservice validates all audio files exist
   - Generates silent MP3s for pause durations
   - Concatenates all audio segments into final MP3
   - Saves to date-based subdirectory in PATH_MP3_OUTPUT
   - Logs final file path to stdout
   - Queuer parses stdout to extract final MP3 path
   - Updates Queue status to "concatenator"

6. **Database Update (GoLightly02Queuer)**:
   - Parses final MP3 path to extract filePath, filename, and title
   - Creates Meditation record in database with:
     - title (from request or derived from filename)
     - description (from request or null)
     - visibility (database default)
     - filename (basename of MP3)
     - filePath (directory path with trailing slash)
     - listenCount (initialized to 0)
   - Creates ContractUsersMeditations record linking userId to meditationId
   - Updates Queue status to "done"

7. **Response Propagation**:
   - Queuer returns success response with queueId and filePath
   - API forwards response to NextJs
   - NextJs displays success message and refreshes meditation list

8. **Playback (GoLightly02NextJs → GoLightly02API)**:
   - User clicks play on meditation in table
   - AudioPlayer component loads `{API_BASE_URL}/meditations/{id}/stream`
   - API streams MP3 file with range request support
   - API increments listenCount in Meditations table
   - If authenticated, API creates/increments ContractUserMeditationsListen record

### Error Handling Throughout Flow

All components follow standardized error response format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-facing error message",
    "details": "Additional context (optional)",
    "status": 500
  }
}
```

Common error codes: `VALIDATION_ERROR`, `AUTH_FAILED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR`

## Cross-Cutting Concerns

This section addresses implementation patterns for features that span multiple components.

### Google Authentication Implementation

**Goal**: Add "Sign in with Google" button for login and registration

**Implementation Strategy**:

1. **GoLightly02NextJs (Frontend)**:
   - Add Google Sign-In button to login and registration pages
   - Use Google OAuth 2.0 JavaScript library or Next.js OAuth library
   - On successful Google authentication, receive Google ID token
   - Send ID token to API endpoint: `POST /users/google-auth`
   - Store returned JWT access token in Redux store

2. **GoLightly02API (Backend)**:
   - Create new endpoint: `POST /users/google-auth`
   - Install Google Auth Library: `npm install google-auth-library`
   - Verify Google ID token server-side:
     ```typescript
     import { OAuth2Client } from 'google-auth-library';
     const client = new OAuth2Client(GOOGLE_CLIENT_ID);
     const ticket = await client.verifyIdToken({
       idToken: token,
       audience: GOOGLE_CLIENT_ID,
     });
     const payload = ticket.getPayload();
     const email = payload['email'];
     ```
   - Check if user exists in Users table by email
   - If user exists: Return JWT access token (same as login flow)
   - If user doesn't exist: Create new user with:
     - `email` from Google payload
     - `password` set to null or random hash (user cannot login with password)
     - `isEmailVerified` set to true (Google already verified)
     - `emailVerifiedAt` set to current timestamp
     - Return JWT access token
   - Add `authProvider` column to Users table (optional): "local" or "google"

3. **GoLightly02Db (Database)**:
   - Optional: Add `authProvider` column to Users model:
     ```typescript
     authProvider: {
       type: DataTypes.STRING,
       allowNull: false,
       defaultValue: 'local',
     }
     ```
   - This allows tracking which users signed up via Google vs email/password

4. **Environment Variables**:
   - `GOOGLE_CLIENT_ID`: Add to GoLightly02API .env file
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Add to GoLightly02NextJs .env file

**Security Considerations**:
- Always verify Google ID token server-side (never trust client)
- Use HTTPS in production
- Rotate Google OAuth credentials regularly
- Handle Google token expiration gracefully

**Reference**: Google Sign-In for server-side apps documentation

### Displaying MP3 Duration in Meditation Table

**Goal**: Show meditation duration (e.g., "5:23") in TableMeditation component

**Problem**: Duration is not currently stored in database or calculated

**Implementation Strategy**:

**Option 1: Calculate on File Creation (Recommended)**

1. **AudioFileConcatenator01 (Microservice)**:
   - Already calculates total duration during concatenation
   - Modify to include duration in stdout output:
     ```
     Output|Saved to|Created: /path/to/output.mp3|Duration: 323.5
     ```
   - Duration in seconds as float

2. **GoLightly02Queuer (Orchestrator)**:
   - Modify stdout parser to extract duration from AudioFileConcatenator output
   - When creating Meditation record, include duration field

3. **GoLightly02Db (Database)**:
   - Add `duration` column to Meditations model:
     ```typescript
     duration: {
       type: DataTypes.FLOAT,
       allowNull: true,
       comment: 'Duration in seconds',
     }
     ```
   - Run migration or sync to add column

4. **GoLightly02API (Backend)**:
   - Return duration in meditation list endpoints
   - Duration already present in Meditation records

5. **GoLightly02NextJs (Frontend)**:
   - Receive duration in API response
   - Format duration for display:
     ```typescript
     const formatDuration = (seconds: number) => {
       const mins = Math.floor(seconds / 60);
       const secs = Math.floor(seconds % 60);
       return `${mins}:${secs.toString().padStart(2, '0')}`;
     };
     ```
   - Display in TableMeditation component

**Option 2: Calculate on Demand (Alternative)**

1. **GoLightly02API (Backend)**:
   - Install audio metadata library: `npm install music-metadata`
   - When returning meditation list, read MP3 metadata for duration:
     ```typescript
     import { parseFile } from 'music-metadata';
     const metadata = await parseFile(fullPath);
     const duration = metadata.format.duration;
     ```
   - Cache durations to avoid repeated file reads

2. **GoLightly02NextJs (Frontend)**:
   - Receive duration in API response
   - Format and display as above

**Recommendation**: Option 1 (calculate on creation) is more efficient as duration is calculated once and stored. Option 2 adds overhead to every meditation list request.

**Migration Path**:
For existing meditations without duration:
- Create a database migration script that reads all meditation files
- Calculate duration using `music-metadata` library
- Update Meditation records with duration values

### Listen Tracking System

**Current Implementation**:

1. **Anonymous Users**:
   - When streaming meditation, API increments `listenCount` in Meditations table
   - No user-specific tracking

2. **Authenticated Users**:
   - When streaming meditation, API increments `listenCount` in Meditations table
   - API creates/updates ContractUserMeditationsListen record with:
     - `userId`: Current user ID
     - `meditationId`: Meditation being played
     - `listenCount`: Incremented by 1 each time
     - `favorite`: User's favorite status (true/false)

3. **Display in Frontend**:
   - TableMeditation component shows total `listenCount` from Meditations table
   - Shows `favoriteCount` calculated from ContractUserMeditationsListen records

**Use Cases**:
- Public meditation dashboard: Show most-listened meditations
- User profile: Show personal listening history and favorites
- Creator analytics: Track how many times their meditations have been played

### Admin User Management

**Current Implementation**:

Admin users (identified by `isAdmin: true` in Users table) have access to:

1. **GoLightly02NextJs (Frontend)**:
   - Admin page at `/admin` (protected route)
   - Sections for:
     - Users management
     - Sound Files management
     - Meditations management
     - Queue monitoring

2. **GoLightly02API (Backend)**:
   - Admin endpoints under `/admin` route
   - Check `isAdmin` flag in JWT token
   - Return 403 Forbidden if not admin

3. **Creating First Admin**:
   - Manual database update to set `isAdmin: true` for first user
   - Or create admin user in database initialization script

**Expandability**:
- Add role-based permissions beyond simple admin flag
- Create separate admin authentication flow
- Implement audit logging for admin actions

## Environment Configuration

This section documents the environment variables required across all components.

### GoLightly02NextJs

```bash
# API Communication
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Application Configuration
NEXT_PUBLIC_MODE=development
NEXT_PUBLIC_NAME_APP=GoLightly02NextJs
NEXT_PUBLIC_PATH_TO_LOGS=/path/to/logs
```

### GoLightly02API

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
NAME_APP=GoLightly02API

# Database
PATH_DATABASE=/path/to/database
NAME_DB=golightly.sqlite

# Authentication
JWT_SECRET=your_jwt_secret_here

# Email Service (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
URL_BASE_WEBSITE=http://localhost:3001

# Queuer Integration
URL_MANTRIFY01QUEUER=http://localhost:3002

# File Paths
PATH_MP3_OUTPUT=/path/to/audio/output
PATH_MP3_SOUND_FILES=/path/to/sound/files

# Logging
PATH_TO_LOGS=/path/to/logs
LOG_MAX_SIZE=5
LOG_MAX_FILES=5
```

### GoLightly02Queuer

```bash
# Application Configuration
NAME_APP=GoLightly02Queuer
PORT=3002
NODE_ENV=testing
PATH_PROJECT_RESOURCES=/path/to/project/resources
PATH_QUEUER=/path/to/queuer/resources

# Database
PATH_DATABASE=/path/to/database
NAME_DB=golightly.sqlite

# Authentication
JWT_SECRET=your_jwt_secret_here

# Logging
PATH_TO_LOGS=/path/to/logs
LOG_MAX_SIZE=5
LOG_MAX_FILES=5

# Child Process: ElevenLabs
NAME_CHILD_PROCESS_ELEVENLABS=RequesterElevenLabs01
PATH_TO_ELEVENLABS_SERVICE=/path/to/RequesterElevenLabs01
PATH_SAVED_ELEVENLABS_AUDIO_MP3_OUTPUT=/path/to/elevenlabs/output
PATH_USER_ELEVENLABS_CSV_FILES=/path/to/elevenlabs/csv
API_KEY_ELEVEN_LABS=your_elevenlabs_api_key

# Child Process: Audio Concatenator
NAME_CHILD_PROCESS_AUDIO_FILE_CONCATENATOR=AudioFileConcatenator01
PATH_TO_AUDIO_FILE_CONCATENATOR=/path/to/AudioFileConcatenator01
PATH_AUDIO_CSV_FILE=/path/to/audio/csv
PATH_MP3_OUTPUT=/path/to/audio/output

# Sound Files
PATH_MP3_SOUND_FILES=/path/to/sound/files
```

### RequesterElevenLabs01

```bash
# Application Configuration
NAME_APP=RequesterElevenLabs01
NODE_ENV=development

# ElevenLabs API
API_KEY_ELEVEN_LABS=your_elevenlabs_api_key
PATH_SAVED_ELEVENLABS_AUDIO_MP3_OUTPUT=/path/to/elevenlabs/output
PATH_USER_ELEVENLABS_CSV_FILES=/path/to/elevenlabs/csv

# Logging
PATH_TO_LOGS=/path/to/logs
LOG_MAX_SIZE=5
LOG_MAX_FILES=5
```

### AudioFileConcatenator01

```bash
# Application Configuration
NAME_APP=AudioFileConcatenator01
NODE_ENV=development

# Audio Processing
PATH_PROJECT_RESOURCES=/path/to/project/resources
PATH_AND_FILENAME_AUDIO_CSV_FILE=/path/to/csv/file.csv
PATH_MP3_OUTPUT=/path/to/audio/output

# Logging
PATH_TO_LOGS=/path/to/logs
LOG_MAX_SIZE=5
LOG_MAX_FILES=5
```

## Development Workflow

### Setting Up Development Environment

1. **Install GoLightly02Db** (all backend projects):
   ```bash
   npm install file:/Users/nick/Documents/GoLightly02Db
   ```

2. **Initialize Database** (in any backend project):
   ```bash
   # Create database file and tables
   import { initModels, sequelize } from "golightly02db";
   initModels();
   await sequelize.sync();
   ```

3. **Start Services in Order**:
   ```bash
   # Terminal 1: Start API
   cd GoLightly02API
   npm run dev

   # Terminal 2: Start Queuer
   cd GoLightly02Queuer
   npm run dev

   # Terminal 3: Start Frontend
   cd GoLightly02NextJs
   npm run dev
   ```

4. **Microservices**: No need to start manually (spawned by Queuer)

### Testing Meditation Creation End-to-End

1. Register user in frontend (http://localhost:3001)
2. Verify email via link in console/logs
3. Login to application
4. Create meditation with mix of text, pauses, and sound files
5. Monitor logs in all three services:
   - API logs the forwarding to Queuer
   - Queuer logs queue creation and child process spawning
   - Microservices log file creation
6. Wait for meditation to appear in table
7. Play meditation to test streaming

### Common Development Tasks

**Updating Database Schema**:
1. Modify models in GoLightly02Db project
2. Rebuild GoLightly02Db: `npm run build`
3. Reinstall in dependent projects: `npm install file:/Users/nick/Documents/GoLightly02Db`
4. Delete existing database file (development only!)
5. Restart services to recreate tables

**Adding New API Endpoint**:
1. Define route in GoLightly02API `src/routes/`
2. Add handler logic in route file
3. Update API documentation in `docs/api-documentation/api/`
4. Add corresponding API call in GoLightly02NextJs `src/lib/api/`
5. Update types in both projects

**Debugging Microservice Issues**:
1. Check Queuer logs for child process spawn errors
2. Review microservice log files in `PATH_TO_LOGS`
3. Manually run microservice with test CSV to isolate issue:
   ```bash
   cd RequesterElevenLabs01
   npm start -- --file_name "test.csv"
   ```

## File Organization Standards

All projects follow consistent patterns:

### TypeScript Project Structure
```
project-root/
├── src/
│   ├── index.ts          # Entry point
│   ├── modules/          # Business logic modules
│   ├── routes/           # Express routes (API projects)
│   ├── types/            # TypeScript type definitions
│   └── templates/        # Email/HTML templates (API only)
├── dist/                 # Compiled JavaScript (gitignored)
├── docs/                 # Documentation
├── test/                 # Jest tests
├── .env                  # Environment variables (gitignored)
├── .env.example          # Environment template
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── README.md             # Project-specific documentation
```

### Next.js Project Structure
```
GoLightly02NextJs/
├── src/
│   ├── app/              # Next.js app directory (pages, layouts)
│   ├── components/       # React components
│   │   ├── forms/        # Form components
│   │   ├── modals/       # Modal dialogs
│   │   ├── tables/       # Table components
│   │   └── ui/           # Reusable UI primitives
│   ├── lib/              # Utilities and API client
│   ├── store/            # Redux store configuration
│   │   ├── features/     # Redux slices
│   │   ├── hooks.ts      # Typed hooks
│   │   └── index.ts      # Store configuration
│   ├── config/           # Configuration files
│   └── styles/           # Global styles
├── public/               # Static assets
├── docs/                 # Documentation
└── ...config files
```

## Logging Standards

All projects follow `docs/LOGGING_NODE_JS_V06.md`:

**Mode-Specific Behavior**:
- **development**: Console output only (for interactive development)
- **testing**: Console + rotating log files (for debugging tests)
- **production**: Rotating log files only (no console clutter)

**Log File Configuration**:
- Filename: `[NAME_APP].log` in `PATH_TO_LOGS` directory
- Rotation: Based on `LOG_MAX_SIZE` (default 5MB) and `LOG_MAX_FILES` (default 5)
- Format: JSON in files, pretty-print to console

**Critical Pattern**: Async IIFE with 100ms delay before early exits:
```typescript
if (error) {
  logger.error('Fatal error occurred', { error });
  await new Promise(resolve => setTimeout(resolve, 100));
  process.exit(1);
}
```

This ensures Winston has time to flush logs to disk before process termination.

## Security Considerations

### Authentication & Authorization
- JWT tokens for API authentication (no expiration on access tokens)
- Email verification required before login
- Password reset tokens expire in 30 minutes
- Bcrypt password hashing with salt rounds
- Authorization header format: `Bearer <token>`

### File Security
- Meditation files organized by date to prevent directory traversal
- File paths validated before reading/writing
- Private meditations require ownership verification
- MP3 streaming uses proper HTTP range requests (no full file in memory)

### API Security
- CORS configured in GoLightly02API
- Input validation on all endpoints
- Standardized error messages (no sensitive data leakage in production)
- SQL injection prevention via Sequelize parameterized queries

### Environment Variables
- `.env` files gitignored across all projects
- `.env.example` templates provided
- Sensitive keys (JWT_SECRET, API_KEY_ELEVEN_LABS) never committed

## Deployment Considerations

### Prerequisites
- Node.js 18+ on all servers
- FFmpeg installed on server running AudioFileConcatenator01
- SMTP credentials for email service
- ElevenLabs API key with sufficient credits

### Service Architecture in Production

**Recommended Setup**:
1. **Frontend**: Deploy GoLightly02NextJs on Vercel or similar CDN
2. **API**: Deploy GoLightly02API on dedicated server/container
3. **Queuer**: Deploy GoLightly02Queuer on same server or separate server
4. **Microservices**: Keep on same server as Queuer (spawned as child processes)
5. **Database**: SQLite file on shared volume accessible to API and Queuer

**Scaling Considerations**:
- Queuer is single-threaded FIFO (no concurrent meditation creation)
- To scale: Deploy multiple Queuer instances with shared database queue
- Implement distributed locking for queue management
- Consider migrating to PostgreSQL for better concurrency
- CDN for serving meditation MP3 files

### Environment-Specific Configuration

**Production Changes**:
- Set `NODE_ENV=production` on all backend services
- Set `NEXT_PUBLIC_MODE=production` in frontend
- Use HTTPS for all API communication
- Configure production-grade SMTP service (not Gmail)
- Set up log rotation and monitoring
- Implement backup strategy for SQLite database

## Troubleshooting Guide

### Common Issues

**Meditation creation fails at ElevenLabs stage**:
- Check ElevenLabs API key is valid
- Verify API key has sufficient credits
- Check network connectivity to ElevenLabs API
- Review RequesterElevenLabs01 logs for detailed error

**Audio file not found when streaming**:
- Verify PATH_MP3_OUTPUT is consistent across Queuer and API
- Check file permissions on output directory
- Ensure AudioFileConcatenator01 completed successfully
- Review filePath and filename in Meditation record

**User cannot login after registration**:
- Check email was verified (isEmailVerified = true)
- Verify email service is configured correctly
- Check spam folder for verification email
- Review API logs for email sending errors

**Queue stuck in "started" or "elevenlabs" status**:
- Check if child process crashed (review logs)
- Verify microservice paths are correct
- Ensure CSV files are being generated properly
- Manually run microservice to test

**JWT token errors**:
- Verify JWT_SECRET is same in API and Queuer
- Check token hasn't expired (though access tokens don't expire)
- Ensure Authorization header format is correct
- Review Redux state for token corruption

## Future Enhancements

### Planned Features
- Google OAuth authentication
- MP3 duration display in meditation table
- Meditation preview before creation
- Bulk meditation operations
- User meditation sharing
- Social features (comments, ratings)
- Advanced audio effects (reverb, EQ)

### Technical Improvements
- Migrate from SQLite to PostgreSQL for production
- Implement Redis for caching and queue management
- Add Prometheus metrics and Grafana dashboards
- Implement comprehensive test coverage
- Add CI/CD pipeline with automated deployments
- Implement WebSocket for real-time queue status updates
- Add CDN for meditation MP3 files

### Scaling Considerations
- Implement distributed queue with multiple Queuer instances
- Add load balancer for API servers
- Separate read and write database instances
- Implement background job processing for non-critical tasks
- Add rate limiting and request throttling

## Related Documentation

### GoLightly02NextJs
- `CLAUDE.md` - Project overview and development guide
- `docs/DATABASE_OVERVIEW.md` - Complete database schema
- `docs/api-documentation/` - API endpoint documentation
- `docs/ERROR_REQUIREMENTS.md` - Error response format
- `docs/LOGGING_NODE_JS_V06.md` - Logging standards

### GoLightly02API
- `docs/references/REQUIREMENTS_TODO_API.md` - Implementation checklist
- `docs/api-documentation/` - Endpoint specifications

### GoLightly02Queuer
- `docs/references/CLAUDE_GoLightly02Queuer.md` - Project guide
- `docs/references/REQUIREMENTS_GoLightly02Queuer.md` - Requirements specification

### Microservices
- `docs/references/README_RequesterElevenLabs01.md` - TTS service documentation
- `docs/references/CLAUDE_AudioFileConcatenator01.md` - Audio combiner guide

### Database
- `docs/references/CLAUDE_GoLightly02Db.md` - Database package notes
- `docs/DATABASE_OVERVIEW.md` - Schema and usage guide

---

**Document Version**: 1.0
**Last Updated**: February 2026
**Maintained By**: Go Lightly Development Team
