Write-Host "Setting up BlueOS Modern Frontend..." -ForegroundColor Cyan

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "Setup complete!" -ForegroundColor Green
    Write-Host "To start the application, run: npm run dev" -ForegroundColor Cyan
} else {
    Write-Error "Failed to install dependencies. Please check the error messages above."
}
