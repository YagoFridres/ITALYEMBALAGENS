$ProgressPreference='SilentlyContinue'
$tok='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWctbG9jYWwtcHJvYmUtMDAwMSIsIm5vbWUiOiJEaWFnIExvY2FsIFByb2JlIiwiZW1haWwiOiJkaWFnQGxvY2FsIiwicGVyZmlsIjoiYWRtaW4iLCJwZXJtaXNzb2VzIjpbInR1ZG8iXSwiYXZhdGFyX3VybCI6bnVsbCwiaWF0IjoxNzg2NjIwNjQ3LCJleHAiOjE3ODY2NDIyNDd9.vZAQV_znvnWr6L0bZf6C17TDw6n3kYX1hfMS-6Sz6z0'
$h=@{Authorization='Bearer '+$tok;'Accept'='application/json'}
$base='c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS'

Write-Host "(A) PROXIMO-NUMERO (corrigido)"
try {
  $r1=Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/ofs/proximo-numero' -Headers $h -Method Get -TimeoutSec 20 -UseBasicParsing
  $r1 | ConvertTo-Json -Depth 5 | Out-File (Join-Path $base '_probe_pos_proximo.json') -Encoding utf8
  Write-Host "OK salvo proximo"
  Get-Content (Join-Path $base '_probe_pos_proximo.json')
} catch {
  ("ERR_A: " + $_.Exception.Message) | Out-File (Join-Path $base '_probe_pos_err.txt') -Encoding utf8
}

Write-Host ""
Write-Host "(B) DIAG_PROXNUM (corrigido)"
try {
  $r2=Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/_diag_proxnum' -Headers $h -Method Get -TimeoutSec 90 -UseBasicParsing
  $r2 | ConvertTo-Json -Depth 10 | Out-File (Join-Path $base '_probe_pos_diag.json') -Encoding utf8
  Write-Host "OK salvo diag"
} catch {
  ("ERR_B: " + $_.Exception.Message) | Out-File (Join-Path $base '_probe_pos_err.txt') -Encoding utf8
  Write-Host ("ERR_B: " + $_.Exception.Message)
}

Write-Host ""
Write-Host "(C) /api/ofs (order=numero desc, incluir_excluidas=0)"
try {
  $url3='https://adm.italyembalagens.com.br/api/ofs?limit=3&order_by=numero&order=desc&incluir_excluidas=0&nocache=1&t='+[DateTimeOffset]::Now.ToUnixTimeSeconds()
  $r3=Invoke-RestMethod -Uri $url3 -Headers $h -Method Get -TimeoutSec 20 -UseBasicParsing
  $r3 | ConvertTo-Json -Depth 5 | Out-File (Join-Path $base '_probe_pos_ofs_numero.json') -Encoding utf8
  Write-Host "OK salvo ofs_numero"
} catch {
  ("ERR_C: " + $_.Exception.Message) | Out-File (Join-Path $base '_probe_pos_err.txt') -Encoding utf8
  Write-Host ("ERR_C: " + $_.Exception.Message)
}

Write-Host ""
Write-Host "(D) COUNT OFs MOVEIS RIPKE (cli_id be617df1-441a-4f11-918e-d813a5ac854c) pela API /api/ofs"
try {
  $url4='https://adm.italyembalagens.com.br/api/ofs?cli_id=be617df1-441a-4f11-918e-d813a5ac854c&incluir_excluidas=0&limit=1&offset=0&nocache=1&t='+[DateTimeOffset]::Now.ToUnixTimeSeconds()
  $r4=Invoke-RestMethod -Uri $url4 -Headers $h -Method Get -TimeoutSec 30 -UseBasicParsing
  $res4=@{total=$r4.total; data_len=($r4.data.Count); hasMore=$r4.hasMore; first_of=if($r4.data -and $r4.data.Count -gt 0){@{id=$r4.data[0].id; numero=$r4.data[0].numero; clinome=$r4.data[0].clinome; status=$r4.data[0].status; deleted_at=if($r4.data[0].deleted_at){[string]$r4.data[0].deleted_at.Substring(0,[Math]::Min(19,[string]$r4.data[0].deleted_at.Length))}else{$null} }}else{$null}}
  $res4 | ConvertTo-Json -Depth 5 | Out-File (Join-Path $base '_probe_ripke_total.json') -Encoding utf8
  Write-Host "OK salvo ripke_total"
  Get-Content (Join-Path $base '_probe_ripke_total.json')
} catch {
  ("ERR_D: " + $_.Exception.Message) | Out-File (Join-Path $base '_probe_ripke_err.txt') -Encoding utf8
  Write-Host ("ERR_D: " + $_.Exception.Message)
}

Write-Host "DONE probes saved."
