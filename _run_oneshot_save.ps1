$tok = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InQiLCJwZXJmaWwiOiJhZG1pbiIsImlhdCI6MTc4NjUzODQxMywiZXhwIjoxNzg2NTQ1NjEzfQ.vJTFHbmUFIX9wTzxemOYXLZadZ8gZ89u8prMLlBhb9U'
$bearer = 'Bearer ' + $tok
$headers = @{
  Authorization = $bearer
  Accept = 'application/json'
}
$url = 'https://adm.italyembalagens.com.br/api/_oneshot_fix_cores_sem_impressao'
$outpath = Join-Path $PSScriptRoot '_ONESHOUT_RESULT.txt'
$ErrorActionPreference = 'Stop'
try {
  $resp = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -TimeoutSec 120 -UseBasicParsing
  $txt = $resp | ConvertTo-Json -Depth 30
  Set-Content -LiteralPath $outpath -Value $txt -Encoding UTF8
  Write-Host "OK_200_WRITTEN"
  exit 0
} catch {
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine("EXCEPTION: $($_.Exception.Message)")
  if ($_.Exception.Response) {
    try {
      $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      [void]$sb.AppendLine("RESP_BODY: " + $sr.ReadToEnd())
    } catch { [void]$sb.AppendLine("READ_BODY_FAIL: $($_.Exception.Message)") }
  }
  Set-Content -LiteralPath $outpath -Value $sb.ToString() -Encoding UTF8
  Write-Host "ERROR_WRITTEN"
  exit 1
}
