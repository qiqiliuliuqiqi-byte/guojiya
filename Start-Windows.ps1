$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
# PROCESSOR_ARCHITEW6432 covers a 32-bit shell running on a 64-bit OS.
$cpu = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
$arch = switch ($cpu) { 'ARM64' { 'arm64' } 'AMD64' { 'x64' } default { throw 'Only Windows x64 / ARM64 is supported.' } }
$name = "node-v22.22.2-win-$arch"
$archive = Join-Path $PSScriptRoot "runtime\$name.zip"
$node = Join-Path $PSScriptRoot "runtime\$name\node.exe"
if (!(Test-Path $node)) {
    Write-Host 'First start: verifying and extracting bundled Node.js...'
    $expected = ((Get-Content "runtime\$name.sha256" -Raw).Trim() -split '\s+')[0]
    $actual = (Get-FileHash $archive -Algorithm SHA256).Hash
    if ($actual -ne $expected) { throw 'Node.js checksum mismatch. Please extract a fresh package.' }
    Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $PSScriptRoot 'runtime') -Force
}
& $node 'start.cjs'
exit $LASTEXITCODE
