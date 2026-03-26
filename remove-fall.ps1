$filePath = 'src/components/SelfDialogueChat.tsx'
$content = Get-Content $filePath -Raw

# Remove the first __FALL__ block from getTodayConversation (around line 423-428)
$pattern1 = @'
      if (msg.message.startsWith('__FALL__')) {
        const content = msg.message.replace('__FALL__|', '');
        const parts = content.split('|');
        const description = parts[1] || '';
        return `[${time}] ? سقوط: ${description}`;
      }
      
'@

# Try to remove it
if ($content -like "*__FALL__*") {
  $originalLength = $content.Length
  # Remove lines 423-428 using a simpler pattern
  $content = $content -replace '(?s)      if \(msg\.message\.startsWith\(.__FALL__.\)\).*?\n      \n', ''
  
  if ($content.Length -lt $originalLength) {
    Write-Host "Successfully removed __FALL__ blocks"
  } else {
    Write-Host "Pattern didn't match, trying alternative..."
    # Alternative: find and remove by looking for the specific structure
    $lines = $content -split "`n"
    $newLines = @()
    $skip = $false
    $for each ($line in $lines) {
      if ($line -like "*__FALL__*" -and !$skip) {
        $skip = $true
        continue
      }
      if ($skip -and $line -like "*if (msg.message.startsWith('__MILESTONE__')*") {
        $skip = $false
      }
      if (!$skip) {
        $newLines += $line
      }
    }
    $content = $newLines -join "`n"
    Write-Host "Used line-by-line removal"
  }
}

# Write back
$content | Out-File $filePath -Encoding UTF8
Write-Host "File updated"
