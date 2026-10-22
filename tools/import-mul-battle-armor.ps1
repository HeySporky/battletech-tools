param(
    [string]$SourceCommit = "39d39699"
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$mulDir = Join-Path $root "src/data/mul"
$sourcePath = "WorkingData_DEV/MULdata/units_detailed.json"
$sourceFile = Join-Path $root $sourcePath

if (Test-Path $sourceFile) {
    $sourceJson = Get-Content -Raw $sourceFile
} else {
    $sourceJson = git show "${SourceCommit}:$sourcePath"
}

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($sourceJson)) {
    throw "Unable to load $sourcePath from the working tree or commit $SourceCommit."
}

function Get-ChunkPathForId {
    param([int]$Id)

    $chunkFiles = Get-ChildItem -Path $mulDir -Filter "mul_ids_*.json" | Sort-Object Name
    foreach ($chunkFile in $chunkFiles) {
        if ($chunkFile.Name -match '^mul_ids_(\d+)_to_(\d+)\.json$') {
            $start = [int]$Matches[1]
            $end = [int]$Matches[2]
            if ($Id -ge $start -and $Id -le $end) {
                return $chunkFile.FullName
            }
        }
    }

    throw "No MUL chunk file covers Id $Id. Add the matching chunk range before updating the JSON bundle."
}

function Get-ChunkEntries {
    param([string]$Path)

    $payload = Get-Content -Raw -Path $Path | ConvertFrom-Json -Depth 100
    if (-not ($payload -is [System.Collections.IEnumerable])) {
        throw "$Path does not contain a JSON array."
    }

    return @($payload)
}

function Is-UnitRecord {
    param($Record)

    if ($null -eq $Record -or $Record -isnot [pscustomobject]) {
        return $false
    }

    $idValue = $Record.PSObject.Properties['Id']?.Value
    if ($null -eq $idValue) { $idValue = $Record.PSObject.Properties['id']?.Value }
    if ($null -eq $idValue) { return $false }

    $nameValue = $Record.PSObject.Properties['Name']?.Value
    return ($idValue -is [int] -or $idValue -match '^-?\d+$') -and $null -ne $nameValue
}

function Get-RecordId {
    param($Record)

    $idValue = $Record.PSObject.Properties['Id']?.Value
    if ($null -eq $idValue) { $idValue = $Record.PSObject.Properties['id']?.Value }

    if ($null -eq $idValue) { return $null }
    if ($idValue -is [int]) { return [int]$idValue }
    if ($idValue -match '^-?\d+$') { return [int]$idValue }
    return $null
}

$units = (ConvertFrom-Json $sourceJson).PSObject.Properties.Value
$liveRecords = @($units | Where-Object { $_ -and $_.PSObject.Properties['Id'] -and $_.Id -ne $null })

if ($liveRecords.Count -eq 0) {
    throw "No records with a numeric Id were found in $sourcePath."
}

$missingIds = @($liveRecords | Where-Object { -not (Get-RecordId $_) })
if ($missingIds.Count -gt 0) {
    throw "One or more source records do not expose a numeric Id; we cannot safely map them into the chunked JSON bundle. The record is: $($missingIds[0] | ConvertTo-Json -Compress -Depth 6)"
}

$duplicateIds = @($liveRecords | Group-Object { (Get-RecordId $_) } | Where-Object { $_.Count -gt 1 })
if ($duplicateIds.Count -gt 0) {
    throw "The source contains duplicate unit IDs. Cannot safely update the chunked JSON bundle."
}

$chunkMap = @{}
foreach ($chunkFile in (Get-ChildItem -Path $mulDir -Filter "mul_ids_*.json")) {
    $chunkMap[$chunkFile.FullName] = @(Get-ChunkEntries -Path $chunkFile.FullName)
}

foreach ($record in $liveRecords) {
    $unitId = Get-RecordId $record
    $chunkPath = Get-ChunkPathForId -Id $unitId

    if (-not $chunkMap.ContainsKey($chunkPath)) {
        $chunkMap[$chunkPath] = @(Get-ChunkEntries -Path $chunkPath)
    }

    $chunkItems = @($chunkMap[$chunkPath])
    $updated = $false
    for ($i = 0; $i -lt $chunkItems.Count; $i++) {
        if (Is-UnitRecord -Record $chunkItems[$i] -and (Get-RecordId -Record $chunkItems[$i]) -eq $unitId) {
            $chunkItems[$i] = $record
            $updated = $true
            break
        }
    }

    if (-not $updated) {
        $chunkItems += $record
    }

    $chunkMap[$chunkPath] = $chunkItems
}

foreach ($entry in $chunkMap.GetEnumerator()) {
    $json = ($entry.Value | ConvertTo-Json -Depth 100)
    [System.IO.File]::WriteAllText($entry.Key, $json + "`n")
}

Write-Output "Updated $($chunkMap.Count) MUL chunk file(s) with $($liveRecords.Count) source records."
