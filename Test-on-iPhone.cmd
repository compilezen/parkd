@echo off
setlocal
cd /d "%~dp0"
title parkd - iPhone test

where node >nul 2>&1
if errorlevel 1 goto :need_node
node -e "if (Number(process.versions.node.split('.')[0]) < 24) process.exit(1)"
if errorlevel 1 goto :need_node

echo Installing parkd's development dependencies...
call npm ci
if errorlevel 1 goto :failed

echo.
echo Installing the required Expo tunnel package...
call npm install --global "@expo/ngrok@^4.1.0"
if errorlevel 1 goto :failed

echo.
echo Sign in to your FREE Expo account below.
echo Use the SAME account in Expo Go on your iPhone.
call npx expo login
if errorlevel 1 goto :failed

echo.
echo Starting parkd with the tunnel package installed.
echo Keep this window open. Scan the QR code with your iPhone Camera.
call npx expo start --go --tunnel
if errorlevel 1 goto :failed
exit /b 0

:need_node
echo Install Node.js 24 LTS, then reopen this file.
echo Download: https://nodejs.org/en/download
start "" "https://nodejs.org/en/download"
pause
exit /b 1

:failed
echo.
echo The iPhone preview could not start. Keep the error above for troubleshooting.
pause
exit /b 1
