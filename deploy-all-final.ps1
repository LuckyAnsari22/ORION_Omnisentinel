# Deploy all Orion services with proper naming
$services = @(
    @{name = "visualky"; path = "visualky"; projectName = "orion-visualky" },
    @{name = "guardian-ai"; path = "guardian-ai/frontend"; projectName = "orion-guardian-ai" },
    @{name = "phantom-guardian"; path = "phantom-guardian"; projectName = "orion-phantom-guardian" },
    @{name = "biosync-oracle"; path = "biosync-oracle"; projectName = "orion-biosync-oracle" },
    @{name = "reality-anchor"; path = "reality-anchor"; projectName = "orion-reality-anchor" },
    @{name = "swarm-intelligence"; path = "swarm-intelligence"; projectName = "orion-swarm-intelligence" },
    @{name = "neurosync-guardian"; path = "neurosync-guardian"; projectName = "orion-neurosync-guardian" },
    @{name = "danger-maps"; path = "danger-maps"; projectName = "orion-danger-maps" },
    @{name = "silent-witness"; path = "silent-witness"; projectName = "orion-silent-witness" },
    @{name = "sonicguard"; path = "sonicguard"; projectName = "orion-sonicguard" },
    @{name = "emotionguard"; path = "emotionguard"; projectName = "orion-emotionguard" },
    @{name = "quantum-mesh"; path = "quantum-mesh"; projectName = "orion-quantum-mesh" }
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING ALL ORION SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$urls = @("ORION PLATFORM - ALL DEPLOYED SERVICES", "=" * 50, "")
$counter = 1

foreach ($service in $services) {
    Write-Host "[$counter/12] Deploying $($service.name)..." -ForegroundColor Yellow
    
    # Create vercel.json with project name
    $vercelConfig = @{name = $service.projectName; version = 2 } | ConvertTo-Json
    Set-Content -Path "$($service.path)/vercel.json" -Value $vercelConfig
    
    # Deploy
    Push-Location $service.path
    Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
    $output = vercel --prod --yes 2>&1 | Out-String
    
    # Extract URL
    if ($output -match 'https://[^\s]+\.vercel\.app') {
        $url = $matches[0]
        $urls += "$($service.projectName): $url"
        Write-Host "  ✅ $url" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ Failed" -ForegroundColor Red
    }
    
    Pop-Location
    $counter++
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALL SERVICES DEPLOYED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$urls | Out-File -FilePath "ALL_DEPLOYED_URLS.txt"
Write-Host ""
Write-Host "All URLs saved to ALL_DEPLOYED_URLS.txt" -ForegroundColor Green
Write-Host ""
$urls | ForEach-Object { Write-Host $_ }
