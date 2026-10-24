param([ValidatePattern('^p\d{2}(/[A-Za-z0-9_-]+)*$')][string]$Page = 'p22/chat')
$ErrorActionPreference = 'Stop'
$plpUrl = 'http://127.0.0.1:8765'
$plpReady = $false
try {
    $plpHealth = Invoke-RestMethod "$plpUrl/api/health" -TimeoutSec 2
    $plpReady = $plpHealth.ok -and $plpHealth.mode -eq 'ai'
} catch {}
if (-not $plpReady) {
    $plpPython = (Get-Command python.exe -ErrorAction Stop).Source
    Start-Process -FilePath $plpPython -ArgumentList ('"' + (Join-Path $PSScriptRoot 'plp_server.py') + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    for ($plpAttempt = 0; $plpAttempt -lt 20; $plpAttempt++) {
        Start-Sleep -Milliseconds 300
        try {
            $plpHealth = Invoke-RestMethod "$plpUrl/api/health" -TimeoutSec 1
            if ($plpHealth.ok -and $plpHealth.mode -eq 'ai') { $plpReady = $true; break }
        } catch {}
    }
}
if (-not $plpReady) { throw 'Chua khoi dong duoc PLP AI. Kiem tra provider.json trong LOCALAPPDATA\NovaGroupPLP.' }
Start-Process -FilePath 'msedge.exe' -ArgumentList "$plpUrl/#$Page"
