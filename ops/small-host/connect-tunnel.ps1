param(
    [Parameter(Mandatory = $true)]
    [string]$RemoteHost,
    [string]$RemoteUser = "root",
    [Parameter(Mandatory = $true)]
    [string]$IdentityFile,
    [int]$LocalPort = 1443
)

$forward = "${LocalPort}:127.0.0.1:1443"
Write-Host "SSH 隧道启动后，请访问 https://localhost:$LocalPort"
Write-Host "保持此窗口打开；按 Ctrl+C 关闭隧道。"
& ssh -N -L $forward -i $IdentityFile -p 22 "${RemoteUser}@${RemoteHost}"
