[CmdletBinding(PositionalBinding = $false)]
param(
    [Parameter(ValueFromPipeline = $true)]
    [AllowEmptyString()]
    [string] $Prompt,

    [Parameter(Mandatory = $true)]
    [string] $ProjectPath,

    [ValidatePattern('^(s|o)/(low|medium|high|xhigh|max|ultracode)$')]
    [string] $Profile = 'o/low',

    [ValidateSet('core', 'astro', 'refine')]
    [string] $Pipeline = 'core',

    [ValidateSet('derive', 'review', 'compare')]
    [string] $Phase = 'derive',

    [ValidateSet('project', 'neutral')]
    [string] $ContextProfile = 'project',

    [ValidateSet('text', 'json')]
    [string] $OutputFormat = 'json',

    [string] $SchemaPath,

    [switch] $EncodedStdin,

    [switch] $NoTools,

    [Alias('UsageCeilingPercent')]
    [ValidateRange(1, 100)]
    [double] $UsageCheckpointPercent = 95,

    [ValidateRange(-1, 100)]
    [double] $KnownUsagePercent = -1,

    [switch] $RecoverLatest,

    [string] $RecoverFile,

    [string] $ClaudeCommandPath,

    [switch] $DryRun
)

begin {
function Get-ClaudexRecoveryDirectory {
    if (-not [string]::IsNullOrWhiteSpace($env:CLAUDEX_RECOVERY_DIR)) {
        return [IO.Path]::GetFullPath($env:CLAUDEX_RECOVERY_DIR)
    }

    $localRoot = if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
        [IO.Path]::GetTempPath()
    }
    else {
        $env:LOCALAPPDATA
    }

    return Join-Path $localRoot 'Claudex\recovery'
}

function Remove-ClaudexExpiredRecoveryFiles {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Directory,

        [Parameter(Mandatory = $true)]
        [ValidateRange(1, 8760)]
        [int] $RetentionHours
    )

    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
        return
    }

    $retentionCutoff = [DateTime]::UtcNow.AddHours(-$RetentionHours)
    Get-ChildItem -LiteralPath $Directory -Filter 'claudex-*.jsonl' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTimeUtc -lt $retentionCutoff } |
        ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue
        }
}

function ConvertTo-ClaudexUsagePercent {
    param($Value)

    if ($null -eq $Value) {
        return $null
    }

    $number = 0.0
    if (-not [double]::TryParse(
        [string] $Value,
        [Globalization.NumberStyles]::Float,
        [Globalization.CultureInfo]::InvariantCulture,
        [ref] $number
    )) {
        return $null
    }

    if ([double]::IsNaN($number) -or [double]::IsInfinity($number) -or $number -lt 0) {
        return $null
    }

    if ($number -ge 0 -and $number -le 1) {
        return [math]::Round($number * 100, 2)
    }

    if ($number -gt 100) {
        return $null
    }

    return [math]::Round($number, 2)
}

function Get-ClaudexStreamSummary {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    $partialText = [Text.StringBuilder]::new()
    $latestAssistantText = $null
    $finalResultLine = $null
    $finalResultText = $null
    $lastRateLimit = $null
    $maxRateLimit = $null
    $maxUtilizationPercent = $null
    $lastUsageCheckpoint = $null
    $parsedLines = 0
    $invalidLines = 0

    foreach ($line in [IO.File]::ReadLines($Path, [Text.Encoding]::UTF8)) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $message = $line | ConvertFrom-Json -ErrorAction Stop
            $parsedLines++
        }
        catch {
            $invalidLines++
            continue
        }

        if ($message.type -eq 'result') {
            $finalResultLine = $line
            if ($null -ne $message.result) {
                $finalResultText = [string] $message.result
            }
            continue
        }

        if ($message.type -eq 'claudex_invalid_event') {
            $invalidLines += 1
            continue
        }

        if ($message.type -in @('claudex_usage_checkpoint', 'claudex_usage_guard')) {
            $lastUsageCheckpoint = [ordered]@{
                status = $message.status
                utilizationPercent = $message.utilization_percent
                utilizationKnown = $message.utilization_known
                usageCheckpointPercent = if ($null -ne $message.usage_checkpoint_percent) {
                    $message.usage_checkpoint_percent
                }
                else {
                    $message.usage_ceiling_percent
                }
                thresholdReached = $message.threshold_reached
                triggerBasis = $message.trigger_basis
                source = $message.source
                action = $message.action
            }
            continue
        }

        if ($message.type -eq 'rate_limit_event') {
            $currentUtilizationPercent = ConvertTo-ClaudexUsagePercent $message.rate_limit_info.utilization
            if (
                $null -ne $currentUtilizationPercent -and
                ($null -eq $maxUtilizationPercent -or $currentUtilizationPercent -gt $maxUtilizationPercent)
            ) {
                $maxUtilizationPercent = $currentUtilizationPercent
            }
            $observedRateLimit = [ordered]@{
                status = $message.rate_limit_info.status
                utilizationPercent = $currentUtilizationPercent
                resetsAt = $message.rate_limit_info.resetsAt
                rateLimitType = $message.rate_limit_info.rateLimitType
            }
            if (
                $null -ne $currentUtilizationPercent -and
                $currentUtilizationPercent -eq $maxUtilizationPercent
            ) {
                $maxRateLimit = $observedRateLimit
            }
            $lastRateLimit = [ordered]@{
                status = $observedRateLimit.status
                utilizationPercent = $observedRateLimit.utilizationPercent
                maxUtilizationPercent = $maxUtilizationPercent
                resetsAt = $observedRateLimit.resetsAt
                rateLimitType = $observedRateLimit.rateLimitType
                maximum = $maxRateLimit
            }
            continue
        }

        if (
            $message.type -eq 'stream_event' -and
            $message.event.type -eq 'content_block_delta' -and
            $message.event.delta.type -eq 'text_delta' -and
            $null -ne $message.event.delta.text
        ) {
            $null = $partialText.Append([string] $message.event.delta.text)
            continue
        }

        if ($message.type -eq 'assistant' -and $null -ne $message.message.content) {
            $textBlocks = @(
                $message.message.content |
                    Where-Object { $_.type -eq 'text' -and $null -ne $_.text } |
                    ForEach-Object { [string] $_.text }
            )
            if ($textBlocks.Count -gt 0) {
                $latestAssistantText = $textBlocks -join [Environment]::NewLine
            }
        }
    }

    $recoveredText = $partialText.ToString()
    if ([string]::IsNullOrWhiteSpace($recoveredText)) {
        $recoveredText = $latestAssistantText
    }
    if ([string]::IsNullOrWhiteSpace($recoveredText)) {
        $recoveredText = $finalResultText
    }

    return [pscustomobject]@{
        path = [IO.Path]::GetFullPath($Path)
        finalResultLine = $finalResultLine
        recoveredText = $recoveredText
        recoveredPartial = -not [string]::IsNullOrWhiteSpace($recoveredText)
        lastRateLimit = $lastRateLimit
        lastUsageCheckpoint = $lastUsageCheckpoint
        parsedLines = $parsedLines
        invalidLines = $invalidLines
    }
}

function ConvertTo-ClaudexRecoveryEnvelope {
    param(
        [Parameter(Mandatory = $true)]
        $Summary,

        [Parameter(Mandatory = $true)]
        [string] $Reason,

        [AllowNull()]
        [Nullable[int]] $ExitCode
    )

    return [ordered]@{
        type = 'claudex_recovery'
        is_error = $true
        recovered_partial = $Summary.recoveredPartial
        complete = $false
        terminal_reason = $Reason
        claude_exit_code = $ExitCode
        result = $Summary.recoveredText
        structured_output = $null
        rate_limit = $Summary.lastRateLimit
        usage_checkpoint = $Summary.lastUsageCheckpoint
        recovery_file = $Summary.path
        parsed_lines = $Summary.parsedLines
        invalid_lines = $Summary.invalidLines
        warning = 'Salida parcial recuperada; no equivale a una respuesta final ni a JSON validado por el esquema.'
    } | ConvertTo-Json -Depth 8 -Compress
}

function Test-ClaudexFinalResultIsComplete {
    param(
        [AllowNull()]
        [string] $Line
    )

    if ([string]::IsNullOrWhiteSpace($Line)) {
        return $false
    }

    try {
        $finalMessage = $Line | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        return $false
    }

    if ($finalMessage.type -ne 'result' -or $finalMessage.is_error -eq $true) {
        return $false
    }

    return $null -ne $finalMessage.structured_output
}

function Get-ClaudexFinalResultFailureReason {
    param(
        [AllowNull()]
        [string] $Line
    )

    if ([string]::IsNullOrWhiteSpace($Line)) {
        return 'missing_final_result'
    }

    try {
        $finalMessage = $Line | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        return 'invalid_final_result'
    }

    if ($finalMessage.type -ne 'result') {
        return 'invalid_final_result'
    }

    if ($finalMessage.is_error -eq $true) {
        return 'claude_result_error'
    }

    if ($null -eq $finalMessage.structured_output) {
        if ([string]::IsNullOrWhiteSpace([string] $finalMessage.result)) {
            return 'empty_final_with_partial'
        }
        return 'schema_output_missing'
    }

    return 'invalid_final_result'
}

function ConvertTo-ClaudexJournalLine {
    param(
        [Parameter(Mandatory = $true)]
        $Message
    )

    if ($Message.type -eq 'result') {
        return [ordered]@{
            type = 'result'
            subtype = $Message.subtype
            is_error = $Message.is_error
            result = $Message.result
            structured_output = $Message.structured_output
        } | ConvertTo-Json -Depth 100 -Compress
    }

    if (
        $Message.type -eq 'stream_event' -and
        $Message.event.type -eq 'content_block_delta' -and
        $Message.event.delta.type -eq 'text_delta' -and
        $null -ne $Message.event.delta.text
    ) {
        return [ordered]@{
            type = 'stream_event'
            event = [ordered]@{
                type = 'content_block_delta'
                delta = [ordered]@{
                    type = 'text_delta'
                    text = [string] $Message.event.delta.text
                }
            }
        } | ConvertTo-Json -Depth 6 -Compress
    }

    if (
        $Message.type -eq 'stream_event' -and
        $Message.event.type -eq 'content_block_start' -and
        $Message.event.content_block.type -eq 'text' -and
        $null -ne $Message.event.content_block.text
    ) {
        return [ordered]@{
            type = 'stream_event'
            event = [ordered]@{
                type = 'content_block_delta'
                delta = [ordered]@{
                    type = 'text_delta'
                    text = [string] $Message.event.content_block.text
                }
            }
        } | ConvertTo-Json -Depth 6 -Compress
    }

    if ($Message.type -eq 'assistant' -and $null -ne $Message.message.content) {
        $visibleBlocks = @(
            $Message.message.content |
                Where-Object { $_.type -eq 'text' -and $null -ne $_.text } |
                ForEach-Object {
                    [ordered]@{
                        type = 'text'
                        text = [string] $_.text
                    }
                }
        )
        if ($visibleBlocks.Count -gt 0) {
            return [ordered]@{
                type = 'assistant'
                message = [ordered]@{
                    content = $visibleBlocks
                }
            } | ConvertTo-Json -Depth 6 -Compress
        }
        return $null
    }

    if ($Message.type -eq 'rate_limit_event') {
        return [ordered]@{
            type = 'rate_limit_event'
            rate_limit_info = [ordered]@{
                status = $Message.rate_limit_info.status
                utilization = $Message.rate_limit_info.utilization
                resetsAt = $Message.rate_limit_info.resetsAt
                rateLimitType = $Message.rate_limit_info.rateLimitType
            }
        } | ConvertTo-Json -Depth 5 -Compress
    }

    return $null
}

function ConvertTo-ClaudexInvalidJournalLine {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Line
    )

    $hashAlgorithm = [Security.Cryptography.SHA256]::Create()
    try {
        $hashBytes = $hashAlgorithm.ComputeHash([Text.Encoding]::UTF8.GetBytes($Line))
        $lineHash = ([BitConverter]::ToString($hashBytes)).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $hashAlgorithm.Dispose()
    }

    return [ordered]@{
        type = 'claudex_invalid_event'
        utf16_length = $Line.Length
        sha256 = $lineHash
    } | ConvertTo-Json -Depth 3 -Compress
}

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
    $journalWriter = $null
    $journalStream = $null
    $recoveryFilePath = $null
    $locationPushed = $false
    $peerStateChanged = $false
    $previousPeerState = $env:CLAUDEX_PEER_ACTIVE
    $claudeExitCode = $null
    $finalResultLine = $null
    $usageCheckpointSignaled = $false
    $protocolRecoveryFailure = $false
    $durableStream = $OutputFormat -eq 'json'
    $recoveryDirectory = Get-ClaudexRecoveryDirectory
    $recoveryRetentionHours = 72

    try {
        if ($RecoverLatest -and -not [string]::IsNullOrWhiteSpace($RecoverFile)) {
            throw 'Usa -RecoverLatest o -RecoverFile, no ambos.'
        }

        if ($RecoverLatest -or -not [string]::IsNullOrWhiteSpace($RecoverFile)) {
            Remove-ClaudexExpiredRecoveryFiles `
                -Directory $recoveryDirectory `
                -RetentionHours $recoveryRetentionHours

            if ($RecoverLatest) {
                if (-not (Test-Path -LiteralPath $recoveryDirectory -PathType Container)) {
                    throw "No existe el directorio de recuperacion de Claudex: '$recoveryDirectory'."
                }

                $recoveryCutoff = [DateTime]::UtcNow.AddHours(-$recoveryRetentionHours)
                $recoveryItem = Get-ChildItem -LiteralPath $recoveryDirectory -Filter 'claudex-*.jsonl' -File |
                    Where-Object { $_.LastWriteTimeUtc -ge $recoveryCutoff } |
                    Sort-Object LastWriteTimeUtc -Descending |
                    Select-Object -First 1
                if ($null -eq $recoveryItem) {
                    throw "No hay salidas recuperables de las ultimas $recoveryRetentionHours horas en '$recoveryDirectory'."
                }
            }
            else {
                try {
                    $recoveryItem = Get-Item -LiteralPath $RecoverFile -ErrorAction Stop
                }
                catch {
                    throw "No se encontro el archivo de recuperacion: '$RecoverFile'."
                }
                if ($recoveryItem.PSIsContainer) {
                    throw "RecoverFile debe apuntar a un archivo JSONL: '$RecoverFile'."
                }
            }

            $summary = Get-ClaudexStreamSummary -Path $recoveryItem.FullName
            if (Test-ClaudexFinalResultIsComplete -Line $summary.finalResultLine) {
                [Console]::Out.WriteLine($summary.finalResultLine)
            }
            else {
                $recoveryReason = if ($null -ne $summary.lastUsageCheckpoint) {
                    'usage_checkpoint_recovery'
                }
                elseif ([string]::IsNullOrWhiteSpace($summary.finalResultLine)) {
                    'manual_recovery'
                }
                else {
                    Get-ClaudexFinalResultFailureReason -Line $summary.finalResultLine
                }
                [Console]::Out.WriteLine((ConvertTo-ClaudexRecoveryEnvelope -Summary $summary -Reason $recoveryReason -ExitCode $null))
            }
            return
        }

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

        $profileMatch = [regex]::Match($Profile.ToLowerInvariant(), '^(s|o)/(low|medium|high|xhigh|max|ultracode)$')
        if (-not $profileMatch.Success) {
            throw "Perfil invalido: '$Profile'. Usa s|o y low|medium|high|xhigh|max|ultracode."
        }

        $modelCode = $profileMatch.Groups[1].Value
        $level = $profileMatch.Groups[2].Value
        if (
            [double]::IsNaN($UsageCheckpointPercent) -or
            [double]::IsInfinity($UsageCheckpointPercent) -or
            ($KnownUsagePercent -lt 0 -and $KnownUsagePercent -ne -1) -or
            ($KnownUsagePercent -ge 0 -and (
                [double]::IsNaN($KnownUsagePercent) -or
                [double]::IsInfinity($KnownUsagePercent)
            ))
        ) {
            throw 'Los porcentajes del checkpoint deben ser numeros finitos.'
        }
        $normalizedPipeline = $Pipeline.ToLowerInvariant()
        $wouldCheckpointForKnownUsage = $KnownUsagePercent -ge 0 -and $KnownUsagePercent -ge $UsageCheckpointPercent

        if (-not $DryRun) {
            Remove-ClaudexExpiredRecoveryFiles `
                -Directory $recoveryDirectory `
                -RetentionHours $recoveryRetentionHours
        }

        $pipelinePreamble = @(
            "CLAUDEX_PIPELINE: $normalizedPipeline"
            'Si el paquete omite criterios o gates necesarios para este pipeline, declaralo en supuestos antes de continuar.'
            "CLAUDEX_RECOVERY_CHECKPOINT: umbral informativo $UsageCheckpointPercent%; no detiene la tarea."
            'Continua el trabajo solicitado y expresa primero las conclusiones visibles mas utiles. No expongas razonamiento interno; entrega hallazgos, evidencia y grado de completitud.'
        ) -join [Environment]::NewLine
        $effectivePromptText = $pipelinePreamble + [Environment]::NewLine + [Environment]::NewLine + $promptText
        $model = if ($modelCode -eq 's') { 'sonnet' } else { 'opus' }
        $effort = if ($level -eq 'ultracode') { 'max' } else { $level }
        $workflowsEnabled = $level -eq 'ultracode'

        if (-not [string]::IsNullOrWhiteSpace($ClaudeCommandPath)) {
            $claudeCommand = Get-Command $ClaudeCommandPath -ErrorAction SilentlyContinue | Select-Object -First 1
        }
        else {
            $claudeCommand = Get-Command 'claude.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
            if (-not $claudeCommand) {
                $claudeCommand = Get-Command 'claude.cmd' -ErrorAction SilentlyContinue | Select-Object -First 1
            }
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
            $requiredFlags += @('--json-schema', '--verbose', '--include-partial-messages')
        }
        $missingFlags = @($requiredFlags | Where-Object { $claudeHelp -notmatch [regex]::Escape($_) })
        if ($missingFlags.Count -gt 0) {
            throw "Claude Code $claudeVersion no expone las capacidades requeridas: $($missingFlags -join ', ')."
        }
        if ($durableStream -and $claudeHelp -notmatch [regex]::Escape('stream-json')) {
            throw "Claude Code $claudeVersion no expone el transporte stream-json requerido para recuperacion durable."
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

        $cliOutputFormat = if ($durableStream) { 'stream-json' } else { $OutputFormat }
        $arguments = [System.Collections.Generic.List[string]]::new()
        @(
            '--print',
            '--model', $model,
            '--effort', $effort,
            '--permission-mode', 'plan',
            '--no-session-persistence',
            '--settings', $temporarySettingsPath,
            '--setting-sources', $settingSources,
            '--output-format', $cliOutputFormat
        ) | ForEach-Object { $arguments.Add($_) }

        if ($durableStream) {
            $arguments.Add('--verbose')
            $arguments.Add('--include-partial-messages')
        }

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
                pipeline = $normalizedPipeline
                promptPreamble = $pipelinePreamble
                effort = $effort
                enableWorkflows = $workflowsEnabled
                phase = $Phase
                contextProfile = $effectiveContextProfile
                settingSources = $settingSources
                tools = $tools
                outputFormat = $OutputFormat
                cliOutputFormat = $cliOutputFormat
                durableStream = $durableStream
                usageCheckpointPercent = $UsageCheckpointPercent
                usageCeilingPercent = $UsageCheckpointPercent
                knownUsagePercent = if ($KnownUsagePercent -ge 0) { $KnownUsagePercent } else { $null }
                wouldCheckpointForKnownUsage = $wouldCheckpointForKnownUsage
                wouldBlockForKnownUsage = $false
                usagePolicy = 'continue_with_durable_recovery'
                recoveryDirectory = $recoveryDirectory
                recoveryRetentionHours = $recoveryRetentionHours
                recoveryPurgePolicy = 'each_claudex_operation'
                schemaPath = $resolvedSchemaPath
                persistentSettingsModified = $false
                arguments = $arguments.ToArray()
            } | ConvertTo-Json -Depth 8
            return
        }

        if ($durableStream) {
            $null = New-Item -ItemType Directory -Path $recoveryDirectory -Force -ErrorAction Stop
            $recoveryFileName = 'claudex-{0}-{1}.jsonl' -f (
                [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ', [Globalization.CultureInfo]::InvariantCulture)
            ), ([guid]::NewGuid().ToString('N'))
            $recoveryFilePath = Join-Path $recoveryDirectory $recoveryFileName
            $journalStream = [IO.FileStream]::new(
                $recoveryFilePath,
                [IO.FileMode]::CreateNew,
                [IO.FileAccess]::Write,
                [IO.FileShare]::Read,
                4096,
                [IO.FileOptions]::WriteThrough
            )
            $journalWriter = [IO.StreamWriter]::new($journalStream, $utf8NoBom)
            $journalWriter.AutoFlush = $true
            [Console]::Error.WriteLine("CLAUDEX_RECOVERY_FILE: $recoveryFilePath")
        }

        if ($wouldCheckpointForKnownUsage) {
            $knownUsageCheckpoint = [ordered]@{
                type = 'claudex_usage_checkpoint'
                status = 'known_usage'
                utilization_percent = $KnownUsagePercent
                utilization_known = $true
                usage_checkpoint_percent = $UsageCheckpointPercent
                threshold_reached = $true
                trigger_basis = 'known_usage'
                source = 'preflight'
                action = 'continue_and_recover_on_failure'
                recovery_file = $recoveryFilePath
            } | ConvertTo-Json -Depth 4 -Compress
            if ($null -ne $journalWriter) {
                $journalWriter.WriteLine($knownUsageCheckpoint)
            }
            $usageCheckpointSignaled = $true
            [Console]::Error.WriteLine("CLAUDEX_USAGE_CHECKPOINT: $knownUsageCheckpoint")
        }

        Push-Location -LiteralPath $workingDirectory
        $locationPushed = $true
        $env:CLAUDEX_PEER_ACTIVE = '1'
        $peerStateChanged = $true

        $argumentArray = $arguments.ToArray()
        if ($durableStream) {
            $effectivePromptText | & $claudeCommand.Source @argumentArray | ForEach-Object {
                $streamLine = [string] $_

                try {
                    $streamMessage = $streamLine | ConvertFrom-Json -ErrorAction Stop
                }
                catch {
                    $streamMessage = $null
                    $journalWriter.WriteLine((ConvertTo-ClaudexInvalidJournalLine -Line $streamLine))
                }

                if ($null -ne $streamMessage) {
                    $journalLine = ConvertTo-ClaudexJournalLine -Message $streamMessage
                    if (-not [string]::IsNullOrWhiteSpace($journalLine)) {
                        $journalWriter.WriteLine($journalLine)
                    }
                }

                if ($null -ne $streamMessage -and $streamMessage.type -eq 'result') {
                    $finalResultLine = $streamLine
                }

                if ($null -ne $streamMessage -and $streamMessage.type -eq 'rate_limit_event') {
                    $rateStatus = [string] $streamMessage.rate_limit_info.status
                    $utilizationPercent = ConvertTo-ClaudexUsagePercent $streamMessage.rate_limit_info.utilization
                    $thresholdReached = $null -ne $utilizationPercent -and $utilizationPercent -ge $UsageCheckpointPercent
                    $statusRequiresCheckpoint = $rateStatus -in @('allowed_warning', 'rejected')
                    $mustCheckpoint = $thresholdReached -or $statusRequiresCheckpoint

                    if ($mustCheckpoint -and -not $usageCheckpointSignaled) {
                        $usageCheckpointSignaled = $true
                        $checkpointSignal = [ordered]@{
                            type = 'claudex_usage_checkpoint'
                            status = $rateStatus
                            utilization_percent = $utilizationPercent
                            utilization_known = $null -ne $utilizationPercent
                            usage_checkpoint_percent = $UsageCheckpointPercent
                            threshold_reached = $thresholdReached
                            trigger_basis = if ($thresholdReached) { 'utilization' } else { 'status' }
                            source = 'rate_limit_event'
                            action = 'continue_and_recover_on_failure'
                            recovery_file = $recoveryFilePath
                        } | ConvertTo-Json -Depth 4 -Compress
                        $journalWriter.WriteLine($checkpointSignal)
                        [Console]::Error.WriteLine("CLAUDEX_USAGE_CHECKPOINT: $checkpointSignal")
                    }
                }
            }
        }
        else {
            $effectivePromptText | & $claudeCommand.Source @argumentArray
        }
        $claudeExitCode = $LASTEXITCODE
    }
    finally {
        if ($null -ne $journalWriter) {
            $journalWriter.Dispose()
            $journalWriter = $null
            $journalStream = $null
        }
        elseif ($null -ne $journalStream) {
            $journalStream.Dispose()
            $journalStream = $null
        }

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
            Remove-Item -LiteralPath $neutralDirectory -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    if ($durableStream -and $recoveryFilePath -and (Test-Path -LiteralPath $recoveryFilePath -PathType Leaf)) {
        $summary = Get-ClaudexStreamSummary -Path $recoveryFilePath
        $candidateFinalResultLine = if (-not [string]::IsNullOrWhiteSpace($finalResultLine)) {
            $finalResultLine
        }
        else {
            $summary.finalResultLine
        }
        $hasSuccessfulExit = $null -ne $claudeExitCode -and $claudeExitCode -eq 0

        if ($hasSuccessfulExit -and (Test-ClaudexFinalResultIsComplete -Line $candidateFinalResultLine)) {
            [Console]::Out.WriteLine($candidateFinalResultLine)
        }
        else {
            $protocolRecoveryFailure = $true
            $terminalReason = if ($null -ne $claudeExitCode -and $claudeExitCode -ne 0) {
                'claude_exit_nonzero'
            }
            else {
                Get-ClaudexFinalResultFailureReason -Line $candidateFinalResultLine
            }
            [Console]::Out.WriteLine((
                ConvertTo-ClaudexRecoveryEnvelope -Summary $summary -Reason $terminalReason -ExitCode $claudeExitCode
            ))
        }
    }

    if ($null -ne $claudeExitCode -and $claudeExitCode -ne 0) {
        [Console]::Error.WriteLine("Claude Code termino con el codigo de salida $claudeExitCode. Revisa el mensaje anterior para distinguir autenticacion, limite de sesion o conectividad.")
        exit $claudeExitCode
    }

    if ($protocolRecoveryFailure) {
        [Console]::Error.WriteLine('Claudex recupero una salida parcial, pero Claude Code no emitio un resultado final valido.')
        exit 76
    }
}
