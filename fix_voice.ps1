$path = "frontend/src/utils/constants.ts"
$content = Get-Content $path -Raw

# Replace voice commands
$content = $content.Replace("'open guardian': 'http://localhost:5178'", "'open guardian': 'https://orion-guardian-ai.vercel.app'")
$content = $content.Replace("'launch guardian': 'http://localhost:5178'", "'launch guardian': 'https://orion-guardian-ai.vercel.app'")
$content = $content.Replace("'open biosync': 'http://localhost:5179'", "'open biosync': 'https://orion-biosync-oracle.vercel.app'")
$content = $content.Replace("'check vitals': 'http://localhost:5179'", "'check vitals': 'https://orion-biosync-oracle.vercel.app'")
$content = $content.Replace("'open reality anchor': 'http://localhost:5181'", "'open reality anchor': 'https://orion-reality-anchor.vercel.app'")
$content = $content.Replace("'help dementia': 'http://localhost:5181'", "'help dementia': 'https://orion-reality-anchor.vercel.app'")
$content = $content.Replace("'open visualky': 'http://localhost:5185'", "'open visualky': 'https://orion-visualky.vercel.app'")

Set-Content $path $content
Write-Host "Voice commands updated."
