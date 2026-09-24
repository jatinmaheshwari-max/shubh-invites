@echo off
title Libesole Invite Maker
cd /d "%~dp0"
if not exist node_modules (
    echo Installing for the first time, please wait...
    call npm install --no-fund --no-audit
)
start "" http://localhost:4321
node server.js
pause
