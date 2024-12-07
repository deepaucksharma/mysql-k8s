# PowerShell script to set up development environment

# Ensure running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))  
{  
    Write-Error "Please run this script as Administrator"
    exit
}

# Install Chocolatey if not installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey package manager..." -ForegroundColor Green
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install Node.js LTS
choco install nodejs-lts -y

# Install Go
choco install golang -y

# Install k6
choco install k6 -y

# Verify installations
Write-Host "`nVerifying Installations:" -ForegroundColor Green
node --version
npm --version
go version
k6 version

Write-Host "`nDevelopment environment setup complete!" -ForegroundColor Cyan
