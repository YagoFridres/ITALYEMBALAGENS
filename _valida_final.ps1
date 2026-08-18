$tokenFile = "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS\_jwt_token.txt"
$token = Get-Content -Path $tokenFile -Raw
$token = $token.Trim()
Write-Host "Token lido: length=$($token.Length)"

$headers = @{ Authorization = "Bearer $token"; Accept = "application/json" }

$testes = @(
    @{ key='RIPKE';     q='RIPKE';     esperado=422; idFiltro='' },
    @{ key='RUIZ';      q='RUIZ';      esperado=275; idFiltro='' },
    @{ key='ROTOPLAST'; q='ROTOPLAST'; esperado=28;  idFiltro='74ce7e67-f1fc-474f-80fa-8302b43854ee' },
    @{ key='DKADI';     q='DKADI';     esperado=23;  idFiltro='' },
    @{ key='ITACIR';    q='ITACIR';    esperado=14;  idFiltro='' }
)

$resultados = @()
$seed = 100
$outFile = "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS\_VALIDACAO_P1_FINAL.txt"
Set-Content -Path $outFile -Value "" -Encoding UTF8
Add-Content -Path $outFile -Value "=== VALIDACAO FINAL PROMPT 1 - HOTFIX 2 c601dce ==="
Add-Content -Path $outFile -Value "Data: $(Get-Date -Format o)"
Add-Content -Path $outFile -Value "Deploy Railway: 20260811204500 (sw.js + index.html + server.js)"
Add-Content -Path $outFile -Value ""

foreach ($t in $testes) {
    $key = $t.key
    $q = $t.q
    $esp = $t.esperado
    $idFiltro = $t.idFiltro
    $seed++
    $uri = "https://adm.italyembalagens.com.br/api/clientes?q=$([Uri]::EscapeDataString($q))&order=finalp1_$seed&dir=asc"
    Write-Host "[$key] Consultando $q ..."
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $resp = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get -TimeoutSec 90 -UseBasicParsing
        $sw.Stop()
        if ($resp.data -is [array]) { $arr = $resp.data }
        elseif ($resp -is [array]) { $arr = $resp }
        else { $arr = @() }

        $cliente = $null
        if ($idFiltro) {
            foreach ($c in $arr) { if ([string]$c.id -eq $idFiltro) { $cliente = $c; break } }
        }
        if (-not $cliente) {
            foreach ($c in $arr) {
                $nn = if ($c.nome) { [string]$c.nome } else { "" }
                $rs = if ($c.rs) { [string]$c.rs } else { "" }
                $ra = if ($c.razao_social) { [string]$c.razao_social } else { "" }
                $nm = ($nn + $rs + $ra).ToUpper()
                if ($nm.Contains($q.ToUpper())) { $cliente = $c; break }
            }
        }
        if (-not $cliente -and $arr.Count -gt 0) { $cliente = $arr[0] }

        if ($cliente -and $cliente.total_ofs -ne $null) { $total = [int]$cliente.total_ofs } else { $total = $null }

        if ($cliente) {
            $nn = if ($cliente.nome) { [string]$cliente.nome } else { "" }
            $rs = if ($cliente.rs) { [string]$cliente.rs } else { "" }
            if ($nn) { $nomeStr = $nn } else { $nomeStr = $rs }
            $idStr = [string]$cliente.id
        } else {
            $nomeStr = "NAO_ENCONTRADO"
            $idStr = "-"
        }
        if ($total -eq $null) { $totalStr = "NULL" } else { $totalStr = [string]$total }
        $match = ($total -eq $esp)
        if ($match) { $status = "PASSOU" } else { $status = "FALHOU" }

        $idShort = if ($idStr.Length -ge 8) { $idStr.Substring(0,8) } else { $idStr }
        $nomeShort = if ($nomeStr.Length -gt 40) { $nomeStr.Substring(0,40) } else { $nomeStr }
        $linha = "[" + $key.PadRight(10) + "] " + $nomeShort.PadRight(40) + " | id=" + $idShort + " | total_ofs=" + $totalStr.PadLeft(4) + " | esperado=" + $esp.ToString().PadLeft(4) + " | " + $status + " | " + $sw.ElapsedMilliseconds + "ms"
        Write-Host $linha
        Add-Content -Path $outFile -Value $linha

        $resultados += New-Object PSObject -Property @{
            key = $key; nome = $nomeStr; id = $idStr;
            total_ofs_listagem = $total; esperado = $esp;
            match = $match; tempo_ms = $sw.ElapsedMilliseconds; filtrados = $arr.Count
        }
    } catch {
        $sw.Stop()
        $err = $_.Exception.Message
        $linha = "[" + $key + "] ERRO: " + $err
        Write-Host $linha
        Add-Content -Path $outFile -Value $linha
        $resultados += New-Object PSObject -Property @{ key=$key; erro=$err; match=$false }
    }
}

$passaram = 0
foreach ($r in $resultados) { if ($r.match -eq $true) { $passaram++ } }
$total = $resultados.Count
$todos = ($passaram -eq $total)

Add-Content -Path $outFile -Value ""
Add-Content -Path $outFile -Value "=================================================="
$finalStr = "RESULTADO FINAL: $passaram / $total PASSARAM"
if ($todos) { $finalStr += " --- SUCESSO GERAL (5/5)" } else { $finalStr += " --- FALHA" }
Add-Content -Path $outFile -Value $finalStr
Add-Content -Path $outFile -Value "HOTFIX c601dce: cols='*' em ambos modos do helper compartilhado"

Write-Host ""
Write-Host "=================================================="
Write-Host $finalStr
Write-Host "Relatorio: $outFile"

$jsonOut = "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS\_VALIDACAO_P1_FINAL.json"
$resultados | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonOut -Encoding UTF8

if ($todos) { exit 0 } else { exit 1 }
