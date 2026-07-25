#Requires -Version 5.1
<#
.SYNOPSIS
  Re-set Fly DATABASE_URL correctly on Windows PowerShell, then redeploy.

.NOTES
  PowerShell treats bare & as an operator. Neon URLs often contain &channel_binding=...
  Always keep the URL in a PowerShell variable (single-quoted), then pass:
    fly secrets set "DATABASE_URL=$url" -a allo-services-api
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$flyBin = Join-Path $env:USERPROFILE ".fly\bin"
if (Test-Path $flyBin) { $env:Path = "$flyBin;$env:Path" }

Write-Host @"
Paste the Neon connection string.
- Neon dashboard > Connection details > URI (pooled recommended)
- Must start with postgresql://
- Paste WITHOUT wrapping quotes

"@

$raw = Read-Host "DATABASE_URL"
$url = $raw.Trim().Trim("'").Trim('"')
if ($url -match "postgres(?:ql)?://\S+") {
  $url = $Matches[0].TrimEnd("'").TrimEnd('"')
}
if ($url -notmatch '^postgres(ql)?://') {
  throw "DATABASE_URL must start with postgresql:// or postgres://"
}

Write-Host ("OK: length={0}, starts with {1}" -f $url.Length, $url.Substring(0, 13))

$App = "allo-services-api"
Write-Host "Setting secret..."
# Double quotes around the whole KEY=VALUE keep & inside the URL safe in PowerShell
fly secrets set "DATABASE_URL=$url" -a $App

Write-Host "Redeploying..."
fly deploy -a $App

Write-Host "Health (curl.exe):"
Start-Sleep -Seconds 10
curl.exe -sS -m 30 "https://$App.fly.dev/api/v1/health"
Write-Host ""
