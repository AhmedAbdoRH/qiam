$filePath = 'src/components/SelfDialogueChat.tsx'
$lines = @(Get-Content $filePath)
$newLines = @()
$skipCount = 0

for ($i = 0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  
  # Check if this is the start of a __FALL__ block
  if ($line -like '*__FALL__*' -and $skipCount -eq 0) {
    # Check next few lines to confirm it's the if block we want to remove
    if ($i + 4 -lt $lines.Count) {
      $nextLine = $lines[$i + 1]
      if ($nextLine -like "*replace('__FALL__|'*") {
        # Skip lines until we reach the end of this if block
        $skipCount = 6  # Skip about 6 lines (the whole if block)
        continue
      }
    }
  }
  
  # Also handle the Fall entry rendering block (line 2058+)
  if ($line -like '*if (m.message.startsWith*__FALL__*') {
    if ($i + 20 -lt $lines.Count) {
      # Check if this looks like the rendering block
      if ($lines[$i + 3] -like "* const fallParts = *") {
        $skipCount = 25  # Skip the entire block
        continue
      }
    }
  }
  
  if ($skipCount -gt 0) {
    $skipCount--
    continue
  }
  
  $newLines += $line
}

$newLines | Out-File $filePath -Encoding UTF8
Write-Host "Fixed __FALL__ references"
