# PowerShell script to organize BlueOS into modules

$rootPath = "C:\Users\Jaya Krishna\Desktop\BlueOS\src"
$modulesPath = "$rootPath\modules"

Write-Host "Organizing BlueOS into modular structure..." -ForegroundColor Cyan

# Move Wild Fishery specific components
Write-Host ""
Write-Host "1. Moving Wild Fishery components..." -ForegroundColor Yellow
$wildFisheryComponents = @("Admin", "Captain", "Fisher", "Inspector", "Worker")
foreach ($component in $wildFisheryComponents) {
    $source = "$rootPath\components\$component"
    $dest = "$modulesPath\wild-fishery\components\$component"
    if (Test-Path $source) {
        Write-Host "  Moving $component..." -ForegroundColor Gray
        Move-Item -Path $source -Destination $dest -Force
    }
}

# Move LandingPage to Wild Fishery
if (Test-Path "$rootPath\components\LandingPage.jsx") {
    Write-Host "  Moving LandingPage.jsx..." -ForegroundColor Gray
    Move-Item -Path "$rootPath\components\LandingPage.jsx" -Destination "$modulesPath\wild-fishery\components\LandingPage.jsx" -Force
}

# Move shared components (Auth, Public, Shared)
Write-Host ""
Write-Host "2. Moving Shared components..." -ForegroundColor Yellow
$sharedComponents = @("Auth", "Public", "Shared")
foreach ($component in $sharedComponents) {
    $source = "$rootPath\components\$component"
    $dest = "$modulesPath\shared\components\$component"
    if (Test-Path $source) {
        Write-Host "  Moving $component..." -ForegroundColor Gray
        Move-Item -Path $source -Destination $dest -Force
    }
}

# Move services
Write-Host ""
Write-Host "3. Moving services to shared..." -ForegroundColor Yellow
if (Test-Path "$rootPath\services") {
    Move-Item -Path "$rootPath\services\*" -Destination "$modulesPath\shared\services\" -Force
    Write-Host "  Moved all services" -ForegroundColor Gray
}

# Move context
Write-Host ""
Write-Host "4. Moving context to shared..." -ForegroundColor Yellow
if (Test-Path "$rootPath\context") {
    Move-Item -Path "$rootPath\context" -Destination "$modulesPath\shared\" -Force
    Write-Host "  Moved context folder" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Module organization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update import paths in App.jsx" -ForegroundColor White
Write-Host "2. Test the application" -ForegroundColor White
Write-Host "3. Ready for Aquaculture and Mariculture" -ForegroundColor White
