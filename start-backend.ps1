$phpPath = "C:\xampp\php\php.exe"
if (-not (Test-Path $phpPath)) {
    Write-Host "Error: PHP not found at $phpPath. Please install XAMPP or PHP." -ForegroundColor Red
    exit 1
}

Write-Host "Starting PHP Backend Server on http://localhost:8000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

# Start the server inside the current directory (BlueOS_New)
& $phpPath -S localhost:8000