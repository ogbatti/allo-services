#Requires -Version 5.1
<#
.SYNOPSIS
  Smoke-test a tenant pack against a running API (local or Fly).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\smoke-tenant.ps1 -TenantId tg
  powershell -ExecutionPolicy Bypass -File scripts\smoke-tenant.ps1 -TenantId bj -ApiBase http://localhost:3001/api/v1 -Phone +22990000001
#>
param(
  [Parameter(Mandatory = $true)][string]$TenantId,
  [string]$ApiBase = "https://allo-services-api.fly.dev/api/v1",
  [string]$Phone = "",
  [string]$Locale = "fr"
)

$ErrorActionPreference = "Stop"
$TenantId = $TenantId.ToLowerInvariant()
if (-not $Phone) {
  $Phone = if ($TenantId -eq "bj") { "+22990000099" } else { "+22890000099" }
}

function Get-Json($Method, $Url, $Body = $null, $Headers = $null) {
  $params = @{
    Method      = $Method
    Uri         = $Url
    ContentType = "application/json"
    UseBasicParsing = $true
  }
  if ($Body) { $params.Body = $Body }
  if ($Headers) { $params.Headers = $Headers }
  $res = Invoke-WebRequest @params
  return ($res.Content | ConvertFrom-Json)
}

Write-Host "==> Health $ApiBase/health"
$health = Get-Json GET "$ApiBase/health"
Write-Host ("  status={0}" -f $health.status)

Write-Host "==> Tenant $TenantId"
$tenants = Get-Json GET "$ApiBase/tenants"
$tenant = $tenants | Where-Object { $_.id -eq $TenantId }
if (-not $tenant) { throw "Tenant not found: $TenantId" }
Write-Host ("  {0} | USSD {1} | modules={2}" -f $tenant.name.fr, $tenant.ussdShortCode, ($tenant.modules -join ","))

Write-Host "==> Journeys"
$journeys = Get-Json GET "$ApiBase/journeys?tenantId=$TenantId"
Write-Host ("  count={0} | {1}" -f $journeys.Count, (($journeys | ForEach-Object { $_.id }) -join ", "))
if ($journeys.Count -lt 1) { throw "No journeys for tenant $TenantId" }

Write-Host "==> Connectors"
$conn = Get-Json GET "$ApiBase/connectors/$TenantId"
Write-Host ("  payment={0} | sms={1}" -f $conn.payment.id, $conn.sms.id)

Write-Host "==> USSD start"
$ussd = Get-Json POST "$ApiBase/channels/ussd" (@{
  tenantId = $TenantId
  phoneNumber = $Phone
  locale = $Locale
} | ConvertTo-Json)
Write-Host ("  session={0}" -f $ussd.sessionId)
Write-Host $ussd.message

Write-Host "==> USSD pick service 1"
$step = Get-Json POST "$ApiBase/channels/ussd" (@{
  tenantId = $TenantId
  phoneNumber = $Phone
  sessionId = $ussd.sessionId
  input = "1"
  locale = $Locale
} | ConvertTo-Json)
Write-Host $step.message

Write-Host "==> Stats"
$stats = Get-Json GET "$ApiBase/stats/demo?tenantId=$TenantId"
$row = $stats.tenants | Select-Object -First 1
Write-Host ("  cases={0} | sms={1}" -f $row.casesTotal, $row.smsTotal)

Write-Host ""
Write-Host "OK - tenant pack $TenantId looks healthy."
