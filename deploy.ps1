# Automated Blue-Green Deployment Framework
# Version: 2.3

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("blue", "green", "auto")]
    [string]$TargetEnv = "auto"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "INITIALIZING BLUE-GREEN DEPLOYMENT"
Write-Host "=========================================="

# 1. Determine Current and Target Environment
$CurrentEnv = "none"
$routerRunning = docker ps --filter "name=finguide_router" --format "{{.Names}}"

if ($routerRunning) {
    $activeContainers = docker ps --format "{{.Names}}"
    if ($activeContainers -like "*_blue*") {
        $CurrentEnv = "blue"
    } elseif ($activeContainers -like "*_green*") {
        $CurrentEnv = "green"
    }
}

if ($TargetEnv -eq "auto") {
    if ($CurrentEnv -eq "blue") { $TargetEnv = "green" } else { $TargetEnv = "blue" }
}

Write-Host "Current Environment: $CurrentEnv"
Write-Host "Target Environment:  $TargetEnv"
Write-Host "------------------------------------------"

# 2. Deployment Automation
Write-Host "Step 1: Building and starting $TargetEnv environment..."
try {
    docker-compose --profile $TargetEnv up -d --build
} catch {
    Write-Host "Failed to start $TargetEnv containers. Aborting."
    exit 1
}

# 3. Health Monitoring
Write-Host "Step 2: Running health checks on $TargetEnv..."
$MaxRetries = 10
$Healthy = $false

for ($i = 1; $i -le $MaxRetries; $i++) {
    Write-Host "Check $i of $MaxRetries..."
    $containerName = "finguide_backend_$TargetEnv"
    try {
        $result = docker exec $containerName curl -s http://localhost:5001/api/health
        if ($result -like "*healthy*") {
            $Healthy = $true
            break
        }
    } catch { }
    Start-Sleep -Seconds 5
}

if (-not $Healthy) {
    Write-Host "Health check FAILED for $TargetEnv!"
    Write-Host "Initiating Rollback..."
    docker-compose --profile $TargetEnv stop
    Write-Host "Rollback complete."
    exit 1
}

Write-Host "Health checks passed!"

# 4. Traffic Management
Write-Host "Step 3: Switching traffic to $TargetEnv..."

# Using brackets around variable name to avoid expansion issues with colons
$conf = @(
    "events {",
    "    worker_connections 1024;",
    "}",
    "http {",
    "    include       /etc/nginx/mime.types;",
    "    default_type  application/octet-stream;",
    "    upstream frontend_active {",
    "        server finguide_frontend_${TargetEnv}:80;",
    "    }",
    "    upstream backend_active {",
    "        server finguide_backend_${TargetEnv}:5001;",
    "    }",
    "    server {",
    "        listen 80;",
    "        location / {",
    "            proxy_pass http://frontend_active;",
    "            proxy_set_header Host `$host;",
    "            proxy_set_header X-Real-IP `$remote_addr;",
    "            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;",
    "            proxy_http_version 1.1;",
    "            proxy_set_header Upgrade `$http_upgrade;",
    "            proxy_set_header Connection `"upgrade`";",
    "        }",
    "    }",
    "    server {",
    "        listen 5001;",
    "        location / {",
    "            proxy_pass http://backend_active;",
    "            proxy_set_header Host `$host;",
    "            proxy_set_header X-Real-IP `$remote_addr;",
    "            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;",
    "        }",
    "    }",
    "}"
)

# On Windows, we need to ensure the directory is not locked.
# Mounting the directory instead of the file in docker-compose helps.
$routerDir = ".\nginx-router"
if (-not (Test-Path $routerDir)) { New-Item -ItemType Directory -Path $routerDir | Out-Null }
$confFile = "$routerDir\router.conf"

# Try to stop the router first to release any locks if needed
docker stop finguide_router 2>$null
$conf | Set-Content -Path $confFile -Force

Write-Host "Starting router..."
docker-compose up -d router

Write-Host "Traffic successfully switched to $TargetEnv!"

# 5. Cleanup
if ($CurrentEnv -ne "none" -and $CurrentEnv -ne $TargetEnv) {
    Write-Host "Step 4: Shutting down $CurrentEnv environment..."
    docker stop "finguide_backend_$CurrentEnv" "finguide_frontend_$CurrentEnv"
}

Write-Host "=========================================="
Write-Host "DEPLOYMENT SUCCESSFUL"
Write-Host "=========================================="
