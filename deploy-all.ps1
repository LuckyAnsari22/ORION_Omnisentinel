# Orion Platform - Deploy All Services
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ORION PLATFORM - DEPLOYING ALL SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    "visualky",
    "guardian-ai/frontend",
    "phantom-guardian",
    "biosync-oracle",
    "reality-anchor",
    "swarm-intelligence",
    "neurosync-guardian",
    "danger-maps",
    "silent-witness",
    "sonicguard",
    "emotionguard",
    "quantum-mesh"
)

$urls = @()
$counter = 1
$total = $services.Count

foreach ($service in $services) {
    Write-Host "[$counter/$total] Deploying $service..." -ForegroundColor Yellow
    
    Push-Location $service
    $output = vercel --prod --yes 2>&1 | Out-String
    
    # Extract URL from output
    if ($output -match 'https://[^\s]+\.vercel\.app') {
        $url = $matches[0]
        $urls += "$service : $url"
        Write-Host "  ✅ Deployed: $url" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to deploy $service" -ForegroundColor Red
    }
    
    Pop-Location
    $counter++
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployed URLs:" -ForegroundColor Green
$urls | ForEach-Object { Write-Host "  $_" }

# Save to file
$urls | Out-File -FilePath "DEPLOYED_URLS.txt"
Write-Host ""
Write-Host "URLs saved to DEPLOYED_URLS.txt" -ForegroundColor Cyan
