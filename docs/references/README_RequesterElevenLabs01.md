# RequesterElevenLabs01

## Overview

TypeScript application that converts text to speech using the ElevenLabs API. The application validates voice IDs and speed parameters, makes requests to ElevenLabs, and saves the resulting MP3 audio files with a structured naming convention. Includes environment-specific Winston logging with file rotation for development, testing, and production modes.

This service was build to support the Mantrify Project.

## Build and Run

1. Install dependencies:

```bash
npm install
```

2. Build the TypeScript project:

```bash
npm run build
```

3. Run the application:

**Single Request Mode:**

```bash
npm start -- --text "Your text here" [--voice_id VOICE_ID] [--speed SPEED]
```

**Batch Processing Mode (CSV):**

```bash
npm start -- --file_name "requests.csv" [--voice_id VOICE_ID] [--speed SPEED]
```

Parameters:

- `--text` (required for single mode) - Text to convert to audio
- `--file_name` (required for batch mode) - CSV filename in PATH_USER_ELEVENLABS_CSV_FILES directory
- `--voice_id` (optional) - ElevenLabs voice ID (default: nPczCjzI2devNBz1zQrb)
  - For CSV mode, used as default when row doesn't specify voice_id
- `--speed` (optional) - Speech speed between 0.7-1.2 (default: 0.85)
  - For CSV mode, used as default when row doesn't specify speed

Note: `--text` and `--file_name` are mutually exclusive - use one or the other.

Examples:

Single request:

```bash
npm start -- --text "Hello world" --voice_id nPczCjzI2devNBz1zQrb --speed 0.9
```

Batch processing from CSV:

```bash
npm start -- --file_name "elevenlabs_0001.csv"
```

## Project Structure

```
src/
├── index.ts                    # Main application entry point
├── modules/
│   ├── logger.ts              # Winston logger configuration
│   ├── cliParser.ts           # Command-line argument parsing
│   ├── csvParser.ts           # CSV file parsing for batch requests
│   ├── elevenLabsService.ts   # ElevenLabs API integration
│   ├── validator.ts           # Parameter validation
│   └── fileSaver.ts           # Audio file saving logic
└── types/
    └── index.ts               # TypeScript type definitions
```

## CSV File Format

For batch processing, create a CSV file with the following columns:

```csv
id,text,voice_id,speed
1,"Hello world",nPczCjzI2devNBz1zQrb,0.9
2,"Good morning",,
3,"How are you today",XYZ123ABC,1.0
```

Column details:

- `id` (required) - Unique identifier for the request
- `text` (required) - The text to convert to audio
- `voice_id` (optional) - ElevenLabs voice ID; if empty, uses default from CLI args
- `speed` (optional) - Speech speed (0.7-1.2); if empty, uses default from CLI args

Notes:

- CSV file must be placed in the directory specified by `PATH_USER_ELEVENLABS_CSV_FILES` environment variable
- Processing stops at the first empty row (row with missing id or text)
- If a row fails, processing continues with remaining rows
- A summary is displayed at the end showing successful and failed requests

## Environment Variables

Required variables in `.env`:

```
# Application Configuration
NAME_APP=RequesterElevenLabs01
NODE_ENV=development|testing|production

# Logging
PATH_TO_LOGS=/path/to/logs

# ElevenLabs API
API_KEY_ELEVEN_LABS=your_api_key_here
PATH_SAVED_ELEVENLABS_AUDIO_MP3_OUTPUT=/path/to/audio/output

# CSV Batch Processing
PATH_USER_ELEVENLABS_CSV_FILES=/path/to/csv/files

# Optional Logging Settings
LOG_MAX_SIZE=5
LOG_MAX_FILES=5
```

## Processing Workflow

### Single Request Mode

1. Parse command-line arguments and apply defaults for optional parameters

2. Validate speed parameter (must be between 0.7 and 1.2)

3. Validate voice_id by querying the ElevenLabs API voices endpoint to confirm the voice exists and retrieve its name

4. Convert text to speech using the ElevenLabs text-to-speech endpoint with the specified voice_id, text, and speed parameters

5. Save the audio file in date-organized subdirectories with naming convention:
   - Files are saved to: `PATH_SAVED_ELEVENLABS_AUDIO_MP3_OUTPUT/YYYYMMDD/[filename].mp3`
   - Subdirectory created automatically for each day in YYYYMMDD format
   - Filename format: `[VoiceName]_[First10CharsOfText]_[YYYYMMDD_HHMMSS].mp3`
     - Voice name extracted up to first space or max 10 characters
     - Text portion has spaces replaced with underscores
     - Timestamp in YYYYMMDD_HHMMSS format

6. Log all operations to console and/or file based on NODE_ENV setting

### Batch Processing Mode (CSV)

1. Parse command-line arguments including CSV filename

2. Read and parse CSV file from PATH_USER_ELEVENLABS_CSV_FILES directory
   - Validate file exists
   - Validate file contains data rows
   - Stop processing at first empty row

3. For each valid row in the CSV:
   - Use row-specific voice_id and speed if provided, otherwise use CLI defaults
   - Validate speed parameter (must be between 0.7 and 1.2)
   - Validate voice_id by querying the ElevenLabs API
   - Convert text to speech
   - Save audio file with same naming convention as single mode
   - Continue processing even if individual rows fail

4. Display summary showing:
   - Total number of requests
   - Successful conversions
   - Failed conversions with error details

5. Log all operations to console and/or file based on NODE_ENV setting
