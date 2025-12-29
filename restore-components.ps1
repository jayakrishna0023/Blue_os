# Restore all wild-fishery components from git

$components = @{
    'Admin' = @('AdminDashboard.jsx', 'QRGenerator.jsx')
    'Captain' = @('CaptainDashboard.jsx', 'SpeciesEntry.jsx', 'TripExpenseForm.jsx', 'TripHistory.jsx', 'TripRegistration.jsx', 'TripSummary.jsx')
    'Fisher' = @('FisherDashboard.jsx')
    'Inspector' = @('InspectorDashboard.jsx', 'InspectorHome.jsx', 'QualityEntry.jsx', 'TripDetails.jsx')
    'Worker' = @('CrateManagement.jsx', 'TripApprovals.jsx', 'WorkerDashboard.jsx', 'WorkerEntry.jsx', 'WorkerHome.jsx', 'WorkerProfile.jsx')
}

foreach ($folder in $components.Keys) {
    foreach ($file in $components[$folder]) {
        Write-Host "Restoring $folder/$file..." -ForegroundColor Cyan
        git show "HEAD:src/components/$folder/$file" | Out-File -FilePath "src\components\$folder\$file" -Encoding utf8
    }
}

Write-Host "`nAll components restored!" -ForegroundColor Green
