param(
    [string]$SourceCommit = "39d39699"
)

$sourcePath = "WorkingData_DEV/MULdata/units_detailed.json"
$sourceFile = Join-Path $PSScriptRoot "../$sourcePath"

if (Test-Path $sourceFile) {
    $sourceJson = Get-Content -Raw $sourceFile
} else {
    $sourceJson = git show "${SourceCommit}:$sourcePath"
}

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($sourceJson)) {
    throw "Unable to load $sourcePath from the working tree or commit $SourceCommit."
}

$eras = @{
    "Star League (2571 - 2780)" = @{ Id = 10; Start = 2571 }
    "Early Succession War (2781 - 2900)" = @{ Id = 11; Start = 2781 }
    "Late Succession War - LosTech (2901 - 3019)" = @{ Id = 255; Start = 2901 }
    "Clan Invasion (3050 - 3061)" = @{ Id = 13; Start = 3050 }
    "Civil War (3062 - 3067)" = @{ Id = 247; Start = 3062 }
    "Jihad (3068 - 3080)" = @{ Id = 14; Start = 3068 }
    "Early Republic (3081 - 3100)" = @{ Id = 15; Start = 3081 }
    "Late Republic (3101 - 3130)" = @{ Id = 254; Start = 3101 }
    "Dark Age (3131 - 3150)" = @{ Id = 16; Start = 3131 }
}

$technologies = @{ "Inner Sphere" = 1; "Clan" = 2; "Mixed" = 3 }
$roles = @{ "None" = 104; "Scout" = 105; "Skirmisher" = 107; "Juggernaut" = 108; "Brawler" = 109; "Missile Boat" = 110; "Ambusher" = 111 }

$units = (ConvertFrom-Json $sourceJson).PSObject.Properties.Value
$battleArmor = $units | Where-Object { $_.Fields."Unit Type" -eq "Infantry - Battle Armor" } | Sort-Object Id

if ($battleArmor.Count -eq 0) {
    throw "No Battle Armor records were found in $sourcePath."
}

$items = foreach ($unit in $battleArmor) {
    $fields = $unit.Fields
    $era = $eras[$fields.Era]
    $technologyName = $fields.Technology
    $roleName = $fields."Unit Role"
    if ([string]::IsNullOrWhiteSpace($roleName)) {
        $roleName = "None"
    }
    $tonnage = if ($fields.Tonnage -match '^\d+(\.\d+)?$') { [decimal]$fields.Tonnage } else { 0 }
    $battleValue = if ($fields."Battle Value" -match '^\d+$') { [int]$fields."Battle Value" } else { 0 }
    $cost = if ($fields.Cost -match '^\d+$') { [int]$fields.Cost } else { 0 }

    if ($null -eq $era -or -not $technologies.ContainsKey($technologyName) -or -not $roles.ContainsKey($roleName)) {
        throw "Unsupported MUL metadata for unit $($unit.Id): era '$($fields.Era)', technology '$technologyName', role '$roleName'."
    }

    [ordered]@{
        Id = [int]$unit.Id
        Name = $unit.Title
        GroupName = $null
        Class = $unit.Title
        Variant = $null
        Tonnage = $tonnage
        BattleValue = $battleValue
        Technology = [ordered]@{ Id = $technologies[$technologyName]; Name = $technologyName; Image = $null; SortOrder = 0 }
        Cost = $cost
        Rules = $fields."Rules Level"
        TROId = 0
        TRO = ""
        RSId = 0
        RS = ""
        EraIcon = ""
        DateIntroduced = $fields."Date Introduced"
        EraId = $era.Id
        EraStart = $era.Start
        ImageUrl = ""
        IsFeatured = $false
        IsPublished = $true
        Release = 1
        Type = [ordered]@{ Id = 22; Name = "Battle Armor"; Image = "BattleArmor.gif"; SortOrder = 5 }
        Role = [ordered]@{ Id = $roles[$roleName]; Name = $roleName; Image = $null; SortOrder = 0 }
        BFType = $null
        BFSize = 0
        BFMove = ""
        BFTMM = 0
        BFArmor = 0
        BFStructure = 0
        BFThreshold = 0
        BFDamageShort = 0
        BFDamageShortMin = $false
        BFDamageMedium = 0
        BFDamageMediumMin = $false
        BFDamageLong = 0
        BFDamageLongMin = $false
        BFDamageExtreme = 0
        BFOverheat = 0
        BFPointValue = 0
        BFAbilities = $null
        Skill = 0
        FormatedTonnage = if ([string]::IsNullOrWhiteSpace($fields.Tonnage)) { $null } else { $fields.Tonnage }
    }
}

$outputPath = Join-Path $PSScriptRoot "../src/data/mul-battle-armor.ts"
$json = $items | ConvertTo-Json -Depth 6
$module = "import { IASMULUnit } from `"../classes/alpha-strike-unit`";`n`nconst battleArmorMulListItems: IASMULUnit[] = $json;`n`nexport default battleArmorMulListItems;`n"
[System.IO.File]::WriteAllText($outputPath, $module)

$elementalCount = @($items | Where-Object { $_.Name -match "Elemental" }).Count
Write-Output "Generated $($items.Count) Battle Armor records, including $elementalCount Elemental variants."