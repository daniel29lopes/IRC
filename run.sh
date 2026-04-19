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
    exit
fi

# Verifica se o ficheiro .env existe, senão cria um de exemplo
if [ ! -f .env ]; then
    echo "A criar ficheiro de configuração '.env'..."
    echo 'DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/trackfab"' > .env
    echo "[ATENÇÃO] Criado ficheiro '.env'."
    echo "Abre o ficheiro '.env' e coloca os teus dados reais da base de dados PostgreSQL."
    echo "Depois volta a executar este script: ./run.sh"
    exit
fi

echo "[1/3] A instalar dependências (pode demorar uns segundos)..."
pip install -r requirements.txt > /dev/null 2>&1

echo ""
echo "[2/3] A preparar a base de dados (Tabelas e Estrutura)..."
python3 init_db.py

echo ""
echo "[3/3] A iniciar o servidor do TRACK-FAB ERP..."
echo "----------------------------------------------------"
echo "Podes aceder ao sistema no teu navegador em:"
echo "http://127.0.0.1:8000/docs"
echo "----------------------------------------------------"
echo ""

uvicorn app.main:app --reload
