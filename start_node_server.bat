@echo off
echo Starting Node.js server for Conference Chat...
echo If this fails, make sure you have Node.js installed.
echo Access the application at the URL shown in the console
echo Press Ctrl+C to stop the server

cd %~dp0
npx serve
