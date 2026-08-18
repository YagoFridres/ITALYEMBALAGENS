$ErrorActionPreference = "Continue"
$hashes = [System.IO.File]::ReadAllLines((Join-Path $PSScriptRoot "_reverter_hashes.txt"))
$total = $hashes.Count
$startIdx = 43   # 0-based, itens ja OK = 0..42 (43 itens). item 44 visual = idx 43.
$progPath = Join-Path $PSScriptRoot "_revert_progress.txt"
$errPath  = Join-Path $PSScriptRoot "_revert_errors.txt"
$lastOut  = Join-Path $PSScriptRoot "_revert_last_stdout.txt"

Write-Host "START loop2: startIdx=$startIdx  total=$total"

$okCount   = 43
$skipCount = 0
$errCount  = 0

for ($i = $startIdx; $i -lt $total; $i++) {
    $h = $hashes[$i].Trim()
    if (-not $h) { continue }
    $visualN = $i + 1

    $msgLine = git --no-pager show -s --format="%h | %s" $h 2>$null
    $l1 = "[$visualN/$total] Tentando (allow-empty) $msgLine"
    Add-Content -Path $progPath -Value $l1
    Write-Host $l1

    $env:GIT_EDITOR = "true"
    & git --no-pager revert --allow-empty --allow-empty-message --no-edit $h > $lastOut 2>&1
    $rc = $LASTEXITCODE

    if ($rc -eq 0) {
        Add-Content -Path $progPath -Value "[$visualN/$total] OK revert $h"
        $okCount++
        Write-Host "  OK revert $h"
        continue
    }

    # rc != 0: checar conflito REAL (porcelain != ??  = algo staged/unstaged diferente de untracked)
    $porcelain = git --no-pager status --porcelain=v1 2>$null
    $temConflito = $false
    if ($porcelain) {
        foreach ($linha in @($porcelain)) {
            if (-not $linha.StartsWith("??")) { $temConflito = $true; break }
        }
    }

    if (-not $temConflito) {
        $env:GIT_EDITOR = "true"
        & git --no-pager revert --quit 2>&1 | Out-Null
        Add-Content -Path $progPath -Value "[$visualN/$total] SKIP $h (nothing-to-commit / empty / ja revertido cascata; HEAD limpo)"
        $skipCount++
        Write-Host "  SKIP $h (empty/nothing-to-commit)"
        continue
    }

    # Conflito REAL
    $stagedNames  = (git --no-pager diff --cached --name-only 2>$null) -join "|"
    $unstagedNames = (git --no-pager diff --name-only 2>$null) -join "|"
    $lerr = "[$visualN/$total] FALHA revert $h (staged=[$stagedNames] unstaged=[$unstagedNames]) CONFLITO REAL. Abortando loop."
    Add-Content -Path $errPath -Value $lerr
    $errCount++
    Write-Host ("  CONFLITO REAL: " + $lerr)
    break
}

Write-Host ""
Write-Host "=== STATUS FINAL LOOP 2 ==="
Write-Host "OK revert (1+2 loops): $okCount / $total"
Write-Host "SKIP (empty/cascata):      $skipCount"
Write-Host "FALHAS conflito REAL:      $errCount"

if (Test-Path $errPath) {
    Write-Host "=== ULTIMAS LINHAS ERROS ==="
    Get-Content $errPath | Select-Object -Last 5
} else {
    Write-Host "NENHUMA falha de conflito real."
}

Write-Host "=== ULTIMO COMMIT (HEAD) ==="
git --no-pager log -1 --format="%h | %ai | %s"

Write-Host "=== DIFF vs 524fe5d (APENAS 4 arqs principais) ==="
git --no-pager diff --stat 524fe5d -- patch.js server.js sw.js index.html
