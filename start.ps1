#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Starts the Speech Recording & Transcription POC application
    
.DESCRIPTION
    This script checks prerequisites, installs dependencies if needed, and starts both
    the server and client in development mode.
    
.EXAMPLE
    .\start.ps1
    
.EXAMPLE
    .\start.ps1 -SkipAzureCheck
#>

param(
    [switch]$SkipAzureCheck,
    [switch]$ForceInstall
)

$ErrorActionPreference = "Stop"

# Color output functions
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "✗ $args" -ForegroundColor Red }

# Banner
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Speech Recording & Transcription POC" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Info "Checking prerequisites..."
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js $nodeVersion detected"
    }
} catch {
    Write-Error "Node.js is not installed or not in PATH"
    Write-Host "Please install Node.js 20 LTS or later from https://nodejs.org/"
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found"
    Write-Host ""
    Write-Host "Please create a .env file with your Azure configuration:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SPEECH_ENDPOINT=https://<your-foundry-resource>.cognitiveservices.azure.com/" -ForegroundColor Gray
    Write-Host "SPEECH_REGION=<your-region, e.g. eastus>" -ForegroundColor Gray
    Write-Host "AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account-name>" -ForegroundColor Gray
    Write-Host "AZURE_STORAGE_CONTAINER_NAME=recordings" -ForegroundColor Gray
    Write-Host "PORT=3001" -ForegroundColor Gray
    Write-Host ""
    
    if (Test-Path ".env.example") {
        Write-Info "You can copy .env.example as a starting point:"
        Write-Host "    Copy-Item .env.example .env" -ForegroundColor Yellow
    }
    
    Write-Host ""
    $response = Read-Host "Do you want to continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

# Check Azure CLI login (optional but recommended)
if (-not $SkipAzureCheck) {
    Write-Info "Checking Azure CLI authentication..."
    try {
        $azAccount = az account show 2>$null | ConvertFrom-Json
        if ($LASTEXITCODE -eq 0 -and $azAccount) {
            Write-Success "Azure CLI authenticated as: $($azAccount.user.name)"
        }
    } catch {
        Write-Warning "Azure CLI is not logged in"
        Write-Host ""
        Write-Host "This app uses DefaultAzureCredential for passwordless authentication." -ForegroundColor Yellow
        Write-Host "For local development, please run: az login" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Required Azure RBAC roles:" -ForegroundColor Cyan
        Write-Host "  • Cognitive Services Speech User (on Speech resource)" -ForegroundColor Gray
        Write-Host "  • Storage Blob Data Contributor (on Storage Account)" -ForegroundColor Gray
        Write-Host ""
        
        $response = Read-Host "Do you want to continue anyway? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Info "Run 'az login' and try again"
            exit 1
        }
    }
}

# Check if dependencies are installed
$needsInstall = $false

if ($ForceInstall) {
    Write-Info "Force install requested..."
    $needsInstall = $true
} else {
    Write-Info "Checking dependencies..."
    
    if (-not (Test-Path "node_modules")) {
        Write-Warning "Root dependencies not found"
        $needsInstall = $true
    }
    
    if (-not (Test-Path "server/node_modules")) {
        Write-Warning "Server dependencies not found"
        $needsInstall = $true
    }
    
    if (-not (Test-Path "client/node_modules")) {
        Write-Warning "Client dependencies not found"
        $needsInstall = $true
    }
}

if ($needsInstall) {
    Write-Info "Installing dependencies (this may take a minute)..."
    npm run install:all
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    Write-Success "Dependencies installed successfully"
} else {
    Write-Success "Dependencies already installed"
}

# Start the application
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Starting development servers..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Info "Server will run on: http://localhost:3001"
Write-Info "Client will run on: http://localhost:5173"
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Yellow
Write-Host ""

# Start the dev servers
npm run dev
