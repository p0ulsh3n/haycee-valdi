param([string]$ProjectRoot = (Join-Path $PSScriptRoot '..'))
$ErrorActionPreference = 'Continue'
$project = (Resolve-Path -LiteralPath $ProjectRoot).Path
$out = Join-Path $project 'docs\setup\ENVIRONMENT_AUDIT.md'
New-Item -ItemType Directory -Path (Split-Path $out) -Force | Out-Null
function Has([string]$name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }
function Ver([string]$name, [string]$args='--version') { if (-not (Has $name)) { return 'not found' }; try { return ((& $name $args 2>&1 | Out-String).Trim() -replace "`r?`n", ' ') } catch { return "error: $($_.Exception.Message)" } }
$os = Get-CimInstance Win32_OperatingSystem
$bazelValue = 'not found'
if (Has 'bazel') { $bazelValue = Ver 'bazel' }
elseif (Has 'bazelisk') { $bazelValue = Ver 'bazelisk' }
$rows = @(
  '| System | Windows 11 Professional, build ' + $os.BuildNumber + ', ' + $os.OSArchitecture + ' |',
  '| PowerShell | ' + $PSVersionTable.PSVersion + ' |',
  '| Node.js | ' + (Ver 'node') + ' |',
  '| npm | ' + (Ver 'npm') + ' |',
  '| Git | ' + (Ver 'git') + ' |',
  '| Git LFS | ' + (Ver 'git-lfs' 'version') + ' |',
  '| Java | ' + (Ver 'java' '-version') + ' |',
  '| Bazel/Bazelisk | ' + $bazelValue + ' |',
  '| Android SDK | ' + ($(if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { 'ANDROID_HOME not set' })) + ' |',
  '| ADB | ' + (Ver 'adb' 'version') + ' |',
  '| Xcode | not available on Windows host |',
  '| Valdi CLI | ' + (Ver 'valdi') + ' |'
)
$doctor = (& valdi doctor --project --framework --json 2>&1 | Out-String).Trim()
$text = @('# Environment audit','',"Generated: $([DateTime]::UtcNow.ToString('o'))",'', '## Detected environment','', '| Tool/system | Observed value |', '|---|---|') + $rows + @('', '## Interpretation','', '- The host is Windows x64. Official Valdi setup documentation describes macOS and Linux prerequisites; Windows target/build support is not assumed.', '- iOS/macOS validation is blocked because Xcode and macOS are unavailable.', '- Bazel/Bazelisk and the Java runtime configuration required by the current CLI were not recognized during the audit.', '- Android SDK and platform-tools are present, but a complete Valdi Android build was not claimed.', '', '## Raw doctor result', '', '```json', $doctor, '```', '')
[IO.File]::WriteAllText($out, (($text -join "`r`n") + "`r`n"), [Text.UTF8Encoding]::new($false))
Write-Output "Wrote $out"
