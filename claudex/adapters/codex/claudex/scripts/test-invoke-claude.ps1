[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $ProjectPath
)

$ErrorActionPreference = 'Stop'
$launcherPath = Join-Path $PSScriptRoot 'invoke-claude.cmd'
$encodedPrompt = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('Prueba de configuracion sin invocar el modelo.'))
$settingsPath = Join-Path $env:USERPROFILE '.claude\settings.json'
$settingsHashBefore = if (Test-Path -LiteralPath $settingsPath) { (Get-FileHash -Algorithm SHA256 -LiteralPath $settingsPath).Hash } else { $null }

function Assert-Equal {
    param(
        [string] $Name,
        $Actual,
        $Expected
    )

    if ($Actual -cne $Expected) {
        throw "$Name esperaba '$Expected' y obtuvo '$Actual'."
    }
}

function Invoke-ClaudexDryRun {
    param(
        [string] $Profile,
        [string] $Pipeline = 'core',
        [string] $Phase = 'derive',
        [string] $ContextProfile = 'project',
        [double] $UsageCheckpointPercent = 95,
        [double] $KnownUsagePercent = -1
    )

    $invokeArguments = @(
        '-EncodedStdin',
        '-ProjectPath', $ProjectPath,
        '-Pipeline', $Pipeline,
        '-Phase', $Phase,
        '-ContextProfile', $ContextProfile,
        '-UsageCheckpointPercent', $UsageCheckpointPercent,
        '-KnownUsagePercent', $KnownUsagePercent,
        '-OutputFormat', 'json',
        '-DryRun'
    )
    if (-not [string]::IsNullOrWhiteSpace($Profile)) {
        $invokeArguments += @('-Profile', $Profile)
    }

    $rawOutput = $encodedPrompt | & $launcherPath @invokeArguments

    if ($LASTEXITCODE -ne 0) {
        throw "DryRun fallo para '$Profile' con el codigo $LASTEXITCODE."
    }

    return (($rawOutput -join [Environment]::NewLine) | ConvertFrom-Json)
}

$cases = @(
    @{ Profile = 's/low'; Model = 'sonnet'; Level = 'low'; Effort = 'low'; Workflows = $false },
    @{ Profile = 's/medium'; Model = 'sonnet'; Level = 'medium'; Effort = 'medium'; Workflows = $false },
    @{ Profile = 'o/high'; Model = 'opus'; Level = 'high'; Effort = 'high'; Workflows = $false },
    @{ Profile = 's/xhigh'; Model = 'sonnet'; Level = 'xhigh'; Effort = 'xhigh'; Workflows = $false },
    @{ Profile = 'o/max'; Model = 'opus'; Level = 'max'; Effort = 'max'; Workflows = $false },
    @{ Profile = 'o/ultracode'; Model = 'opus'; Level = 'ultracode'; Effort = 'max'; Workflows = $true }
)

foreach ($case in $cases) {
    $result = Invoke-ClaudexDryRun -Profile $case.Profile
    Assert-Equal "$($case.Profile) model" $result.model $case.Model
    Assert-Equal "$($case.Profile) level" $result.level $case.Level
    Assert-Equal "$($case.Profile) pipeline" $result.pipeline 'core'
    if (-not $result.promptPreamble.StartsWith('CLAUDEX_PIPELINE: core')) {
        throw "$($case.Profile) no genero el preambulo core esperado."
    }
    Assert-Equal "$($case.Profile) effort" $result.effort $case.Effort
    $effortArgumentIndex = [Array]::IndexOf([object[]] $result.arguments, '--effort')
    if ($effortArgumentIndex -lt 0 -or $effortArgumentIndex + 1 -ge $result.arguments.Count) {
        throw "$($case.Profile) no genero un argumento --effort valido."
    }
    Assert-Equal "$($case.Profile) CLI effort" $result.arguments[$effortArgumentIndex + 1] $case.Effort
    Assert-Equal "$($case.Profile) workflows" $result.enableWorkflows $case.Workflows
    Assert-Equal "$($case.Profile) project" $result.projectPath ([IO.Path]::GetFullPath($ProjectPath).TrimEnd('\'))
    Assert-Equal "$($case.Profile) persistent settings" $result.persistentSettingsModified $false
}

$defaultResult = Invoke-ClaudexDryRun
Assert-Equal 'default model' $defaultResult.model 'opus'
Assert-Equal 'default level' $defaultResult.level 'low'
Assert-Equal 'default pipeline' $defaultResult.pipeline 'core'
if (-not $defaultResult.promptPreamble.StartsWith('CLAUDEX_PIPELINE: core')) {
    throw 'La invocacion predeterminada no genero el preambulo core esperado.'
}
Assert-Equal 'default effort' $defaultResult.effort 'low'
Assert-Equal 'default workflows' $defaultResult.enableWorkflows $false
Assert-Equal 'default requested output' $defaultResult.outputFormat 'json'
Assert-Equal 'default CLI output' $defaultResult.cliOutputFormat 'stream-json'
Assert-Equal 'default durable stream' $defaultResult.durableStream $true
Assert-Equal 'default usage checkpoint' $defaultResult.usageCheckpointPercent 95
Assert-Equal 'default known usage' $defaultResult.knownUsagePercent $null
Assert-Equal 'default known checkpoint' $defaultResult.wouldCheckpointForKnownUsage $false
Assert-Equal 'default known block disabled' $defaultResult.wouldBlockForKnownUsage $false
Assert-Equal 'default usage policy' $defaultResult.usagePolicy 'continue_with_durable_recovery'
Assert-Equal 'default recovery retention' $defaultResult.recoveryRetentionHours 72
Assert-Equal 'default recovery purge policy' $defaultResult.recoveryPurgePolicy 'each_claudex_operation'
foreach ($requiredArgument in @('--verbose', '--include-partial-messages')) {
    if ($defaultResult.arguments -notcontains $requiredArgument) {
        throw "La invocacion durable no incluyo '$requiredArgument'."
    }
}
$outputFormatArgumentIndex = [Array]::IndexOf([object[]] $defaultResult.arguments, '--output-format')
if ($outputFormatArgumentIndex -lt 0 -or $outputFormatArgumentIndex + 1 -ge $defaultResult.arguments.Count) {
    throw 'La invocacion durable no genero un argumento --output-format valido.'
}
Assert-Equal 'default CLI output argument' $defaultResult.arguments[$outputFormatArgumentIndex + 1] 'stream-json'

$knownCheckpointDryRun = Invoke-ClaudexDryRun -Profile 'o/high' -KnownUsagePercent 95
Assert-Equal 'known checkpoint dry-run threshold' $knownCheckpointDryRun.usageCheckpointPercent 95
Assert-Equal 'known checkpoint dry-run usage' $knownCheckpointDryRun.knownUsagePercent 95
Assert-Equal 'known checkpoint dry-run decision' $knownCheckpointDryRun.wouldCheckpointForKnownUsage $true
Assert-Equal 'known checkpoint does not block' $knownCheckpointDryRun.wouldBlockForKnownUsage $false

$comparisonResult = Invoke-ClaudexDryRun -Profile 'o/medium' -Phase compare -ContextProfile project
Assert-Equal 'comparison context' $comparisonResult.contextProfile 'neutral'
Assert-Equal 'comparison settings' $comparisonResult.settingSources 'user'
Assert-Equal 'comparison tools' @($comparisonResult.tools).Count 0
Assert-Equal 'comparison temporary directory removed' (Test-Path -LiteralPath $comparisonResult.workingDirectory) $false
if (-not $comparisonResult.schemaPath.EndsWith('comparison-response.schema.json')) {
    throw "La comparacion selecciono un esquema inesperado: '$($comparisonResult.schemaPath)'."
}

$astroResult = Invoke-ClaudexDryRun -Profile 'o/high' -Pipeline astro
Assert-Equal 'astro pipeline' $astroResult.pipeline 'astro'
if (-not $astroResult.promptPreamble.StartsWith('CLAUDEX_PIPELINE: astro')) {
    throw 'El pipeline astro no genero el preambulo esperado.'
}

$refineResult = Invoke-ClaudexDryRun -Profile 's/medium' -Pipeline refine -Phase review
Assert-Equal 'refine pipeline' $refineResult.pipeline 'refine'
if (-not $refineResult.promptPreamble.StartsWith('CLAUDEX_PIPELINE: refine')) {
    throw 'El pipeline refine no genero el preambulo esperado.'
}
Assert-Equal 'refine review tools' (@($refineResult.tools) -join ',') 'Read,Glob,Grep'

$astroComparisonResult = Invoke-ClaudexDryRun -Profile 'o/high' -Pipeline astro -Phase compare -ContextProfile project
Assert-Equal 'astro comparison pipeline' $astroComparisonResult.pipeline 'astro'
Assert-Equal 'astro comparison context' $astroComparisonResult.contextProfile 'neutral'
Assert-Equal 'astro comparison tools' @($astroComparisonResult.tools).Count 0
if (-not $astroComparisonResult.schemaPath.EndsWith('comparison-response.schema.json')) {
    throw "La comparacion astro selecciono un esquema inesperado: '$($astroComparisonResult.schemaPath)'."
}

$previousErrorPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = 'Continue'
    $invalidPipelineOutput = $encodedPrompt | & $launcherPath `
        -EncodedStdin `
        -ProjectPath $ProjectPath `
        -Pipeline invalid `
        -DryRun 2>&1
}
finally {
    $ErrorActionPreference = $previousErrorPreference
}
if ($LASTEXITCODE -eq 0) {
    throw 'Pipeline invalido no fue rechazado.'
}
if (($invalidPipelineOutput -join [Environment]::NewLine) -notmatch 'Pipeline') {
    throw 'Pipeline invalido no produjo el diagnostico esperado.'
}

$previousErrorPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = 'Continue'
    $invalidProfileOutput = $encodedPrompt | & $launcherPath `
        -EncodedStdin `
        -ProjectPath $ProjectPath `
        -Profile 'o/extreme' `
        -DryRun 2>&1
}
finally {
    $ErrorActionPreference = $previousErrorPreference
}
if ($LASTEXITCODE -eq 0) {
    throw 'Perfil invalido no fue rechazado.'
}
if (($invalidProfileOutput -join [Environment]::NewLine) -notmatch 'Profile|ValidatePattern') {
    throw 'Perfil invalido no produjo el diagnostico esperado.'
}

$invalidProjectPath = Join-Path $ProjectPath 'directorio-claudex-que-no-existe'
$previousErrorPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = 'Continue'
    $invalidOutput = $encodedPrompt | & $launcherPath `
        -EncodedStdin `
        -ProjectPath $invalidProjectPath `
        -Profile 's/low' `
        -DryRun 2>&1
}
finally {
    $ErrorActionPreference = $previousErrorPreference
}
if ($LASTEXITCODE -eq 0) {
    throw 'ProjectPath invalido no fue rechazado.'
}
if (($invalidOutput -join [Environment]::NewLine) -notmatch 'ProjectPath no existe') {
    throw 'ProjectPath invalido no produjo el diagnostico esperado.'
}

$previousRecoveryDirectory = $env:CLAUDEX_RECOVERY_DIR
$fixtureDirectory = Join-Path ([IO.Path]::GetTempPath()) ("claudex-recovery-test-$([guid]::NewGuid().ToString('N'))")
try {
    $null = New-Item -ItemType Directory -Path $fixtureDirectory -ErrorAction Stop
    $env:CLAUDEX_RECOVERY_DIR = $fixtureDirectory

    $partialFixturePath = Join-Path $fixtureDirectory 'partial.jsonl'
    $partialLines = @(
        '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Hallazgo recuperado "}}}',
        '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"antes del corte."}}}',
        '{"type":"rate_limit_event","rate_limit_info":{"status":"allowed_warning","utilization":0.96,"resetsAt":1790000000,"rateLimitType":"five_hour"}}'
    )
    [IO.File]::WriteAllText(
        $partialFixturePath,
        (($partialLines -join [Environment]::NewLine) + [Environment]::NewLine),
        [Text.UTF8Encoding]::new($false)
    )

    $partialRecoveryRaw = & $launcherPath -ProjectPath $ProjectPath -RecoverFile $partialFixturePath
    Assert-Equal 'partial recovery exit code' $LASTEXITCODE 0
    $partialRecovery = ($partialRecoveryRaw -join [Environment]::NewLine) | ConvertFrom-Json
    Assert-Equal 'partial recovery type' $partialRecovery.type 'claudex_recovery'
    Assert-Equal 'partial recovery flag' $partialRecovery.recovered_partial $true
    Assert-Equal 'partial recovery complete' $partialRecovery.complete $false
    Assert-Equal 'partial recovery text' $partialRecovery.result 'Hallazgo recuperado antes del corte.'
    Assert-Equal 'partial recovery rate status' $partialRecovery.rate_limit.status 'allowed_warning'
    Assert-Equal 'partial recovery utilization' $partialRecovery.rate_limit.utilizationPercent 96

    $emptyFinalFixturePath = Join-Path $fixtureDirectory 'empty-final.jsonl'
    $emptyFinalLines = @(
        $partialLines[0],
        '{"type":"result","is_error":false,"result":"","structured_output":null}'
    )
    [IO.File]::WriteAllText(
        $emptyFinalFixturePath,
        (($emptyFinalLines -join [Environment]::NewLine) + [Environment]::NewLine),
        [Text.UTF8Encoding]::new($false)
    )
    $emptyFinalRaw = & $launcherPath -ProjectPath $ProjectPath -RecoverFile $emptyFinalFixturePath
    Assert-Equal 'empty final recovery exit code' $LASTEXITCODE 0
    $emptyFinalRecovery = ($emptyFinalRaw -join [Environment]::NewLine) | ConvertFrom-Json
    Assert-Equal 'empty final recovery reason' $emptyFinalRecovery.terminal_reason 'empty_final_with_partial'
    Assert-Equal 'empty final recovery text' $emptyFinalRecovery.result 'Hallazgo recuperado '

    $completeFixturePath = Join-Path $fixtureDirectory 'claudex-fixture-complete.jsonl'
    $completeLine = '{"type":"result","is_error":false,"result":"Respuesta final","structured_output":{"summary":"ok"}}'
    [IO.File]::WriteAllText($completeFixturePath, ($completeLine + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
    $expiredFixturePath = Join-Path $fixtureDirectory 'claudex-fixture-expired.jsonl'
    [IO.File]::WriteAllText($expiredFixturePath, ($completeLine + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
    $unrelatedExpiredFixturePath = Join-Path $fixtureDirectory 'unrelated-expired.jsonl'
    [IO.File]::WriteAllText($unrelatedExpiredFixturePath, ($completeLine + [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
    [IO.File]::SetLastWriteTimeUtc($partialFixturePath, [DateTime]::UtcNow.AddMinutes(-2))
    [IO.File]::SetLastWriteTimeUtc($emptyFinalFixturePath, [DateTime]::UtcNow.AddMinutes(-1))
    [IO.File]::SetLastWriteTimeUtc($expiredFixturePath, [DateTime]::UtcNow.AddHours(-73))
    [IO.File]::SetLastWriteTimeUtc($unrelatedExpiredFixturePath, [DateTime]::UtcNow.AddHours(-73))
    [IO.File]::SetLastWriteTimeUtc($completeFixturePath, [DateTime]::UtcNow)

    $latestRecoveryRaw = & $launcherPath -ProjectPath $ProjectPath -RecoverLatest
    Assert-Equal 'latest recovery exit code' $LASTEXITCODE 0
    Assert-Equal 'expired Claudex recovery removed' (Test-Path -LiteralPath $expiredFixturePath) $false
    Assert-Equal 'unrelated expired file preserved' (Test-Path -LiteralPath $unrelatedExpiredFixturePath) $true
    $latestRecovery = ($latestRecoveryRaw -join [Environment]::NewLine) | ConvertFrom-Json
    Assert-Equal 'latest recovery final result' $latestRecovery.result 'Respuesta final'
    Assert-Equal 'latest recovery structured result' $latestRecovery.structured_output.summary 'ok'

    $fakeClaudePath = Join-Path $fixtureDirectory 'fake-claude.cmd'
    $fakeClaude = @'
@echo off
if "%~1"=="--version" (
  echo 2.1.226 ^(Claude Code fake^)
  exit /b 0
)
if "%~1"=="--help" (
  echo --model --effort --settings --setting-sources --tools --output-format --no-session-persistence --json-schema --verbose --include-partial-messages stream-json
  exit /b 0
)
if /I "%CLAUDEX_FAKE_MODE%"=="partial" goto partial
if /I "%CLAUDEX_FAKE_MODE%"=="missing" goto missing
if /I "%CLAUDEX_FAKE_MODE%"=="invalidfinal" goto invalidfinal
if /I "%CLAUDEX_FAKE_MODE%"=="statuswarning" goto statuswarning
echo evento-invalido-NO_GUARDAR_INVALIDO
echo {"type":"stream_event","session_id":"NO_GUARDAR_SESSION","event":{"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":"NO_GUARDAR_RAZONAMIENTO"}}}
echo {"type":"stream_event","session_id":"NO_GUARDAR_SESSION","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Resultado visible."}}}
echo {"type":"assistant","message":{"content":[{"type":"thinking","thinking":"NO_GUARDAR_BLOQUE"},{"type":"text","text":"Resultado visible."}]}}
echo {"type":"rate_limit_event","rate_limit_info":{"status":"allowed","resetsAt":1790000000,"rateLimitType":"five_hour"}}
echo {"type":"result","session_id":"NO_GUARDAR_RESULT_SESSION","is_error":false,"result":"Resultado visible.","structured_output":{"summary":"fake-ok"}}
exit /b 0
:partial
echo {"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Respuesta parcial conservada."}}}
echo {"type":"rate_limit_event","rate_limit_info":{"status":"allowed_warning","utilization":0.96,"resetsAt":1790000000,"rateLimitType":"five_hour"}}
exit /b 42
:missing
echo {"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Respuesta sin sobre final."}}}
exit /b 0
:invalidfinal
echo {"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Texto sin estructura."}}}
echo {"type":"result","session_id":"NO_GUARDAR_INVALID_SESSION","is_error":false,"result":"Texto sin estructura.","structured_output":null}
exit /b 0
:statuswarning
echo {"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Corte conservador por estado."}}}
echo {"type":"rate_limit_event","rate_limit_info":{"status":"allowed_warning","resetsAt":1790000000,"rateLimitType":"five_hour"}}
exit /b 42
'@
    [IO.File]::WriteAllText($fakeClaudePath, $fakeClaude, [Text.ASCIIEncoding]::new())

    $previousFakeMode = $env:CLAUDEX_FAKE_MODE
    try {
        $env:CLAUDEX_FAKE_MODE = 'success'
        $previousErrorPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $fakeSuccessRaw = $encodedPrompt | & $launcherPath `
                -EncodedStdin `
                -ProjectPath $ProjectPath `
                -Profile 's/low' `
                -OutputFormat json `
                -ClaudeCommandPath $fakeClaudePath 2>&1
            $fakeSuccessExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorPreference
        }
        Assert-Equal 'fake success exit code' $fakeSuccessExitCode 0
        $fakeSuccessOutputText = $fakeSuccessRaw -join [Environment]::NewLine
        if ($fakeSuccessOutputText -match 'CLAUDEX_USAGE_CHECKPOINT') {
            throw 'Un estado allowed sin utilizacion activo un checkpoint inesperado.'
        }
        $fakeSuccessJsonLine = @($fakeSuccessRaw | Where-Object { [string] $_ -match '^\s*\{"type":"result"' })
        Assert-Equal 'fake success JSON line count' $fakeSuccessJsonLine.Count 1
        $fakeSuccess = ([string] $fakeSuccessJsonLine[0]) | ConvertFrom-Json
        Assert-Equal 'fake success final result' $fakeSuccess.result 'Resultado visible.'
        Assert-Equal 'fake success structured output' $fakeSuccess.structured_output.summary 'fake-ok'

        $successJournal = Get-ChildItem -LiteralPath $fixtureDirectory -Filter 'claudex-*.jsonl' -File |
            Sort-Object LastWriteTimeUtc -Descending |
            Select-Object -First 1
        if ($null -eq $successJournal) {
            throw 'La invocacion fake exitosa no creo un journal durable.'
        }
        $successJournalText = [IO.File]::ReadAllText($successJournal.FullName, [Text.Encoding]::UTF8)
        if ($successJournalText -match 'NO_GUARDAR') {
            throw 'El journal durable conservo razonamiento interno que debia filtrar.'
        }
        if ($successJournalText -notmatch [regex]::Escape('Resultado visible.')) {
            throw 'El journal durable no conservo el texto visible.'
        }
        if ($successJournalText -notmatch [regex]::Escape('claudex_invalid_event')) {
            throw 'El journal durable no registro de forma segura el evento JSON invalido.'
        }

        $previousErrorPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $fakeKnownUsageRaw = $encodedPrompt | & $launcherPath `
                -EncodedStdin `
                -ProjectPath $ProjectPath `
                -Profile 's/low' `
                -KnownUsagePercent 99 `
                -UsageCheckpointPercent 95 `
                -OutputFormat json `
                -ClaudeCommandPath $fakeClaudePath 2>&1
            $fakeKnownUsageExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorPreference
        }
        Assert-Equal 'known usage continues exit code' $fakeKnownUsageExitCode 0
        $fakeKnownUsageText = $fakeKnownUsageRaw -join [Environment]::NewLine
        foreach ($checkpointFragment in @(
            'CLAUDEX_USAGE_CHECKPOINT',
            '"type":"claudex_usage_checkpoint"',
            '"trigger_basis":"known_usage"',
            '"action":"continue_and_recover_on_failure"'
        )) {
            if ($fakeKnownUsageText -notmatch [regex]::Escape($checkpointFragment)) {
                throw "El checkpoint de uso conocido no incluyo '$checkpointFragment'."
            }
        }
        $fakeKnownUsageJsonLine = @($fakeKnownUsageRaw | Where-Object { [string] $_ -match '^\s*\{"type":"result"' })
        Assert-Equal 'known usage final JSON line count' $fakeKnownUsageJsonLine.Count 1
        $fakeKnownUsageResult = ([string] $fakeKnownUsageJsonLine[0]) | ConvertFrom-Json
        Assert-Equal 'known usage still invoked Claude' $fakeKnownUsageResult.result 'Resultado visible.'

        $env:CLAUDEX_FAKE_MODE = 'partial'
        $previousErrorPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $fakePartialRaw = $encodedPrompt | & $launcherPath `
                -EncodedStdin `
                -ProjectPath $ProjectPath `
                -Profile 's/low' `
                -OutputFormat json `
                -ClaudeCommandPath $fakeClaudePath 2>&1
            $fakePartialExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorPreference
        }
        Assert-Equal 'fake partial exit code' $fakePartialExitCode 42
        $fakePartialOutputText = $fakePartialRaw -join [Environment]::NewLine
        $fakePartialJsonLine = @($fakePartialRaw | Where-Object { [string] $_ -match '^\s*\{"type":"claudex_recovery"' })
        Assert-Equal 'fake partial JSON line count' $fakePartialJsonLine.Count 1
        $fakePartial = ([string] $fakePartialJsonLine[0]) | ConvertFrom-Json
        Assert-Equal 'fake partial envelope' $fakePartial.type 'claudex_recovery'
        Assert-Equal 'fake partial reason' $fakePartial.terminal_reason 'claude_exit_nonzero'
        Assert-Equal 'fake partial text' $fakePartial.result 'Respuesta parcial conservada.'
        Assert-Equal 'fake partial original exit' $fakePartial.claude_exit_code 42
        Assert-Equal 'fake partial maximum usage' $fakePartial.rate_limit.maxUtilizationPercent 96
        foreach ($checkpointFragment in @(
            '"trigger_basis":"utilization"',
            '"utilization_known":true',
            '"threshold_reached":true',
            '"action":"continue_and_recover_on_failure"'
        )) {
            if ($fakePartialOutputText -notmatch [regex]::Escape($checkpointFragment)) {
                throw "El checkpoint de utilizacion no incluyo '$checkpointFragment'."
            }
        }

        $env:CLAUDEX_FAKE_MODE = 'missing'
        $previousErrorPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $fakeMissingRaw = $encodedPrompt | & $launcherPath `
                -EncodedStdin `
                -ProjectPath $ProjectPath `
                -Profile 's/low' `
                -OutputFormat json `
                -ClaudeCommandPath $fakeClaudePath
            $fakeMissingExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorPreference
        }
        Assert-Equal 'fake missing result exit code' $fakeMissingExitCode 76
        $fakeMissing = ($fakeMissingRaw -join [Environment]::NewLine) | ConvertFrom-Json
        Assert-Equal 'fake missing result envelope' $fakeMissing.type 'claudex_recovery'
        Assert-Equal 'fake missing result reason' $fakeMissing.terminal_reason 'missing_final_result'
        Assert-Equal 'fake missing result text' $fakeMissing.result 'Respuesta sin sobre final.'

        $env:CLAUDEX_FAKE_MODE = 'invalidfinal'
        $previousErrorPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $fakeInvalidFinalRaw = $encodedPrompt | & $launcherPath `
                -EncodedStdin `
                -ProjectPath $ProjectPath `
                -Profile 's/low' `
                -OutputFormat json `
                -ClaudeCommandPath $fakeClaudePath 2>&1
            $fakeInvalidFinalExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorPreference
        }
        Assert-Equal 'fake invalid final exit code' $fakeInvalidFinalExitCode 76
        $fakeInvalidFinalJsonLine = @($fakeInvalidFinalRaw | Where-Object { [string] $_ -match '^\s*\{"type":"claudex_recovery"' })
        Assert-Equal 'fake invalid final JSON line count' $fakeInvalidFinalJsonLine.Count 1
        $fakeInvalidFinal = ([string] $fakeInvalidFinalJsonLine[0]) | ConvertFrom-Json
        Assert-Equal 'fake invalid final envelope' $fakeInvalidFinal.type 'claudex_recovery'
        Assert-Equal 'fake invalid final reason' $fakeInvalidFinal.terminal_reason 'schema_output_missing'
        Assert-Equal 'fake invalid final text' $fakeInvalidFinal.result 'Texto sin estructura.'

        $env:CLAUDEX_FAKE_MODE = 'statuswarning'
        $previousErrorPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $fakeStatusWarningRaw = $encodedPrompt | & $launcherPath `
                -EncodedStdin `
                -ProjectPath $ProjectPath `
                -Profile 's/low' `
                -OutputFormat json `
                -ClaudeCommandPath $fakeClaudePath 2>&1
            $fakeStatusWarningExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorPreference
        }
        Assert-Equal 'fake status warning exit code' $fakeStatusWarningExitCode 42
        $fakeStatusWarningOutputText = $fakeStatusWarningRaw -join [Environment]::NewLine
        foreach ($checkpointFragment in @(
            '"trigger_basis":"status"',
            '"utilization_known":false',
            '"threshold_reached":false',
            '"action":"continue_and_recover_on_failure"'
        )) {
            if ($fakeStatusWarningOutputText -notmatch [regex]::Escape($checkpointFragment)) {
                throw "El checkpoint por estado no incluyo '$checkpointFragment'."
            }
        }
        $fakeStatusWarningJsonLine = @($fakeStatusWarningRaw | Where-Object { [string] $_ -match '^\s*\{"type":"claudex_recovery"' })
        Assert-Equal 'fake status warning JSON line count' $fakeStatusWarningJsonLine.Count 1
        $fakeStatusWarning = ([string] $fakeStatusWarningJsonLine[0]) | ConvertFrom-Json
        Assert-Equal 'fake status warning checkpoint basis' $fakeStatusWarning.usage_checkpoint.triggerBasis 'status'
        Assert-Equal 'fake status warning usage known' $fakeStatusWarning.usage_checkpoint.utilizationKnown $false
        Assert-Equal 'fake status warning threshold reached' $fakeStatusWarning.usage_checkpoint.thresholdReached $false
    }
    finally {
        if ($null -eq $previousFakeMode) {
            Remove-Item Env:CLAUDEX_FAKE_MODE -ErrorAction SilentlyContinue
        }
        else {
            $env:CLAUDEX_FAKE_MODE = $previousFakeMode
        }
    }
}
finally {
    if ($null -eq $previousRecoveryDirectory) {
        Remove-Item Env:CLAUDEX_RECOVERY_DIR -ErrorAction SilentlyContinue
    }
    else {
        $env:CLAUDEX_RECOVERY_DIR = $previousRecoveryDirectory
    }

    if (Test-Path -LiteralPath $fixtureDirectory) {
        Remove-Item -LiteralPath $fixtureDirectory -Recurse -Force -ErrorAction SilentlyContinue
    }
}

$previousPeerState = $env:CLAUDEX_PEER_ACTIVE
try {
    $env:CLAUDEX_PEER_ACTIVE = '1'
    $ErrorActionPreference = 'Continue'
    try {
        $recursionOutput = $encodedPrompt | & $launcherPath `
            -EncodedStdin `
            -ProjectPath $ProjectPath `
            -Profile 's/low' `
            -DryRun 2>&1
    }
    finally {
        $ErrorActionPreference = $previousErrorPreference
    }
    if ($LASTEXITCODE -eq 0) {
        throw 'La reentrada recursiva no fue rechazada.'
    }
    if (($recursionOutput -join [Environment]::NewLine) -notmatch 'reentrada recursiva') {
        throw 'La reentrada recursiva no produjo el diagnostico esperado.'
    }
}
finally {
    if ($null -eq $previousPeerState) {
        Remove-Item Env:CLAUDEX_PEER_ACTIVE -ErrorAction SilentlyContinue
    }
    else {
        $env:CLAUDEX_PEER_ACTIVE = $previousPeerState
    }
}

$settingsHashAfter = if (Test-Path -LiteralPath $settingsPath) { (Get-FileHash -Algorithm SHA256 -LiteralPath $settingsPath).Hash } else { $null }
Assert-Equal 'persistent settings hash' $settingsHashAfter $settingsHashBefore

'Claudex: pruebas DryRun, checkpoint no bloqueante y recuperacion pasaron.'
