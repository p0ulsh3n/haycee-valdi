param(
  [string]$ReferencePath = 'S:\valdi-official-reference',
  [string]$ProjectRoot = (Join-Path $PSScriptRoot '..')
)
$ErrorActionPreference = 'Stop'
$reference = (Resolve-Path -LiteralPath $ReferencePath).Path
if ((git -C $reference status --porcelain)) { throw 'Reference checkout has local changes; refusing to update it.' }
git -C $reference fetch --depth 1 origin main
git -C $reference checkout --detach FETCH_HEAD
& (Join-Path $PSScriptRoot 'refresh-valdi-reference.ps1') -ProjectRoot $ProjectRoot -ReferencePath $reference
