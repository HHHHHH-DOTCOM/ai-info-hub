// 生成「每日定时同步」的 Windows 脚本（免管理员 + 需管理员两种方案）
// 运行： node scripts/make-scheduler.mjs
//
// 注意：PowerShell 脚本里含大量反引号与美元符号，这里用占位符避免与 JS 模板字符串冲突。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BOM = '\uFEFF';
const BT = String.fromCharCode(96);   // 反引号
const D = '$';                        // 美元符

/* ---------- 1. 免管理员：启动文件夹 + 每日轮询 ---------- */
// VBS 必须纯 ASCII（cscript 默认按 ANSI 读取），注释也用英文
const vbs = [
  "' AI Info Hub - daily background sync (no admin rights needed)",
  "' Put a shortcut to this file in your Startup folder.",
  "' It runs hidden on boot, then once every 24 hours.",
  'Set fso = CreateObject("Scripting.FileSystemObject")',
  'Set sh  = CreateObject("WScript.Shell")',
  'root   = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))',
  'script = root & "\\scripts\\sync.ps1"',
  'If Not fso.FileExists(script) Then WScript.Quit',
  'Do',
  '  sh.Run "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & script & """", 0, True',
  '  WScript.Sleep 86400000',
  'Loop',
  '',
].join('\r\n');
fs.writeFileSync(path.join(ROOT, 'scripts', 'daily-loop.vbs'), vbs, 'ascii');

/* ---------- 2. 安装脚本 ---------- */
const install = `${BOM}# AI 情报站 · 注册每日定时同步
# 用法：
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\\install-task.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\\install-task.ps1 -Time "07:30"
#   （管理员）powershell -NoProfile -ExecutionPolicy Bypass -File scripts\\install-task.ps1 -UseTaskScheduler
#
# 两种模式：
#   默认      免管理员，用「启动」文件夹 + daily-loop.vbs 常驻轮询
#   -UseTaskScheduler  注册 Windows 计划任务，时间精确，但需要管理员权限

param(
  [string]$Time = '07:30',
  [switch]$UseTaskScheduler,
  [string]$TaskName = 'AI情报站每日同步'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sync = Join-Path $PSScriptRoot 'sync.ps1'
$loop = Join-Path $PSScriptRoot 'daily-loop.vbs'

if (-not (Test-Path $sync)) { throw "找不到 $sync" }

if ($UseTaskScheduler) {
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $sync + '"') -WorkingDirectory $root
  $trigger = New-ScheduledTaskTrigger -Daily -At $Time
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew

  if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  }
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description '每天采集 AI/竞赛/就业/考研情报，更新本地站点与晨报' | Out-Null

  Write-Host ""
  Write-Host "OK 已注册计划任务：$TaskName（每天 $Time）"
  Write-Host "    立即运行： Start-ScheduledTask -TaskName '$TaskName'"
  Write-Host "    查看状态： Get-ScheduledTaskInfo -TaskName '$TaskName'"
  Write-Host "    删除任务： Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:${D}false"
  Write-Host ""
  exit 0
}

if (-not (Test-Path $loop)) { throw "找不到 $loop" }
$startup = [Environment]::GetFolderPath('Startup')
$lnk = Join-Path $startup 'AI情报站每日同步.lnk'

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($lnk)
$sc.TargetPath = 'wscript.exe'
$sc.Arguments = '"' + $loop + '"'
$sc.WorkingDirectory = $root
$sc.WindowStyle = 7
$sc.Description = 'AI 情报站：每天自动采集并更新站点'
$sc.Save()

Write-Host ""
Write-Host "OK 已加入开机启动（免管理员）"
Write-Host "    快捷方式：$lnk"
Write-Host "    开机后自动运行，之后每 24 小时一次；日志在 data\\logs\\"
Write-Host ""
Write-Host "    立即测试： powershell -NoProfile -ExecutionPolicy Bypass -File ""$sync"""
Write-Host "    取消自启： Remove-Item ""$lnk"""
Write-Host "    精确到分钟（需管理员）： powershell -NoProfile -ExecutionPolicy Bypass -File scripts\\install-task.ps1 -UseTaskScheduler -Time ""$Time"""
Write-Host ""
`;
fs.writeFileSync(path.join(ROOT, 'scripts', 'install-task.ps1'), install, 'utf8');

/* ---------- 3. sync.ps1 保证 BOM ---------- */
const sp = path.join(ROOT, 'scripts', 'sync.ps1');
if (fs.existsSync(sp)) {
  let s = fs.readFileSync(sp, 'utf8');
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  fs.writeFileSync(sp, BOM + s, 'utf8');
}

console.log('已生成 scripts/daily-loop.vbs 与 scripts/install-task.ps1（均带 BOM）');
