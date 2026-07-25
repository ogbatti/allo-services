$ErrorActionPreference = "Continue"
$api = "https://allo-services-api.fly.dev/api/v1"
$web = "https://web-omega-bay-47.vercel.app"

Write-Host "==> DNS"
try {
  Resolve-DnsName "allo-services-api.fly.dev" -Type A | Select-Object -First 2 | Format-Table
} catch {
  Write-Host $_.Exception.Message
}

Write-Host "==> API health"
curl.exe -sS -m 25 "$api/health"
Write-Host ""

Write-Host "==> WEB page"
curl.exe -sS -m 25 "$web" -o "$env:TEMP\allo-web.html"
Write-Host ("WEB downloaded bytes={0}" -f (Get-Item "$env:TEMP\allo-web.html").Length)

$html = Get-Content "$env:TEMP\allo-web.html" -Raw
$chunkPaths = [regex]::Matches($html, '/_next/static/chunks/[^"]+\.js') | ForEach-Object { $_.Value } | Select-Object -Unique
Write-Host ("JS chunks={0}" -f $chunkPaths.Count)

foreach ($p in $chunkPaths) {
  curl.exe -sS -m 25 ($web + $p) -o "$env:TEMP\allo-chunk.js"
  $c = Get-Content "$env:TEMP\allo-chunk.js" -Raw -ErrorAction SilentlyContinue
  if (-not $c) { continue }
  if ($c.Contains("fly.dev") -or $c.Contains("localhost:3001")) {
    Write-Host "MATCH $p"
    $m1 = [regex]::Match($c, "https://[A-Za-z0-9._\-]+fly\.dev[A-Za-z0-9._\-/?=]*")
    if ($m1.Success) { Write-Host ("  API URL: " + $m1.Value) }
    $m2 = [regex]::Match($c, "http://localhost:3001[A-Za-z0-9._\-/?=]*")
    if ($m2.Success) { Write-Host ("  LOCAL URL: " + $m2.Value) }
  }
}

Write-Host "==> USSD start"
$body = '{"tenantId":"tg","phoneNumber":"+22890000001","locale":"fr"}'
curl.exe -sS -m 40 -X POST "$api/channels/ussd" -H "Content-Type: application/json" -d $body
Write-Host ""
