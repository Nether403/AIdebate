# Clean desktop.ini files from .git directory
# Run this if Google Drive File Stream creates desktop.ini files in .git

Write-Host "Cleaning desktop.ini files from .git directory..." -ForegroundColor Yellow

# Remove desktop.ini files from .git directory
$count = 0
Get-ChildItem -Path ".git" -Recurse -Filter "desktop.ini" -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $_.Attributes = 'Normal'
    Remove-Item $_.FullName -Force
    $count++
}

if ($count -gt 0) {
    Write-Host "Removed $count desktop.ini files from .git directory" -ForegroundColor Green
} else {
    Write-Host "No desktop.ini files found in .git directory" -ForegroundColor Green
}

# Verify git repository health
Write-Host "`nVerifying git repository..." -ForegroundColor Yellow
$fsckOutput = git fsck --full 2>&1 | Select-String "desktop.ini"
if ($fsckOutput) {
    Write-Host "Warning: Some desktop.ini references still exist:" -ForegroundColor Red
    $fsckOutput
} else {
    Write-Host "Git repository is clean!" -ForegroundColor Green
}
