#Requires -Version 5.1
<#
.SYNOPSIS
  Scaffold a new country tenant from templates (config only).

.NOTES
  Run from the monorepo root (APPS), not from apps/web.

.EXAMPLE
  cd "C:\Users\GBATTI\Projects\ALLO SERVICES\APPS"
  powershell -ExecutionPolicy Bypass -File scripts\scaffold-tenant.ps1 `
    -TenantId sn -CountryCode SN -NameFr "Sénégal" -NameEn "Senegal" `
    -UssdShortCode "*850#" -FeeAmount 400
#>
param(
  [Parameter(Mandatory = $true)][string]$TenantId,
  [Parameter(Mandatory = $true)][string]$CountryCode,
  [Parameter(Mandatory = $true)][string]$NameFr,
  [string]$NameEn = "",
  [string]$UssdShortCode = "*000#",
  [string]$SmsSenderId = "",
  [int]$FeeAmount = 500,
  [string]$InstructorEmail = "",
  [string]$InstructorName = "",
  [string]$Password = "Demo2026!"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$TenantId = $TenantId.ToLowerInvariant()
$CountryCode = $CountryCode.ToUpperInvariant()
if (-not $NameEn) { $NameEn = $NameFr }
if (-not $SmsSenderId) { $SmsSenderId = "ALLO-$CountryCode" }
if (-not $InstructorEmail) { $InstructorEmail = "instructeur@$TenantId.demo" }
if (-not $InstructorName) { $InstructorName = "Agent $NameFr" }

$voice = ($UssdShortCode -replace '[^\d]', '')
if (-not $voice) { $voice = "000" }

$tenantPath = Join-Path $Root "config\tenants\$TenantId.json"
$journeyPath = Join-Path $Root "config\journeys\civil-status-birth-certificate.$TenantId.json"
$instructorsPath = Join-Path $Root "config\instructors\demo.json"

if (Test-Path $tenantPath) { throw "Tenant already exists: $tenantPath" }
if (Test-Path $journeyPath) { throw "Journey already exists: $journeyPath" }

$tenantTpl = Get-Content (Join-Path $Root "config\tenants\_template.json") -Raw -Encoding UTF8
$tenantTpl = $tenantTpl.Replace('"id": "xx"', "`"id`": `"$TenantId`"")
$tenantTpl = $tenantTpl.Replace('"countryCode": "XX"', "`"countryCode`": `"$CountryCode`"")
$tenantTpl = $tenantTpl.Replace('"fr": "Nom du pays"', "`"fr`": `"$NameFr`"")
$tenantTpl = $tenantTpl.Replace('"en": "Country name"', "`"en`": `"$NameEn`"")
$tenantTpl = $tenantTpl.Replace('"ussdShortCode": "*000#"', "`"ussdShortCode`": `"$UssdShortCode`"")
$tenantTpl = $tenantTpl.Replace('"voiceShortNumber": "000"', "`"voiceShortNumber`": `"$voice`"")
$tenantTpl = $tenantTpl.Replace('"smsSenderId": "ALLO-XX"', "`"smsSenderId`": `"$SmsSenderId`"")
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($tenantPath, $tenantTpl, $utf8)

$journeyTpl = Get-Content (Join-Path $Root "config\journeys\_template-civil-status.json") -Raw -Encoding UTF8
$journeyTpl = $journeyTpl.Replace("civil-status-birth-certificate-xx", "civil-status-birth-certificate-$TenantId")
$journeyTpl = $journeyTpl.Replace('"tenantId": "xx"', "`"tenantId`": `"$TenantId`"")
$journeyTpl = $journeyTpl.Replace('"feeAmount": 500', "`"feeAmount`": $FeeAmount")
[System.IO.File]::WriteAllText($journeyPath, $journeyTpl, $utf8)

$instructors = @()
if (Test-Path $instructorsPath) {
  $rawInstr = [System.IO.File]::ReadAllText($instructorsPath).TrimStart([char]0xFEFF)
  $instructors = $rawInstr | ConvertFrom-Json
  if ($instructors -isnot [System.Array]) { $instructors = @($instructors) }
}
$instructors = @($instructors) + @(
  [pscustomobject]@{
    tenantId = $TenantId
    email    = $InstructorEmail.ToLowerInvariant()
    name     = $InstructorName
    password = $Password
    role     = "instructor"
  }
)
$instrJson = ($instructors | ConvertTo-Json -Depth 5)
[System.IO.File]::WriteAllText($instructorsPath, $instrJson + "`n", $utf8)

Write-Host "Created:"
Write-Host "  $tenantPath"
Write-Host "  $journeyPath"
Write-Host "  instructor $InstructorEmail / $Password (tenant $TenantId)"
Write-Host ""
Write-Host "Next: restart API, then:"
Write-Host "  powershell -File scripts\smoke-tenant.ps1 -TenantId $TenantId"
Write-Host "Docs: docs\country-pack.fr.md"
