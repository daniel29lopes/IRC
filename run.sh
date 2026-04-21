#!/bin/bash

echo "========================================="
echo "       Bem-vindo ao TRACK-FAB ERP        "
echo "========================================="
echo ""

# Verifica se o Python está instalado
if ! command -v python3 &> /dev/null
then
    echo "[ERRO] O Python 3 não está instalado!"
    echo "Por favor instala o Python (versão 3.11 ou superior)."
    return 1 2>/dev/null || true
fi

# Verifica se o Node.js está instalado
if ! command -v npm &> /dev/null
then
    echo "[ERRO] O Node.js/npm não está instalado!"
    echo "O frontend precisa do Node.js para correr. Por favor instala-o a partir de nodejs.org"
    return 1 2>/dev/null || true
fi

# Verifica se o ficheiro .env existe, senão cria um de exemplo
if [ ! -f .env ]; then
    echo "A criar ficheiro de configuração '.env'..."
    echo 'DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/trackfab"' > .env
    echo "[ATENÇÃO] Criado ficheiro '.env'."
    echo "Abre o ficheiro '.env' e coloca os teus dados reais da base de dados PostgreSQL."
    echo "Depois volta a executar este script: ./run.sh"
    return 1 2>/dev/null || true
fi

echo "[1/4] A instalar dependências Backend (Python)..."
pip install -r requirements.txt > /dev/null 2>&1

echo ""
echo "[2/4] A preparar a base de dados (Tabelas e Estrutura)..."
python3 init_db.py

echo ""
echo "[3/4] A iniciar o servidor Frontend (React/Next.js) em background..."
echo "Podes aceder ao FrontEnd no teu navegador em: http://localhost:3000"
(cd frontend && npm install > /dev/null 2>&1 && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "[4/4] A iniciar o servidor Backend (FastAPI)..."
echo "----------------------------------------------------"
echo "Podes aceder ao Swagger (API) no teu navegador em: http://127.0.0.1:8000/docs"
echo "----------------------------------------------------"
echo "Prime CTRL+C para parar ambos os servidores."
echo ""

# Handler para fechar ambos os processos ao fazer CTRL+C
trap "echo 'A fechar os servidores...'; kill $FRONTEND_PID; return 0 2>/dev/null || true" INT TERM

uvicorn app.main:app --reload
