@echo off
title NoteUniX Frontend (port 5173)
cd /d "%~dp0packages\frontend"
echo Starting Frontend on http://localhost:5173
npm run dev
