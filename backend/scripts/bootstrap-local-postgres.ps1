param(
  [string]$Version = "18",
  [int]$Port = 5433,
  [string]$User = "postgres",
  [string]$Database = "detal",
  [string]$DataDir = ""
)

$ErrorActionPreference = "Stop"

if (-not $DataDir) {
  $DataDir = Join-Path (Split-Path -Parent $PSScriptRoot) ".postgres-data"
}

$resolvedDataDir = [System.IO.Path]::GetFullPath($DataDir)
$binDir = Join-Path "C:\Program Files\PostgreSQL" "$Version\bin"
$initdb = Join-Path $binDir "initdb.exe"
$pgCtl = Join-Path $binDir "pg_ctl.exe"
$pgIsReady = Join-Path $binDir "pg_isready.exe"
$psql = Join-Path $binDir "psql.exe"
$createdb = Join-Path $binDir "createdb.exe"
$pgVersionFile = Join-Path $resolvedDataDir "PG_VERSION"
$logFile = Join-Path $resolvedDataDir "postgres.log"

foreach ($toolPath in @($initdb, $pgCtl, $pgIsReady, $psql, $createdb)) {
  if (-not (Test-Path $toolPath)) {
    throw "Missing PostgreSQL tool: $toolPath"
  }
}

if (-not (Test-Path $resolvedDataDir)) {
  New-Item -ItemType Directory -Path $resolvedDataDir -Force | Out-Null
}

if (-not (Test-Path $pgVersionFile)) {
  Write-Host "Initializing local PostgreSQL cluster in $resolvedDataDir ..."
  & $initdb -D $resolvedDataDir -U $User -A trust -E UTF8

  if ($LASTEXITCODE -ne 0) {
    throw "initdb failed"
  }
}

& $pgCtl -D $resolvedDataDir status | Out-Null

if ($LASTEXITCODE -ne 0) {
  Write-Host "Starting local PostgreSQL on port $Port ..."
  & $pgCtl -D $resolvedDataDir -l $logFile -o "-p $Port" start

  if ($LASTEXITCODE -ne 0) {
    throw "pg_ctl start failed"
  }
}

$isReady = $false

for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
  & $pgIsReady -h 127.0.0.1 -p $Port -U $User | Out-Null

  if ($LASTEXITCODE -eq 0) {
    $isReady = $true
    break
  }

  Start-Sleep -Milliseconds 500
}

if (-not $isReady) {
  throw "Local PostgreSQL did not become ready. Check $logFile"
}

$dbExistsResult = & $psql -h 127.0.0.1 -p $Port -U $User -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$Database';"

if ($LASTEXITCODE -ne 0) {
  throw "Could not query database list"
}

$dbExists = "$dbExistsResult".Trim()

if ($dbExists -ne "1") {
  Write-Host "Creating database $Database ..."
  & $createdb -h 127.0.0.1 -p $Port -U $User $Database

  if ($LASTEXITCODE -ne 0) {
    throw "createdb failed"
  }
}

Write-Host "Local PostgreSQL is ready at postgresql://$User@localhost:$Port/$Database"
