@echo off
title TRACK-FAB ERP Iniciador
color 0A

echo =========================================
echo       Bem-vindo ao TRACK-FAB ERP
echo =========================================
echo.

REM Verifica se o Python esta instalado
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] O Python nao esta instalado!
    echo Por favor instala o Python (versao 3.11 ou superior) a partir de python.org
    echo Nao te esquecas de marcar a caixa "Add Python to PATH" durante a instalacao.
    pause
    exit /b
)

REM Verifica se o ficheiro .env existe, senao cria um de exemplo
IF NOT EXIST ".env" (
    echo A criar ficheiro de configuracao '.env'...
    echo DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/trackfab" > .env
    echo [ATENCAO] Criado ficheiro '.env'.
    echo Abre o ficheiro '.env' no Bloco de Notas e coloca os teus dados reais da base de dados PostgreSQL.
    echo Depois volta a executar este ficheiro run.bat!
    pause
    exit /b
)

echo [1/3] A instalar dependencias (pode demorar uns segundos)...
pip install -r requirements.txt >nul 2>&1

echo.
echo [2/3] A preparar a base de dados (Tabelas e Estrutura)...
python init_db.py

echo.
echo [3/3] A iniciar o servidor do TRACK-FAB ERP...
echo ----------------------------------------------------
echo Podes aceder ao sistema no teu navegador em:
echo http://127.0.0.1:8000/docs
echo ----------------------------------------------------
echo.
uvicorn app.main:app --reload

pause
