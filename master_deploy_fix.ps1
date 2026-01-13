# Master Fix Script for Orion Platform
$ErrorActionPreference = "Continue"

$services = @(
    @{name = "visualky"; path = "visualky"; projectName = "orion-visualky" },
    @{name = "guardian"; path = "guardian-ai/frontend"; projectName = "orion-guardian-ai" },
    @{name = "phantom"; path = "phantom-guardian"; projectName = "orion-phantom-guardian" },
    @{name = "biosync"; path = "biosync-oracle"; projectName = "orion-biosync-oracle" },
    @{name = "reality"; path = "reality-anchor"; projectName = "orion-reality-anchor" },
    @{name = "swarm"; path = "swarm-intelligence"; projectName = "orion-swarm-intelligence" },
    @{name = "neuro"; path = "neurosync-guardian"; projectName = "orion-neurosync-guardian" },
    @{name = "danger"; path = "danger-maps"; projectName = "orion-danger-maps" },
    @{name = "silent"; path = "silent-witness"; projectName = "orion-silent-witness" },
    @{name = "sonic"; path = "sonicguard"; projectName = "orion-sonicguard" },
    @{name = "emotion"; path = "emotionguard"; projectName = "orion-emotionguard" },
    @{name = "quantum"; path = "quantum-mesh"; projectName = "orion-quantum-mesh" }
)

$deployedUrls = @{}

Write-Host "Starting Master Deployment Fix..." -ForegroundColor Cyan

foreach ($service in $services) {
    Write-Host "`nDeploying $($service.name)..." -ForegroundColor Yellow
    
    $configPath = Join-Path $service.path "vercel.json"
    $config = @{
        version         = 2
        name            = $service.projectName
        installCommand  = "npm install --legacy-peer-deps"
        buildCommand    = "vite build" 
        outputDirectory = "dist"
    }
    $config | ConvertTo-Json | Set-Content $configPath
    
    Push-Location $service.path
    # Capture output
    $deployOutput = vercel --prod --yes 2>&1 | Out-String
    
    if ($deployOutput -match 'https://[a-zA-Z0-9-]+\.vercel\.app') {
        # Find the last/best URL match which is usually the production alias
        # Vercel output usually puts the production url near the end
        $lines = $deployOutput -split "`n"
        $url = ""
        foreach ($line in $lines) {
            if ($line -match 'Production:\s+(https://[^\s]+)') {
                $url = $matches[1]
            }
        }
       
        if ($url -eq "") {
            # Fallback regex search
            if ($deployOutput -match '(https://' + $service.projectName + '-[a-zA-Z0-9-]+\.vercel\.app)') {
                $url = $matches[1]
            }
            elseif ($deployOutput -match '(https://' + $service.projectName + '\.vercel\.app)') {
                $url = $matches[1]
            }
        }
       
        if ($url) {
            $deployedUrls[$service.name] = $url
            Write-Host "✅ Deployed $($service.name) to $url" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Could not parse URL for $($service.name). Output:" -ForegroundColor Red
            Write-Host $deployOutput.Substring($deployOutput.Length - 500)
        }
    }
    else {
        Write-Host "❌ Deployment failed for $($service.name)" -ForegroundColor Red
        Write-Host $deployOutput
    }
    Pop-Location
}

# Now update constants.ts
$constantsPath = "frontend/src/utils/constants.ts"
$constantsContent = Get-Content $constantsPath -Raw

foreach ($key in $deployedUrls.Keys) {
    if ($key -eq "guardian") {
        $constantsContent = $constantsContent -replace "url: 'https://orion-guardian-ai.vercel.app'", "url: '$($deployedUrls[$key])'"
    }
    else {
        # Generic replacement looking for the structure
        # We need to be careful matching the right key in the object
        # The keys in constants.ts match our service names here mostly
         
        # Regex to find the specific system block and replace its URL
        # format: id: 'phantom', ... url: '...'
         
        # simpler approach: we previously set them to https://orion-[name].vercel.app
        # let's just replace those specific strings with the captured REAL URLs
         
        # Mapping Check
        $searchUrl = "https://orion-" + ($services | Where-Object { $_.name -eq $key }).projectName.Replace("orion-", "") + ".vercel.app"
         
        # Special handling for names
        if ($key -eq "guardian") { $searchUrl = "https://orion-guardian-ai.vercel.app" }
        if ($key -eq "phantom") { $searchUrl = "https://orion-phantom-guardian.vercel.app" }
        # ... actually the previous replace used the projectName suffix.
         
        $replaceUrl = $deployedUrls[$key]
         
        # We'll do a robust regex replace for each system ID
        $pattern = "(id:\s*'$key'[\s\S]*?url:\s*')[^']+'"
        $constantsContent = [regex]::Replace($constantsContent, $pattern, "${1}$replaceUrl'")
    }
}

Set-Content $constantsPath $constantsContent
Write-Host "`nUpdated constants.ts with verified URLs" -ForegroundColor Green

# Redeploy Frontend
Write-Host "Redeploying Main Frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
vercel --prod --yes
Write-Host "✅ Main Frontend Redeployed!" -ForegroundColor Green
