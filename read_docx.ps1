Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("c:\Users\evang\OneDrive\Bureau\Projets\OpenChantier\data\OpenChantier_CDC_v2_FutureProof_i18n.docx")
$entry = $zip.GetEntry("word/document.xml")
$stream = $entry.Open()
$reader = New-Object IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

# Replace w:p with newline to keep some paragraph structure
$content = $content -replace '<w:p(?: [^>]+)?>',"`n"

# Remove all other XML tags
$content = $content -replace '<[^>]+>', ''

Write-Output $content
