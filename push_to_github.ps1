Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Pushing HARSHA METAL_FRAM_WORKS to GitHub" -ForegroundColor Cyan
Write-Host "Remote Repo: https://github.com/Preethamnaya/Metal_frame.git" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Git is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/ and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

# Initialize git if not already done
if (-not (Test-Path .git)) {
    Write-Host "[INFO] Initializing new Git repository..." -ForegroundColor Green
    git init
} else {
    Write-Host "[INFO] Git repository already initialized." -ForegroundColor Green
}

# Set remote origin
Write-Host "[INFO] Setting remote origin..." -ForegroundColor Green
git remote remove origin 2>$null
git remote add origin https://github.com/Preethamnaya/Metal_frame.git

# Stage files
Write-Host "[INFO] Staging project files..." -ForegroundColor Green
git add .

# Commit
Write-Host "[INFO] Committing files..." -ForegroundColor Green
git commit -m "Initialize project with premium 3D visuals, order tracking, and status controls"

# Rename branch
Write-Host "[INFO] Renaming default branch to main..." -ForegroundColor Green
git branch -M main

# Push
Write-Host "[INFO] Pushing files to GitHub..." -ForegroundColor Green
Write-Host "Note: If prompted, please authenticate with your GitHub account." -ForegroundColor Yellow
Write-Host ""
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Failed to push to GitHub." -ForegroundColor Red
    Write-Host "Please check your internet connection, credentials, and repository permissions." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "[SUCCESS] Project successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "URL: https://github.com/Preethamnaya/Metal_frame.git" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
