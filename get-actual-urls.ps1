# Get actual deployed URLs from Vercel
Write-Host "Fetching actual deployment URLs..." -ForegroundColor Cyan

$services = @{
    "visualky"           = "visualky"
    "guardian-ai"        = "guardian-ai/frontend"
    "phantom-guardian"   = "phantom-guardian"
    "biosync-oracle"     = "biosync-oracle"
    "reality-anchor"     = "reality-anchor"
    "swarm-intelligence" = "swarm-intelligence"
    "neurosync-guardian" = "neurosync-guardian"
    "danger-maps"        = "danger-maps"
    "silent-witness"     = "silent-witness"
    "sonicguard"         = "sonicguard"
    "emotionguard"       = "emotionguard"
    "quantum-mesh"       = "quantum-mesh"
}

$urls = @{}

foreach ($key in $services.Keys) {
    $path = $services[$key]
    Write-Host "Checking $key..." -ForegroundColor Yellow
    
    Push-Location $path
    $output = vercel ls 2>&1 | Out-String
    
    # Extract the production URL
    if ($output -match 'https://orion-[^\s]+\.vercel\.app') {
        $url = $matches[0]
        $urls[$key] = $url
        Write-Host "  Found: $url" -ForegroundColor Green
    }
    else {
        Write-Host "  Not found - needs deployment" -ForegroundColor Red
    }
    
    Pop-Location
}

# Save to file
"ACTUAL DEPLOYED URLS" | Out-File -FilePath "ACTUAL_URLS.txt"
"=" * 50 | Out-File -FilePath "ACTUAL_URLS.txt" -Append
"" | Out-File -FilePath "ACTUAL_URLS.txt" -Append

foreach ($key in $urls.Keys | Sort-Object) {
    "$key : $($urls[$key])" | Out-File -FilePath "ACTUAL_URLS.txt" -Append
    Write-Host "$key : $($urls[$key])"
}

Write-Host "`nSaved to ACTUAL_URLS.txt" -ForegroundColor Cyan
