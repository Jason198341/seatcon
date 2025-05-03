@echo off
echo Starting simple HTTP server for Conference Chat...
echo Access the application at http://localhost:8000
echo Press Ctrl+C to stop the server

cd %~dp0
python -m http.server 8000
