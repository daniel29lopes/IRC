# Manual de Bordo - TRACK-FAB ERP (Versão 1.2)

Bem-vindo ao **TRACK-FAB ERP**, o cérebro central da nossa fábrica. Este documento foi desenhado para a Direção e Operação, explicando como a plataforma funciona de forma simples, direta e sem jargões complexos.

Imagine o TRACK-FAB ERP como o sistema nervoso de um corpo humano: ele liga a cabeça (Engenharia) aos membros que executam o trabalho (Produção e Logística), garantindo que todos falam a mesma língua.

---

## 1. Resumo da Plataforma
Até à versão 1.2, o sistema opera de forma unificada as quatro grandes áreas da fábrica:

*   **Engenharia**: A origem da informação. Dita as regras, as medidas, as listas de materiais (Bill of Materials - BOM) e pode colocar travões (HOLDs) quando deteta erros no projeto.
*   **Armazém (Logística)**: O banco de peças. Recebe material, controla as prateleiras e entrega os "kits" encomendados pela Produção.
*   **Produção (Chão de Fábrica)**: O motor de montagem. Corta os tubos, junta as peças e efetua as soldaduras, informando o sistema do seu progresso passo-a-passo.
*   **Qualidade (NDT)**: O inspetor final. Aprova ou reprova as soldaduras através de métodos de raio-x e testes rigorosos (NDT).

Toda a informação visualizada pela fábrica hoje num tablet flui instantaneamente para o **Cockpit de Supervisão (Dashboard)** na sala da Direção.

---

## 2. Guia de Funcionalidades por Módulo

### 🏗️ Engenharia
* **Para que serve:** Submeter Isométricos (projetos de Spools) e os respetivos materiais.
* **O "Poder Especial":** O botão de **HOLD**. Se o cliente pede uma alteração num desenho, a engenharia põe o Spool em *Hold*. A produção fica automaticamente bloqueada e não consegue trabalhar nesse tubo até que a Engenharia liberte uma nova revisão.

### 📦 Armazém (Logística)
* **Para que serve:** Gerir as requisições de material feitas pela Produção.
* **Como funciona:** O Armazém nunca tem o botão "Recusar" por falta de stock. O sistema obriga a fazer entregas. Se pediram 10 tubos e só tens 8, fazes uma entrega *Parcial*. O pedido fica a "piscar" até que os outros 2 cheguem. Tudo para evitar que a produção pare por causa de "burocracia de sistema".

### 🏭 Produção
* **Para que serve:** Mapear fisicamente em que secretária o Spool está.
* **Regras da Passadeira de Montagem:** Um tubo só pode avançar de *Pendente* -> *Em Corte* -> *Em Montagem* -> *Soldado*. Não podes passar um tubo mágico de Pendente direto para Soldado. Isto garante que não nos escapam fases nem rastreabilidade.

### 🛡️ Qualidade (NDT - Ensaios Não Destrutivos)
* **Para que serve:** Validar cada centímetro de soldadura.
* **Regra Rigorosa:** Se o inspetor NDT carregar no botão **CORTAR** numa soldadura que chumbou no Raio-X, não tem volta atrás. O sistema risca essa soldadura, obriga a Produção a repará-la, aumenta o "número da tentativa" e guarda um registo imutável. A qualidade não aceita "jeitinhos".

---

## 3. O Sistema de Logins e Perfis

O TRACK-FAB usa um sistema de credenciais seguro e compartimentado:
* **"Tu só vês o que deves ver":**
    * O **PREPARADOR** (Engenharia) pode gerir desenhos, mas não pode aprovar soldaduras.
    * O **ARMAZEM** pode mexer em stocks, mas não pode dar um tubo como "Soldado".
    * O **ADMIN** ou a **DIREÇÃO** tem uma chave-mestra e pode ver tudo.

> *Na prática (V1.2):* A autenticação completa com ecrã de password ainda vai ser ligada na versão final. Atualmente o sistema trabalha assumindo quem o operador diz ser.

---

## 4. O Cofre de Dados (A Base de Dados)

O coração do ERP é a base de dados (o nosso cofre digital). Em vez de milhares de ficheiros Excel perdidos pelo servidor, nós usamos uma "gaveta ultrassegura" chamada PostgreSQL. Lá dentro, as tabelas cruzam todas as regras de negócio em tempo real.

### Como a Direção pode ver o "Excel" ao Vivo:
Se um administrador quiser espreitar os dados crus, sem passar pelos ecrãs bonitos, pode fazê-lo:

1. Fazer download de um programa visual gratuito como o **DBeaver** (dbeaver.io).
2. Abrir o programa e criar uma nova "Ligação de Base de Dados".
3. Escolher o elefante azul (**PostgreSQL**).
4. Preencher com os dados do vosso servidor:
   * **Host/Endereço:** *localhost* (ou o IP do vosso servidor)
   * **Porta:** *5432*
   * **Database:** *trackfab*
   * **Username/Password:** (Facultado pela vossa equipa de IT)
5. Clicar em "Connect" e abrir a pasta "Tables". Podem clicar duas vezes na tabela `movimentos_stock` ou `spools` e o programa mostrará uma folha de estilo Excel com a verdade em tempo real.

---

## 5. Dicas de Utilização (Boas Práticas)
* **Confiem no Dashboard:** O "Cockpit de Supervisão" (Ecrã principal) bebe a informação ao segundo. Usem-no para gerir crises. Se a linha dos "Alertas de Stock" piscar, atuem antes de a produção parar.
* **Armazém - Contagem Cega:** Nos tablets do armazém, o sistema foi programado para não sugerir o valor de tubos que devem ser entregues. O operador tem de os contar fisicamente e escrever o número (ex: 5). Isto reduz quebras de stock falsas porque elimina a facilidade de carregar apenas em "Confirmar tudo".
* **Tablets para todos:** A aplicação tem botões gigantes e cores claras para ser usada diretamente em ecrãs de toque no chão de fábrica por pessoas que têm luvas.
