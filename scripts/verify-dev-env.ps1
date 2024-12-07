# PowerShell script to verify and set up development environment

# Function to check and install a package
function Install-PackageIfMissing {
    param (
        [string]$PackageName,
        [string]$InstallCommand
    )

    try {
        $version = & $PackageName --version
        Write-Host "$PackageName is already installed. Version: $version" -ForegroundColor Green
    }
    catch {
        Write-Host "$PackageName is not installed. Installing..." -ForegroundColor Yellow
        Invoke-Expression $InstallCommand
    }
}

# Ensure running with administrator privileges
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

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Install and verify Node.js
Install-PackageIfMissing -PackageName "node" -InstallCommand "choco install nodejs-lts -y"

# Install and verify npm (comes with Node.js)
Install-PackageIfMissing -PackageName "npm" -InstallCommand "choco install nodejs-lts -y"

# Install and verify Go
Install-PackageIfMissing -PackageName "go" -InstallCommand "choco install golang -y"

# Install and verify k6
Install-PackageIfMissing -PackageName "k6" -InstallCommand "choco install k6 -y"

# Verify Docker
try {
    $dockerVersion = docker version --format '{{.Server.Version}}'
    Write-Host "Docker is installed. Version: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "Docker is not installed or not running" -ForegroundColor Red
}

# Verify Kubernetes
try {
    $kubectlVersion = kubectl version --client
    Write-Host "Kubectl is installed. Version: $kubectlVersion" -ForegroundColor Green
}
catch {
    Write-Host "Kubectl is not installed" -ForegroundColor Red
}

# Refresh environment variables again
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Final verification
Write-Host "`nFinal Verification:" -ForegroundColor Cyan
Write-Host "Node.js Version: $(node --version)"
Write-Host "npm Version: $(npm --version)"
Write-Host "Go Version: $(go version)"
Write-Host "k6 Version: $(k6 version)"

Write-Host "`nDevelopment environment setup and verification complete!" -ForegroundColor Green
