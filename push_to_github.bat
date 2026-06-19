@echo off
title Push Project to GitHub - HARSHA METAL_FRAM_WORKS
echo ===================================================
echo Pushing HARSHA METAL_FRAM_WORKS to GitHub
echo Remote Repo: https://github.com/Preethamnaya/Metal_frame.git
echo ===================================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/ and try again.
    pause
    exit /b 1
)

:: Initialize git repository if not already done
if not exist .git (
    echo [INFO] Initializing new Git repository...
    git init
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to initialize git repository.
        pause
        exit /b %errorlevel%
    )
) else (
    echo [INFO] Git repository already initialized.
)

:: Set remote origin
echo [INFO] Setting remote origin...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/Preethamnaya/Metal_frame.git
if %errorlevel% neq 0 (
    echo [ERROR] Failed to set remote origin.
    pause
    exit /b %errorlevel%
)

:: Stage all files
echo [INFO] Staging project files...
git add .
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stage files.
    pause
    exit /b %errorlevel%
)

:: Commit files
echo [INFO] Committing files...
git commit -m "Initialize project with premium 3D visuals, order tracking, and status controls"
if %errorlevel% neq 0 (
    :: If nothing to commit, that's fine if they already committed
    echo [WARNING] Commit failed. You might have no new changes to commit.
)

:: Rename branch to main
echo [INFO] Renaming default branch to main...
git branch -M main

:: Push project
echo [INFO] Pushing files to GitHub...
echo Note: If prompted, please authenticate with your GitHub account.
echo.
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to push to GitHub.
    echo Please check your internet connection, credentials, and repository permissions.
    echo If GitHub rejected the push because the remote repo has changes, try running:
    echo     git pull origin main --rebase
    echo then run this script again.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo [SUCCESS] Project successfully pushed to GitHub!
echo URL: https://github.com/Preethamnaya/Metal_frame.git
echo ===================================================
echo.
pause
