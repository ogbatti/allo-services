#Requires -Version 5.1
<#
.SYNOPSIS
  Re-set Fly DATABASE_URL correctly, then redeploy the API.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\fix-fly-db-secret.ps1
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$flyBin = Join-Path $env:USERPROFILE ".fly\bin"
if (Test-Path $flyBin) { $env:Path = "$flyBin;$env:Path" }

Write-Host "Paste the Neon connection string (must start with postgresql://)."
Write-Host "Use the pooled connection string from https://console.neon.tech"
$DatabaseUrl = Read-Host "DATABASE_URL"
$DatabaseUrl = $DatabaseUrl.Trim().Trim("'").Trim('"')

if ($DatabaseUrl -notmatch '^postgres(ql)?://') {
  throw "DATABASE_URL must start with postgresql:// or postgres://"
}

$App = "allo-services-api"
Write-Host "Setting secret on $App ..."
fly secrets set "DATABASE_URL=$DatabaseUrl" -a $App

Write-Host "Redeploying..."
fly deploy -a $App

Write-Host "Waiting for health..."
Start-Sleep -Seconds 8
try {
  Invoke-RestMethod "https://$App.fly.dev/api/v1/health" | ConvertTo-Json
} catch {
  Write-Host "Health not ready yet. Check: fly logs -a $App"
  Write-Host $_.Exception.Message
}
