$ErrorActionPreference='Continue'
$T=(node _gera.cjs) -replace "`r|`n",''
Write-Output "TOKEN OK len=$($T.Length)"
$hdr=@{ 'Authorization'="Bearer $T"; 'Accept'='application/json'; 'Cache-Control'='no-cache' }
$EU='df5f7672-0a6b-402d-ae65-296554236c31'
$R={ param($u) return Invoke-RestMethod -Uri $u -Method GET -Headers $hdr -UseBasicParsing -TimeoutSec 120 }
try {
  $r1 = &$R ("https://adm.italyembalagens.com.br/api/clientes?empId=$([Uri]::EscapeDataString($EU))&search=RIPKE&limit=10&nc=$(Get-Random)")
  $arr=@()
  if($r1.data -ne $null){$arr=@($r1.data)}else{$arr=@($r1)}
  Write-Output "=== (1) search=RIPKE & empId=UUID ==="
  Write-Output "qtd=$($arr.Count)"
  foreach($c in $arr){
    if($c.id){$cid=$c.id.Substring(0,12)}else{$cid="NULL"}
    $empresaId = $c.empresa_id
    if($empresaId -ne $null -and $empresaId -ne ''){$empresaId=$empresaId.Substring(0,12)}
    Write-Output "  id=$cid nome=$($c.nome) emp_id=$($c.emp_id) empresa_id=$empresaId ativo=$($c.ativo) codigo=$($c.codigo)"
  }
  Start-Sleep -Seconds 1
  Write-Output ""
  Write-Output "=== (2) todos clientes da empresa (limit 500) ==="
  $r2 = &$R ("https://adm.italyembalagens.com.br/api/clientes?empId=$([Uri]::EscapeDataString($EU))&limit=500&nc=$(Get-Random)")
  $arr2=@()
  if($r2.data -ne $null){$arr2=@($r2.data)}else{$arr2=@($r2)}
  Write-Output "total=$($arr2.Count)"
  $nomes=@()
  $moveis=@()
  foreach($c in $arr2){
    $n=$c.nome
    $nomes += $n
    if($n -match 'RIPKE|moveis|MOVEIS|m.v.is|M.V.IS'){
      if($c.id){$cid=$c.id.Substring(0,12)}else{$cid='NULL'}
      $moveis += @("$cid $n")
    }
  }
  Write-Output "=== 20 primeiros nomes ==="
  for($i=0;$i -lt [Math]::Min(20,$nomes.Count);$i++){ Write-Output "  [$i] $($nomes[$i])" }
  Write-Output "=== Moveis/RIPKE na lista ($($moveis.Count)) ==="
  foreach($m in $moveis){ Write-Output "  $m" }
  $RES=@{
    t=Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    r1_count=$arr.Count
    r2_total=$arr2.Count
    tem_ripke_busca=($arr.Count -gt 0)
    tem_ripke_lista_total=(($arr2 | Where-Object { $_.nome -like '*RIPKE*' }).Count -gt 0)
    r2_primeiros_20 = $nomes | Select-Object -First 20
    r2_match_ripke_moveis = $moveis
    primeiro_empid_cliente = if($arr2.Count -gt 0){ $arr2[0].emp_id } else { $null }
    primeiro_empresauuid_cliente = if($arr2.Count -gt 0 -and $arr2[0].empresa_id -ne $null -and $arr2[0].empresa_id -ne ''){ $arr2[0].empresa_id.Substring(0,12) } else { $null }
  }
  $RES | ConvertTo-Json -Depth 6 | Out-File -FilePath '_DIAG_PS.json' -Encoding utf8
  Write-Output ""
  Write-Output "=== RESUMO (json) ==="
  Get-Content '_DIAG_PS.json' -Raw
} catch {
  Write-Output "ERRO: $($_.Exception.Message)"
  if($_.Exception.Response){
    try{
      $sr=New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      Write-Output "RESP BODY: $($sr.ReadToEnd())"
      $sr.Dispose()
    }catch{}
  }
}
