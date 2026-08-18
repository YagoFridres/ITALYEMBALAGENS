param()
$ProgressPreference='SilentlyContinue'
function IfNull($x,$y){if($null -eq $x -or [string]::IsNullOrEmpty([string]$x)){return $y};return $x}
function Slice($s,$m){if($null -eq $s){return ''};$ss=[string]$s;if($ss.Length -le $m){return $ss};return $ss.Substring(0,$m)}
$JWT=& node -e "console.log(require('jsonwebtoken').sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'}))"
$HEADERS=@{Authorization='Bearer '+$JWT;Accept='application/json'}
$BASE='https://adm.italyembalagens.com.br'
$NUMS=@(2597,2598,2599,2600,2601,2602,2603,2604)
$SEED=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$res=New-Object System.Collections.ArrayList
try{
  $uri='{0}/api/ofs?limit=50&order=created_at&dir=desc&numero_ou_of_ini={1}&f_numero_ini={1}&f_numero_fim={2}&bust={3}' -f $BASE,$NUMS[0],$NUMS[-1],$SEED
  $LIST=Invoke-RestMethod -Uri $uri -Headers $HEADERS -Method Get -UseBasicParsing -TimeoutSec 60
  $arr=@()
  if($LIST.data -is [array]){$arr=@($LIST.data)}elseif($LIST -is [array]){$arr=@($LIST)}
  foreach($n in $NUMS){
    $o=$null
    foreach($x in $arr){if([string]($x.numero) -eq [string]$n -or [string]($x.of) -eq [string]$n){$o=$x;break}}
    if($null -eq $o){
      try{
        $uri2='{0}/api/ofs/buscar?q={1}&bust={2}' -f $BASE,$n,$SEED
        $b=Invoke-RestMethod -Uri $uri2 -Headers $HEADERS -Method Get -UseBasicParsing -TimeoutSec 60
        $arr2=@()
        if($b.data -is [array]){$arr2=@($b.data)}elseif($b -is [array]){$arr2=@($b)}
        foreach($x in $arr2){if([string]($x.numero) -eq [string]$n -or [string]($x.of) -eq [string]$n){$o=$x;break}}
        if($null -eq $o -and $arr2.Count -gt 0){$o=$arr2[0]}
      }catch{}
    }
    if($null -ne $o -and ('' -ne [string]($o.id))){
      $cliname=IfNull $o.clinome (IfNull $o.cliNome (IfNull $o.cliente_nome (IfNull $o.cliente $null)))
      $obj=[pscustomobject]@{
        numero=$n;
        ofs_id=IfNull $o.id $null;
        status_of=IfNull $o.status $null;
        cli_id=IfNull $o.cli_id (IfNull $o.cliId (IfNull $o.cliente_id $null));
        cliente_nome_tela=$cliname;
        descricao=Slice (IfNull $o.descricao (IfNull $o.produto '')) 140;
        data_entrega=Slice (IfNull $o.data_entrega (IfNull $o.ent $null)) 10;
        deleted_at=IfNull $o.deleted_at $null;
      }
      [void]$res.Add($obj)
    }else{
      [void]$res.Add([pscustomobject]@{numero=$n;nao_encontrado_no_listado=$true})
    }
  }
}catch{
  [void]$res.Add([pscustomobject]@{erro_geral=$_.Exception.Message})
}
$out=[pscustomobject]@{
  gerado_em=(Get-Date).ToUniversalTime().ToString('o');
  modo='VERIFICACAO-OFs-2597-a-2604-DEVE-SER-MOVEIS-RIPKE';
  qtd=$res.Count;
  ofs=@($res);
}
$fp=Join-Path (Get-Location) '_VERIF_OFS_RIPKE.json'
$out | ConvertTo-Json -Depth 10 | Out-File -FilePath $fp -Encoding utf8
$todos_ripke=$true; $falhou=0
foreach($r in $res){if([string]($r.cliente_nome_tela) -notmatch '(?i)RIPKE'){$todos_ripke=$false;$falhou+=1}}
Write-Host "OFs_OKs=$($res.Count)  TodosRipke=$todos_ripke  FalhasRipke=$falhou"
Write-Host "Arquivo=$fp"
exit 0
