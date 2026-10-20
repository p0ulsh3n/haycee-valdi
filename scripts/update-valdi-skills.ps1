param([string]$ProjectRoot = (Join-Path $PSScriptRoot '..'))

$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath $ProjectRoot).Path
$bundle = Join-Path $env:APPDATA 'npm\node_modules\@snap\valdi\bundled-skills'
$registry = Get-Content -LiteralPath (Join-Path $bundle 'registry.json') -Raw | ConvertFrom-Json
$clientSkills = @($registry.skills | Where-Object { $_.category -contains 'client' })
$projectRoot = Join-Path $project '.codex\skills'
$globalRoot = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.codex\skills'
New-Item -ItemType Directory -Path $projectRoot,$globalRoot -Force | Out-Null

foreach ($skill in $clientSkills) {
  $sourceDir = Join-Path $bundle ([IO.Path]::GetDirectoryName($skill.path))
  foreach ($root in @($projectRoot,$globalRoot)) {
    $destination = Join-Path $root $skill.name
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Get-ChildItem -LiteralPath $sourceDir -Force | Where-Object Name -ne 'skill.md' | Copy-Item -Destination $destination -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $sourceDir 'skill.md') -Destination (Join-Path $destination 'SKILL.md') -Force
  }
}
Write-Output "Updated $($clientSkills.Count) official client skills from CLI bundle $((Get-Content (Join-Path $bundle '..\package.json') -Raw | ConvertFrom-Json).version)."
