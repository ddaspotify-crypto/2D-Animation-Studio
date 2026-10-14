$ErrorActionPreference = 'Stop'
# Local tools only. Verify the tested build checksum before extracting known entries.
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$toolsDirectory = Join-Path $workspace 'tools'
New-Item -ItemType Directory -Path $toolsDirectory -Force | Out-Null
$archive = Join-Path $toolsDirectory 'ffmpeg-download.zip'
Invoke-WebRequest 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile $archive
$expectedHash = '60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba'
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLower() -ne $expectedHash) { throw 'Build FFmpeg đã thay đổi. Kiểm tra phiên bản theo PHASE5_REVIEW.md; không cài bản khác tự động.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
try {
    foreach ($entry in $zip.Entries) {
        if ($entry.FullName -match '/bin/(ffmpeg|ffprobe)\.exe$') {
            [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, (Join-Path $toolsDirectory $entry.Name), $true)
        } elseif ($entry.Name -eq 'LICENSE') {
            [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, (Join-Path $toolsDirectory 'FFMPEG-LICENSE.txt'), $true)
        }
    }
} finally { $zip.Dispose() }
& (Join-Path $toolsDirectory 'ffmpeg.exe') -version | Select-Object -First 1
Write-Host 'Đã cài FFmpeg vào tools/. Khởi động lại backend của Studio.'
