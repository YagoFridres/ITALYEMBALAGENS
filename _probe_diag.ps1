$ProgressPreference='SilentlyContinue'
$tok='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWctbG9jYWwtcHJvYmUtMDAwMSIsIm5vbWUiOiJEaWFnIExvY2FsIFByb2JlIiwiZW1haWwiOiJkaWFnQGxvY2FsIiwicGVyZmlsIjoiYWRtaW4iLCJwZXJtaXNzb2VzIjpbInR1ZG8iXSwiYXZhdGFyX3VybCI6bnVsbCwiaWF0IjoxNzg2NjIwNjQ3LCJleHAiOjE3ODY2NDIyNDd9.vZAQV_znvnWr6L0bZf6C17TDw6n3kYX1hfMS-6Sz6z0'
$h=@{Authorization='Bearer '+$tok;'Accept'='application/json'}

Write-Host "=== (1) PROXIMO-NUMERO ==="
try {
  $r1=Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/ofs/proximo-numero' -Headers $h -Method Get -TimeoutSec 20 -UseBasicParsing
  ConvertTo-Json -InputObject $r1 -Depth 5
} catch {
  Write-Host ("ERR1: " + $_.Exception.Message)
}

Write-Host ""
Write-Host "=== (2) DIAG_PROXNUM (top5 numeros com flag deletado) ==="
try {
  $r2=Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/_diag_proxnum' -Headers $h -Method Get -TimeoutSec 30 -UseBasicParsing
  $res = $r2.res_por_resolver
  $top5 = @()
  $i = 0
  foreach ($x in $res.top15) {
    if ($i -ge 5) { break }
    $top5 += @{n=$x.n;numero=$x.numero;of=$x.of;ofn=$x.of_num;criado=$x.criado;deletado=$x.deletado}
    $i++
  }
  $out = @{
    ok=$res.ok
    proximo=$res.proximo
    maior=$res.maior
    qtd=$res.qtd
    qtdNumeros=$res.qtdNumeros
    numeracaoGlobal=$res.numeracaoGlobal
    incluiDeletadosNoMaximo=$res.incluiDeletadosNoMaximo
    maxSql=$res.maxSql
    sqlOk=$res.sqlOk
    maiorScan=$res.maiorScan
    top5=$top5
  }
  ConvertTo-Json -InputObject $out -Depth 6
} catch {
  Write-Host ("ERR2: " + $_.Exception.Message)
}

Write-Host ""
Write-Host "=== (3) FRONTEND ROUTE /api/ofs?limit=1&order=numero desc&incluir_excluidas=1 ==="
try {
  $url3 = 'https://adm.italyembalagens.com.br/api/ofs?limit=1&order_by=numero&order=desc&incluir_excluidas=1&t=' + [DateTimeOffset]::Now.ToUnixTimeSeconds()
  $r3=Invoke-RestMethod -Uri $url3 -Headers $h -Method Get -TimeoutSec 20 -UseBasicParsing
  $first = $null
  if ($r3.data -and $r3.data.Count -gt 0) { $first = $r3.data[0] }
  elseif ($r3.ofs -and $r3.ofs.Count -gt 0) { $first = $r3.ofs[0] }
  $len = 0
  if ($r3.data) { $len = $r3.data.Count } elseif ($r3.ofs) { $len = $r3.ofs.Count }
  $p = $null
  if ($first) {
    $del = $null
    if ($first.deleted_at) { $del = [string]$first.deleted_at; if ($del.Length -gt 19) { $del = $del.Substring(0,19) } }
    $cre = $null
    if ($first.created_at) { $cre = [string]$first.created_at; if ($cre.Length -gt 19) { $cre = $cre.Substring(0,19) } }
    $p = @{id=$first.id;numero=$first.numero;of=$first.of;of_num=$first.of_num;clinome=$first.clinome;deleted_at=$del;created_at=$cre}
  }
  $f3 = @{total=$r3.total;len=$len;primeiro=$p}
  ConvertTo-Json -InputObject $f3 -Depth 5
} catch {
  Write-Host ("ERR3: " + $_.Exception.Message)
}
