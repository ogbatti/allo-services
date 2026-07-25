#Requires -Version 5.1
<#
.SYNOPSIS
  Redeploy only the Vercel web demo (API already on Fly).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\redeploy-web.ps1
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ApiBase = "https://allo-services-api.fly.dev/api/v1"
$env:NEXT_PUBLIC_API_BASE_URL = $ApiBase

Write-Host "API: $ApiBase"
Write-Host "Deploying apps/web to Vercel..."

Set-Location (Join-Path $Root "apps\web")
npx --yes vercel --prod --yes `
  --env "NEXT_PUBLIC_API_BASE_URL=$ApiBase" `
  --build-env "NEXT_PUBLIC_API_BASE_URL=$ApiBase"
