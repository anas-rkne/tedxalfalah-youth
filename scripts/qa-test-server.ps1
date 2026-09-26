# QA live test server launcher.
#
# Boots `next dev` on an isolated port with QA_DATA_DIR pointed at a temp folder,
# so test runs never touch the repo's real store/ directory.
# Writes server.json (base/pid/dataDir) next to the logs for the runner scripts.
param(
  [int]$Port = 3110,
  [switch]$Fresh
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$tempRoot = Join-Path $env:TEMP "opencode\qa-live-suite"
$dataDir = Join-Path $tempRoot "data"
$outLog = Join-Path $tempRoot "server.out.log"
$errLog = Join-Path $tempRoot "server.err.log"

if ($Fresh -and (Test-Path $tempRoot)) { Remove-Item -Recurse -Force $tempRoot }
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

# Kill a stale server left behind by a previous run.
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like "*next*dev*$Port*" } |
  ForEach-Object { Write-Host "killing stale node pid $($_.ProcessId)"; Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$env:QA_DATA_DIR = $dataDir
$env:PORT = "$Port"
$env:ALLOWED_API_ORIGINS = "http://localhost:$Port,http://localhost:3000"
$env:GOOGLE_APPLICATION_CREDENTIALS = ""

# ⚠️ نُفرغ Upstash في خادم الاختبار (سلسلة فارغة، ولا تُستبدل بقيمة من
# `.env.local` لأن قيم process.env الموجودة مسبقاً تتقدّم على ملفات .env).
# السبب: حدّ 5 طلبات/10 دقائق لكل فورم **مشترك بين كل بيئات الاختبار على
# النطاق نفسه**، فكان تشغيل المجموعة مرتين متتاليتين يُنتج 429 ويفشل
# اختبارات تعتمد على عدد الأسئلة بعدد الأسئلة — إخفاق اصطناعي لا علاقة له بالشيفرة.
# فحص حدّ Upstash الحقيقي يجري في مسار منفصل.
$env:UPSTASH_REDIS_REST_URL = ""
$env:UPSTASH_REDIS_REST_TOKEN = ""
$p = Start-Process -FilePath "node" `
  -ArgumentList @("node_modules/next/dist/bin/next", "dev", "-p", $Port) `
  -WorkingDirectory $root -RedirectStandardOutput $outLog -RedirectStandardError $errLog `
  -WindowStyle Hidden -PassThru

$base = "http://localhost:$Port"
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-WebRequest -Uri "$base/robots.txt" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($r.StatusCode -lt 500) { $ready = $true; break }
  } catch {
    if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -lt 500) { $ready = $true; break }
  }
}

if (-not $ready) {
  Write-Host "SERVER FAILED TO START"
  Get-Content $outLog -Tail 40 -ErrorAction SilentlyContinue
  Get-Content $errLog -Tail 40 -ErrorAction SilentlyContinue
  exit 1
}

@{ base = $base; pid = $p.Id; dataDir = $dataDir } | ConvertTo-Json | Set-Content (Join-Path $tempRoot "server.json") -Encoding utf8
Write-Host "QA_TEST_SERVER_READY base=$base pid=$($p.Id) dataDir=$dataDir"
