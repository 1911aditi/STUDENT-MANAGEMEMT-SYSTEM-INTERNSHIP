@echo off
title Student Management System

echo =========================================================
echo   Starting Student Management System (Offline Local Server)
echo =========================================================
echo.
echo   * URL: http://localhost:8000/login.html
echo.
echo   [NOTE] Keep this window open while using the application.
echo          To stop the server, close this window.
echo =========================================================
echo.

:: Start a background delay command to open the default web browser after server has started
start /B cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000/login.html"

:: Start Node.js server in the foreground using the portable node.exe inside bin folder
"%~dp0bin\node.exe" "%~dp0backend\server.js"
