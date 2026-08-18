Add-Type -AssemblyName System.Web.Extensions; Add-Type -AssemblyName System.Security;
function Jwt([hashtable]$pay){
  $sec=[Text.Encoding]::UTF8.GetBytes('italy_secret_2026');
  $jser=New-Object Web.Script.Serialization.JavaScriptSerializer; $jser.MaxJsonLength=100mb;
  $h=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($jser.Serialize(@{alg='HS256';typ='JWT'}))).TrimEnd('=').Replace('+','-').Replace('/','_');
  $p=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($jser.Serialize($pay))).TrimEnd('=').Replace('+','-').Replace('/','_');
  $hmac=New-Object Security.Cryptography.HMACSHA256 @(,$sec);
  $s=[Convert]::ToBase64String($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$h.$p"))).TrimEnd('=').Replace('+','-').Replace('/','_');
  return "$h.$p.$s"
}
$tok=Jwt @{id='t';perfil='admin'}
$hdr=@{Authorization="Bearer $tok";Accept='application/json';'Cache-Control'='no-cache'}
Write-Output '=== GET CLIENTES ==='
try{ $resp=Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/clientes?limit=900&nocache='+([Guid]::NewGuid().ToString('N')) -Headers $hdr -Method Get -UseBasicParsing -TimeoutSec 90 } catch { Write-Output 'ERR_CLI: '+$_.Exception.Message; $_ | Format-List * -Force; exit 2 }
$arr=@(); if($resp.data -is [array]){$arr=$resp.data} elseif($resp -is [array]){$arr=$resp}
Write-Output ('arr len='+$arr.Count)
function Norm([string]$s){ if(-not $s){return ''}; $t=$s.Normalize([Text.NormalizationForm]::FormD); $sb=New-Object Text.StringBuilder; foreach($c in $t.ToCharArray()){ if([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [Globalization.UnicodeCategory]::NonSpacingMark){[void]$sb.Append($c)} }; return ($sb.ToString().ToLower().Trim() -replace '\s+',' ') }
$m=@(); foreach($o in $arr){ $nm=Norm (($o.nome??'')+' '+($o.razao_social??'')+' '+($o.nome_fantasia??'')); if($nm -match 'ripke'){ $m+=[pscustomobject]@{id=$o.id.ToString().Substring(0,[Math]::Min(16,$o.id.ToString().Length));nome=$o.nome;empresa_id=($o.empresa_id??$o.emp_id);deleted=[bool]$o.deleted_at;status=$o.status;cliCodigo=$o.codigo??$o.cli_codigo} } }
Write-Output '=== RIPKE ==='
$m | ConvertTo-Json -Depth 3
Write-Output '=== OUTROS NOMES (rotoplast / ruiz / itacir / dkadi) primeiros 2 cada ==='
foreach($n in @('rotoplast','ruiz','itacir','dkadi','moveis rip','ind','ltda','comercio')){
  $mm=@(); $count=0; foreach($o in $arr){ $nm=Norm (($o.nome??'')+' '+($o.razao_social??'')+' '+($o.nome_fantasia??'')); if($nm -match [regex]::Escape($n)){ if($count -lt 2){$mm+=[pscustomobject]@{id=$o.id.ToString().Substring(0,[Math]::Min(12,$o.id.ToString().Length));nome=$o.nome;emp=$o.empresa_id??$o.emp_id;del=[bool]$o.deleted_at}}; $count++ } }
  Write-Output ("-- {0} total={1}" -f $n,$count)
  $mm | ConvertTo-Json -Depth 3
}
Write-Output '=== EMPRESAS ==='
try{ $re=Invoke-RestMethod -Uri 'https://adm.italyembalagens.com.br/api/empresas?nocache='+([Guid]::NewGuid().ToString('N')) -Headers $hdr -Method Get -UseBasicParsing -TimeoutSec 90 } catch { Write-Output 'ERR_EMP: '+$_.Exception.Message }
$earr=@(); if($re.data -is [array]){$earr=$re.data}elseif($re -is [array]){$earr=$re}
Write-Output ('emp count='+$earr.Count)
$earr | ForEach-Object { [pscustomobject]@{id=$_.id;codigo=$_.codigo??$_.emp_id;nome=$_.nome??$_.razao_social} } | ConvertTo-Json -Depth 3
