# يبدأ خادماً معزولاً للتحقق من QA على منفذ 3107 مع بيانات QA مؤقتة، ويسجّل الناتج.
$ErrorActionPreference = "Stop"
$port = 3120
$tmpBase = Join-Path $env:TEMP "opencode"
New-Item -ItemType Directory -Force -Path $tmpBase | Out-Null
$qaData = Join-Path $tmpBase "qa-verify-data"
New-Item -ItemType Directory -Force -Path $qaData | Out-Null
$outLog = Join-Path $tmpBase "qa-verify-server.out.log"
$errLog = Join-Path $tmpBase "qa-verify-server.err.log"

# داده QA معزولة تماماً عن store/ الحقيقي
$env:QA_DATA_DIR = $qaData
# نُبقي المنشأ الأساسي للسماح بالطلب بدون Origin (سكربت/اختبار) — لكن نضيف منفذ الاختبار للواجهة
$env:QA_SENDGRID_KEY = ""
$env:PORT = "$port"

$p = Start-Process -FilePath "node" -ArgumentList @("node_modules/next/dist/bin/next", "dev", "-p", $port) `
  -WorkingDirectory $PWD -RedirectStandardOutput $outLog -RedirectStandardError $errLog `
  -WindowStyle Hidden -PassThru
Write-Host "server pid=$($p.Id)"
# انتظار الجاهزية
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$port/" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($r.StatusCode -eq 200) { Write-Host "READY after $($i+1)s"; break }
  } catch {}
}
Write-Host "--- stdout tail ---"
Get-Content $outLog -Tail 10 -ErrorAction SilentlyContinue
Write-Host "--- stderr tail ---"
Get-Content $errLog -Tail 15 -ErrorAction SilentlyContinue
