# Script to add theme toggle button to all audio tool nav bars
# Handles different nav patterns across tools

$audioToolsDir = "c:\Users\shash\OneDrive\Desktop\web_tech_projects\pdf manager\audio tools"

$files = Get-ChildItem -Path $audioToolsDir -Recurse -Filter "index.html" | Where-Object {
    $_.DirectoryName -ne $audioToolsDir
}

$toggleButton = '<button onclick="toggleTheme()" class="theme-toggle-btn p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Toggle Theme" title="Toggle Theme"><i id="theme-icon" class="fas fa-moon"></i></button>'

$processed = 0
$skipped = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Skip if already has theme-toggle or toggleTheme
    if ($content -match "toggleTheme|theme-toggle-btn|theme-toggle") {
        Write-Host "SKIP (already has toggle): $($file.FullName)" -ForegroundColor Yellow
        $skipped++
        continue
    }
    
    $modified = $false
    
    # Pattern 1: Shadow Audio tools - has <!-- Back to Tools --> or "Back to Tools" link
    # Insert before the back link's </a> parent's closing tag
    # Most have: <a href="../index.html" ...>..back..</a> as the last element in nav right side
    
    # Pattern 2: AudioForge tools with "Back to Tools" text  
    # Pattern: <a href="../index.html" class="...">...Back to Tools</a> in header
    
    # Strategy: Insert toggle button right before the "back to tools" or "close" link
    # Look for the back/close link pattern and insert before it
    
    # Try: Insert before <a href="../index.html" (the back/close link)
    if ($content -match '(<a\s+href="\.\.\/index\.html")' -and -not $modified) {
        $content = $content -replace '(<a\s+href="\.\.\/index\.html")', "$toggleButton`r`n        `$1"
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "UPDATED: $($file.FullName)" -ForegroundColor Green
        $processed++
    } else {
        Write-Host "NO MATCH: $($file.FullName)" -ForegroundColor Red
        $skipped++
    }
}

Write-Host ""
Write-Host "Done! Updated: $processed, Skipped/NoMatch: $skipped" -ForegroundColor Cyan
