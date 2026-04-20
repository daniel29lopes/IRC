# TRACK-FAB ERP
**Versão:** 1.3.1 - Em Fase de Testes (UAT)

Este repositório contém a infraestrutura Core do ERP para controlo de Engenharia, Armazém, Produção de Spools e Qualidade NDT.

⚠️ **O sistema encontra-se atualmente sob CODE FREEZE. Todas as alterações, novas funcionalidades ou refactoring logico estão restritamente suspensos até aprovação final da UAT (User Acceptance Testing).**

---

## 🚀 Como Iniciar a Plataforma (Ambiente Local)

O projeto é desenhado para iniciar com mínimo de atrito. Foram desenvolvidos launch scripts universais para levantar a Base de Dados (PostgreSQL via Docker), instalar dependências, gerir variáveis de ambiente, popular utilizadores de base e iniciar o servidor FastAPI e Frontend Next.js simultaneamente.

### Pré-Requisitos:
- [Docker e Docker Compose](https://www.docker.com/products/docker-desktop)
- [Node.js e NPM](https://nodejs.org/)
- [Python 3.11+](https://www.python.org/)

### Instruções:

**Para Sistemas Linux/macOS:**
```bash
# 1. Garanta que o script tem permissão de execução:
chmod +x run.sh

# 2. Inicie a infraestrutura e os servidores
./run.sh
```

**Para Sistemas Windows:**
```cmd
run.bat
```

> **Nota para a Base de Dados (via Docker):**
> O comando `docker-compose up -d db` é executado internamente nestes scripts. O porto **5432** deve estar livre na sua máquina local.

> **Utilizadores de Teste (UAT):**
> O módulo de segurança JWT está ativo na Versão 1.3. Durante o processo de bootstrap, o script `init_db.py` cria 5 contas padronizadas para cada função da operação. Utilize os seguintes perfis, todos com a password base `123456`:
> - `admin@trackfab.com` (Acesso Total / Dashboard)
> - `preparador@trackfab.com` (Engenharia / Bulk Loading)
> - `armazem@trackfab.com` (Logística e Kitting)
> - `producao@trackfab.com` (Chefe de Equipa / Tracker)
> - `ndt@trackfab.com` (Inspetor de Qualidade)

---

## 📁 Estrutura de Documentação
Todos os ficheiros técnicos, relatórios de auditoria e diretivas anteriores de usabilidade estão agora consolidados como arquivo em `/docs`. Esta diretoria na raiz está reservada apenas para documentação base e run scripts.
