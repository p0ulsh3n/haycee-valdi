param(
  [string]$ProjectRoot = (Join-Path $PSScriptRoot '..')
)

$ErrorActionPreference = 'Continue'
$project = (Resolve-Path -LiteralPath $ProjectRoot).Path
$outDir = Join-Path $project 'docs\setup'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$results = [System.Collections.Generic.List[object]]::new()

function Run-Check([string]$Name, [string]$Command, [scriptblock]$Action) {
  $started = [DateTime]::UtcNow
  $output = @(& $Action 2>&1 | Out-String).Trim()
  $exitCode = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }
  $status = if ($exitCode -eq 0) { 'pass' } else { 'fail-or-blocked' }
  $results.Add([ordered]@{ name=$Name; command=$Command; status=$status; exit_code=$exitCode; duration_ms=([int](([DateTime]::UtcNow-$started).TotalMilliseconds)); output=$output })
}

Push-Location $project
try {
  Run-Check 'API/agent self-test' 'pwsh -NoProfile -File scripts/valdi-api-self-test.ps1' { pwsh -NoProfile -File (Join-Path $project 'scripts\valdi-api-self-test.ps1') }
  Run-Check 'Valdi CLI version' 'valdi --version' { valdi --version }
  Run-Check 'Valdi doctor' 'valdi doctor --project --framework --json' { valdi doctor --project --framework --json }
  Run-Check 'Valdi projectsync' 'valdi projectsync' { valdi projectsync }
  if (((Test-Path '.prettierrc') -or (Test-Path '.prettierrc.json')) -and ((Test-Path '.eslintrc.js') -or (Test-Path '.eslintrc.json'))) {
    Run-Check 'Valdi lint' 'valdi lint check modules/haycee_mobile_app_valdi/src/App.tsx' { valdi lint check 'modules/haycee_mobile_app_valdi/src/App.tsx' }
  } else {
    $results.Add([ordered]@{ name='Valdi lint'; command='valdi lint check modules/haycee_mobile_app_valdi/src/App.tsx'; status='fail-or-blocked'; exit_code=2; duration_ms=0; output='Blocked: bootstrap did not generate both recognized Prettier and ESLint configs; valdi lint check would prompt interactively.' })
  }
  Run-Check 'Valdi test' 'valdi test --module haycee_mobile_app_valdi' { valdi test --module haycee_mobile_app_valdi }
  $help = (& valdi --help 2>&1 | Out-String)
  if ($help -match 'agent-check') {
    Run-Check 'Valdi agent-check' 'valdi agent-check --module haycee_mobile_app_valdi --quick --json' { valdi agent-check --module haycee_mobile_app_valdi --quick --json }
  } else {
    $results.Add([ordered]@{ name='Valdi agent-check'; command='valdi agent-check --module haycee_mobile_app_valdi --quick --json'; status='fail-or-blocked'; exit_code=2; duration_ms=0; output='Unavailable: the installed Valdi CLI does not expose agent-check; use the migration-compatible CLI version pinned by the build workflow.' })
  }
} finally { Pop-Location }

$payload = [ordered]@{ generated_at_utc=[DateTime]::UtcNow.ToString('o'); project=$project; results=@($results) }
[IO.File]::WriteAllText((Join-Path $outDir 'VALIDATION_RESULTS.json'), ($payload | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# Valdi validation results'); $lines.Add(''); $lines.Add("Generated: $($payload.generated_at_utc)"); $lines.Add('')
$lines.Add('| Check | Exit code | Status |'); $lines.Add('|---|---:|---|')
foreach ($r in $results) { $lines.Add("| $($r.name) | $($r.exit_code) | $($r.status) |") }
$lines.Add(''); $lines.Add('Full command output is in `VALIDATION_RESULTS.json`. A non-zero result is preserved as a failure or environment block; it is not converted into a pass.')
[IO.File]::WriteAllText((Join-Path $outDir 'VALIDATION_RESULTS.md'), (($lines -join "`r`n") + "`r`n"), [Text.UTF8Encoding]::new($false))
Write-Output "Validation complete: $($results.Count) checks; passes=$(@($results | Where-Object status -eq 'pass').Count); nonzero=$(@($results | Where-Object status -ne 'pass').Count)"
