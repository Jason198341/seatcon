@echo off
echo Deploying real-time messaging synchronization improvements...

REM Create necessary directories if they don't exist
if not exist css mkdir css
if not exist js\modules mkdir js\modules

REM Copy new module files
echo Copying new module files...
copy /y js\modules\network-monitor.js js\modules\
copy /y js\modules\message-status.js js\modules\
copy /y js\modules\typing-indicator.js js\modules\
copy /y js\modules\connection-status.js js\modules\

REM Copy improved database file
echo Copying improved database implementation...
copy /y js\database_improved.js js\database.js

REM Copy CSS files
echo Copying CSS files...
copy /y css\connection-status.css css\

REM Update index.html
echo Updating index.html...
copy /y index.html.new index.html

REM Create updated script references file
echo Creating index with script references...
echo ^<!-- Module scripts --^> > temp.txt
echo ^<script src="js/modules/network-monitor.js"^>^</script^> >> temp.txt
echo ^<script src="js/modules/message-status.js"^>^</script^> >> temp.txt
echo ^<script src="js/modules/typing-indicator.js"^>^</script^> >> temp.txt
echo ^<script src="js/modules/connection-status.js"^>^</script^> >> temp.txt

REM Insert module scripts before app.js
powershell -Command "(Get-Content index.html) -replace '(.*database.js\".*)', '$1`r`n    <!-- Module scripts -->`r`n    <script src=\"js/modules/network-monitor.js\"></script>`r`n    <script src=\"js/modules/message-status.js\"></script>`r`n    <script src=\"js/modules/typing-indicator.js\"></script>`r`n    <script src=\"js/modules/connection-status.js\"></script>' | Set-Content index.html"

echo Deployment completed successfully!
echo Please test the application by opening index.html in a browser.
