$audioToolsDir = "c:\Users\shash\OneDrive\Desktop\web_tech_projects\pdf manager\audio tools"
$missing = @()

Get-ChildItem -Path $audioToolsDir -Recurse -Filter "index.html" | ForEach-Object {
    if ($_.DirectoryName -ne $audioToolsDir) {
        $c = [System.IO.File]::ReadAllText($_.FullName)
        $hasCSS = $c -match 'theme\.css'
        $hasToggle = $c -match 'toggleTheme'
        $name = $_.DirectoryName.Replace($audioToolsDir + '\', '')
        if (-not $hasCSS -or -not $hasToggle) {
            $missing += "$name | CSS:$hasCSS | Toggle:$hasToggle"
        }
    }
}

if ($missing.Count -eq 0) {
    Write-Output "ALL TOOLS HAVE THEME CSS AND TOGGLE BUTTON!"
}
else {
    Write-Output "MISSING THEME IN:"
    $missing | ForEach-Object { Write-Output "  - $_" }
}
