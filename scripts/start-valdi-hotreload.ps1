[CmdletBinding()]
param(
  [string]$DeviceId = '',
  [string]$Distribution = 'Ubuntu-24.04',
  [switch]$RefreshApk,
  [switch]$ResetHotReloadCache
)

# ADB and WSL legitimately write status messages to stderr (for example when
# the ADB server starts). Explicit checks below still stop on real failures.
$ErrorActionPreference = 'Continue'
$relayScript = Join-Path $PSScriptRoot 'dev-tcp-relay.py'
$wslProjectRoot = '/mnt/s/haycee-mobile-app-valdi'
$wslRelayScript = "$wslProjectRoot/scripts/dev-tcp-relay.py"
$wslHotreloadScript = "$wslProjectRoot/scripts/valdi-hotreload.sh"
$wslCleanupScript = "$wslProjectRoot/scripts/stop-valdi-hotreload.sh"
$wslClearCacheScript = "$wslProjectRoot/scripts/clear-valdi-hotreload-cache.sh"
$wslStopMarker = '/tmp/haycee-mobile-app-valdi-hotreload.stop'
$adbCommand = Get-Command 'adb.exe' -ErrorAction SilentlyContinue
if ($adbCommand) {
  $adb = $adbCommand.Source
} else {
  $adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
  if (-not (Test-Path -LiteralPath $adb)) {
    throw "adb.exe not found in PATH or $adb"
  }
}
$python = (Get-Command 'python.exe' -ErrorAction Stop).Source

if (-not (Test-Path -LiteralPath $relayScript)) {
  throw "Relay script not found: $relayScript"
}

function Stop-StaleWindowsRelayProcesses {
  $helperNames = @('python.exe', 'wsl.exe')
  foreach ($helperName in $helperNames) {
    $helpers = @(Get-CimInstance Win32_Process -Filter "Name = '$helperName'" -ErrorAction SilentlyContinue |
      Where-Object {
        $_.CommandLine -and (
          $_.CommandLine -like "*$relayScript*" -or
          $_.CommandLine -like "*$wslRelayScript*" -or
          $_.CommandLine -like "*$wslHotreloadScript*"
        )
      })

    foreach ($helper in $helpers) {
      Stop-Process -Id $helper.ProcessId -Force -ErrorAction SilentlyContinue
    }
  }
}

function Stop-StaleValdiWorkers {
  Write-Host 'Clearing old Haycee Valdi hot reload and Bazel workers...'
  Stop-StaleWindowsRelayProcesses

  try {
    & wsl --distribution $Distribution -- bash $wslCleanupScript $wslProjectRoot 2>$null | Out-Null
    # Valdi's official troubleshooting guide recommends clearing Watchman
    # watches before restarting when recompilation no longer reaches the app.
    & wsl --distribution $Distribution -- watchman watch-del-all 2>$null | Out-Null
  } catch {
    Write-Warning 'A previous Valdi worker could not be stopped cleanly; continuing the cleanup.'
  }
}

function Clear-ValdiHotReloadCache {
  Write-Host 'Resetting the Valdi hot reload TypeScript cache...'
  & wsl --distribution $Distribution -- bash $wslClearCacheScript
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not reset the Valdi hot reload TypeScript cache.'
  }
}

function Remove-ValdiAdbForwards {
  $forwardLines = @(& $adb forward --list 2>$null)
  foreach ($line in $forwardLines) {
    $parts = $line -split '\s+'
    if ($parts.Count -lt 3 -or $parts[0] -ne $DeviceId) {
      continue
    }

    $isValdiForward = $parts[2] -match '^tcp:(13592|13594|60827)$' -or $parts[1] -eq 'tcp:13595'
    if (-not $isValdiForward) {
      continue
    }

    & $adb -s $DeviceId forward --remove $parts[1] 2>$null | Out-Null
  }
}

$gateway = (wsl --distribution $Distribution -- bash -lc "ip route | grep '^default' | cut -d' ' -f3").Trim()
if ([string]::IsNullOrWhiteSpace($gateway)) {
  throw 'Could not determine the WSL host gateway.'
}

Write-Host "WSL distribution: $Distribution"
Write-Host "WSL host gateway: $gateway"
Write-Host 'Leave this window open. Press Ctrl+C only when you want to stop hot reload.'

$readyDevices = @(& $adb devices -l 2>$null | Where-Object { $_ -match '^\S+\s+device\b' } | ForEach-Object { ($_ -split '\s+')[0] })
if ([string]::IsNullOrWhiteSpace($DeviceId)) {
  if ($readyDevices.Count -ge 1) {
    $DeviceId = $readyDevices[0]
    if ($readyDevices.Count -gt 1) {
      Write-Host "Multiple Android devices detected; using the first ready device '$DeviceId'."
    }
  } else {
    throw 'No Android device is available. Reconnect USB, enable USB debugging, accept the RSA prompt, then run adb devices.'
  }
} elseif ($readyDevices -notcontains $DeviceId) {
  if ($readyDevices.Count -eq 1) {
    Write-Host "Requested device '$DeviceId' is unavailable; using the only ready device '$($readyDevices[0])'."
    $DeviceId = $readyDevices[0]
  } else {
    throw "ADB device '$DeviceId' is not ready. Run adb devices and reconnect USB debugging."
  }
}

Write-Host "ADB device: $DeviceId"
Stop-StaleValdiWorkers
if ($ResetHotReloadCache.IsPresent) {
  Clear-ValdiHotReloadCache
}
Remove-ValdiAdbForwards

$packageName = 'com.snap.valdi.haycee_mobile_app_valdi_app'
$apkPath = Join-Path $env:TEMP 'haycee_mobile_debug.apk'
$wslApkPath = "/mnt/c/Users/$env:USERNAME/AppData/Local/Temp/haycee_mobile_debug.apk"
$projectRoot = Split-Path -Parent $PSScriptRoot
$installedPackage = (& $adb -s $DeviceId shell pm path $packageName 2>$null | Out-String).Trim()
$apkNeedsRefresh = $RefreshApk.IsPresent

if (-not (Test-Path -LiteralPath $apkPath)) {
  $apkNeedsRefresh = $true
} elseif (-not $apkNeedsRefresh) {
  # TypeScript/TSX is handled by Valdi hot reload and must not invalidate the
  # APK. Compare only inputs that are packaged into or configure the native
  # application: resources, Android code and Bazel metadata.
  $cachedApkTime = (Get-Item -LiteralPath $apkPath).LastWriteTimeUtc
  $appModuleRoot = Join-Path $projectRoot 'modules\haycee_mobile_app_valdi'
  $nativeApkInputs = @(
    Get-ChildItem -LiteralPath (Join-Path $appModuleRoot 'res') -File -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem -LiteralPath (Join-Path $appModuleRoot 'android') -File -Recurse -Force -ErrorAction SilentlyContinue
    Get-Item -LiteralPath (Join-Path $appModuleRoot 'BUILD.bazel') -ErrorAction SilentlyContinue
    Get-Item -LiteralPath (Join-Path $projectRoot 'BUILD.bazel') -ErrorAction SilentlyContinue
    Get-Item -LiteralPath (Join-Path $projectRoot 'WORKSPACE') -ErrorAction SilentlyContinue
    Get-Item -LiteralPath (Join-Path $projectRoot '.bazelrc') -ErrorAction SilentlyContinue
    Get-Item -LiteralPath (Join-Path $projectRoot '.bazelversion') -ErrorAction SilentlyContinue
    Get-Item -LiteralPath (Join-Path $projectRoot 'MODULE.bazel') -ErrorAction SilentlyContinue
  ) | Where-Object { $_ -and $_.LastWriteTimeUtc -gt $cachedApkTime }
  if ($nativeApkInputs.Count -gt 0) {
    Write-Host "Native APK inputs changed after the cached APK ($($nativeApkInputs.Count) file(s)); refreshing the native APK."
    $apkNeedsRefresh = $true
  }
}

if ([string]::IsNullOrWhiteSpace($installedPackage) -or $apkNeedsRefresh) {
  if ([string]::IsNullOrWhiteSpace($installedPackage)) {
    Write-Host "Application not installed on $DeviceId. Preparing the debug APK..."
  } else {
    Write-Host "Refreshing the debug APK on $DeviceId..."
  }

  if ($apkNeedsRefresh) {
    # The cached APK can retain the ReadOnly attribute after being copied from
    # WSL or downloaded. Clear it before the WSL build copies the fresh APK.
    if (Test-Path -LiteralPath $apkPath) {
      $cachedApk = Get-Item -LiteralPath $apkPath -Force
      if ($cachedApk.IsReadOnly) {
        $cachedApk.IsReadOnly = $false
      }
    }

    Write-Host 'Building the arm64 debug APK; this can take several minutes.'
    $buildBash = @'
export PATH=/tmp:/home/darkk/.valdi/bin:/usr/local/bin:/usr/bin:/bin
export ANDROID_HOME=/home/darkk/Android/Sdk
export ANDROID_SDK_ROOT=/home/darkk/Android/Sdk
export ANDROID_NDK_HOME=/home/darkk/Android/Sdk/ndk/25.2.9519653
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
cd /mnt/s/haycee-mobile-app-valdi
bazelisk build //:haycee_mobile_app_valdi_app_android \
  --snap_flavor=platform_development \
  --copt=-DANDROID_WITH_JNI \
  --repo_env=VALDI_PLATFORM_DEPENDENCIES=android \
  --define=client_repo_arm64=true \
  --define=client_repo_arm32=false \
  --define=client_repo_x86_64=false \
  --fat_apk_cpu=arm64-v8a \
  --android_cpu=arm64-v8a
cp bazel-bin/haycee_mobile_app_valdi_app_android.apk __WINDOWS_APK_PATH__
'@
    $buildBash = $buildBash.Replace('__WINDOWS_APK_PATH__', $wslApkPath)
    & wsl --distribution $Distribution -- bash -lc $buildBash
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $apkPath)) {
      throw 'The automatic Android debug APK build failed.'
    }
  }

  & $adb -s $DeviceId install -r -d $apkPath
  if ($LASTEXITCODE -ne 0) {
    throw "APK installation failed on device '$DeviceId'."
  }
  Write-Host 'Debug APK installed successfully.'
}

$relayProcesses = @{}
$relayMisses = @{}
$sourceState = @{}
$sourceRoots = @(
  (Join-Path $projectRoot 'modules\haycee_mobile_app_valdi\src'),
  (Join-Path $projectRoot 'modules\haycee_mobile_app_valdi\res')
)
$sharedSourceRoot = Join-Path $projectRoot 'src'
$sourceExtensions = @('.ts', '.tsx', '.js', '.mjs', '.ttml', '.css', '.json', '.yaml', '.yml', '.xml', '.png', '.jpg', '.jpeg', '.webp', '.svg')
if (Test-Path -LiteralPath $sharedSourceRoot) {
  $sourceRoots += $sharedSourceRoot
}
$hotreloadProcess = $null

function Get-HotReloadSourceFiles {
  foreach ($root in $script:sourceRoots) {
    if (-not (Test-Path -LiteralPath $root)) {
      continue
    }

    Get-ChildItem -LiteralPath $root -File -Recurse -Force -ErrorAction SilentlyContinue |
      Where-Object {
        $script:sourceExtensions -contains $_.Extension.ToLowerInvariant() -and
        $_.FullName -notmatch '[\\/]node_modules[\\/]' -and
        $_.FullName -notmatch '[\\/]__pycache__[\\/]'
      }
  }
}

function Get-SourceSignature([System.IO.FileInfo]$file) {
  # A WSL touch used to wake Watchman can alter the mounted file timestamp
  # without changing its content. Hash the small source roots instead of
  # feeding that synthetic timestamp back into the Windows poller.
  $contentHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256 -ErrorAction Stop).Hash
  return "$($file.Length)|$contentHash"
}

function Convert-WindowsPathToWslPath([string]$path) {
  $fullPath = [System.IO.Path]::GetFullPath($path)
  if ($fullPath -notmatch '^(?<drive>[A-Za-z]):\\(?<rest>.*)$') {
    throw "Cannot convert Windows path to WSL path: $fullPath"
  }

  return "/mnt/$($matches.drive.ToLowerInvariant())/$($matches.rest -replace '\\', '/')"
}

function Initialize-WindowsSourceState {
  $script:sourceState.Clear()
  foreach ($file in @(Get-HotReloadSourceFiles)) {
    $script:sourceState[$file.FullName] = Get-SourceSignature $file
  }
}

function Sync-WindowsSourceChanges {
  $currentPaths = @{}
  $watchmanRefreshNeeded = $false

  foreach ($file in @(Get-HotReloadSourceFiles)) {
    $path = $file.FullName
    $currentPaths[$path] = $true
    $signature = Get-SourceSignature $file

    if (-not $script:sourceState.ContainsKey($path)) {
      $script:sourceState[$path] = $signature
      continue
    }

    if ($script:sourceState[$path] -eq $signature) {
      continue
    }

    $script:sourceState[$path] = $signature
    $wslPath = Convert-WindowsPathToWslPath $path
    $escapedWslPath = $wslPath.Replace("'", "'\\''")
    & wsl --distribution $script:Distribution -- bash -lc "touch --no-dereference -- '$escapedWslPath'" 2>$null | Out-Null

    if ($LASTEXITCODE -eq 0) {
      $watchmanRefreshNeeded = $true
      $refreshedFile = Get-Item -LiteralPath $path -ErrorAction SilentlyContinue
      if ($refreshedFile) {
        $script:sourceState[$path] = Get-SourceSignature $refreshedFile
      }
      $relativePath = $path.Substring($script:projectRoot.Length).TrimStart('\', '/')
      Write-Host "Mirrored source change for Watchman: $relativePath"
    } else {
      Write-Warning "Could not notify Watchman about source change: $path"
    }
  }

  if ($watchmanRefreshNeeded) {
    # Watchman on WSL can miss edits made by a Windows editor on a mounted
    # /mnt drive. A targeted recrawl makes the changed mtime visible to the
    # existing Valdi subscription without restarting the compiler or app.
    & wsl --distribution $script:Distribution -- watchman --no-pretty debug-recrawl $script:wslProjectRoot 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Warning 'Could not refresh Watchman after a Windows source change.'
    }
  }

  foreach ($path in @($script:sourceState.Keys)) {
    if (-not $currentPaths.ContainsKey($path)) {
      $script:sourceState.Remove($path)
    }
  }
}

function Stop-RelayEntry($entry) {
  foreach ($process in @($entry.Windows, $entry.Wsl)) {
    if ($process -and -not $process.HasExited) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  }
}

function Start-RelayPair([int]$localPort, [int]$devicePort) {
  $fixedPort = 43000 + ($localPort % 1000)
  $key = "$localPort/$devicePort"
  if ($script:relayProcesses.ContainsKey($key)) {
    $existing = $script:relayProcesses[$key]
    if (-not $existing.Windows.HasExited -and -not $existing.Wsl.HasExited) {
      $script:relayMisses.Remove($key)
      return
    }
    $script:relayProcesses.Remove($key)
  }

  while (Get-NetTCPConnection -State Listen -LocalPort $fixedPort -ErrorAction SilentlyContinue) {
    $fixedPort++
  }

  $windowsRelay = Start-Process -FilePath $script:python -WindowStyle Hidden -PassThru -ArgumentList @(
    $script:relayScript, '0.0.0.0', $fixedPort, '127.0.0.1', $localPort
  )

  $wslRelay = Start-Process -FilePath 'wsl.exe' -WindowStyle Hidden -PassThru -ArgumentList @(
    '--distribution', $script:Distribution, '--', 'python3', $script:wslRelayScript,
    '127.0.0.1', $localPort, $script:gateway, $fixedPort
  )

  $script:relayProcesses[$key] = @{
    Windows = $windowsRelay
    Wsl = $wslRelay
    FixedPort = $fixedPort
  }
  $script:relayMisses.Remove($key)
  Write-Host "Relay active: WSL localhost:$localPort -> Windows localhost:$fixedPort -> Android:$devicePort"
}

function Stop-RelayPairs {
  foreach ($entry in $script:relayProcesses.Values) {
    Stop-RelayEntry $entry
  }
  $script:relayProcesses.Clear()
  $script:relayMisses.Clear()
}

function Clear-HotreloadConflicts {
  Stop-RelayPairs
  Remove-ValdiAdbForwards
  Stop-StaleValdiWorkers
}

function Start-ValdiApplication {
  & $adb -s $DeviceId shell am force-stop $packageName 2>$null | Out-Null
  & $adb -s $DeviceId shell monkey -p $packageName 1 2>$null | Out-Null
  Write-Host 'Valdi application launched after the hot reload daemon became ready.'
}

function Sync-ValdiRelays {
  $forwardLines = @(& $adb forward --list 2>$null)
  $activeKeys = @{}
  foreach ($line in $forwardLines) {
    $parts = $line -split '\s+'
    if ($parts.Count -lt 3 -or $parts[0] -ne $DeviceId) {
      continue
    }

    $devicePortText = $parts[2]
    if ($devicePortText -notmatch '^tcp:(13592|13594)$') {
      continue
    }

    $localPort = [int]($parts[1] -replace '^tcp:', '')
    $devicePort = [int]($devicePortText -replace '^tcp:', '')
    $activeKeys["$localPort/$devicePort"] = $true
    Start-RelayPair $localPort $devicePort
  }

  # Valdi recreates dynamic ADB forwards when a client reconnects. Do not leave
  # relay pairs for forwards that disappeared; stale pairs can keep the app on an
  # old tunnel even though the status indicator is still green.
  foreach ($key in @($script:relayProcesses.Keys)) {
    if ($activeKeys.ContainsKey($key)) {
      $script:relayMisses.Remove($key)
      continue
    }

    $missCount = 0
    if ($script:relayMisses.ContainsKey($key)) {
      $missCount = [int]$script:relayMisses[$key]
    }
    $missCount++
    $script:relayMisses[$key] = $missCount
    if ($missCount -lt 3) {
      continue
    }

    Stop-RelayEntry $script:relayProcesses[$key]
    $script:relayProcesses.Remove($key)
    $script:relayMisses.Remove($key)
    Write-Host "Removed stale Valdi relay: $key"
  }
}

function Wait-ForValdiRelays([int]$timeoutSeconds = 30) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  do {
    Sync-ValdiRelays

    $hasApplicationRelay = @($script:relayProcesses.Keys | Where-Object { $_ -match '/13592$' }).Count -gt 0
    if ($hasApplicationRelay) {
      Write-Host 'ADB relay ready. Launching the Valdi application.'
      return $true
    }

    Start-Sleep -Seconds 1
  } while ((Get-Date) -lt $deadline)

  Write-Warning 'The Valdi application relay was not visible within 30 seconds; launching anyway so the daemon can finish device discovery.'
  return $false
}

function Test-ValdiDaemonReady {
  $compilerProcess = @(& wsl --distribution $Distribution -- bash -lc "ps -eo args= | grep -E 'valdi_compiler.*haycee_mobile_app_valdi.*--monitor' | grep -v grep" 2>$null)
  return -not [string]::IsNullOrWhiteSpace(($compilerProcess -join "`n"))
}

function Test-UserStopRequested {
  & wsl --distribution $Distribution -- bash -lc "if [ -f '$wslStopMarker' ]; then rm -f '$wslStopMarker'; exit 0; else exit 1; fi" 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

$hotReloadMutex = New-Object System.Threading.Mutex($false, 'Global\HayceeMobileValdiHotReload')
$ownsHotReloadMutex = $false
try {
  $ownsHotReloadMutex = $hotReloadMutex.WaitOne(0)
} catch {
  $hotReloadMutex.Dispose()
  throw 'Could not acquire the Valdi hot reload instance lock.'
}

if (-not $ownsHotReloadMutex) {
  $hotReloadMutex.Dispose()
  throw 'Another Valdi hot reload script is already running. Close that window before starting a new one.'
}

try {
  Initialize-WindowsSourceState

  while ($true) {
    Clear-HotreloadConflicts
    Write-Host 'Starting Valdi hot reload daemon...'

    $hotreloadProcess = Start-Process -FilePath 'wsl.exe' -NoNewWindow -PassThru -ArgumentList @(
      '--distribution', $Distribution, '--', 'bash', $wslHotreloadScript, $env:USERNAME
    )

    $daemonReady = $false
    while (-not $hotreloadProcess.HasExited -and -not $daemonReady) {
      $daemonReady = Test-ValdiDaemonReady
      if (-not $daemonReady) {
        Start-Sleep -Seconds 2
        $hotreloadProcess.Refresh()
      }
    }

    if ($daemonReady -and -not $hotreloadProcess.HasExited) {
      # The daemon can be ready before its ADB forwards have been mirrored
      # through WSL. Establish the application relay before launching Android;
      # otherwise the first daemon session can be lost during app startup.
      Wait-ForValdiRelays | Out-Null
      Start-ValdiApplication
    }

    while (-not $hotreloadProcess.HasExited) {
      Sync-ValdiRelays
      Sync-WindowsSourceChanges

      Start-Sleep -Seconds 1
      $hotreloadProcess.Refresh()
    }

    $exitCode = $hotreloadProcess.ExitCode
    if (Test-UserStopRequested) {
      Write-Host 'Ctrl+C detected. Stopping Valdi hot reload.'
      break
    }

    Write-Warning "Valdi hot reload daemon stopped (exit code $exitCode). Retrying in 5 seconds..."
    Clear-HotreloadConflicts
    Start-Sleep -Seconds 5
  }
}
finally {
  Clear-HotreloadConflicts
  if ($hotreloadProcess -and -not $hotreloadProcess.HasExited) {
    Stop-Process -Id $hotreloadProcess.Id -Force -ErrorAction SilentlyContinue
  }
  if ($ownsHotReloadMutex) {
    $hotReloadMutex.ReleaseMutex()
    $hotReloadMutex.Dispose()
  }
}
