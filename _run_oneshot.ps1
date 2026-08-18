$tok = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InQiLCJwZXJmaWwiOiJhZG1pbiIsImlhdCI6MTc4NjUzODQxMywiZXhwIjoxNzg2NTQ1NjEzfQ.vJTFHbmUFIX9wTzxemOYXLZadZ8gZ89u8prMLlBhb9U'
$bearer = 'Bearer ' + $tok
$headers = @{
  Authorization = $bearer
  Accept = 'application/json'
}
$url = 'https://adm.italyembalagens.com.br/api/_oneshot_fix_cores_sem_impressao'
$ErrorActionPreference = 'Stop'
try {
  $resp = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -TimeoutSec 120 -UseBasicParsing
  Write-Host ($resp | ConvertTo-Json -Depth 30)
  exit 0
} catch {
  Write-Host "EXCEPTION: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    try {
      $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      Write-Host ("RESP_BODY: " + $sr.ReadToEnd())
    } catch { Write-Host ("READ_BODY_FAIL: $($_.Exception.Message)") }
  }
  exit 1
}
