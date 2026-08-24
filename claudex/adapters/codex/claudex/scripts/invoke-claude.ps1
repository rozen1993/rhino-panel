[CmdletBinding(PositionalBinding = $false)]
param(
    [Parameter(ValueFromPipeline = $true)]
    [AllowEmptyString()]
    [string] $Prompt,

    [Parameter(Mandatory = $true)]
    [string] $ProjectPath,

    [ValidatePattern('^(s|o)/(low|medium|high|ultracode)$')]
    [string] $Profile = 'o/ultracode',

    [ValidateSet('derive', 'review', 'compare')]
    [string] $Phase = 'derive',

    [ValidateSet('project', 'neutral')]
    [string] $ContextProfile = 'project',

    [ValidateSet('text', 'json')]
    [string] $OutputFormat = 'json',

    [string] $SchemaPath,

    [switch] $EncodedStdin,

    [switch] $NoTools,

    [switch] $DryRun
)

begin {
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [Console]::InputEncoding = $utf8NoBom
    [Console]::OutputEncoding = $utf8NoBom
    $OutputEncoding = $utf8NoBom
    $promptParts = [System.Collections.Generic.List[string]]::new()
}

process {
    if ($null -ne $Prompt) {
        $promptParts.Add($Prompt)
    }
}

end {
    $temporarySettingsPath = $null
    $neutralDirectory = $null
    $locationPushed = $false
    $peerStateChanged = $false
    $previousPeerState = $env:CLAUDEX_PEER_ACTIVE
    $claudeExitCode = $null

    try {
        if ($EncodedStdin -and $promptParts.Count -gt 0) {
            throw 'No combines -EncodedStdin con el parametro -Prompt.'
        }

        if ($EncodedStdin) {
            $encodedPrompt = [Console]::In.ReadToEnd().Trim().TrimStart([char] 0xFEFF)
            try {
                $promptText = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encodedPrompt))
            }
            catch {
                throw 'La entrada de -EncodedStdin no es Base64 UTF-8 valido.'
            }
        }
        elseif ($promptParts.Count -gt 0) {
            $promptText = $promptParts -join [Environment]::NewLine
        }
        else {
            $promptText = [Console]::In.ReadToEnd()
        }

        if ([string]::IsNullOrWhiteSpace($promptText)) {
            throw 'Claudex necesita un prompt no vacio por la entrada estandar.'
        }

        if ($env:CLAUDEX_PEER_ACTIVE -eq '1') {
            throw 'Claudex bloqueo una reentrada recursiva desde la sesion par de Claude.'
        }

        try {
            $projectItem = Get-Item -LiteralPath $ProjectPath -ErrorAction Stop
        }
        catch {
            throw "ProjectPath no existe o no es accesible: '$ProjectPath'."
        }

        if (-not $projectItem.PSIsContainer -or $projectItem.PSProvider.Name -ne 'FileSystem') {
            throw "ProjectPath debe ser un directorio del sistema de archivos: '$ProjectPath'."
        }

        $resolvedProjectPath = $projectItem.FullName.TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
        $driveRoot = [IO.Path]::GetPathRoot($resolvedProjectPath).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
        $userProfileRoot = [IO.Path]::GetFullPath($env:USERPROFILE).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
        if ($resolvedProjectPath -ieq $driveRoot -or $resolvedProjectPath -ieq $userProfileRoot) {
            throw "ProjectPath es demasiado amplio para Claudex: '$resolvedProjectPath'. Usa la raiz concreta de un proyecto."
        }

        $profileMatch = [regex]::Match($Profile.ToLowerInvariant(), '^(s|o)/(low|medium|high|ultracode)$')
        if (-not $profileMatch.Success) {
            throw "Perfil invalido: '$Profile'. Usa s|o y low|medium|high|ultracode."
        }

        $modelCode = $profileMatch.Groups[1].Value
        $level = $profileMatch.Groups[2].Value
        $model = if ($modelCode -eq 's') { 'sonnet' } else { 'opus' }
        $effort = if ($level -eq 'ultracode') { 'xhigh' } else { $level }
        $workflowsEnabled = $level -eq 'ultracode'

        $claudeCommand = Get-Command 'claude.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $claudeCommand) {
            $claudeCommand = Get-Command 'claude.cmd' -ErrorAction SilentlyContinue | Select-Object -First 1
        }
        if (-not $claudeCommand) {
            throw 'Claude Code no esta instalado o no esta disponible en PATH.'
        }

        $claudeVersion = (& $claudeCommand.Source --version 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) {
            throw 'No se pudo consultar la version de Claude Code.'
        }

        $claudeHelp = (& $claudeCommand.Source --help 2>&1 | Out-String)
        if ($LASTEXITCODE -ne 0) {
            throw 'No se pudo consultar las capacidades de Claude Code.'
        }

        $requiredFlags = @('--model', '--effort', '--settings', '--setting-sources', '--tools', '--output-format', '--no-session-persistence')
        if ($OutputFormat -eq 'json') {
            $requiredFlags += '--json-schema'
        }
        $missingFlags = @($requiredFlags | Where-Object { $claudeHelp -notmatch [regex]::Escape($_) })
        if ($missingFlags.Count -gt 0) {
            throw "Claude Code $claudeVersion no expone las capacidades requeridas: $($missingFlags -join ', ')."
        }

        $sessionSettings = @{ enableWorkflows = $workflowsEnabled } | ConvertTo-Json -Compress
        $temporarySettingsPath = Join-Path ([IO.Path]::GetTempPath()) ("claudex-settings-$([guid]::NewGuid().ToString('N')).json")
        [IO.File]::WriteAllText($temporarySettingsPath, $sessionSettings, $utf8NoBom)

        $effectiveContextProfile = $ContextProfile
        if ($Phase -eq 'compare') {
            $effectiveContextProfile = 'neutral'
        }

        if ($effectiveContextProfile -eq 'neutral') {
            $neutralDirectory = Join-Path ([IO.Path]::GetTempPath()) ("claudex-neutral-$([guid]::NewGuid().ToString('N'))")
            $workingDirectory = (New-Item -ItemType Directory -Path $neutralDirectory -ErrorAction Stop).FullName
            $settingSources = 'user'
        }
        else {
            $workingDirectory = $resolvedProjectPath
            $settingSources = 'user,project,local'
        }

        $tools = [System.Collections.Generic.List[string]]::new()
        if (-not $NoTools -and $effectiveContextProfile -eq 'project' -and $Phase -ne 'compare') {
            @('Read', 'Glob', 'Grep') | ForEach-Object { $tools.Add($_) }
        }

        $arguments = [System.Collections.Generic.List[string]]::new()
        @(
            '--print',
            '--model', $model,
            '--effort', $effort,
            '--permission-mode', 'plan',
            '--no-session-persistence',
            '--settings', $temporarySettingsPath,
            '--setting-sources', $settingSources,
            '--output-format', $OutputFormat
        ) | ForEach-Object { $arguments.Add($_) }

        if ($tools.Count -eq 0) {
            $arguments.Add('--tools=')
        }
        else {
            $arguments.Add('--tools')
            $arguments.Add(($tools -join ','))
        }

        $resolvedSchemaPath = $null
        if ($OutputFormat -eq 'json') {
            if ([string]::IsNullOrWhiteSpace($SchemaPath)) {
                $schemaName = if ($Phase -eq 'compare') { 'comparison-response.schema.json' } else { 'peer-response.schema.json' }
                $SchemaPath = Join-Path (Split-Path -Parent $PSScriptRoot) "schemas\$schemaName"
            }

            try {
                $schemaItem = Get-Item -LiteralPath $SchemaPath -ErrorAction Stop
            }
            catch {
                throw "No se encontro el esquema de salida: '$SchemaPath'."
            }
            if ($schemaItem.PSIsContainer) {
                throw "SchemaPath debe apuntar a un archivo JSON: '$SchemaPath'."
            }

            $resolvedSchemaPath = $schemaItem.FullName
            $schemaJson = [IO.File]::ReadAllText($resolvedSchemaPath, [Text.Encoding]::UTF8)
            try {
                $null = $schemaJson | ConvertFrom-Json
            }
            catch {
                throw "El esquema de salida no contiene JSON valido: '$resolvedSchemaPath'."
            }

            $schemaNativeArgument = $schemaJson.Replace('"', '\"')
            $arguments.Add('--json-schema')
            $arguments.Add($schemaNativeArgument)
        }

        if ($DryRun) {
            [ordered]@{
                claudeVersion = $claudeVersion
                projectPath = $resolvedProjectPath
                workingDirectory = $workingDirectory
                profile = $Profile.ToLowerInvariant()
                model = $model
                level = $level
                effort = $effort
                enableWorkflows = $workflowsEnabled
                phase = $Phase
                contextProfile = $effectiveContextProfile
                settingSources = $settingSources
                tools = $tools
                outputFormat = $OutputFormat
                schemaPath = $resolvedSchemaPath
                persistentSettingsModified = $false
                arguments = $arguments.ToArray()
            } | ConvertTo-Json -Depth 8
            return
        }

        Push-Location -LiteralPath $workingDirectory
        $locationPushed = $true
        $env:CLAUDEX_PEER_ACTIVE = '1'
        $peerStateChanged = $true

        $argumentArray = $arguments.ToArray()
        $promptText | & $claudeCommand.Source @argumentArray
        $claudeExitCode = $LASTEXITCODE
    }
    finally {
        if ($peerStateChanged) {
            if ($null -eq $previousPeerState) {
                Remove-Item Env:CLAUDEX_PEER_ACTIVE -ErrorAction SilentlyContinue
            }
            else {
                $env:CLAUDEX_PEER_ACTIVE = $previousPeerState
            }
        }

        if ($locationPushed) {
            Pop-Location
        }

        if ($temporarySettingsPath -and (Test-Path -LiteralPath $temporarySettingsPath)) {
            Remove-Item -LiteralPath $temporarySettingsPath -Force -ErrorAction SilentlyContinue
        }

        if ($neutralDirectory -and (Test-Path -LiteralPath $neutralDirectory)) {
            Remove-Item -LiteralPath $neutralDirectory -Force -ErrorAction SilentlyContinue
        }
    }

    if ($null -ne $claudeExitCode -and $claudeExitCode -ne 0) {
        [Console]::Error.WriteLine("Claude Code termino con el codigo de salida $claudeExitCode. Revisa el mensaje anterior para distinguir autenticacion, limite de sesion o conectividad.")
        exit $claudeExitCode
    }
}
