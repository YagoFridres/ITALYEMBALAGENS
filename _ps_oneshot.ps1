$ProgressPreference = 'SilentlyContinue'
$tok = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InQiLCJwZXJmaWwiOiJhZG1pbiIsImlhdCI6MTc4NjUzODQxMywiZXhwIjoxNzg2NTQ1NjEzfQ.vJTFHbmUFIX9wTzxemOYXLZadZ8gZ89u8prMLlBhb9U'
$bearer = 'Bearer ' + $tok
$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Authorization",$bearer)
$headers.Add("Accept","application/json")
$url = 'https://adm.italyembalagens.com.br/api/_oneshot_fix_cores_sem_impressao'
Write-Host "STEP1_URL_BEFORE"
try {
  $resp = Invoke-WebRequest -Uri $url -Method Get -Headers $headers -TimeoutSec 120 -UseBasicParsing
  Write-Host "STEP2_STATUSCODE=$($resp.StatusCode)"
  $body = [System.Text.Encoding]::UTF8.GetString($resp.Content)
  $tmpFile = Join-Path $env:TEMP 'oneshot_out_20260812.json'
  [System.IO.File]::WriteAllText($tmpFile, $body)
  Write-Host "STEP3_WROTE=$tmpFile"
  Write-Host "STEP4_BODY_START"
  Write-Host $body
  Write-Host "STEP4_BODY_END"
  Write-Host "ONESHOT_DONE_OK=1"
  exit 0
} catch {
  Write-Host "STEP2_ERR=$($_.Exception.Message)"
  if ($_.Exception.Response) {
    try {
      $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $raw = $sr.ReadToEnd()
      Write-Host "STEP3_ERRBODY_START"
      Write-Host $raw
      Write-Host "STEP3_ERRBODY_END"
    } catch { Write-Host "STEP3_READERR=$($_.Exception.Message)" }
  }
  Write-Host "ONESHOT_DONE_ERR=1"
  exit 1
}
