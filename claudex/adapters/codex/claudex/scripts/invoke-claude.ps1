[CmdletBinding(PositionalBinding = $false)]
param(
    [Parameter(ValueFromPipeline = $true)]
    [AllowEmptyString()]
    [string] $Prompt,

    [ValidateSet('text', 'json')]
    [string] $OutputFormat = 'text',

    [switch] $EncodedStdin,

    [switch] $NoTools
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

    $claudeCommand = Get-Command 'claude.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $claudeCommand) {
        $claudeCommand = Get-Command 'claude.cmd' -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    if (-not $claudeCommand) {
        throw 'Claude Code no esta instalado o no esta disponible en PATH.'
    }

    $settingsPath = Join-Path $env:USERPROFILE '.claude\settings.json'
    if (-not (Test-Path -LiteralPath $settingsPath)) {
        throw "No se encontro la configuracion de Claude Code en '$settingsPath'. Activa Dynamic workflows antes de usar Claudex."
    }

    try {
        $settings = Get-Content -Raw -LiteralPath $settingsPath | ConvertFrom-Json
    }
    catch {
        throw "La configuracion de Claude Code en '$settingsPath' no contiene JSON valido."
    }

    if ($settings.enableWorkflows -ne $true) {
        throw 'Claudex requiere Dynamic workflows. Ejecuta `/config workflows=true` en Claude Code y vuelve a intentarlo.'
    }

    $arguments = @(
        '--print'
        '--model', 'opus'
        '--effort', 'xhigh'
        '--permission-mode', 'plan'
        '--no-session-persistence'
        '--output-format', $OutputFormat
    )

    if ($NoTools) {
        $arguments += '--tools='
    }
    else {
        $arguments += @('--tools', 'Read,Glob,Grep')
    }

    $previousPeerState = $env:CLAUDEX_PEER_ACTIVE
    try {
        $env:CLAUDEX_PEER_ACTIVE = '1'
        $promptText | & $claudeCommand.Source @arguments
        $claudeExitCode = $LASTEXITCODE
    }
    finally {
        if ($null -eq $previousPeerState) {
            Remove-Item Env:CLAUDEX_PEER_ACTIVE -ErrorAction SilentlyContinue
        }
        else {
            $env:CLAUDEX_PEER_ACTIVE = $previousPeerState
        }
    }

    if ($claudeExitCode -ne 0) {
        [Console]::Error.WriteLine("Claude Code termino con el codigo de salida $claudeExitCode. Revisa el mensaje anterior para distinguir autenticacion, limite de sesion o conectividad.")
        exit $claudeExitCode
    }
}
