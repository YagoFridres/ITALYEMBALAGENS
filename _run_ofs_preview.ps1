param()
$ProgressPreference = 'SilentlyContinue'
function IfNull($x,$y){if($null -eq $x -or [string]::IsNullOrEmpty([string]$x)){return $y};return $x}
function Slice($s,$m){if($null -eq $s){return ''};$ss=[string]$s;if($ss.Length -le $m){return $ss};return $ss.Substring(0,$m)}
$JWT = & node -e "console.log(require('jsonwebtoken').sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'}))"
$HEADERS=@{Authorization='Bearer '+$JWT;Accept='application/json'}
$BASE='https://adm.italyembalagens.com.br'
$OFS_IDS=@('c4db942d-7024-401a-a330-56a7faed344a','afea1a07-acb8-4967-8a1e-fa16ecc8da1b','c5478e8b-c98c-40de-98de-65477363bc26','0a49f941-426a-4f35-ab81-118ad57423b4','3100fdd2-6d75-49c5-a3ce-18fe3a58e0f0','b2886f39-c729-4592-ba55-3a7cc37713c3','15ce6411-1e9a-40cf-80af-c5e6ebda1247','c2f83ddc-1b71-45c3-86f5-163638bde440')
$list=New-Object System.Collections.ArrayList
foreach($id in $OFS_IDS){
  try{
    $r=Invoke-RestMethod -Uri ($BASE+'/api/ofs/'+$id) -Headers $HEADERS -Method Get -UseBasicParsing -TimeoutSec 60
    $o=$null
    if($r.data -is [pscustomobject]){$o=$r.data}elseif($r -is [pscustomobject] -and $null -ne $r.id){$o=$r}
    if($null -ne $o -and $null -ne $o.id){
      $cli=IfNull $o.cli_id (IfNull $o.cliId (IfNull $o.cliente_id $null))
      $clin=IfNull $o.clinome (IfNull $o.cliNome (IfNull $o.cliente_nome (IfNull $o.cliente $null)))
      $obj=[pscustomobject]@{
        id=[string]$o.id;
        numero=IfNull $o.numero (IfNull $o.of $null);
        seq=IfNull $o.seq $null;
        status=IfNull $o.status $null;
        emp_id=IfNull $o.emp_id $null;
        empresa_id=IfNull $o.empresa_id $null;
        cli_id=$cli;
        cliente_nome_of=$clin;
        descricao=Slice (IfNull $o.descricao (IfNull $o.produto '')) 140;
        produto=Slice (IfNull $o.produto '') 100;
        qtd=IfNull $o.qtd (IfNull $o.quantidade $null);
        data_entrega=Slice (IfNull $o.data_entrega (IfNull $o.ent $null)) 10;
        created_at=Slice (IfNull $o.created_at $null) 19;
        deleted_at=IfNull $o.deleted_at $null;
      }
      [void]$list.Add($obj)
    }else{
      [void]$list.Add([pscustomobject]@{id=$id;not_found=$true;wrapper_ok=$r.ok;status_http=200})
    }
  }catch{
    [void]$list.Add([pscustomobject]@{id=$id;error=$_.Exception.Message})
  }
}
$out=[pscustomobject]@{
  gerado_em=(Get-Date).ToUniversalTime().ToString('o');
  qtd_ofs=$list.Count;
  ofs=@($list);
}
$fp=Join-Path (Get-Location) '_PREVIEW_COMPLETO_OFS.json'
$out | ConvertTo-Json -Depth 10 | Out-File -FilePath $fp -Encoding utf8
Write-Host "OK ($($list.Count) ofs) -> $fp"
exit 0
