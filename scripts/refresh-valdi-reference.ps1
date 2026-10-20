param(
  [string]$ProjectRoot = (Join-Path $PSScriptRoot '..'),
  [string]$ReferencePath = 'S:\valdi-official-reference'
)

$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath $ProjectRoot).Path
$reference = (Resolve-Path -LiteralPath $ReferencePath).Path
$output = Join-Path $project 'docs\valdi-reference'
New-Item -ItemType Directory -Path $output -Force | Out-Null

$errors = [System.Collections.Generic.List[string]]::new()
$now = [DateTime]::UtcNow.ToString('o')
$commit = (& git -C $reference rev-parse HEAD).Trim()
$branch = (& git -C $reference branch --show-current).Trim()
$commitDate = (& git -C $reference show -s --format=%cI HEAD).Trim()
$cliVersion = (& valdi --version 2>$null).Trim()

function Relative-Path([string]$path) {
  return ([IO.Path]::GetRelativePath($reference, $path)).Replace('\', '/')
}

function Read-Text([IO.FileInfo]$file) {
  try { return [IO.File]::ReadAllText($file.FullName) }
  catch { $errors.Add("Unreadable: $(Relative-Path $file.FullName) - $($_.Exception.Message)"); return $null }
}

$allFiles = @(Get-ChildItem -LiteralPath $reference -Recurse -File | Where-Object { $_.FullName -notmatch '[\\/]\.git[\\/]' })
$rootDocs = @('README.md','AGENTS.md','CONTRIBUTING.md','SECURITY.md','SUPPORT.md','ROADMAP.md','VERSIONING.md')
$docFiles = @($allFiles | Where-Object {
  $rel = Relative-Path $_.FullName
  ($_.Extension -in @('.md','.mdx')) -and ($rel -match '^(docs/|ai-skills/)' -or $rootDocs -contains $rel)
})

$docRecords = foreach ($file in $docFiles) {
  $text = Read-Text $file
  if ($null -eq $text) { continue }
  $lines = if ($text.Length -eq 0) { @() } else { $text -split "`r?`n" }
  $headings = @([regex]::Matches($text, '(?m)^#{1,6}\s+(.+?)\s*$') | ForEach-Object { $_.Groups[1].Value.Trim() })
  [ordered]@{
    path = Relative-Path $file.FullName
    bytes = $file.Length
    lines = $lines.Count
    sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    headings = $headings
  }
}

$inventory = [System.Collections.Generic.List[string]]::new()
$inventory.Add('# Valdi documentation inventory')
$inventory.Add('')
$inventory.Add("Generated: $now")
$inventory.Add('Reference commit: ' + '`' + $commit + '`')
$inventory.Add('')
$inventory.Add("Measured documentation files: **$($docRecords.Count)**")
$inventory.Add('')
$inventory.Add('| Path | Lines | Bytes | SHA-256 | Headings discovered |')
$inventory.Add('|---|---:|---:|---|---|')
foreach ($record in $docRecords) {
  $headingText = (($record.headings | Select-Object -First 5) -join '; ').Replace('|','\|')
  if ($record.headings.Count -gt 5) { $headingText += '; …' }
  $inventory.Add("| ``$($record.path)`` | $($record.lines) | $($record.bytes) | ``$($record.sha256)`` | $headingText |")
}
[IO.File]::WriteAllText((Join-Path $output 'DOCUMENTATION_INVENTORY.md'), (($inventory -join "`r`n") + "`r`n"), [Text.UTF8Encoding]::new($false))

$workspaceText = [IO.File]::ReadAllText((Join-Path $project 'WORKSPACE'))
$valdiTag = if ($workspaceText -match 'strip_prefix\s*=\s*"Valdi-([^"]+)"') { $Matches[1] } else { $null }
$widgetsTag = if ($workspaceText -match 'strip_prefix\s*=\s*"Valdi_Widgets-([^"]+)"') { $Matches[1] } else { $null }
$registryPath = Join-Path $reference 'ai-skills\registry.json'
$registry = Get-Content -LiteralPath $registryPath -Raw | ConvertFrom-Json
$skillChecks = foreach ($skill in $registry.skills) {
  $skillPath = Join-Path $reference ($skill.path -replace '/', '\')
  [ordered]@{
    name = $skill.name
    category = @($skill.category)
    path = $skill.path
    exists = Test-Path -LiteralPath $skillPath
  }
}
$projectSkillNames = @(Get-ChildItem -LiteralPath (Join-Path $project '.codex\skills') -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
$globalSkillNames = @(Get-ChildItem -LiteralPath 'C:\Users\darkk\.codex\skills' -Directory -ErrorAction SilentlyContinue | Where-Object Name -like 'valdi-*' | Select-Object -ExpandProperty Name)
$officialClientNames = @($skillChecks | Where-Object { $_.category -contains 'client' } | ForEach-Object { $_.name })
$projectOfficialClientCount = @($projectSkillNames | Where-Object { $officialClientNames -contains $_ }).Count
$globalOfficialClientCount = @($globalSkillNames | Where-Object { $officialClientNames -contains $_ }).Count
$codeRoots = @('valdi_core','valdi','modules','src','compiler','apps','experiments','libs','registry')
$codeFiles = foreach ($root in $codeRoots) {
  $path = Join-Path $reference $root
  if (Test-Path -LiteralPath $path) {
    Get-ChildItem -LiteralPath $path -Recurse -File | Where-Object { $_.Extension -in @('.ts','.tsx','.d.ts','.kt','.java','.swift','.m','.mm','.cpp','.h','.bzl','.bazel') }
  }
}
$binaryFiles = @($allFiles | Where-Object { $_.Extension.ToLowerInvariant() -in @('.png','.jpg','.jpeg','.gif','.webp','.svg','.ico','.bin','.a','.so','.dylib','.dll','.jar','.aar','.zip') } | ForEach-Object { Relative-Path $_.FullName })
$generatedOrDependencyFiles = @($allFiles | Where-Object { (Relative-Path $_.FullName) -match '^(third-party/|bazel-|android_.*\.json$|.*maven.*\.json$|.*\.lock$)' } | ForEach-Object { Relative-Path $_.FullName })
$analyzedPathSet = @($docRecords | ForEach-Object { $_.path }) + @($codeFiles | ForEach-Object { Relative-Path $_.FullName }) + @('ai-skills/registry.json')
$otherUnparsedFiles = @($allFiles | ForEach-Object { Relative-Path $_.FullName } | Where-Object { ($analyzedPathSet -notcontains $_) -and ($binaryFiles -notcontains $_) -and ($generatedOrDependencyFiles -notcontains $_) })

$manifest = [ordered]@{
  repository = 'https://github.com/Snapchat/Valdi.git'
  reference_path = $reference
  branch = $branch
  commit = $commit
  commit_date = $commitDate
  retrieved_at_utc = $now
  cli_version = $cliVersion
  project_pinned_valdi_release = $valdiTag
  project_pinned_valdi_widgets_release = $widgetsTag
  source_counts = [ordered]@{
    all_files_excluding_git = $allFiles.Count
    documentation_files_indexed = $docRecords.Count
    source_files_indexed = $codeFiles.Count
    unreadable_files = $errors.Count
    root_directories = @((Get-ChildItem -LiteralPath $reference -Directory | Select-Object -ExpandProperty Name))
  }
  discovered_files = @($allFiles | ForEach-Object { Relative-Path $_.FullName })
  analyzed_files = [ordered]@{
    documentation = @($docRecords | ForEach-Object { $_.path })
    source_code = @($codeFiles | ForEach-Object { Relative-Path $_.FullName })
    skills_registry = @('ai-skills/registry.json')
  }
  ignored_files = @(
    [ordered]@{ reason='Binary assets and compiled/native artifacts are inventoried but not parsed as text'; files=$binaryFiles }
    [ordered]@{ reason='Third-party or generated dependency metadata is inventoried for provenance but excluded from API extraction'; files=$generatedOrDependencyFiles }
    [ordered]@{ reason='Other configuration/text files are inventoried but not included in the TypeScript API extraction'; files=$otherUnparsedFiles }
  )
  skills = [ordered]@{
    registry_version = $registry.version
    registry_entries = @($skillChecks)
    registry_entry_count = @($skillChecks).Count
    client_skill_count = @($skillChecks | Where-Object { $_.category -contains 'client' }).Count
    project_codex_installed = $projectSkillNames
    global_codex_installed = $globalSkillNames
    project_official_client_skill_count = $projectOfficialClientCount
    global_official_client_skill_count = $globalOfficialClientCount
  }
  errors = @($errors)
}
[IO.File]::WriteAllText((Join-Path $output 'SOURCE_MANIFEST.json'), ($manifest | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false))

$apiEntries = [System.Collections.Generic.List[object]]::new()
$seen = [Collections.Generic.HashSet[string]]::new()
function Add-ApiEntry($entry) {
  $key = "$($entry.kind)|$($entry.name)|$($entry.module)|$($entry.source)|$($entry.line)"
  if ($seen.Add($key)) { $apiEntries.Add($entry) }
}

foreach ($record in $docRecords | Where-Object { $_.path -like 'docs/api/*' -or $_.path -like 'docs/docs/*' }) {
  $file = Join-Path $reference ($record.path -replace '/', '\')
  $lines = [IO.File]::ReadAllLines($file)
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^#{1,6}\s+(.+?)\s*$') {
      Add-ApiEntry ([ordered]@{ name=$Matches[1].Trim(); kind='documented-concept'; module=$null; signature=$null; source=$record.path; line=$i+1; evidence='Markdown heading' })
    }
    if ($lines[$i] -match 'from\s+[\x27\"]([^\x27\"]+)[\x27\"]') {
      Add-ApiEntry ([ordered]@{ name=$Matches[1]; kind='documented-import'; module=$Matches[1]; signature=$lines[$i].Trim(); source=$record.path; line=$i+1; evidence='Documented import' })
    }
  }
}

$apiCodeFiles = @($codeFiles | Where-Object { $_.Extension -in @('.ts','.tsx','.d.ts') })
foreach ($file in $apiCodeFiles) {
  $rel = Relative-Path $file.FullName
  $lines = [IO.File]::ReadAllLines($file.FullName)
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*export\s+(?:(?:abstract|declare|default)\s+)*(class|interface|type|enum|function|const|let|var)\s+([A-Za-z_$][\w$]*)') {
      Add-ApiEntry ([ordered]@{ name=$Matches[2]; kind="exported-$($Matches[1])"; module=$rel; signature=$lines[$i].Trim(); source=$rel; line=$i+1; evidence='Exported TypeScript declaration' })
    }
    if ($lines[$i] -match '^\s*import\s+.*\sfrom\s+[\x27\"]([^\x27\"]+)[\x27\"]') {
      Add-ApiEntry ([ordered]@{ name=$Matches[1]; kind='source-import'; module=$Matches[1]; signature=$lines[$i].Trim(); source=$rel; line=$i+1; evidence='Source import' })
    }
  }
}

$docTextByPath = @{}
foreach ($record in $docRecords) {
  $docTextByPath[$record.path] = [IO.File]::ReadAllText((Join-Path $reference ($record.path -replace '/', '\')))
}
$exampleFiles = foreach ($root in @('apps','experiments')) {
  $path = Join-Path $reference $root
  if (Test-Path -LiteralPath $path) { Get-ChildItem -LiteralPath $path -Recurse -File | Where-Object { $_.Extension -in @('.ts','.tsx','.d.ts','.kt','.java','.swift','.m','.mm','.cpp') } }
}
$exampleTextByPath = @{}
foreach ($file in $exampleFiles) { $exampleTextByPath[(Relative-Path $file.FullName)] = [IO.File]::ReadAllText($file.FullName) }
foreach ($entry in $apiEntries) {
  $entry['reference_commit'] = $commit
  $entry['source_url'] = "https://github.com/Snapchat/Valdi/blob/$commit/$($entry.source)#L$($entry.line)"
  $needle = [regex]::Escape([string]$entry.name)
  $docMatches = @($docTextByPath.Keys | Where-Object { $docTextByPath[$_] -match "(?im)\b$needle\b" } | Select-Object -First 5)
  $exampleMatches = @($exampleTextByPath.Keys | Where-Object { $exampleTextByPath[$_] -match "(?im)\b$needle\b" } | Select-Object -First 5)
  $entry['documentation'] = $docMatches
  $entry['documentation_urls'] = @($docMatches | ForEach-Object { "https://github.com/Snapchat/Valdi/blob/$commit/$_" })
  $entry['examples'] = $exampleMatches
  $entry['platform_constraints'] = if ($entry.source -match '(?i)(android|ios|macos|web)') { @($Matches[1]) } else { @('not inferred from this record') }
  $entry['availability'] = 'Evidence present in the reference checkout at the recorded commit; project-pinned availability still requires the pinned release/toolchain check.'
  $entry['parameters'] = $null
  $entry['returns'] = $null
  $entry['properties'] = $null
  $entry['events_callbacks'] = $null
  $entry['lifecycle'] = $null
  $entry['prerequisites'] = $null
  $entry['alternatives'] = $null
  $entry['limitations'] = $null
}

$apiPayload = [ordered]@{
  generated_at_utc = $now
  reference_commit = $commit
  project_pinned_release = $valdiTag
  methodology = 'Headings/imports from docs plus exported TypeScript declarations and imports from public source roots and examples. Each entry carries source/documentation/example pointers and explicit nulls for fields not structurally available from the evidence; this is a searchable evidence index, not a claim of semantic completeness.'
  schema = @('name','kind','module','signature','parameters','returns','properties','events_callbacks','lifecycle','platform_constraints','availability','prerequisites','examples','source','line','source_url','documentation','documentation_urls','alternatives','limitations','reference_commit')
  counts = [ordered]@{ entries=$apiEntries.Count; documented_concepts=@($apiEntries | Where-Object kind -eq 'documented-concept').Count; exported_declarations=@($apiEntries | Where-Object kind -like 'exported-*').Count; imports=@($apiEntries | Where-Object kind -in @('documented-import','source-import')).Count }
  entries = @($apiEntries)
}
[IO.File]::WriteAllText((Join-Path $output 'API_INDEX.json'), ($apiPayload | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false))

$domains = @(
  @{name='Framework and components'; pattern='core-component|core-states|core-views|core-text|api-reference-elements'},
  @{name='Layout, styling and interaction'; pattern='core-flexbox|core-styling|core-touches|core-scrolls|advanced-animations|navigation'},
  @{name='Images and media'; pattern='core-images|core-video|advanced-images'},
  @{name='Services and async'; pattern='stdlib-http|advanced-worker|stdlib-persistence|advanced-provider'},
  @{name='Native integration'; pattern='native-|advanced-native|native-bindings|native-annotations'},
  @{name='Build, CLI and testing'; pattern='command-line|workflow-bazel|workflow-testing|ai-tooling|core-module'},
  @{name='Performance and debugging'; pattern='performance-|workflow-inspector|workflow-hermes|help-troubleshooting'}
)
$coverage = [System.Collections.Generic.List[string]]::new()
$coverage.Add('# Valdi API and capability coverage')
$coverage.Add('')
$coverage.Add('Generated from commit ' + '`' + $commit + '` on ' + $now + '. Counts are measured by `refresh-valdi-reference.ps1`.')
$coverage.Add('')
$coverage.Add('| Domain | Matching official documents | Status |')
$coverage.Add('|---|---:|---|')
foreach ($domain in $domains) {
  $matches = @($docRecords | Where-Object { $_.path -match $domain.pattern })
  $status = if ($matches.Count -gt 0) { 'documented evidence found' } else { 'not confirmed by current index' }
  $coverage.Add("| $($domain.name) | $($matches.Count) | $status |")
}
$coverage.Add('')
$coverage.Add("Indexed documentation files: **$($docRecords.Count)**")
$coverage.Add("Indexed API evidence entries: **$($apiEntries.Count)**")
$coverage.Add('')
$coverage.Add('This report measures discoverability and source pointers. It does not claim that every runtime behavior, private API, platform combination, or semantic interaction has been exhaustively verified.')
[IO.File]::WriteAllText((Join-Path $output 'API_COVERAGE.md'), (($coverage -join "`r`n") + "`r`n"), [Text.UTF8Encoding]::new($false))

$matrix = @('# Valdi capability matrix','',('Reference commit: ' + '`' + $commit + '`'),'','| Capability | Evidence | Windows host | Android | iOS/macOS |', '|---|---|---|---|---|')
$matrix += '| TSX components and native template elements | `docs/api/api-reference-elements.md`, `docs/docs/core-component.md` | source index only | documented | documented; build blocked |'
$matrix += '| Bazel module/app build | `docs/docs/workflow-bazel.md`, generated `WORKSPACE` | blocked: Bazel/Windows host | not run | not run |'
$matrix += '| Official client skills | `ai-skills/registry.json`, `.codex/skills/` | installed | applicable | applicable |'
$matrix += '| Android install/build | CLI `valdi install android` | blocked until Bazel/Java setup | device/emulator not established | n/a |'
$matrix += '| iOS/macOS install/build | CLI and official setup docs | unavailable: no macOS/Xcode | n/a | blocked: no macOS/Xcode |'
$matrix += '| CLI/web target | official CLI references and source | not assumed; verify target first | not a mobile runtime claim | not a mobile runtime claim |'
[IO.File]::WriteAllText((Join-Path $output 'CAPABILITY_MATRIX.md'), (($matrix -join "`r`n") + "`r`n"), [Text.UTF8Encoding]::new($false))

$report = @('# Valdi coverage report','',"Generated: $now", ('Reference commit: ' + '`' + $commit + '`'),'',"- Repository files excluding `.git`: **$($allFiles.Count)**", "- Documentation files discovered and read: **$($docRecords.Count)**", "- Unreadable files: **$($errors.Count)**", "- Source files indexed: **$($codeFiles.Count)**", "- API evidence entries: **$($apiEntries.Count)**", "- Official skill registry entries: **$(@($skillChecks).Count)**", "- Official client skills installed in project Codex adapter: **$projectOfficialClientCount**", "- Official client skills installed in global Codex adapter: **$globalOfficialClientCount**",'', '## Interpretation','', 'The documentation inventory is exhaustive for Markdown files under `docs/`, `ai-skills/`, and the selected root guidance files at this checkout. The API index is a reproducible evidence index of public documentation headings, imports, exported TypeScript declarations and imports from selected public source roots; it is not a claim of complete semantic or private-runtime coverage.','', '## Omissions and limits','', '- Native behavior requiring macOS/Xcode, a configured Android toolchain, a device or an emulator was not executed on this Windows host.', '- The application remains pinned to the CLI bootstrap release tags; the reference checkout is `main` and its commit is recorded above, so newer main-only APIs must not be assumed available.', '- Framework-internal contributor skills are inventoried but intentionally not installed into the application agent profile.', '')
[IO.File]::WriteAllText((Join-Path $output 'COVERAGE_REPORT.md'), (($report -join "`r`n") + "`r`n"), [Text.UTF8Encoding]::new($false))

Write-Output "Reference refresh complete: docs=$($docRecords.Count), api=$($apiEntries.Count), skills=$(@($skillChecks).Count), errors=$($errors.Count), commit=$commit"
