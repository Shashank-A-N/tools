# Script to add theme support to all audio tool index.html files
# Adds: theme.css, audio-tool-theme.css, theme.js, and theme toggle button

$audioToolsDir = "c:\Users\shash\OneDrive\Desktop\web_tech_projects\pdf manager\audio tools"

# Get all index.html files in subdirectories (not the hub index.html)
$files = Get-ChildItem -Path $audioToolsDir -Recurse -Filter "index.html" | Where-Object {
    $_.DirectoryName -ne $audioToolsDir
}

$themeLines = @"
    <!-- Shared Theme System -->
    <link rel="stylesheet" href="../../shared/theme.css">
    <link rel="stylesheet" href="../shared/audio-tool-theme.css">
    <script src="../../shared/theme.js"></script>
"@

# For tools inside nested folders like "Format & Encoding Tools/sub-tool/"
$themeLinesSub = @"
    <!-- Shared Theme System -->
    <link rel="stylesheet" href="../../../shared/theme.css">
    <link rel="stylesheet" href="../../shared/audio-tool-theme.css">
    <script src="../../../shared/theme.js"></script>
"@

$themeToggleButton = '<button onclick="toggleTheme()" class="theme-toggle-btn p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Toggle Theme"><i id="theme-icon" class="fas fa-moon"></i></button>'

$processed = 0
$skipped = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Skip if already has theme.css
    if ($content -match "theme\.css") {
        Write-Host "SKIP (already themed): $($file.FullName)" -ForegroundColor Yellow
        $skipped++
        continue
    }
    
    # Determine depth - is this a direct child or nested deeper?
    $relativePath = $file.DirectoryName.Substring($audioToolsDir.Length + 1)
    $depth = ($relativePath.Split('\') | Where-Object { $_ -ne '' }).Count
    
    if ($depth -gt 1) {
        $linesToAdd = $themeLinesSub
    } else {
        $linesToAdd = $themeLines
    }
    
    # Insert theme links before </head>
    $content = $content -replace '(</head>)', "$linesToAdd`r`n`$1"
    
    # Add theme toggle button - try to insert before the last </a> or close button in the nav/header
    # Strategy: insert before the closing </header> or </nav> first found
    # We'll add it as part of the nav's right side
    
    # Save the file
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    
    Write-Host "UPDATED: $($file.FullName)" -ForegroundColor Green
    $processed++
}

Write-Host ""
Write-Host "Done! Processed: $processed, Skipped: $skipped" -ForegroundColor Cyan
