# 本地每日同步（Windows 计划任务调用）
# 用法： powershell -NoProfile -ExecutionPolicy Bypass -File scripts\sync.ps1
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$logDir = Join-Path $root 'data\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir ("sync-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd'))

function Write-Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $msg
  Write-Host $line
  Add-Content -Path $log -Value $line -Encoding utf8
}

Write-Log "=== 开始每日同步 ==="

# 找 Node：优先用 DSH 自带运行时，其次系统 node
$node = $null
$rtBase = Join-Path $env:APPDATA 'DSH Desktop\runtime-commands\generations'
if (Test-Path $rtBase) {
  $cand = Get-ChildItem $rtBase -Directory -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    ForEach-Object { Join-Path $_.FullName 'private\node-bin\node.cmd' } |
    Where-Object { Test-Path $_ } |
    Select-Object -First 1
  if ($cand) { $node = $cand }
}
if (-not $node) {
  $sys = Get-Command node -ErrorAction SilentlyContinue
  if ($sys) { $node = $sys.Source }
}
if (-not $node) {
  Write-Log "未找到 Node.js，请先安装 Node 18+ 或确认 DSH 已安装"
  exit 1
}
Write-Log "Node: $node"

# 采集 + 构建 + 晨报
& $node (Join-Path $root 'src\daily.mjs') 2>&1 | ForEach-Object { Write-Log $_ }
if ($LASTEXITCODE -ne 0) { Write-Log "daily.mjs 失败（退出码 $LASTEXITCODE）" }

# 自检
& $node (Join-Path $root 'scripts\verify.mjs') 2>&1 | ForEach-Object { Write-Log $_ }

# 若本目录是 git 仓库，自动提交推送
if (Test-Path (Join-Path $root '.git')) {
  git -C $root add data dist 2>&1 | Out-Null
  $st = git -C $root status --porcelain data dist
  if ($st) {
    git -C $root -c user.name='ai-info-hub' -c user.email='bot@localhost' commit -m ("chore: 本地同步 " + (Get-Date -Format 'yyyy-MM-dd HH:mm')) 2>&1 | ForEach-Object { Write-Log $_ }
    git -C $root push 2>&1 | ForEach-Object { Write-Log $_ }
    Write-Log "已推送到 GitHub"
  } else {
    Write-Log "数据无变化，跳过推送"
  }
}

Write-Log "=== 同步结束 ==="
