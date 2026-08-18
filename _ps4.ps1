$T = Get-Content "_fresh_tok.txt" -Raw; $T = ($T -replace "`r|`n",'').Trim(); $hdr = @{ 'Authorization' = "Bearer $T"; 'Accept' = 'application/json'; 'Cache-Control' = 'no-cache' };
$EU='df5f7672-0a6b-402d-ae65-296554236c31'; $VEND='b362b262-0b8f-40e3-865f-7eb5bfe226c8';
$cases = @(
  @{ N='A_EXATO_BANCO'; CLI='MOVEIS RIPKE'; NUM='99695'; PROD='ZZZ_TESTE_APAGAR_CASOEXATO_BANCO' },
  @{ N='A_ACENTO'; CLI='MÓVEIS RIPKE'; NUM='99699'; PROD='ZZZ_TESTE_APAGAR_CASOA_ACENTO' },
  @{ N='B_SEMACENTO_MINUSC'; CLI='moveis ripke'; NUM='99698'; PROD='ZZZ_TESTE_APAGAR_CASOB_SEMACENTO' },
  @{ N='C_INEXISTENTE'; CLI='cliente xablau 8888 inexistente'; NUM='99697'; PROD='ZZZ_TESTE_APAGAR_CASOC_INEXISTENTE' },
  @{ N='D_AMBIGUO'; CLI='moveis'; NUM='99696'; PROD='ZZZ_TESTE_APAGAR_CASOD_AMBIGUO' }
);
$RES = New-Object System.Collections.ArrayList;
foreach($c in $cases){
  $body = @{ empresa_id=$EU; empId=$EU; emp_id='E1'; vendedor_id=$VEND; vendId=$VEND; cli_id=$c.CLI; cliId=$c.CLI; cliente_id=$c.CLI; numero=$c.NUM; of=$c.NUM; produto=$c.PROD; qtd=1; valor_unitario=10; valor_total=10; data_entrega='2026-12-31'; data_pedido='2026-08-12'; status='Em aberto'; caixa_comprimento=10; caixa_largura=10; itens=@(@{desc=$c.PROD;qtd=1;valor_unitario=10}); imgs=@() } | ConvertTo-Json -Depth 10 -Compress;
  $o = [ordered]@{ CASO=$c.N; CLI_ENTRADA=$c.CLI };
  try {
    $r = Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/ofs' -Method POST -Headers $hdr -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 180;
    $o.ok = $true; $o.status = 200; $o.id = $r.data.id; $o.numero = $r.data.numero; $o.cli_id = $r.data.cli_id; $o.clinome = $r.data.clinome; $o.cliente_nome = $r.data.cliente_nome; $o.modo = $r.data.modo_resolvido; $o.DEL = '?';
    if($r.data.id){ try { $del = Invoke-RestMethod -Uri ("https://adm.italyembalagens.com.br/api/ofs/"+$r.data.id) -Method DELETE -Headers $hdr -UseBasicParsing -TimeoutSec 90; $o.DEL = ($del.ok -or $del.data.deleted_at -ne $null -or $del.deleted_at -ne $null) } catch { $o.DEL = "ERR: $($_.Exception.Message)" } };
  } catch {
    $resp = $_.Exception.Response; $o.ok = $false; $o.status = 0;
    try {
      $sr = New-Object System.IO.StreamReader($resp.GetResponseStream()); $raw = $sr.ReadToEnd(); $sr.Dispose();
      $j = $raw | ConvertFrom-Json;
      $o.status = [int]$resp.StatusCode; $o.error = $j.error; $o.ref = $j.ref; $o.missing = @($j.missing); $o.qtd = $j.qtd;
      $cands = @(); if($j.candidatos){ $cands = @($j.candidatos | ForEach-Object { $_.nome } | Select-Object -First 6) };
      $o.candidatos = $cands; $o.DEL = 'N/A (não criou)';
    } catch { $o.errmsg = $_.Exception.Message; $o.DEL='N/A' }
  };
  $RES.Add($o) | Out-Null; Start-Sleep -Milliseconds 500;
}
$pn1 = Invoke-RestMethod -Uri ("https://adm.italyembalagens.com.br/api/ofs/proximo-numero?nc="+[Guid]::NewGuid()) -Method GET -Headers $hdr -UseBasicParsing -TimeoutSec 60;
$RESULTS = [ordered]@{ casos = $RES; prox_num_final = $pn1; timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss" };
$RESULTS | ConvertTo-Json -Depth 10 -Compress:$false | Out-File -FilePath "_PS4_CASOS.json" -Encoding utf8;
# Print resumo:
$RES | ForEach-Object { Write-Host "CASO $($_.CASO): status=$($_.status) ok=$($_.ok) cli=$($_.cli_id.Substring(0,[Math]::Min(12,$_.cli_id.Length))) nome=$($_.clinome) modo=$($_.modo) ref=$($_.ref) qtd=$($_.qtd) DEL=$($_.DEL)" };
Write-Host "PROX_NUM FINAL = $($pn1.proximo) (maior=$($pn1.maior))";
