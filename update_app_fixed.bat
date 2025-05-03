@echo off
echo Updating app.js with improved logout functionality...

REM Move the updated file to replace the original
move /y "C:\MYCLAUDE_PROJECT\conference-chat\js\app.js.updated" "C:\MYCLAUDE_PROJECT\conference-chat\js\app.js"

echo App.js has been updated successfully!
echo The logout functionality now completely clears all session information.
