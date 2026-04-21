@echo off
title TRACK-FAB ERP Backend
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
    goto end
)

REM Verifica se o Node.js esta instalado
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] O Node.js nao esta instalado!
    echo O frontend precisa do Node.js para correr. Por favor instala-o a partir de nodejs.org
    pause
    goto end
)

REM Verifica se o ficheiro .env existe, senao cria um de exemplo
IF NOT EXIST ".env" (
    echo A criar ficheiro de configuracao '.env'...
    echo DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/trackfab" > .env
    echo [ATENCAO] Criado ficheiro '.env'.
    echo Abre o ficheiro '.env' no Bloco de Notas e coloca os teus dados reais da base de dados PostgreSQL.
    echo Depois volta a executar este ficheiro run.bat!
    pause
    goto end
)

echo [1/4] A instalar dependencias Backend (Python)...
pip install -r requirements.txt >nul 2>&1

echo.
echo [2/4] A preparar a base de dados (Tabelas e Estrutura)...
python init_db.py

echo.
echo [3/4] A iniciar o servidor Frontend (React/Next.js) numa nova janela...
echo Podes aceder ao FrontEnd no teu navegador em: http://localhost:3000
start "TRACK-FAB Frontend" cmd /c "cd frontend && npm install && npm run dev"

echo.
echo [4/4] A iniciar o servidor Backend (FastAPI)...
echo Podes aceder a API / Swagger no teu navegador em: http://127.0.0.1:8000/docs
echo ----------------------------------------------------
echo Podes fechar esta janela para parar o servidor.
echo ----------------------------------------------------
echo.
uvicorn app.main:app --reload

:end
