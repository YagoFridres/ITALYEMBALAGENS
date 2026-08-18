Add-Type -AssemblyName System.Security
function Gen-Jwt {
  param([hashtable]$Header,[hashtable]$Payload,[string]$Secret)
  $ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer; $ser.MaxJsonLength=100mb
  $h=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($ser.Serialize($Header))).TrimEnd('=').Replace('+','-').Replace('/','_')
  $p=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($ser.Serialize($Payload))).TrimEnd('=').Replace('+','-').Replace('/','_')
  $hmac=New-Object Security.Cryptography.HMACSHA256 @(,[Text.Encoding]::UTF8.GetBytes($Secret))
  $s=[Convert]::ToBase64String($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$h.$p"))).TrimEnd('=').Replace('+','-').Replace('/','_')
  return "$h.$p.$s"
}
$jwt = Gen-Jwt -Header @{alg='HS256';typ='JWT'} -Payload @{id='t';perfil='admin'} -Secret 'italy_secret_2026'
$hdr = @{Authorization="Bearer $jwt";Accept='application/json';'Cache-Control'='no-cache'}
Write-Output '--- 1) Busca clientes RIPKE (SEM FILTRO EMPRESA) ---'
try { $r = Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/clientes?search=RIPKE&limit=10&incluir_inativos=true&nocache='+([Guid]::NewGuid().ToString('N')) -Headers $hdr -Method Get -UseBasicParsing -TimeoutSec 90 } catch { Write-Output 'ERR1: '+$_.Exception.Message; exit 2 }
$arr = @(); if($r.data -is [array]){$arr=$r.data}elseif($r -is [array]){$arr=$r}
Write-Output ("total="+$arr.Count)
$norm = { param($s) if(-not $s){return ''}; $t=$s.Normalize([Text.NormalizationForm]::FormD); $sb=New-Object Text.StringBuilder; foreach($c in $t.ToCharArray()){ if([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [Globalization.UnicodeCategory]::NonSpacingMark){ [void]$sb.Append($c) } }; return ($sb.ToString().ToLower().Trim() -replace '\s+',' ') }
$objList = @(); foreach($o in $arr){
  $n1 = & $norm (($o.nome??'')+' '+($o.rs??'')+' '+($o.razao_social??''))
  if($n1 -match 'ripke'){ $objList += [pscustomobject]@{
      id=$o.id.ToString();
      nome=$o.nome; rs=$o.rs; razao=$o.razao_social;
      emp_id=$o.emp_id; empId=$o.empId; empresa_id=$o.empresa_id;
      ativo=$o.ativo; deleted=[bool]$o.deleted_at; codigo=$o.codigo; vendedor_id=$o.vendedor_id
    }
  }
}
$objList | ConvertTo-Json -Depth 4

Write-Output "`n--- 2) Lista Empresas (primeiras 5) ---"
try { $e = Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/empresas?nocache='+([Guid]::NewGuid().ToString('N')) -Headers $hdr -Method Get -UseBasicParsing -TimeoutSec 90 } catch { Write-Output 'ERR2: '+$_.Exception.Message; exit 2 }
$earr=@(); if($e.data -is [array]){$earr=$e.data}elseif($e -is [array]){$earr=$e}
$empList = @(); $i=0; foreach($o in $earr){ if($i -ge 5){break}; $empList += [pscustomobject]@{id=$o.id.ToString();codigo=$o.codigo;emp_id=$o.emp_id;sigla=$o.sigla;nome=$o.nome??$o.razao_social}; $i++ }
$empList | ConvertTo-Json -Depth 4

Write-Output "`n--- 3) POST Cliente UUID + empresa escolhida (qualquer) + nome produto ZZZ_TESTE ---"
$ripke = $objList[0]; if(-not $ripke){ Write-Output 'ERRO: nao achei cliente ripke no passo 1'; exit 3 }
$emp = $empList[0]; if(-not $emp){ Write-Output 'ERRO: sem empresas'; exit 3 }
$payload = @{
  empresa_id=$emp.id; empId=$emp.id; emp_id=($emp.codigo??$emp.sigla??$emp.emp_id??$null);
  vendedor_id='b362b262-0b8f-40e3-865f-7eb5bfe226c8'; vendId='b362b262-0b8f-40e3-865f-7eb5bfe226c8';
  cli_id=$ripke.id; cliId=$ripke.id; cliente_id=$ripke.id;
  numero='99940'; of='99940';
  produto='ZZZ_TESTE_APAGAR_PS_UIDCLIENTE'; qtd=1; valor_unitario=10; valor_total=10;
  data_entrega='2026-12-31'; data_pedido='2026-08-12'; status='Em aberto';
  itens=@(@{desc='ZZZ_TESTE_APAGAR_PS_UIDCLIENTE';qtd=1;valor_unitario=10}); imgs=@()
}
$body = $payload | ConvertTo-Json -Depth 6
try { $p = Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/ofs' -Headers ($hdr+@{'Content-Type'='application/json'}) -Method Post -Body $body -UseBasicParsing -TimeoutSec 90 } catch {
  $p = $_.Exception.Response; $errResp = ''
  try { $rs=$_.Exception.Response.GetResponseStream(); $rd=New-Object IO.StreamReader($rs); $errResp=$rd.ReadToEnd(); } catch {}
  Write-Output ('ERR3 POST UUID status HTTP=' + $_.Exception.Response.StatusCode.value__ + ' ' + $errResp);
  exit 4
}
Write-Output ('POST status HTTP=OK, payload resp keys=' + (($p | Get-Member -MemberType NoteProperty).Name -join ', '))
$pD = $p.data ?? $p; Write-Output ('OF criada: id=' + ($pD.id.ToString().Substring(0,[Math]::Min(18,$pD.id.ToString().Length))) + ' cli_id=' + ($pD.cli_id??$pD.cliente_id).ToString().Substring(0,[Math]::Min(10,($pD.cli_id??$pD.cliente_id??'').ToString().Length)) + ' clinome=' + ($pD.clinome??$pD.cliente_nome??''))
$ofId = $pD.id.ToString();
if($ofId){
  Write-Output ('--- 4) SOFT-DELETE da OF teste id=' + $ofId.Substring(0,12) + ' ---')
  try{ $dd = Invoke-RestMethod -Uri ('https://adm.italyembalagens.com.br/api/ofs/'+$ofId) -Headers $hdr -Method Delete -UseBasicParsing -TimeoutSec 90; Write-Output ('DELETE status ok=' + ($dd.ok -or $dd.data.deleted_at -or $dd.status -eq 200)) } catch { Write-Output 'ERR4 DEL: '+$_.Exception.Message }
}

Write-Output "`n--- 5) POST CASO A - nome MÓVEIS RIPKE (COM ACENTO) MESMA EMPRESA ---"
$payA = @{
  empresa_id=$emp.id; empId=$emp.id; emp_id=($emp.codigo??$emp.sigla??$emp.emp_id??$null);
  vendedor_id='b362b262-0b8f-40e3-865f-7eb5bfe226c8'; vendId='b362b262-0b8f-40e3-865f-7eb5bfe226c8';
  cli_id='MÓVEIS RIPKE'; cliId='MÓVEIS RIPKE'; cliente_id='MÓVEIS RIPKE';
  numero='99939'; of='99939';
  produto='ZZZ_TESTE_APAGAR_PS_CASOA_ACENTO'; qtd=1; valor_unitario=10; valor_total=10;
  data_entrega='2026-12-31'; data_pedido='2026-08-12'; status='Em aberto';
  itens=@(@{desc='ZZZ_TESTE_APAGAR_PS_CASOA_ACENTO';qtd=1;valor_unitario=10}); imgs=@()
}
try { $rA = Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/ofs' -Headers ($hdr+@{'Content-Type'='application/json'}) -Method Post -Body ($payA | ConvertTo-Json -Depth 6) -UseBasicParsing -TimeoutSec 90 } catch {
  $errResp = ''
  try { $rs=$_.Exception.Response.GetResponseStream(); $rd=New-Object IO.StreamReader($rs); $errResp=$rd.ReadToEnd(); } catch {}
  Write-Output ('CASOA HTTP=' + $_.Exception.Response.StatusCode.value__ + ' body=' + $errResp)
  $rA = $null
  $errA = $errResp
}
if($rA){ $rAd = $rA.data??$rA; Write-Output ('CASOA OK id=' + $rAd.id.ToString().Substring(0,[Math]::Min(14,$rAd.id.ToString().Length)) + ' cli=' + ($rAd.cli_id??$rAd.cliente_id).ToString().Substring(0,[Math]::Min(10,($rAd.cli_id??'').ToString().Length)) + ' nome=' + ($rAd.clinome??$rAd.cliente_nome??'')); if($rAd.id){ $ofA = $rAd.id.ToString(); try{ $dA = Invoke-RestMethod -Uri ('https://adm.italyembalagens.com.br/api/ofs/'+$ofA) -Headers $hdr -Method Delete -UseBasicParsing -TimeoutSec 90; Write-Output ('CASOA DEL status ok=' + ($dA.ok -or $dA.data.deleted_at -or $dA.status -eq 200)) }catch{ Write-Output 'CASOA DEL ERR: '+$_.Exception.Message } } }
exit 0
