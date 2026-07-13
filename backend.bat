@echo off
title NoteUniX Backend (port 5000)
cd /d "%~dp0packages\backend"
echo Starting Backend on http://localhost:5000
npm run dev
