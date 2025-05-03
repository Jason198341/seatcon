@echo off
echo Updating app.js with improved logout functionality...

REM Create a backup of the original file
copy /y js\app.js js\app.js.bak

REM Replace with the updated version
copy /y js\app.js.updated js\app.js

echo App.js has been updated successfully!
echo The logout functionality now completely clears all session information.
