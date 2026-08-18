$ProgressPreference='SilentlyContinue'
$tok='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWctbG9jYWwtcHJvYmUtMDAwMSIsIm5vbWUiOiJEaWFnIExvY2FsIFByb2JlIiwiZW1haWwiOiJkaWFnQGxvY2FsIiwicGVyZmlsIjoiYWRtaW4iLCJwZXJtaXNzb2VzIjpbInR1ZG8iXSwiYXZhdGFyX3VybCI6bnVsbCwiaWF0IjoxNzg2NjIwNjQ3LCJleHAiOjE3ODY2NDIyNDd9.vZAQV_znvnWr6L0bZf6C17TDw6n3kYX1hfMS-6Sz6z0'
$h=@{Authorization='Bearer '+$tok;'Accept'='application/json'}
$base='c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS'

Write-Host "(1) PROXIMO-NUMERO..."
try {
  $r1=Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/ofs/proximo-numero' -Headers $h -Method Get -TimeoutSec 20 -UseBasicParsing
  $r1 | ConvertTo-Json -Depth 5 | Out-File (Join-Path $base '_probe_r1.json') -Encoding utf8
  Write-Host "OK salvo _probe_r1.json"
} catch {
  ("ERR1: " + $_.Exception.Message) | Out-File (Join-Path $base '_probe_r1.json') -Encoding utf8
}

Write-Host "(2) DIAG_PROXNUM..."
try {
  $r2=Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/_diag_proxnum' -Headers $h -Method Get -TimeoutSec 60 -UseBasicParsing
  $r2 | ConvertTo-Json -Depth 10 | Out-File (Join-Path $base '_probe_r2.json') -Encoding utf8
  Write-Host "OK salvo _probe_r2.json"
} catch {
  ("ERR2: " + $_.Exception.Message) | Out-File (Join-Path $base '_probe_r2_error.txt') -Encoding utf8
  Write-Host "ERR2: $($_.Exception.Message)"
}

Write-Host "(3) FRONTEND ROUTE max(numero) com incluir_excluidas=1..."
try {
  $url3 = 'https://adm.italyembalagens.com.br/api/ofs?limit=1&order_by=numero&order=desc&incluir_excluidas=1&t=' + [DateTimeOffset]::Now.ToUnixTimeSeconds()
  $r3=Invoke-RestMethod -Uri $url3 -Headers $h -Method Get -TimeoutSec 20 -UseBasicParsing
  $r3 | ConvertTo-Json -Depth 6 | Out-File (Join-Path $base '_probe_r3.json') -Encoding utf8
  Write-Host "OK salvo _probe_r3.json"
} catch {
  ("ERR3: " + $_.Exception.Message) | Out-File (Join-Path $base '_probe_r3_error.txt') -Encoding utf8
  Write-Host "ERR3: $($_.Exception.Message)"
}

Write-Host "DONE probes saved to files."
