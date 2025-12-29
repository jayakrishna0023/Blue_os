# PowerShell script to update import paths in all module files

$rootPath = "C:\Users\Jaya Krishna\Desktop\BlueOS\src\modules"

Write-Host "Updating import paths in all module files..." -ForegroundColor Cyan

# Define import replacements
$replacements = @(
    @{
        Old = "from '../../../services/"
        New = "from '../../../shared/services/"
    },
    @{
        Old = "from '../../services/"
        New = "from '../../../shared/services/"
    },
    @{
        Old = "from '../services/"
        New = "from '../../shared/services/"
    },
    @{
        Old = "from '../../../context/"
        New = "from '../../../shared/context/"
    },
    @{
        Old = "from '../../context/"
        New = "from '../../../shared/context/"
    },
    @{
        Old = "from '../context/"
        New = "from '../../shared/context/"
    },
    @{
        Old = "from '../../components/Shared/"
        New = "from '../../../shared/components/Shared/"
    },
    @{
        Old = "from '../components/Shared/"
        New = "from '../../shared/components/Shared/"
    },
    @{
        Old = "from '../Shared/"
        New = "from '../../../shared/components/Shared/"
    }
)

# Get all .jsx and .js files in wild-fishery and shared modules
$files = Get-ChildItem -Path "$rootPath\wild-fishery" -Recurse -Include *.jsx,*.js
$files += Get-ChildItem -Path "$rootPath\shared" -Recurse -Include *.jsx,*.js

$totalFiles = $files.Count
$currentFile = 0

foreach ($file in $files) {
    $currentFile++
    $relativePath = $file.FullName.Replace($rootPath, "modules")
    Write-Progress -Activity "Updating imports" -Status "Processing $relativePath" -PercentComplete (($currentFile / $totalFiles) * 100)
    
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    foreach ($replacement in $replacements) {
        if ($content -match [regex]::Escape($replacement.Old)) {
            $content = $content -replace [regex]::Escape($replacement.Old), $replacement.New
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Updated: $relativePath" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Import paths updated successfully!" -ForegroundColor Green
Write-Host "Total files processed: $totalFiles" -ForegroundColor White
