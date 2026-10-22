@echo off
title EcoContract AI - Waste Management Proposal & Contract Assistant
echo =====================================================================
echo   EcoContract AI - Waste Management Proposal ^& Contract Assistant
echo   Starting Manager's Office Support Server...
echo =====================================================================
cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing required packages for first-time setup...
    call npm install
)

if not exist "dist\index.html" (
    echo Building user interface...
    call npm run build
)

echo Opening Manager Dashboard in your browser (http://localhost:3001)...
start "" "http://localhost:3001"
node server/index.js
pause
