param()
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$NL = [Environment]::NewLine

function IfNull($x, $y) {
  if ($null -eq $x -or [string]::IsNullOrEmpty([string]$x)) { return $y }
  return $x
}
function SubSafe($s, $max) {
  if ($null -eq $s) { return '' }
  $ss = [string]$s
  if ($ss.Length -le $max) { return $ss }
  return $ss.Substring(0, $max)
}
function SliceDate($s) {
  if ($null -eq $s) { return '' }
  return SubSafe ([string]$s) 19
}

$JWT = & node -e "console.log(require('jsonwebtoken').sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'}))"
Write-Host "TOKEN_LEN=$($JWT.Length)"

$HEADERS = @{
  'Authorization' = 'Bearer ' + $JWT
  'Accept' = 'application/json'
}
$SEED = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$BASE = 'https://adm.italyembalagens.com.br'

$OFS_IDS = @(
  'c4db942d-7024-401a-a330-56a7faed344a',
  'afea1a07-acb8-4967-8a1e-fa16ecc8da1b',
  'c5478e8b-c98c-40de-98de-65477363bc26',
  '0a49f941-426a-4f35-ab81-118ad57423b4',
  '3100fdd2-6d75-49c5-a3ce-18fe3a58e0f0',
  'b2886f39-c729-4592-ba55-3a7cc37713c3',
  '15ce6411-1e9a-40cf-80af-c5e6ebda1247',
  'c2f83ddc-1b71-45c3-86f5-163638bde440'
)
$OFS = New-Object System.Collections.ArrayList
foreach ($id in $OFS_IDS) {
  try {
    $uri = '{0}/api/ofs/{1}?seed={2}' -f $BASE, $id, $SEED
    $o = Invoke-RestMethod -Uri $uri -Headers $HEADERS -Method Get -UseBasicParsing -TimeoutSec 60
    if ($null -ne $o -and $null -ne $o.id) {
      $numero = IfNull $o.numero $o.of
      $seq = IfNull $o.seq $null
      $emp_id = IfNull $o.emp_id $null
      $empresa_id = IfNull $o.empresa_id $null
      $tmp = IfNull $o.cli_id ($null)
      if ($null -eq $tmp) { $tmp = IfNull $o.cliId ($null) }
      if ($null -eq $tmp) { $tmp = IfNull $o.cliente_id ($null) }
      $cli_id = $tmp
      $tmp2 = IfNull $o.clinome ($null)
      if ($null -eq $tmp2) { $tmp2 = IfNull $o.cliNome ($null) }
      if ($null -eq $tmp2) { $tmp2 = IfNull $o.cliente_nome ($null) }
      if ($null -eq $tmp2) { $tmp2 = IfNull $o.cliente ($null) }
      $nome_cliente_of = $tmp2
      $descrRaw = IfNull $o.descricao $o.produto
      $prodRaw = IfNull $o.produto ''
      $obj = [pscustomobject]@{
        id = $o.id
        numero = $numero
        seq = $seq
        emp_id = $emp_id
        empresa_id = $empresa_id
        cli_id = $cli_id
        nome_cliente_of = $nome_cliente_of
        descricao = SubSafe $descrRaw 120
        produto = SubSafe $prodRaw 120
        created_at = SliceDate $o.created_at
        deleted_at = IfNull $o.deleted_at $null
      }
      [void]$OFS.Add($obj)
    }
  } catch {
    [void]$OFS.Add([pscustomobject]@{ id = $id; error = $_.Exception.Message })
  }
}
Write-Host "OFS_ENCONTRADOS=$($OFS.Count)"

$CLI_IDS = @(
  'cef7e8c5-e6d2-49a8-984b-8c44a687e278',
  '3f11ccd8-00b2-4eda-b1fd-c8b660367a50'
)
$CLIS = New-Object System.Collections.ArrayList
try {
  $uri = '{0}/api/clientes?q={1}&order=cln_{2}' -f $BASE, [Uri]::EscapeDataString('NOME REAL AQUI'), $SEED
  $rclis = Invoke-RestMethod -Uri $uri -Headers $HEADERS -Method Get -UseBasicParsing -TimeoutSec 60
  $arr = @()
  if ($rclis.data -is [array]) { $arr = @($rclis.data) }
  elseif ($rclis -is [array]) { $arr = @($rclis) }
  foreach ($c in $arr) {
    if ($CLI_IDS -contains [string]$c.id) {
      $total = IfNull $c.total_ofs ($null)
      if ($null -eq $total) { $total = IfNull $c.total_ofs_listagem ($null) }
      $obj = [pscustomobject]@{
        id = [string]$c.id
        nome = IfNull $c.nome $null
        rs = IfNull $c.rs (IfNull $c.razao_social $null)
        codigo = IfNull $c.codigo $null
        empresa_id = IfNull $c.empresa_id $null
        created_at = SliceDate $c.created_at
        deleted_at = IfNull $c.deleted_at $null
        total_ofs_listagem = $total
      }
      [void]$CLIS.Add($obj)
    }
  }
} catch {
  [void]$CLIS.Add([pscustomobject]@{ error = $_.Exception.Message })
}
Write-Host "CLIS_ENCONTRADOS=$($CLIS.Count)"

$EMPS = New-Object System.Collections.ArrayList
try {
  $uri = '{0}/api/empresas?_{1}=1' -f $BASE, $SEED
  $REMPS = Invoke-RestMethod -Uri $uri -Headers $HEADERS -Method Get -UseBasicParsing -TimeoutSec 60
  $ARR_E = @()
  if ($REMPS.data -is [array]) { $ARR_E = @($REMPS.data) }
  elseif ($REMPS -is [array]) { $ARR_E = @($REMPS) }
  foreach ($e in $ARR_E) {
    $n = IfNull $e.nome $e.apelido
    $ei = IfNull $e.emp_id ($null)
    if ($null -eq $ei) { $ei = IfNull $e.codigo_legado ($null) }
    if ($null -eq $ei) { $ei = IfNull $e.codigo ($null) }
    $obj = [pscustomobject]@{
      id = [string]$e.id
      nome = $n
      emp_id = $ei
      apelido = IfNull $e.apelido $null
      created_at = SliceDate $e.created_at
    }
    [void]$EMPS.Add($obj)
  }
} catch {
  [void]$EMPS.Add([pscustomobject]@{ error = $_.Exception.Message })
}
Write-Host "EMPS_QTD=$($EMPS.Count)"

$CORES_SEM = New-Object System.Collections.ArrayList
try {
  $uri = '{0}/api/cores-impressao?_{1}=1' -f $BASE, $SEED
  $RCOR = Invoke-RestMethod -Uri $uri -Headers $HEADERS -Method Get -UseBasicParsing -TimeoutSec 60
  $ARC = @()
  if ($RCOR.data -is [array]) { $ARC = @($RCOR.data) }
  elseif ($RCOR -is [array]) { $ARC = @($RCOR) }
  foreach ($c in $ARC) {
    $nome = [string](IfNull $c.nome '')
    if ($nome -match '(?i)sem\s*impress') {
      $obj = [pscustomobject]@{
        id = [string]$c.id
        nome = $nome
        empresa_id = IfNull $c.empresa_id $null
        codigo = IfNull $c.codigo $null
        hex = IfNull $c.hex $null
        ativo = IfNull $c.ativo $null
        ordem = IfNull $c.ordem $null
      }
      [void]$CORES_SEM.Add($obj)
    }
  }
} catch {
  [void]$CORES_SEM.Add([pscustomobject]@{ error = $_.Exception.Message })
}
Write-Host "CORES_SEM_IMPRESSAO_QTD=$($CORES_SEM.Count)"

$UUID_ITALY = $null
$UUID_CARTOESTE = $null
$UUID_OESTEPACK = $null
foreach ($e in $EMPS) {
  if ($null -eq $e.nome -and $null -eq $e.emp_id -and $null -eq $e.apelido) { continue }
  $s = ('{0}|{1}|{2}' -f ([string]($e.nome)).ToUpper(), ([string]($e.emp_id)).ToUpper(), ([string]($e.apelido)).ToUpper())
  if ($null -eq $UUID_ITALY -and ($s -match 'ITALY' -or $s -match '^.*\|E1(\||$)')) { $UUID_ITALY = $e.id }
  if ($null -eq $UUID_CARTOESTE -and ($s -match 'CARTOESTE' -or $s -match '^.*\|E2(\||$)')) { $UUID_CARTOESTE = $e.id }
  if ($null -eq $UUID_OESTEPACK -and ($s -match 'OESTEPACK' -or $s -match '^.*\|E3(\||$)')) { $UUID_OESTEPACK = $e.id }
}

function TemCorPorEmpresa($empId) {
  foreach ($c in $CORES_SEM) { if ([string]$c.empresa_id -eq [string]$empId) { return $true } }
  return $false
}

$OUT = [pscustomobject]@{
  modo = 'PREVIEW-SELECT-SEM-ALTERACOES-DEPLOY-ATUAL-77c4ed3'
  gerado_em = (Get-Date).ToUniversalTime().ToString('o')
  oofs_alvo_8 = [pscustomobject]@{
    tentativas = 8
    encontrados = $OFS.Count
    registros = @($OFS)
  }
  clientes_alvo_2 = [pscustomobject]@{
    ids_buscados = @($CLI_IDS)
    encontrados = $CLIS.Count
    registros = @($CLIS)
  }
  empresas_todas = [pscustomobject]@{
    qtd = $EMPS.Count
    uuid_italy = $UUID_ITALY
    uuid_cartoeste = $UUID_CARTOESTE
    uuid_oestepack = $UUID_OESTEPACK
    registros = @($EMPS)
  }
  cores_sem_impressao_existentes = [pscustomobject]@{
    qtd = $CORES_SEM.Count
    tem_italy = TemCorPorEmpresa $UUID_ITALY
    tem_cartoeste = TemCorPorEmpresa $UUID_CARTOESTE
    tem_oestepack = TemCorPorEmpresa $UUID_OESTEPACK
    registros = @($CORES_SEM)
  }
}
$fp = Join-Path (Get-Location) '_PREVIEW_LIMPEZA_SEM_ALTERACOES.json'
$OUT | ConvertTo-Json -Depth 10 | Out-File -FilePath $fp -Encoding utf8
$sz = (Get-Item $fp).Length
Write-Host "ARQUIVO=$fp"
Write-Host "TAMANHO=$sz"
exit 0
