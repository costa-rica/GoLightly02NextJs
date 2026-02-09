# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoLightly01Queuer is a TypeScript Express API that orchestrates meditation audio creation using SQLite/Sequelize database with FIFO queue management. It coordinates two microservices (RequesterElevenLabs01 and AudioFileConcatenator01) to generate custom meditation meditations from user input.

## Essential Commands

```bash
# Build
npm run build

# Start (production)
npm start

# Development mode (auto-reload)
npm run dev

# Tests
npm test
```

## Architecture

### Workflow Pipeline

The system follows a multi-stage pipeline triggered by `POST /meditations/new`:

1. **Input Parsing** (csvParser.ts) - Accepts either `filenameCsv` or `meditationArray` in request body
2. **Queue Creation** (queueManager.ts) - Creates queue record with status "queued"
3. **Status: started** - Updates queue status
4. **ElevenLabs Stage** (elevenLabsHandler.ts) - Generates CSV for text-to-speech entries, spawns RequesterElevenLabs01 child process, parses output to extract MP3 file paths
5. **Status: elevenlabs** - Updates queue status
6. **AudioConcatenator Stage** (audioConcatenatorHandler.ts) - Generates CSV mapping all elements (ElevenLabs files, pauses, sound files), spawns AudioFileConcatenator01 child process, parses output for final MP3 path
7. **Status: concatenator** - Updates queue status
8. **Database Update** (meditationsManager.ts) - Creates Meditation record with parsed file path/name, creates ContractUsersMeditations linking userId to meditationId
9. **Status: done** - Marks queue complete and returns final file path

All orchestration happens in `workflowOrchestrator.ts`.

### Database Integration

Uses custom package `golightly02db` (local dependency at `/Users/nick/Documents/GoLightly02Db`):

- **Models**: User, Queue, Meditation, ContractUsersMeditations, ElevenLabsFiles, UserMeditationListen, SoundFiles
- **Key tables for this service**: Queue (FIFO management), Meditation (output files), ContractUsersMeditations (user-meditation links)
- Import models from `src/modules/database.ts`

### Child Process Management

The system spawns two Node.js microservices as child processes:

**RequesterElevenLabs01** (elevenLabsHandler.ts):

- Spawned with: `npm start` in PATH_TO_ELEVENLABS_SERVICE directory
- Input: CSV with id, text, voice_id, speed
- Output: Parses stdout for lines matching `Audio file created successfully: <path>`
- Environment: Inherits parent env + NAME_APP set to NAME_CHILD_PROCESS_ELEVENLABS

**AudioFileConcatenator01** (audioConcatenatorHandler.ts):

- Spawned with: `npm start` in PATH_TO_AUDIO_FILE_CONCATENATOR directory
- Input: CSV with id, audio_file_name_and_path, pause_duration
- Output: Parses stdout for lines matching `Output|Saved to|Created: <path>.mp3`
- Environment: Inherits parent env + NAME_APP set to NAME_CHILD_PROCESS_AUDIO_FILE_CONCATENATOR + PATH_AND_FILENAME_AUDIO_CSV_FILE

Generic spawner in `childProcessSpawner.ts` captures stdout/stderr and returns ChildProcessResult.

### Meditation Input Types

Each meditation element must have ONE of:

- **text** (+ optional voice_id, speed) - Sent to ElevenLabs for TTS
- **pause_duration** - Generates silence in seconds
- **sound_file** - Pre-existing MP3 filename (full path constructed from PATH_MP3_SOUND_FILES + filename)

**Mutual exclusivity**: sound_file cannot coexist with text/voice_id/speed/pause_duration in the same element (validated in validator.ts).

### File Path Parsing

When saving Meditation records (meditationsManager.ts), the full path from AudioConcatenator is parsed:

- Input: `/path/to/output_20260202_153045.mp3`
- **filePath**: `/path/to/` (directory with trailing slash)
- **filename**: `output_20260202_153045.mp3` (basename)
- **title**: `output_20260202_153045` (filename without extension)

## Critical Environment Variables

Required on startup (validated in onStartUp.ts):

- `PATH_MP3_SOUND_FILES` - Directory containing pre-existing MP3 files
- `PATH_USER_ELEVENLABS_CSV_FILES` - Directory for ElevenLabs CSV generation
- `PATH_AUDIO_CSV_FILE` - Directory for AudioConcatenator CSV generation
- `PATH_TO_ELEVENLABS_SERVICE` - Path to RequesterElevenLabs01 microservice
- `PATH_TO_AUDIO_FILE_CONCATENATOR` - Path to AudioFileConcatenator01 microservice

Application exits with fatal error if any are missing.

## Code Organization

```
src/
├── modules/          # All business logic (modular design)
│   ├── database.ts              # Model imports/exports
│   ├── onStartUp.ts             # Env validation, admin user creation
│   ├── validator.ts             # Request validation
│   ├── csvParser.ts             # Parse CSV files and arrays
│   ├── csvWriter.ts             # Generate CSV for child processes
│   ├── queueManager.ts          # Queue CRUD operations
│   ├── elevenLabsHandler.ts     # ElevenLabs workflow
│   ├── audioConcatenatorHandler.ts  # AudioConcatenator workflow
│   ├── meditationsManager.ts         # Meditation database operations
│   ├── workflowOrchestrator.ts  # Main pipeline coordinator
│   ├── childProcessSpawner.ts   # Generic process spawner
│   ├── fileManager.ts           # File operations
│   ├── logger.ts                # Winston configuration
│   ├── errorHandler.ts          # Express error middleware
│   └── errors.ts                # Custom error classes
├── routes/
│   └── meditations.ts    # POST /meditations/new endpoint
├── types/
│   └── index.ts      # TypeScript interfaces
└── index.ts          # Express app entry
```

Keep modules focused on single responsibilities. When changing workflow steps, modify the relevant handler module.

## Logging Standards

Winston logger configured per docs/LOGGING_NODE_JS_V06.md:

- **Development**: Console only
- **Testing**: Console + rotating files
- **Production**: Rotating files only
- Log files: `PATH_TO_LOGS/[NAME_APP].log`
- Child processes log to separate files using NAME*CHILD_PROCESS*\* env vars

## Error Handling

Follows docs/ERROR_REQUIREMENTS.md:

- Custom error classes in errors.ts (ValidationError, FileNotFoundError, DatabaseError)
- Express error middleware in errorHandler.ts returns standardized JSON:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "User message",
      "details": "...",
      "status": 400
    }
  }
  ```

## Database Schema Notes

**Queue table**: Tracks workflow status with FIFO ordering

- Status progression: queued → started → elevenlabs → concatenator → done
- jobFilename stores the CSV filename for the request

**Meditation table**: Stores final audio file metadata

- Created AFTER AudioConcatenator completes, BEFORE queue marked "done"
- visibility field has database default (not set by this service)

**ContractUsersMeditations**: Junction table linking users to their meditations

- Created immediately after Meditation record

See docs/DATABASE_OVERVIEW.md for full schema.

## Testing

Jest configured in test/ directory:

- Test utilities in test/utils/testHelpers.ts
- getOrCreateTestUser() - Gets admin user or creates test user
- cleanupDatabaseRecords() - Deletes test queue records
- cleanupTestFiles() - Deletes generated files
- Actual test implementations (elevenlabs.test.ts, audioConcatenator.test.ts, e2e.test.ts) need to be created

## Local Dependencies

GoLightly02Db package installed from local file system:

```bash
npm install file:/Users/nick/Documents/GoLightly02Db
```

If making changes to GoLightly02Db models, rebuild that package first, then rebuild this one.

## Key Documentation

- docs/REQUIREMENTS.md - Original project requirements
- docs/REQUIREMENTS_TODO.md - Implementation checklist
- docs/DATABASE_OVERVIEW.md - Database schema details
- docs/LOGGING_NODE_JS_V06.md - Logging standards
- docs/ERROR_REQUIREMENTS.md - Error response format
- docs/references/ - Child microservice documentation
