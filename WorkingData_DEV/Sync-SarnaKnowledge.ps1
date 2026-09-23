param (
    [Parameter(Mandatory=$false)][string]$OutputDir = "C:\repo\battletech-tools\_DEV_KNOWLEDGE\weapons",
    [Parameter(Mandatory=$false)][string[]]$Categories = @("Alternate_Ammunition", "Artillery_Weapons", "Ballistic_Weapons", "Ballistic_Weapons_(Heavy)", "Special_Munitions", "Melee_Weapons", "Apocryphal_Weapons", "Equipment")
)

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$BaseUrl = "https://www.sarna.net/wiki/api.php"

Write-Host "=== Starting Astech Data Acquisition Matrix ===" -ForegroundColor Cyan

foreach ($Category in $Categories) {
    Write-Host "`n[FETCHING] Aggregating member links for Category:$Category..." -ForegroundColor Yellow
    
    $ParamArgs = @{
        action    = "query"
        list      = "categorymembers"
        cmtitle   = "Category:$Category"
        cmlimit   = "100"
        format    = "json"
    }
    
    try {
        $Response = Invoke-RestMethod -Uri $BaseUrl -Method Get -Body $ParamArgs -UserAgent "AstechDataAgent/1.0"
        $Members  = $Response.query.categorymembers
        
        if (-not $Members) {
            Write-Host "[WARNING] No entries resolved for $Category. Skipping." -ForegroundColor Crimson
            continue
        }
        
        $MDFilePath = Join-Path $OutputDir "$($Category.ToLower()).md"
        
        $MDHeader = @"
# BattleTech Reference Corpus: $Category
*Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')*
*Target Parsing Mode: Strict Local Context Mapping (Astech-Prime)*

---
"@
        $MDHeader | Out-File -FilePath $MDFilePath -Encoding utf8 -Force
        
        foreach ($Item in $Members) {
            $PageTitle = $Item.title
            Write-Host "  -> Scraping: $PageTitle" -ForegroundColor Gray
            
            $ContentArgs = @{
                action   = "query"
                prop     = "revisions"
                titles   = $PageTitle
                rvprop   = "content"
                format   = "json"
                formatversion = "2"
            }
            
            $PageResponse = Invoke-RestMethod -Uri $BaseUrl -Method Get -Body $ContentArgs -UserAgent "AstechDataAgent/1.0"
            $RawWikiText  = $PageResponse.query.pages[0].revisions[0].content
            
            if ($RawWikiText) {
                $CleanText = $RawWikiText -replace '\{\{[Aa]mbbox[^}]*\}\}', ''
                $CleanText = $CleanText -replace '\[\[Category:[^\]]*\]\]', ''
                $CleanText = $CleanText -replace '(?ms)<ref>.*?</ref>', ''
                
                $Payload = @"

## Weapon: $PageTitle
### Data Extract Profile
$CleanText

---
"@
                $Payload | Out-File -FilePath $MDFilePath -Append -Encoding utf8
            }
            Start-Sleep -Milliseconds 200
        }
        Write-Host "[SUCCESS] Matrix $Category written completely to: $MDFilePath" -ForegroundColor Green
        
    } catch {
        Write-Host "[ERROR] Execution failure while scraping $Category : $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Synchronized Core Reference Materials ===" -ForegroundColor Cyan