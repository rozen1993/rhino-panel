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
        [string] $Phase = 'derive',
        [string] $ContextProfile = 'project'
    )

    $invokeArguments = @(
        '-EncodedStdin',
        '-ProjectPath', $ProjectPath,
        '-Phase', $Phase,
        '-ContextProfile', $ContextProfile,
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
    @{ Profile = 'o/ultracode'; Model = 'opus'; Level = 'ultracode'; Effort = 'xhigh'; Workflows = $true }
)

foreach ($case in $cases) {
    $result = Invoke-ClaudexDryRun -Profile $case.Profile
    Assert-Equal "$($case.Profile) model" $result.model $case.Model
    Assert-Equal "$($case.Profile) level" $result.level $case.Level
    Assert-Equal "$($case.Profile) effort" $result.effort $case.Effort
    Assert-Equal "$($case.Profile) workflows" $result.enableWorkflows $case.Workflows
    Assert-Equal "$($case.Profile) project" $result.projectPath ([IO.Path]::GetFullPath($ProjectPath).TrimEnd('\'))
    Assert-Equal "$($case.Profile) persistent settings" $result.persistentSettingsModified $false
}

$defaultResult = Invoke-ClaudexDryRun
Assert-Equal 'default model' $defaultResult.model 'opus'
Assert-Equal 'default level' $defaultResult.level 'low'
Assert-Equal 'default effort' $defaultResult.effort 'low'
Assert-Equal 'default workflows' $defaultResult.enableWorkflows $false

$comparisonResult = Invoke-ClaudexDryRun -Profile 'o/medium' -Phase compare -ContextProfile project
Assert-Equal 'comparison context' $comparisonResult.contextProfile 'neutral'
Assert-Equal 'comparison settings' $comparisonResult.settingSources 'user'
Assert-Equal 'comparison tools' @($comparisonResult.tools).Count 0
Assert-Equal 'comparison temporary directory removed' (Test-Path -LiteralPath $comparisonResult.workingDirectory) $false
if (-not $comparisonResult.schemaPath.EndsWith('comparison-response.schema.json')) {
    throw "La comparacion selecciono un esquema inesperado: '$($comparisonResult.schemaPath)'."
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

'Claudex: todas las pruebas DryRun pasaron.'
