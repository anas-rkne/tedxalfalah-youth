# يبدأ خادم Next.js معزولاً في QA_DATA_DIR مؤقت على منفذ حر، ويمنع الكيانات التجريبية
# من المساس بالمتجر الحقيقي (store/). الملاحظة: الاستبيان يُكتب في store/qa-surveys.json
# (مسار ثابت في الحقيقية)، لذلك ننشئ نسخة احتياطية من المجلد وتُستعاد بعد الاختبار.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$tempRoot = Join-Path $env:TEMP "opencode\qa-verify-ryun"
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
$dataDir = Join-Path $tempRoot "qa-data-rok"
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
$storeSnap = Join-Path $tempRoot "store-snapshot"
New-Item -ItemType Directory -Force -Path $storeSnap | Out-Null

Copy-Item "store\*" $storeSnap -Force -ErrorAction SilentlyContinue
Write-Host "store snapshot saved:"
Get-ChildItem $storeSnap | Select-Object Name, Length

$port = 3110
$env:QA_DATA_DIR = $dataDir
$env:PORT = "$port"
$env:ALLOWED_API_ORIGINS = "http://localhost:$port,http://localhost:3000,http://localhost:3100,http://localhost:3107"
$env:GOOGLE_APPLICATION_CREDENTIALS = ""
# إبقاء Turnstile مفعلاً = fail-open محلياً (لا توكن) — كما في البيئة الفعلية

$outLog = Join-Path $tempRoot "server.out.log"
$errLog = Join-Path $tempRoot "server.err.log"
$p = Start-Process -FilePath "node" -ArgumentList @("node_modules/next/dist/bin/next","dev","-p",$port) `
  -WorkingDirectory $root -RedirectStandardOutput $outLog -RedirectStandardError $errLog -WindowStyle Hidden -PassThru
Write-Host "server pid: $($p.Id) on port $port"

# انتظار الجاهزية
$base = "http://localhost:$port"
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-WebRequest -Uri "$base/" -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
    if ($r.StatusCode -lt 500) { Write-Host "server ready after $($i+1)s"; break }
  } catch { }
}
Write-Host "--- stdout tail ---"
Get-Content $outLog -Tail 15 -ErrorAction SilentlyContinue
Write-Host "--- stderr tail ---"
Get-Content $errLog -Tail 15 -ErrorAction SilentlyContinue
Write-Host "READY_BASE=$base"
Write-Host "PID=$($p.Id)"
Write-Host "STORE_SNAP=$storeSnap"
