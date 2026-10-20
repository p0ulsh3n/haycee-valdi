param(
  [string]$ProjectRoot = (Join-Path $PSScriptRoot '..')
)

$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath $ProjectRoot).Path
$indexPath = Join-Path $project 'docs\valdi-reference\API_INDEX.json'
$manifestPath = Join-Path $project 'docs\valdi-reference\SOURCE_MANIFEST.json'
$index = Get-Content -LiteralPath $indexPath -Raw | ConvertFrom-Json
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$bundleRegistryPath = Join-Path $env:APPDATA 'npm\node_modules\@snap\valdi\bundled-skills\registry.json'
$bundleRegistry = Get-Content -LiteralPath $bundleRegistryPath -Raw | ConvertFrom-Json
$results = [System.Collections.Generic.List[object]]::new()

function Assert-Search([string]$Name, [string]$Term) {
  $hits = @($index.entries | Where-Object { $_.name -match [regex]::Escape($Term) -or $_.module -match [regex]::Escape($Term) })
  $results.Add([ordered]@{ name=$Name; term=$Term; status=if ($hits.Count -gt 0) { 'pass' } else { 'fail' }; hits=$hits.Count; examples=@($hits | Select-Object -First 3 | ForEach-Object { "$($_.source):$($_.line)" }) })
}

Assert-Search 'Stateful component API' 'StatefulComponent'
Assert-Search 'Native template import' 'NativeTemplateElements'
Assert-Search 'Bazel module rule' 'valdi_module'
Assert-Search 'Cancelable async API' 'CancelablePromise'
Assert-Search 'Navigation API evidence' 'NavigationRoot'

$projectImports = @(Get-ChildItem -LiteralPath (Join-Path $project 'modules') -Recurse -File -Include *.ts,*.tsx | Select-String -Pattern 'from [''\"]([^''\"]+)[''\"]' | ForEach-Object { $_.Matches | ForEach-Object { $_.Groups[1].Value } } | Where-Object { $_ -notmatch '^\.' } | Sort-Object -Unique)
$unresolvedImports = @($projectImports | Where-Object { $import=$_; @($index.entries | Where-Object { $_.module -eq $import -or $_.name -eq $import -or $_.module -like "*$import*" }).Count -eq 0 })
$results.Add([ordered]@{ name='Project external imports indexed'; term='module imports'; status=if ($unresolvedImports.Count -eq 0) { 'pass' } else { 'fail' }; hits=$projectImports.Count; examples=@($unresolvedImports) })

$skillDirs = @(Get-ChildItem -LiteralPath (Join-Path $project '.codex\skills') -Directory | Where-Object Name -like 'valdi-*')
$officialClientCount = @($bundleRegistry.skills | Where-Object { $_.category -contains 'client' }).Count
$installedOfficialCount = @($skillDirs | Where-Object Name -ne 'valdi-expert').Count
$results.Add([ordered]@{ name='Official client skills present'; term='CLI bundle client skills'; status=if ($installedOfficialCount -ge $officialClientCount) { 'pass' } else { 'fail' }; hits=$installedOfficialCount; examples=@("installed=$installedOfficialCount", "cli_bundle=$officialClientCount", "main_registry=$(@($manifest.skills.registry_entries | Where-Object { $_.category -contains 'client' }).Count)") })

$outDir = Join-Path $project 'docs\setup'
$payload = [ordered]@{ generated_at_utc=[DateTime]::UtcNow.ToString('o'); reference_commit=$manifest.commit; api_entries=$index.counts.entries; results=@($results) }
[IO.File]::WriteAllText((Join-Path $outDir 'AGENT_SELF_TEST.json'), ($payload | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
$lines = @('# Agent/API self-test','',('Reference commit: ' + '`' + $manifest.commit + '`'), "API entries searched: **$($index.counts.entries)**",'', '| Check | Status | Hits | Evidence |','|---|---|---:|---|')
foreach ($r in $results) { $lines += "| $($r.name) | $($r.status) | $($r.hits) | $(@($r.examples) -join '; ') |" }
$lines += '', 'This test verifies searchability and source pointers; it does not replace a platform build or runtime test.'
[IO.File]::WriteAllText((Join-Path $outDir 'AGENT_SELF_TEST.md'), (($lines -join "`r`n") + "`r`n"), [Text.UTF8Encoding]::new($false))
Write-Output "Agent/API self-test complete: passes=$(@($results | Where-Object status -eq 'pass').Count), failures=$(@($results | Where-Object status -eq 'fail').Count)"
if (@($results | Where-Object status -eq 'fail').Count -gt 0) { exit 1 }
