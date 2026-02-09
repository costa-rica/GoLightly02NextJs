# GoLightly01Queuer Requirements

This TypeScript ExpressJS API that uses a sqlite/Sequelize database with a table called "queue" for queue management. It will receieve local requests from the GoLightly01API. This doucment will refer to the "queuer" as this application.

The main objective is to receive user input a POST request with a body that contains parameters for the meditation, then queue the request and process it providing the input to two child processes: the RequesterElevenLabs01 microservice and the AudioFileConcatenator01 microservice. In our docs/references/README-RequesterElevenLabs01.md and docs/references/README-AudioFileConcatenator01.md we have the details of the child processes.

The queuer will also queue requests in a first in first out (FIFO) manner. This means that if there are multiple requests to make a new meditation, they will be processed in the order that they are received. This service will be responsible for updating the queue table with the status of each job.

This service will be connected to the GoLightly02Db database.

## Build process

This requirements document will be the basis for the engineers "To Do" list to build out the application. Store the "To Do" list in the docs/REQUIREMENTS_TODO.md file. When building the application, use the todo list to build out the application each task should have a `[ ]` and once it is complete change it to `[x]`. Group tasks into phases and as each phase is completed then commit the changes to git.

## Codebase

We want the codebase to be modular and easy to maintain. Store the code in the src directory. Types can be stored in the src/types directory. But all other modules or helper functions should be stored in the src/modules directory. Make as many as needed to keep the code modularized so that if we need to replace a module or change a process it can be done by chaning a file and limit the effect on other parts of the codebase.

The router file for this first version will be meditations.ts (subdomain: meditations) and it will be located in the src/routes directory.

In the future there might be other router files for different features.

## .env

Use these .env variables for this app where needed. If additional .env variables are need bring them up in the todo list.

```
NAME_APP=GoLightly01Queuer
PORT=3000
NODE_ENV=testing
PATH_PROJECT_RESOURCES=/Users/nick/Documents/_project_resources/GoLightly/
PATH_QUEUER=/Users/nick/Documents/_project_resources/GoLightly/queuer/
JWT_SECRET=JWT_SECRET

# Logs
PATH_TO_LOGS=/Users/nick/Documents/_logs
# LOG_MAX_SIZE=5
# LOG_MAX_FILES=5

# Child Process: ElevenLabs
NAME_CHILD_PROCESS_ELEVENLABS=RequesterElevenLabs01
PATH_TO_ELEVENLABS_SERVICE=/Users/nick/Documents/RequesterElevenLabs01
PATH_SAVED_ELEVENLABS_AUDIO_MP3_OUTPUT=/Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses
PATH_USER_ELEVENLABS_CSV_FILES=/Users/nick/Documents/_project_resources/GoLightly/eleven_labs_user_csv_files
API_KEY_ELEVEN_LABS=sk_1c2f764a3f6355b5d85c178ae2c2774795ab92e0409f5ad8

# Child Process: Audio Processing
NAME_CHILD_PROCESS_AUDIO_FILE_CONCATENATOR=AudioFileConcatenator01
PATH_TO_AUDIO_FILE_CONCATENATOR=/Users/nick/Documents/AudioFileConcatenator01
PATH_AUDIO_CSV_FILE=/Users/nick/Documents/_project_resources/GoLightly/audio_concatenator_input
PATH_MP3_OUTPUT=/Users/nick/Documents/_project_resources/GoLightly/audio_results
```

# Database / GoLightly02Db

The queuer will be connected to a SQLite / Sequelize database. using the custom package GoLightly02Db. See the docs/DATABASE_OVERVIEW_DRAFT.md file for the schema. This app will use the database to validate users to view the queue page and update the queue table.

### Queue table

I want to try an approach using a table in the database called queue. The table will have the following columns:

- id: this will be the integer value assigned to the latest job.
- userId: this will be in the body of requests
- status: “queued”, “started”, "elevenlabs", "concatenator" or "done"
- jobFilename: this will be the csv filename of the job file stored in PATH_QUEUER/user_request_csv_files
- createdAt: timestamp of when the job was created (Sequelize will handle this)
- updatedAt: timestamp of when the job was updated (Sequelize will handle this)

The docs/DATABASE_OVERVIEW_DRAFT.md file has the full schema.

## Workflow to POST /meditations/new

The objective of this api is to orchestrate the workflow of the first recieving a request to make a new meditation. The workflow is as follows:

### 1. Receive request to make a new meditation.

This will include a JSON body containing one of two elements in the first level: `filenameCsv` or `meditationArray`.

If `filenameCsv` is present, it will be a string containing the filename of a csv file. The file will be located in the subdirectory of the PATH_QUEUER .env variable path called user_request_csv_files.

If `meditationArray` is present, it will be an array of objects.

Both the csv file contents and the array elements objects will be similar. The key names in the array objects will match the field names below.

The CSV file will have the following columns:

- id
- text
- voice_id
- speed
- pause_duration
- sound_file

In the csv each row there could be three different types of filled rows. The text, voice_id and speed go together but voice_id and speed are optional becuase the RequesterElevenLabs01 service has defaults that it will use. But if there is text, there will be no pause_duration or sound_file. If there is pause_duration, there will be no text (voice_id or speed) and no sound_file. If there is sound_file there will be no text / pause_duration.

Here is an example of the csv file:

```
id,text,voice_id,speed,pause_duration,sound_file
1,,,,5,
2,Third time is a charm,Xb7hH8MSUJpSbSDYk0k2,0.8,,
3,,,,5,
4,Yo Yo yo,Xb7hH8MSUJpSbSDYk0k2,1.2,,
5,,,,,
```

### 2. Create csv for RequesterElevenLabs01 microservice and start it.

From the queuer's csv file we will have the information need to create the csv file for the RequesterElevenLabs01 microservice. The csv file for the RequesterElevenLabs01 microservice will have the following columns:

- id
- text
- voice_id
- speed

The file name will be passed to the RequesterElevenLabs01 microservice to request a new meditation audio file.

The RequesterElevenLabs01 microservice will use a csv file that looks like this:

```
id,text,voice_id,speed
1,Third time is a charm,Xb7hH8MSUJpSbSDYk0k2,0.8
2,Yo Yo yo,Xb7hH8MSUJpSbSDYk0k2,1.2
```

### 3. Wait for the RequesterElevenLabs01 microservice to finish.

When RequesterElevenLabs01 finishes, it will have created files saved in the PATH_SAVED_ELEVENLABS_AUDIO_MP3_OUTPUT directory. And the terminal output will look like this:

```
➜  RequesterElevenLabs01 git:(dev_02) ✗ npm start -- --file_name "0001.csv"

> requester-elevenlabs01@1.0.0 start
> node dist/index.js --file_name 0001.csv

2026-01-26 18:10:44 [info]: RequesterElevenLabs01 application started
2026-01-26 18:10:44 [info]: Parsing command line arguments
2026-01-26 18:10:44 [info]: Processing batch requests from CSV file: 0001.csv
2026-01-26 18:10:44 [info]: Reading CSV file: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_user_csv_files/0001.csv
2026-01-26 18:10:44 [info]: Parsed 2 rows from CSV file
2026-01-26 18:10:44 [info]: Processing row 0:
2026-01-26 18:10:44 [info]:   Keys found: id, text, voice_id, speed
2026-01-26 18:10:44 [info]:   Key "id" (length: 3, trimmed: "id") -> value: "1"
2026-01-26 18:10:44 [info]:   Key "text" (length: 4, trimmed: "text") -> value: "Third time is a charm"
2026-01-26 18:10:44 [info]:   Key "voice_id" (length: 8, trimmed: "voice_id") -> value: "Xb7hH8MSUJpSbSDYk0k2"
2026-01-26 18:10:44 [info]:   Key "speed" (length: 5, trimmed: "speed") -> value: "0.8"
2026-01-26 18:10:44 [info]:   Final values - id: "1", text: "Third time is a charm"
2026-01-26 18:10:44 [info]: Processing row 1:
2026-01-26 18:10:44 [info]:   Keys found: id, text, voice_id, speed
2026-01-26 18:10:44 [info]:   Key "id" (length: 3, trimmed: "id") -> value: "2"
2026-01-26 18:10:44 [info]:   Key "text" (length: 4, trimmed: "text") -> value: "Yo Yo yo"
2026-01-26 18:10:44 [info]:   Key "voice_id" (length: 8, trimmed: "voice_id") -> value: "Xb7hH8MSUJpSbSDYk0k2"
2026-01-26 18:10:44 [info]:   Key "speed" (length: 5, trimmed: "speed") -> value: "1.2"
2026-01-26 18:10:44 [info]:   Final values - id: "2", text: "Yo Yo yo"
2026-01-26 18:10:44 [info]: Found 2 valid rows to process
2026-01-26 18:10:44 [info]: Processing 2 requests from CSV
Processing 2 requests from CSV file...
2026-01-26 18:10:44 [info]: Processing row 1/2 - ID: 1

Processing request 1/2 (ID: 1)...
2026-01-26 18:10:44 [info]: Validating speed parameter
2026-01-26 18:10:44 [info]: Speed validated successfully: 0.8
2026-01-26 18:10:44 [info]: Validating voice_id parameter
2026-01-26 18:10:44 [info]: Validating voice_id: Xb7hH8MSUJpSbSDYk0k2
2026-01-26 18:10:44 [info]: Voice validated successfully: Alice - Clear, Engaging Educator (Xb7hH8MSUJpSbSDYk0k2)
2026-01-26 18:10:44 [info]: Using voice: Alice - Clear, Engaging Educator (Xb7hH8MSUJpSbSDYk0k2)
2026-01-26 18:10:44 [info]: Making request to ElevenLabs API for text-to-speech conversion
2026-01-26 18:10:44 [info]: Converting text to speech with voice_id: Xb7hH8MSUJpSbSDYk0k2, speed: 0.8
2026-01-26 18:10:45 [info]: Text-to-speech conversion successful
2026-01-26 18:10:45 [info]: Ensuring subdirectory exists: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126
2026-01-26 18:10:45 [info]: Saving audio file: Alice_Third_time_20260126_181045.mp3
2026-01-26 18:10:45 [info]: File path: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126/Alice_Third_time_20260126_181045.mp3
2026-01-26 18:10:45 [info]: Audio file saved successfully: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126/Alice_Third_time_20260126_181045.mp3
2026-01-26 18:10:45 [info]: Audio file created successfully: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126/Alice_Third_time_20260126_181045.mp3
✓ Success: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126/Alice_Third_time_20260126_181045.mp3
2026-01-26 18:10:45 [info]: Processing row 2/2 - ID: 2

Processing request 2/2 (ID: 2)...
2026-01-26 18:10:45 [info]: Validating speed parameter
2026-01-26 18:10:45 [info]: Speed validated successfully: 1.2
2026-01-26 18:10:45 [info]: Validating voice_id parameter
2026-01-26 18:10:45 [info]: Validating voice_id: Xb7hH8MSUJpSbSDYk0k2
2026-01-26 18:10:45 [info]: Voice validated successfully: Alice - Clear, Engaging Educator (Xb7hH8MSUJpSbSDYk0k2)
2026-01-26 18:10:45 [info]: Using voice: Alice - Clear, Engaging Educator (Xb7hH8MSUJpSbSDYk0k2)
2026-01-26 18:10:45 [info]: Making request to ElevenLabs API for text-to-speech conversion
2026-01-26 18:10:45 [info]: Converting text to speech with voice_id: Xb7hH8MSUJpSbSDYk0k2, speed: 1.2
2026-01-26 18:10:46 [info]: Text-to-speech conversion successful
2026-01-26 18:10:46 [info]: Ensuring subdirectory exists: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126
2026-01-26 18:10:46 [info]: Saving audio file: Alice_Yo_Yo_yo_20260126_181046.mp3
2026-01-26 18:10:46 [info]: File path: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126/Alice_Yo_Yo_yo_20260126_181046.mp3
2026-01-26 18:10:46 [info]: Audio file saved successfully: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126/Alice_Yo_Yo_yo_20260126_181046.mp3
2026-01-26 18:10:46 [info]: Audio file created successfully: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126/Alice_Yo_Yo_yo_20260126_181046.mp3
✓ Success: /Users/nick/Documents/_project_resources/GoLightly/eleven_labs_responses/20260126/Alice_Yo_Yo_yo_20260126_181046.mp3
2026-01-26 18:10:46 [info]: Batch processing completed: 2 successful, 0 failed

========== Batch Processing Summary ==========
Total requests: 2
Successful: 2
Failed: 0
============================================
2026-01-26 18:10:46 [info]: RequesterElevenLabs01 application completed successfully
```

We will want to get the filenames and paths of these ouptut files and create a new csv file that will be used by the AudioFileConcatenator01 microservice. The file path and names will come from the output of the RequesterElevenLabs01 microservice that begins with `Audio file created successfully`.

### 4. create the AudioFileConcatenator01 csv file and start it.

The RequesterElevenLabs01 microservice will have as many rows as the queuer csv file has.
Here is an example of the AudioFileConcatenator01 csv file:

```
id,audio_file_name_and_path,pause_duration
1,/path/to/intro.mp3,
2,,2.5
3,/path/to/meditation.mp3,
```

The column `audio_file_name_and_path` will either use the file path and name from the RequesterElevenLabs01 microservice or the `sound_file` column from the queuer csv file. if there is a pause_duration value in that row it will be used to create a pause in the audio file and there will be no value in the `audio_file_name_and_path` column for that row.

### 5. Once finished

Once finished the queuer will log the new file name and path to the console.

## Authentication

There will be no authentication for this service. It will be run locally and will not be exposed to the internet.

## Logging

Use the requirements in the docs/LOGGING_NODE_JS_V06.md file. This will have child processes and we'll need to have .env variables to pass the chile processes log file name.

## Errors

Use the requirements in the docs/ERROR_REQUIREMENTS.md file for returning error messages to the parent process.

## Readme

Create a README.md file using the requirements in the docs/README-format.md file.

## Tests

Let’s add tests using jest that will use the database to create a request to each of the microservices. The ElevenLabs test should be a short text and then a separate one for the Audio concatenator that will use the ElevenLabs test result and file.

After the test is completed delete the database rows that is makes and the files created from running the microservices.

These tests should be stored in a test/ directory at the root of the project. With that will get passed like a request is made from the API with the `meditationArray`.
