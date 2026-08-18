$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProgressPreference = 'SilentlyContinue'
[System.IO.File]::WriteAllText((Join-Path $base '_chk_step0_start.txt'), 'START OK ' + (Get-Date -Format 'o'))

$tok = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InQiLCJwZXJmaWwiOiJhZG1pbiIsImlhdCI6MTc4NjUzODQxMywiZXhwIjoxNzg2NTQ1NjEzfQ.vJTFHbmUFIX9wTzxemOYXLZadZ8gZ89u8prMLlBhb9U'
$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Authorization", ('Bearer ' + $tok))
$headers.Add("Accept", 'application/json')
[System.IO.File]::WriteAllText((Join-Path $base '_chk_step1_headers.txt'), 'HEADERS OK')

$url = 'https://adm.italyembalagens.com.br/api/cores-impressao'
try {
  [System.IO.File]::WriteAllText((Join-Path $base '_chk_step2_precall.txt'), 'PRECALL')
  $resp = Invoke-WebRequest -Uri $url -Method Get -Headers $headers -TimeoutSec 90 -UseBasicParsing
  [System.IO.File]::WriteAllText((Join-Path $base '_chk_step3_status.txt'), 'STATUS ' + $resp.StatusCode)
  $body = [System.Text.Encoding]::UTF8.GetString($resp.Content)
  [System.IO.File]::WriteAllText((Join-Path $base '_chk_step4_body.json'), $body)
  [System.IO.File]::WriteAllText((Join-Path $base '_chk_end.txt'), 'DONE_OK')
  exit 0
} catch {
  $msg = 'ERR: ' + $_.Exception.Message
  if ($_.Exception.Response) {
    try {
      $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $msg += " RAW: " + $sr.ReadToEnd()
    } catch { $msg += " READERR: " + $_.Exception.Message }
  }
  [System.IO.File]::WriteAllText((Join-Path $base '_chk_err.txt'), $msg)
  exit 1
}
