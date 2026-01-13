# Deploy each service and capture URLs
$services = @(
    @{name = "visualky"; path = "visualky" },
    @{name = "guardian-ai"; path = "guardian-ai/frontend" },
    @{name = "phantom-guardian"; path = "phantom-guardian" },
    @{name = "biosync-oracle"; path = "biosync-oracle" },
    @{name = "reality-anchor"; path = "reality-anchor" },
    @{name = "swarm-intelligence"; path = "swarm-intelligence" },
    @{name = "neurosync-guardian"; path = "neurosync-guardian" },
    @{name = "danger-maps"; path = "danger-maps" },
    @{name = "silent-witness"; path = "silent-witness" },
    @{name = "sonicguard"; path = "sonicguard" },
    @{name = "emotionguard"; path = "emotionguard" },
    @{name = "quantum-mesh"; path = "quantum-mesh" }
)

$deployedUrls = @{}

foreach ($service in $services) {
    Write-Host "`n[$($service.name)] Deploying..." -ForegroundColor Cyan
    
    Push-Location $service.path
    
    # Deploy and capture output
    $output = vercel --prod --yes 2>&1 | Out-String
    Write-Host $output
    
    # Extract production URL (the aliased one)
    if ($output -match 'Aliased:\s+(https://[^\s]+)') {
        $url = $matches[1]
        $deployedUrls[$service.name] = $url
        Write-Host "✅ Deployed: $url" -ForegroundColor Green
    }
    elseif ($output -match 'Production:\s+(https://[^\s]+)') {
        $url = $matches[1]
        $deployedUrls[$service.name] = $url
        Write-Host "✅ Deployed: $url" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to get URL" -ForegroundColor Red
    }
    
    Pop-Location
}

# Save URLs
"DEPLOYED SERVICE URLS`n" + ("=" * 50) | Out-File "FINAL_URLS.txt"
$deployedUrls.GetEnumerator() | Sort-Object Name | ForEach-Object {
    "$($_.Name): $($_.Value)" | Out-File "FINAL_URLS.txt" -Append
}

Write-Host "`n✅ All URLs saved to FINAL_URLS.txt" -ForegroundColor Green
$deployedUrls.GetEnumerator() | Sort-Object Name | ForEach-Object {
    Write-Host "$($_.Name): $($_.Value)"
}
