#Requires -Version 5.1
<#
.SYNOPSIS
  Interactive demo deploy: Neon DATABASE_URL + Fly.io API + Vercel web.

.NOTES
  Run in a normal PowerShell terminal (not headless):
    powershell -ExecutionPolicy Bypass -File scripts\deploy-demo.ps1
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

# Ensure Fly CLI is on PATH for this session
$flyBin = Join-Path $env:USERPROFILE ".fly\bin"
if (Test-Path $flyBin) {
  $env:Path = "$flyBin;$env:Path"
}

$fly = Join-Path $env:USERPROFILE ".fly\bin\flyctl.exe"
if (-not (Test-Path $fly)) {
  Write-Host "Installing flyctl..."
  iwr https://fly.io/install.ps1 -useb | iex
  $fly = Join-Path $env:USERPROFILE ".fly\bin\flyctl.exe"
}

Write-Host "==> Fly auth"
& $fly auth login

$who = & $fly auth whoami
Write-Host "Logged in as $who"

Write-Host ""
Write-Host "Create a free Neon project: https://console.neon.tech"
Write-Host "Copy the connection string (pooled, SSL)."
$DatabaseUrl = Read-Host "DATABASE_URL"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  throw "DATABASE_URL is required"
}

$App = "allo-services-api"
$existing = & $fly apps list --json 2>$null | ConvertFrom-Json
if (-not ($existing | Where-Object { $_.Name -eq $App })) {
  Write-Host "==> Creating Fly app $App"
  & $fly apps create $App --org personal
}

Write-Host "==> Setting secrets"
& $fly secrets set "DATABASE_URL=$DatabaseUrl" -a $App

Write-Host "==> Deploying API"
& $fly deploy -a $App

$ApiBase = "https://$App.fly.dev/api/v1"
Write-Host "API health: $ApiBase/health"
try {
  Invoke-RestMethod "$ApiBase/health" | ConvertTo-Json
} catch {
  Write-Host "Health check not ready yet; retry in a minute."
}

Write-Host ""
Write-Host "==> Vercel web"
Write-Host "Linking apps/web and deploying with API URL:"
Write-Host "  NEXT_PUBLIC_API_BASE_URL=$ApiBase"
$env:NEXT_PUBLIC_API_BASE_URL = $ApiBase
Push-Location (Join-Path $Root "apps\web")
try {
  npx --yes vercel pull --yes --environment=production 2>$null
  npx --yes vercel env add NEXT_PUBLIC_API_BASE_URL production 2>$null
  # Non-interactive prod deploy from apps/web (standalone Next.js app)
  npx --yes vercel --prod --yes `
    --env "NEXT_PUBLIC_API_BASE_URL=$ApiBase" `
    --build-env "NEXT_PUBLIC_API_BASE_URL=$ApiBase"
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Demo deploy finished."
Write-Host "API:  $ApiBase"
Write-Host "Web:  (URL printed by Vercel above)"
