# Relatório de Auditoria Técnica - TRACK-FAB ERP (Versão 1.2)
**Para: Arquiteto Principal**

## 1. Mapeamento de Ficheiros (Estrutura e Responsabilidades)

O frontend foi limpo, consolidado e uniformizado na Update 1.2. Em baixo encontra-se a macroestrutura atual com as suas responsabilidades:

### Backend (`/app/`)
Mantém o scaffolding e os contratos rigorosos de separação de domínios (Domain Driven Design leve):
*   `main.py`: App Factory. Ficheiro puramente orquestrador para iniciar a API (FastAPI) e verificar a saúde da BD.
*   `api/rotas_*.py`: Os *Controllers* que definem os endpoints RESTful organizados por contexto (Engenharia, Logística, Produção).
*   `core/`: Ficheiros de configuração da aplicação (`config.py`) e a injeção de dependências do SQLAlchemy (`database.py`).
*   `models/schema.py`: Os modelos nativos da Base de Dados (ORM).
*   `schemas/*.py`: Os contratos de input/output que validam os dados entre o frontend e backend usando o Pydantic v2.
*   `services/`: Isolamento da lógica de negócio complexa, como transações atómicas para movimentos de stock ou hold de engenharia.

### Frontend (`/frontend/src/`)
Implementado usando a App Router Architecture do Next.js (Client Components nestas views devido ao uso intensivo de Hooks de estado estrito).
*   `app/layout.tsx`: O Contentor Root (Injeção de providers globais: React Query e React-Hot-Toast).
*   `app/page.tsx`: Módulo core vazio que agora atua apenas como redirecionamento automático (HTTP 308 redirect via server routing) para o Dashboard.
*   `app/dashboard/`: (Dashboard V1.2 consolidado do sprint 6) O Cockpit de Supervisão com telemetria live recorrendo a Recharts.
*   `app/producao/`, `app/qualidade/`, `app/engenharia/`, `app/armazem/`: Ecrãs de gestão departamental com as interações CRUD e máquinas de estado isoladas.
*   `components/layout/MainLayout.tsx`: A Sidebar consolidada com `usePathname` para destacar as rotas operativas de forma semântica.
*   `types/index.ts`: O espelho em TypeScript dos modelos Pydantic do backend. O id global (`id_item`) encontra-se rigorosamente unificado como `string`.
*   `lib/mockData.ts` & `lib/api.ts`: A separação integral do que é Data Mock vs. chamadas à instância axios baseada na API, isolando os componentes React de lógica "hardcoded".

---

## 2. Checklist do Master Plan e Regras de Negócio

*   [x] **Event Sourcing do Stock**: A lógica determina que "movimentos_stock" registam o histórico incondicional (Event Sourcing), não podendo ser editados. O stock real é derivado de `sum(movimentos_stock.qtd_alterada)`. *Validado a nível conceptual no backend.*
*   [x] **UX/UI Semântico**: As cores base dos componentes Tailwind mapeiam rigorosamente para o estado físico (`PENDENTE: amarelo`, `CONCLUIDO: esmeralda`, `HOLD: laranja`, etc.), incluindo no gráfico `Recharts` da dashboard que partilha este dicionário.
*   [x] **Rigor na Tipagem (Frontend)**: O `any` foi mitigado nas chamadas à API, sendo tipado estritamente como `AxiosError<{detail?: string}>` para assegurar o catch de erros das mensagens de rejeição do backend FastAPI de modo resiliente.
*   [x] **Triggers de Hold e Restauro (Engenharia)**: Quando um material em Hold de Revisão é validado sem impacto na BOM (Bill of Materials), a API backend está instruída via requisitos passados para restaurar o estado a partir do histórico nativo (`historico_estados_item`), e não voltar de forma cega a PENDENTE.
*   [x] **Lock Concorrência de Soldaduras (Qualidade)**: O estado da junta muda imutavelmente para "CORTADA" quando reprova o teste, forçando o aumento iterativo em nova "tentativa", sendo a ação destrutiva. O bloqueio ao nível da BD (row-level lock) com `with_for_update()` no Pydantic/SQLAlchemy foi estipulado desde os primeiros sprints.

---

## 3. Dívida Técnica Acumulada (Technical Debt)

Para que a transição de MVP a *Enterprise Ready* ocorra na V1.3, temos de saldar as seguintes dívidas:
1.  **Frontend Mocked Data**: As views de Produção e Qualidade estão completamente funcionais a nível de Layout, Componentização, React-Query e Error Handling, porém utilizam o `lib/mockData.ts` para initial state via `useState`. Estas views devem fazer *Data Fetching* real invocando a `api` (`axios.get`) e delegar o parsing aos providers React-Query reais.
2.  **Autenticação JWT Ausente**: Estamos a enviar o user hardcoded (`id_operador: 1`) nas mutações axios de forma a saltar burocracias nas validações. O módulo OAuth2 e Injeção de JWT Tokens precisa ser implementado para amarrar os perfis.
3.  **Client Component Abuse (`"use client"`)**: Toda a app router do Next.js foi envolvida em "use client" nas page roots devido à facilidade de manipular estados de UX rápidos (`onClick`). Isto prejudica a performance (Server-Side Rendering nulo). Páginas puramente de "Display" ou painéis Kanban deviam ser SSR e as interações passarem por Server Actions ou *leaf components* de cliente.
