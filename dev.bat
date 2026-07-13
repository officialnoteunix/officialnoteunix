@echo off
title NoteUniX
cd /d "%~dp0"

echo Starting NoteUniX...
echo.

start "NoteUniX Backend" cmd /k "cd /d "%~dp0packages\backend" && npm run dev"
start "NoteUniX Frontend" cmd /k "cd /d "%~dp0packages\frontend" && npm run dev"

echo Backend  ^> http://localhost:5000
echo Frontend ^> http://localhost:5173
echo.
echo Both windows launched!
