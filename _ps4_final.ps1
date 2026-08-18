$ErrorActionPreference='Continue'
$T=(node _gera.cjs) -replace "`r|`n",''
$h=@{ Authorization="Bearer $T"; Accept='application/json'; 'Cache-Control'='no-cache' }
$EU='df5f7672-0a6b-402d-ae65-296554236c31'
$VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8'
$RIPKE_ID='be617df1-441a-4f11-918e-d813a5ac854c'
$CASES = [ordered]@{
  '0_BASELINE_UUID' = @{ num='99700'; cli=$RIPKE_ID; prod='ZZZ_APAGAR_PS_BASELINE_UUID'; expected_cid_head=$RIPKE_ID.Substring(0,8); expected_status=200; expected_name='MOVEIS RIPKE' }
  '1_EXATO_BANCO_MAIUSC_SEMACENTO' = @{ num='99695'; cli='MOVEIS RIPKE'; prod='ZZZ_APAGAR_PS_EXATO_BANCO'; expected_cid_head=$RIPKE_ID.Substring(0,8); expected_status=200; expected_name='MOVEIS RIPKE' }
  '2_CASO_B_MINUSC_SEMACENTO' = @{ num='99698'; cli='moveis ripke'; prod='ZZZ_APAGAR_PS_CASOB'; expected_cid_head=$RIPKE_ID.Substring(0,8); expected_status=200; expected_name='MOVEIS RIPKE' }
  '3_CASO_C_INEXISTENTE' = @{ num='99697'; cli='cliente xablau 9999'; prod='ZZZ_APAGAR_PS_CASOC'; expected_status=400; expected_ref_contem='xablau 9999' }
  '4_CASO_D_AMBIGUO' = @{ num='99696'; cli='moveis'; prod='ZZZ_APAGAR_PS_CASOD'; expected_status_min=200; expected_status_max=499 }
  '5_CASO_A_COM_ACENTO_MAIUSC' = @{ num='99699'; cli='MÓVEIS RIPKE'; prod='ZZZ_APAGAR_PS_CASOA_ACENTO'; expected_cid_head=$RIPKE_ID.Substring(0,8); expected_status=200; expected_name='MOVEIS RIPKE' }
}
$RESULTS=@()
foreach($k in $CASES.Keys){
  $case=$CASES[$k]
  $cliVal=$case.cli
  $bodyObj=[ordered]@{
    empresa_id=$EU; empId=$EU; emp_id='E1'
    vendedor_id=$VEND; vendId=$VEND
    cli_id=$cliVal; cliId=$cliVal; cliente_id=$cliVal
    numero=$case.num; of=$case.num
    produto=$case.prod; qtd=1; valor_unitario=10; valor_total=10
    data_entrega='2026-12-31'; data_pedido='2026-08-12'; status='Em aberto'
    caixa_comprimento=10; caixa_largura=10
    itens=@(@{ desc=$case.prod; qtd=1; valor_unitario=10 })
    imgs=@()
  }
  $jsonBody = $bodyObj | ConvertTo-Json -Depth 10 -Compress
  [byte[]]$utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
  $row=[ordered]@{ CASO=$k; CLI_ENTRADA=$cliVal; STATUS=0; OK=$false; ID=''; CID=''; NOME=''; MODO=''; ERR=''; REF=''; QTD=$null; OPS=@(); DEL=$false }
  try{
    $resp = Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/ofs' -Method POST -Headers $h -Body $utf8Bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 180
    $d=$resp.data
    $row.STATUS=200
    if($d.id){ $row.ID=$d.id.Substring(0,14); if($d.cli_id){$row.CID=$d.cli_id.Substring(0,14)}elseif($d.cliente_id){$row.CID=$d.cliente_id.Substring(0,14)}; $row.NOME=$d.clinome; if(-not $row.NOME){$row.NOME=$d.cliente_nome}; $row.MODO=$d.modo_resolvido }
    if($case.expected_status -eq 200){ $row.OK = ($row.CID.StartsWith($case.expected_cid_head) -and $row.NOME -like $case.expected_name) }
    if($d.id){
      try{
        $delResp = Invoke-RestMethod -Uri ("https://adm.italyembalagens.com.br/api/ofs/"+$d.id) -Method DELETE -Headers $h -UseBasicParsing -TimeoutSec 90
        $row.DEL = ($delResp.ok -or $delResp.data.deleted_at -or $delResp.deleted_at)
      }catch{ $row.DEL="ERR_DEL $($_.Exception.Message.Substring(0,80))" }
    }
  }catch{
    $ex=$_.Exception
    try{ $row.STATUS=[int]$ex.Response.StatusCode }catch{}
    $bodyRaw=''
    try{
      $sr=New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
      $bodyRaw=$sr.ReadToEnd()
      $sr.Dispose()
      $j=$bodyRaw | ConvertFrom-Json
      $row.ERR=$j.error
      $row.REF=$j.ref
      $row.QTD=$j.qtd
      if($j.candidatos){ $row.OPS=@($j.candidatos | ForEach-Object { $_.nome } | Select-Object -First 6) }
    }catch{}
    if($case.expected_status -and $row.STATUS -eq $case.expected_status){
      if($case.expected_ref_contem){ $row.OK = $row.REF -like "*$($case.expected_ref_contem)*" }
      else { $row.OK = $true }
    }
    if($case.expected_status_min){ if($row.STATUS -ge $case.expected_status_min -and $row.STATUS -le $case.expected_status_max){ if($row.ERR -or $row.CID){ $row.OK=$true } } }
  }
  $RESULTS += $row
  Start-Sleep -Milliseconds 600
}
# proximo numero OF
try { $pn=Invoke-RestMethod -Uri "https://adm.italyembalagens.com.br/api/ofs/proximo-numero?nc=$(Get-Random)" -Method GET -Headers $h -UseBasicParsing -TimeoutSec 60; $RESULTS += [ordered]@{ CASO='PROX_NUMERO_FINAL'; CLI_ENTRADA='-'; STATUS=200; OK=($pn.proximo -eq '2605'); ID="-"; CID="-"; NOME="proximo=$($pn.proximo) maior=$($pn.maior)"; MODO=''; ERR=''; REF=''; QTD=$null; OPS=@(); DEL=$false } } catch {}
$FINAL=[ordered]@{
  timestamp=Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  casos=$RESULTS
  resumo=[ordered]@{
    passou=($RESULTS | Where-Object { $_.OK -eq $true }).Count
    total=($RESULTS | Where-Object { $_.OK -ne $null -and $_.CASO -ne 'PROX_NUMERO_FINAL' }).Count
    prox_num_ok=($RESULTS | Where-Object { $_.CASO -eq 'PROX_NUMERO_FINAL' } | Select-Object -First 1 -ExpandProperty OK)
    tudo_ok=$false
  }
}
$tudo = @($RESULTS | Where-Object { $_.OK -ne $null })
$FINAL.resumo.tudo_ok = ($tudo.Count -gt 0 -and ($tudo | Where-Object { $_.OK -ne $true }).Count -eq 0)
$FINAL | ConvertTo-Json -Depth 10 | Out-File -FilePath '_PS4_FINAL.json' -Encoding utf8
Write-Output "=== RESUMO ==="
foreach($r in $RESULTS){
  Write-Output "CASO $($r.CASO.PadRight(30)) status=$($r.STATUS) ok=$($r.OK) cid=$($r.CID.PadRight(14)) nome=$($r.NOME) ref=$($r.REF.Substring(0,[Math]::Min(40,$r.REF.Length))) ops=$($r.OPS.Count)"
}
Write-Output "RESULTADO FINAL: passou=$($FINAL.resumo.passou)/$($FINAL.resumo.total) prox_num_2605=$($FINAL.resumo.prox_num_ok) tudo_ok=$($FINAL.resumo.tudo_ok)"
