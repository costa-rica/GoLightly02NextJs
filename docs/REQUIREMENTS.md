# Mantrify NextJs Project Requirements

## Project Inspiration

The Mantrify app is a web application that allows users to create their own guided meditations. Specifically, we want to create **lightly guided meditations**. The goal of Mantrify is to enable users to create these lightly guided meditations that combines purposeful affirmations, common in modern secular/therapeutic meditation, with contemplative silences, allowing users to balance guided reflection with spacious awareness—drawing from diverse meditation traditions worldwide.

Contemporary practice emphasizes regular reminders of gratitude, acceptance, and thought non-identification. These concepts are rooted in ancient wisdom and now supported by research.

Mantrify provides an easy way for users to create and share their own guided meditations.

## Build process

This requirements document will be the basis for the engineers "To Do" list to build out the application. Store the "To Do" list in the docs/REQUIREMENTS_TODO.md file. When building the application, use the todo list to build out the application each task should have a `[ ]` and once it is complete change it to `[x]`. Group tasks into phases and as each phase is completed then commit the changes to git.

## codebase

- The API documentation is in docs/api-documentation/.
- Use the docs/NEXTJS_STRUCTURE.md as a reference for the codebase.
- Use the docs/LOGGING_NODE_JS_V06.md for logging. Make the .log file just be one file do not make multiple files for "-exceptions.log" and "-rejections.log".
- Use the docs/README-format.md to create the README.md file.
- this app will use a .env file to store environment variables.

## General Layout of Website

This website will be mainly homepage and admin page.
It will be responsive to screen size.
The navigation bar at the top will be a simple bar with the logo on the left, and then links to the homepage and admin page on the right. Also there will be a login/logout button on the right. If the user logs in a modal will display that will be in the middle of the screen. This will be the login modal. It will have a username and password field, and a login button. We will also have Google login option.

The navigation bar will be fixed to the top of the screen. The navigation on small screens will be a hamburger menu. clicking on the hamburger menu will display the navigation links by a slide out panel from the left. It will cover 75% of the screen width and have an overlay behind it where the user can click to close the panel.

The admin page will only be accessible to users where isAdmin is true. If the user is not logged in or isAdmin is false, they will be redirected to the homepage. Admin users will see "admin" link in the navigation bar.

## Style

Please use a modern clean style for the website. Use a color scheme that is calming and relaxing. Use a color scheme that is calming and relaxing.

The logo is in public/images/mantrifyLogo02.png and the favicon is in public/images/favicon_io/.

## Website Homepage

The website will allow for non-registered users to view and listen to meditations. But registered users will be able to create their own meditations.

The main page will have two sections expandable and collapsable sections stacked vertically. The top section will be a table of meditations, with a section heading "Meditations". The bottom section will be a form to create a new meditation, with a section heading "Create New Meditation". By default the "Meditaitons" will be expanded and "Create New Meditation" will be collapsed or non-visible if the user is not logged in.

## Meditation Table Section

All users will see the title, a play button, number of listens, for all public meditations. The table will be populated using the GET /mantras/all endpoint (see documentation for endpoint in docs/api-documentation/api/mantras.md).

This tabel will have to be visible in small screens as well. The table will be scrollable and have a fixed header. Make the text size smaller for small screens.

A registered user will be able to see all the public meditations and their own private meditations as well as a column for favorite. They will be able to click a star button that will make the meditaiton one of their favorites. If the star is clicked it will turn yellow and a request will be sent to POST /mantras/favorite/:mantraId/:trueOrFalse (see documentation for endpoint in docs/api-documentation/api/mantras.md), where the mantraId is the id of the meditation and trueOrFalse is a boolean value that indicates if the meditation is a favorite or not. If the start is clicked again it will turn white and a request will be sent to POST /mantras/favorite/:mantraId/:trueOrFalse, where the mantraId is the id of the meditation and trueOrFalse is a boolean value that indicates if the meditation is a favorite or not.

The play button will stream using the GET /mantras/:id/stream endpoint (see documentation for endpoint in docs/api-documentation/api/mantras.md).

Logged in users will see their own meditations will have a delete button. The delete button will call the DELETE /mantras/:id endpoint (see documentation for endpoint in docs/api-documentation/api/mantras.md).

## Create Mantra section

Registered users will see an expandable section that will say "Create New Meditation". The section will be a form that will be a single row at first, but have a plus sign or indication to add more rows. This section will not be visible to visitors not logged in.

The goal of this form will be to mimic the creation of the csv file the Mantrify01Queuer, refered to as the queuer from here on out, creates. The queuer is an API service that the Mantrify01API, refered to as the api from here on out, will use to create the audio files for the meditations. This app will communicate directly with the api to create the meditations, login, and other admin functions.

The queuer is a seperate service on the local machine that orchestrates the communcation with ElevenLabs (named RequesterElevenLabs01) to create text-to-speech file and an audio file concatenator microservice (named AudioFileConcatenator01), that combines the files into one meditation mp3 file.

Here is an example of the csv file:

```
id,text,voice_id,speed,pause_duration,sound_file
1,,,,5,
2,Third time is a charm,Xb7hH8MSUJpSbSDYk0k2,0.8,,
3,,,,5,
4,Yo Yo yo,Xb7hH8MSUJpSbSDYk0k2,1.2,,
5,,,,,
```

In the csv each row there could be three different types of filled rows. The text and speed go together but speed is optional. But if there is text, there will be no pause_duration or sound_file. If there is pause_duration, there will be no text ( speed) and no sound_file. If there is sound_file there will be no text / pause_duration.

So this form section will need to have inputs for text, speed, pause_duration, and sound_file. Let's make the left most column a dropdown that will say "Text", "Pause", or "Sound File". Based on the selection the other columns with inputs and labels indicating the units will appear. Let's make the default selection "Text". This will just have an input for text, that will have two rows so it might be a textarea. Then to the right will be inputs for speed, which should be small like allow for a decimal between 0.7 and 1.3. If the dropdown is changed to "Pause" then an input that allows for a number in seconds will appear with a small label indicating seconds. If the dropdown is changed to "Sound File" then an input that allows for a file will appear with a small label indicating file.

The sound file input will also be a dropdown that selects from the sounds files supported by the API's GET /sounds/sound_files endpoint. Show the name of the sound file. When the page loads it

Below there will be an "Add Row" button that will add a new row to the table. Again the default selection will be "Text".

In the same section but below the table of rows there will be a button that says "submit". When clicked it will send a request to the POST /mantras/create endpoint.

## Admin Page

The admin page will have expandable sections aligned vertically. The top most will be "Users", followed by "Sounds Files", below that will be "Meditations", and the bottom most will be "Queuer". Each will be collapsable and expandable.

### Users

The Users section will have a table component called TableAdminUsers. This table will display all the users that are registered. It will popualate with data from the GET /admin/users endpoint. It will have columns for id, username, email, and delete button. The delete button will call the DELETE /admin/users/:id endpoint.

### Sounds Files

The Sounds Files section will have a table component called TableAdminSoundsFiles. This table will display all the sound files that are available to be used in the meditations. It will popualate with data from the GET /sounds/sound_files endpoint. It will have columns for id, name, and delete button. The delete button will call the DELETE /sounds/sound_file/:id endpoint.

There will be a button that says "Upload Sound File", in the section above the table to the right of the section heading. This button will open a modal, called ModalUploadSoundFile, that will allow the user to upload a sound file. This will call the POST /sounds/upload endpoint. The modal will have a file input, name input, description input, and a submit button. name and description are optional.

### Meditations

The Meditations section will have a table component called TableAdminMeditations. This table will display all the meditations that are available to be used in the meditations. It will popualate with data from the GET /admin/mantras endpoint. It will have columns for id, name, and delete button. The delete button will call the DELETE /admin/mantras/:id endpoint.

### Queuer

The Queuer section will have a table component called TableAdminQueuer. This table will display all the meditations that are available to be used in the meditations. It will popualate with data from the GET /admin/queuer endpoint. It will have columns for id, name, and delete button. The delete button will call the DELETE /admin/queuer/:id endpoint.
