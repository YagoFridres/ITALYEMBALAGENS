$ProgressPreference = "SilentlyContinue"; $ErrorActionPreference = "Stop";
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAzNzUwMjhkLTc2NTItNDhjNS05MTZjLTNhMzI1ZDcyYjRlMiIsIm5vbWUiOiJBRElNSU5JU1RSQURPUiIsImVtYWlsIjoiaXRhbHkiLCJwZXJmaWwiOiJhZG1pbiIsInBlcm1pc3NvZXMiOlsidHVkbyJdLCJhdmF0YXJfdXJsIjoiaHR0cHM6Ly91YnlnanF4a2ZsZmFjaHRsb2dkdy5zdXBhYmFzZS5jby9zdG9yYWdlL3YxL29iamVjdC9wdWJsaWMvY2hhdC1hcnF1aXZvcy9hdmF0YXJlcy8wMzc1MDI4ZC03NjUyLTQ4YzUtOTE2Yy0zYTMyNWQ3MmI0ZTIuanBnP3Y9MTc4MDQxMTMzODY0NiIsImlhdCI6MTc4NjYyOTc1MiwiZXhwIjoxNzg5MjIxNzUyfQ.o92KGHEY04rJ390cmd4eroZUxijy92NXKIKf7Qi9kEI";
$headers = @{ Authorization = "Bearer $token" };
$chunkLimit = 500; $maxPages = 5; $all = New-Object System.Collections.ArrayList;
$prog = New-Object System.Collections.ArrayList;
for ($page = 0; $page -lt $maxPages; $page++) {
  $t = ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString()) + "_$page";
  $url = "https://adm.italyembalagens.com.br/api/clientes?lite=1&limit=$chunkLimit&offset=$($page*$chunkLimit)&nocache=1&order=created_at&dir=desc&t=$t";
  try {
    $r = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -UseBasicParsing -TimeoutSec 45;
    $arr = @();
    if ($r.ok -and $r.data -is [array]) { $arr = @($r.data) }
    elseif ($r.data -is [array]) { $arr = @($r.data) }
    $firstId = if ($arr.Count) { $arr[0].id } else { $null };
    $lastId  = if ($arr.Count) { $arr[-1].id } else { $null };
    [void]$prog.Add([pscustomobject]@{ page=$page; arr=$arr.Count; ok=$r.ok; err=$r.err; firstId=$firstId; lastId=$lastId });
    foreach ($a in $arr) { [void]$all.Add($a) }
    if ($arr.Count -lt $chunkLimit) { break; }
  } catch {
    [void]$prog.Add([pscustomobject]@{ page=$page; arr=-1; ok=$false; err=$_.Exception.Message; firstId=$null; lastId=$null });
    break;
  }
}
$total = $all.Count;
$ripke = @($all | Where-Object { ($_.nome + $_.clinome + $_.razao_social + $_."razão social") -match "RIPKE" });
$ripkeMax = 0;
foreach ($r in $ripke) {
  $v = 0;
  if ($r.qtd_ofs)    { $v = [Math]::Max($v, [int]([string]$r.qtd_ofs -as [int])); }
  if ($r.num_ofs)    { $v = [Math]::Max($v, [int]([string]$r.num_ofs -as [int])); }
  if ($r.qtd_of)     { $v = [Math]::Max($v, [int]([string]$r.qtd_of -as [int])); }
  if ($r.of_count)   { $v = [Math]::Max($v, [int]([string]$r.of_count -as [int])); }
  if ($r.total_ofs)  { $v = [Math]::Max($v, [int]([string]$r.total_ofs -as [int])); }
  if ($v -gt $ripkeMax) { $ripkeMax = $v }
}
Write-Host "=== PAGES ===" -ForegroundColor Cyan;
$prog | Format-Table page, arr, ok, err, firstId, lastId -AutoSize | Out-String | Write-Host;
Write-Host "=== TOTAL CLIENTES: $total ===" -ForegroundColor Green;
Write-Host "=== RIPKE MATCHES: $($ripke.Count)  |  MAX QTD_OFS: $ripkeMax ===" -ForegroundColor Yellow;
if ($ripke.Count) {
  Write-Host "=== RIPKE SAMPLE ===" -ForegroundColor Yellow;
  $r0 = $ripke[0];
  $r0 | Select-Object id, nome, qtd_ofs, qtd_of, num_ofs, of_count, total_ofs, total_valor, vl_total, empId, cidade, uf | Format-List | Out-String | Write-Host;
}
