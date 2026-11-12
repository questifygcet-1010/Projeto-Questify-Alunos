@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ========================================================
echo   Questify - Inicializacao Automatica (Docker / Local)
echo ========================================================

if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo [OK] Arquivo .env criado automaticamente a partir de .env.example.
  )
)

REM 1. Se o Docker estiver rodando, tenta subir o banco oficial no container
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [OK] Docker Desktop detectado! Subindo container PostgreSQL...
  docker compose up -d postgres
) else (
  echo [!] Docker Desktop nao esta aberto/instalado. Usando modo portatil automatico...
)

REM 2. Verifica se o Node.js esta instalado; se nao estiver, baixa o Node 22 portatil localmente
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  if not exist ".tools\node\node.exe" (
    echo [!] Node.js nao encontrado no sistema. Baixando Node.js v22.14.0 portatil para .tools\node...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$ErrorActionPreference='Stop'; New-Item -ItemType Directory -Force '.tools' | Out-Null; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip' -OutFile '.tools\node.zip'; Expand-Archive -Path '.tools\node.zip' -DestinationPath '.tools' -Force; Move-Item '.tools\node-v22.14.0-win-x64' '.tools\node' -Force; Remove-Item '.tools\node.zip'"
  )
  set "PATH=%~dp0.tools\node;%PATH%"
)

if not exist "node_modules" (
  echo [->] Instalando dependencias do projeto...
  call npm.cmd install
)

echo [->] Iniciando banco, migrations, seeds e servidor...
call npm.cmd run start:auto
