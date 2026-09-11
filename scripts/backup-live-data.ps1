param(
  [string]$SupabaseCli = 'C:/Users/MARCO/AppData/Local/npm-cache/_npx/aa8e5c70f9d8d161/node_modules/supabase/dist/supabase.js'
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$backupRoot = Join-Path $env:LOCALAPPDATA 'SistemaR/backups/live'
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$acl = New-Object System.Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true, $false)
$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule($sid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
$acl.AddAccessRule($rule)
Set-Acl -LiteralPath $backupRoot -AclObject $acl
$destination = Join-Path $backupRoot ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $destination | Out-Null
Push-Location $repoRoot
try {
  if (!(Test-Path -LiteralPath $SupabaseCli)) { throw 'Supabase CLI unavailable; backup not completed.' }
  $linkedProject = (Get-Content -LiteralPath 'supabase/.temp/project-ref' -Raw).Trim()
  if ($linkedProject -ne 'fzbpqgjrdreefontqmnf') { throw 'Linked project mismatch; stopping backup.' }
  & node $SupabaseCli db dump --linked --schema public,private,auth,supabase_migrations --file (Join-Path $destination 'schema.sql')
  if ($LASTEXITCODE -ne 0) { throw 'Schema backup failed.' }
  & node $SupabaseCli db dump --linked --data-only --schema public,private,auth,supabase_migrations --file (Join-Path $destination 'data.sql')
  if ($LASTEXITCODE -ne 0) { throw 'Data backup failed.' }
  foreach ($name in @('schema.sql','data.sql')) {
    if ((Get-Item -LiteralPath (Join-Path $destination $name)).Length -eq 0) { throw 'Empty backup file.' }
  }
  # Marker is written only after both exports succeed. No automatic pruning.
  Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $destination 'schema.sql'),(Join-Path $destination 'data.sql') |
    Select-Object Hash,Path | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $destination 'COMPLETE.json') -Encoding UTF8
  Write-Output "Backup complete: $destination"
} finally { Pop-Location }
