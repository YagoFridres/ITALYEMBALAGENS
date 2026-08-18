$secret = 'italy_secret_2026'
$jwtLib = @"
using System;
using System.Text;
using System.Security.Cryptography;
public class JWT {
    public static string Encode(string payloadJson, string secret) {
        var header = Convert.ToBase64String(Encoding.UTF8.GetBytes("{\"alg\":\"HS256\",\"typ\":\"JWT\"}"));
        var payload = Convert.ToBase64String(Encoding.UTF8.GetBytes(payloadJson));
        var toSign = header + "." + payload;
        var key = Encoding.UTF8.GetBytes(secret);
        using (var hmac = new HMACSHA256(key)) {
            var sig = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(toSign)));
            return toSign + "." + sig;
        }
    }
}
"@
Add-Type -TypeDefinition $jwtLib -ErrorAction SilentlyContinue

$payloadJson = '{"id":"t","perfil":"admin"}'
$token = [JWT]::Encode($payloadJson, $secret)
Write-Host "Token gerado, length=$($token.Length)"

$headers = @{ Authorization = "Bearer $token"; Accept = "application/json" }

$testes = @(
    @{ key='RIPKE';     q='RIPKE';     esperado=422; idFiltro=$null },
    @{ key='RUIZ';      q='RUIZ';      esperado=275; idFiltro=$null },
    @{ key='ROTOPLAST'; q='ROTOPLAST'; esperado=28;  idFiltro='74ce7e67-7095-44c8-9de3-7d28b2243687' },
    @{ key='DKADI';     q='DKADI';     esperado=23;  idFiltro=$null },
    @{ key='ITACIR';    q='ITACIR';    esperado=14;  idFiltro=$null }
)

$resultados = @()
$seed = 1
$outFile = "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS\_validacao_p1_ps.txt"
Set-Content -Path $outFile -Value "" -Encoding UTF8
Add-Content -Path $outFile -Value "=== VALIDACAO PROMPT 1 - PowerShell Invoke-RestMethod - $(Get-Date -Format o) ==="
Add-Content -Path $outFile -Value ""

foreach ($t in $testes) {
    $key = $t.key
    $q = $t.q
    $esp = $t.esperado
    $seed++
    $uri = "https://adm.italyembalagens.com.br/api/clientes?q=$([Uri]::EscapeDataString($q))&order=psp1_$seed&dir=asc"
    Write-Host "[$key] Buscando $q ..."
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $resp = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get -TimeoutSec 120 -UseBasicParsing
        $sw.Stop()
        $arr = if ($resp.data -is [array]) { $resp.data } elseif ($resp -is [array]) { $resp } else { @() }
        
        $cliente = $null
        if ($t.idFiltro) {
            foreach ($c in $arr) { if ($c.id -eq $t.idFiltro) { $cliente = $c; break } }
            if (-not $cliente -and $arr.Count -gt 0) {
                foreach ($c in $arr) {
                    $nomeNome = if ($c.nome) { [string]$c.nome } else { "" }
                    $nomeRs = if ($c.rs) { [string]$c.rs } else { "" }
                    $nomeRa = if ($c.razao_social) { [string]$c.razao_social } else { "" }
                    $nome = ($nomeNome + $nomeRs + $nomeRa).ToUpper()
                    if ($nome -match 'INDUSTRIA|IND.') { $cliente = $c; break }
                }
            }
        }
        if (-not $cliente -and $arr.Count -gt 0) {
            foreach ($c in $arr) {
                $nomeNome = if ($c.nome) { [string]$c.nome } else { "" }
                $nomeRs = if ($c.rs) { [string]$c.rs } else { "" }
                $nomeRa = if ($c.razao_social) { [string]$c.razao_social } else { "" }
                $nome = ($nomeNome + $nomeRs + $nomeRa).ToUpper()
                if ($nome.Contains($q.ToUpper())) { $cliente = $c; break }
            }
        }
        if (-not $cliente -and $arr.Count -gt 0) { $cliente = $arr[0] }

        if ($cliente -and $cliente.total_ofs -ne $null) { $totalOfs = [int]$cliente.total_ofs } else { $totalOfs = $null }
        $match = ($totalOfs -eq $esp)
        
        if ($cliente) {
            $nomeNome = if ($cliente.nome) { [string]$cliente.nome } else { "" }
            $nomeRs = if ($cliente.rs) { [string]$cliente.rs } else { "" }
            if ($nomeNome) { $nomeStr = $nomeNome } elseif ($nomeRs) { $nomeStr = $nomeRs } else { $nomeStr = "?" }
            $idStr = [string]$cliente.id
        } else {
            $nomeStr = "NAO_ENCONTRADO"
            $idStr = "?"
        }
        if ($match) { $status = "PASSOU" } else { $status = "FALHOU" }
        
        if ($totalOfs -eq $null) { $totalStr = "NULL" } else { $totalStr = [string]$totalOfs }
        
        $nomeStrTrunc = $nomeStr
        if ($nomeStrTrunc.Length -gt 35) { $nomeStrTrunc = $nomeStrTrunc.Substring(0,35) }
        $idStrShort = if ($idStr.Length -gt 8) { $idStr.Substring(0,8) } else { $idStr }
        
        $linha = "[" + $key.PadRight(10) + "] " + $nomeStrTrunc.PadRight(35) + " | id=" + $idStrShort + " | total_ofs=" + $totalStr + " | esperado=" + $esp + " | " + $status + " | " + $sw.ElapsedMilliseconds + "ms | filtrados=" + $arr.Count
        
        Write-Host $linha
        Add-Content -Path $outFile -Value $linha
        
        $resultados += New-Object PSObject -Property @{ key=$key; nome=$nomeStr; id=$idStr; total_ofs=$totalOfs; esperado=$esp; match=$match; tempo_ms=$sw.ElapsedMilliseconds; filtrados=$arr.Count }
    }
    catch {
        $sw.Stop()
        $err = $_.Exception.Message
        Write-Host "[ERR $key] $err"
        $linha = "[" + $key + "] ERRO: " + $err
        Add-Content -Path $outFile -Value $linha
        $resultados += New-Object PSObject -Property @{ key=$key; erro=$err; match=$false }
    }
}

$passaram = 0
foreach ($r in $resultados) { if ($r.match -eq $true) { $passaram++ } }
$total = $resultados.Count
$todos = ($passaram -eq $total)

Add-Content -Path $outFile -Value ""
Add-Content -Path $outFile -Value "=== FINAL ==="
$finalStr = "PASSARAM: $passaram / $total"
if ($todos) { $finalStr += "  SUCESSO" } else { $finalStr += "  FALHA" }
Add-Content -Path $outFile -Value $finalStr
Add-Content -Path $outFile -Value "TODOS_PASSARAM: $todos"

$jsonPath = "c:\Users\Usuario\PCP PROGRAMA\ITALYEMBALAGENS\_validacao_p1_final_ps.json"
$resultados | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding UTF8
Add-Content -Path $outFile -Value "JSON: $jsonPath"

Write-Host ""
Write-Host "=== FINAL ==="
Write-Host $finalStr
Write-Host "Relatorio: $outFile"

if ($todos) { exit 0 } else { exit 1 }
