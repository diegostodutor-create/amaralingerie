# AMARA ERP — Codex Handoff

> Última atualização: 2026-08-16
> Repositório: `diegostodutor-create/amaralingerie`
> Produção: `https://diegostodutor-create.github.io/amaralingerie/`

## 1. Missão

Este repositório contém o ERP web da **Amara Confecções / Amara Produção**, voltado para uma confecção de lingerie. O sistema deve ser simples de operar no computador e no celular, mas manter rastreabilidade suficiente para pedidos, corte, produção, qualidade, estoque, expedição, custos e financeiro.

O proprietário do produto quer um sistema utilizável no dia a dia, não apenas um protótipo visual. Priorize funcionalidade real, integridade de dados, UX direta e segurança.

## 2. Estado atual

O sistema está publicado no GitHub Pages e conectado a um backend Supabase real.

### Status validado

Foram executados testes de integração reais contra produção usando dados temporários e limpeza posterior.

Resultado agregado:

- 55 verificações concluídas com sucesso.
- Site público: OK.
- Login e sessão: OK.
- Leitura dos cadastros: OK.
- CRUD de cliente: OK.
- Pedidos: OK.
- Corte e criação de OP: OK.
- Grade automática 20/40/40: OK.
- Apontamento de produção: OK.
- Baixa automática de material: OK.
- Qualidade: OK.
- Histórico de OP: OK.
- Expedição e entrega: OK.
- Custos: OK.
- Financeiro e recebimentos: OK.
- Rentabilidade: OK.
- Criação de usuário: OK.
- Login de usuário criado pelo ERP: OK.
- Troca de senha: OK.
- Desativação de usuário: OK.
- Logout e revogação de sessão: OK.

O primeiro teste longo atingiu rate limit do Supabase após 38 verificações; um segundo teste específico executou os 17 pontos restantes com 17/17 de sucesso. Não ficou nenhum registro temporário de teste no banco.

## 3. Stack

### Frontend

- HTML/CSS/JavaScript vanilla.
- Hospedagem: GitHub Pages.
- Sem framework de frontend atualmente.
- Estado de autenticação mantido em `sessionStorage`.

### Backend

- Supabase PostgreSQL.
- Supabase Edge Functions.
- Autenticação customizada da aplicação, separada do Supabase Auth.

### Projeto Supabase

Project ref:

```text
pklluxvpvbvomthbzahu
```

Base URL:

```text
https://pklluxvpvbvomthbzahu.supabase.co
```

Endpoints usados pelo frontend:

```text
API    https://pklluxvpvbvomthbzahu.supabase.co/functions/v1/amara-api
LOGIN  https://pklluxvpvbvomthbzahu.supabase.co/functions/v1/amara-login
COST   https://pklluxvpvbvomthbzahu.supabase.co/functions/v1/amara-costing
FIN    https://pklluxvpvbvomthbzahu.supabase.co/functions/v1/amara-finance
```

**Nunca adicionar service-role key, senha, hash de senha ou qualquer outro segredo ao repositório.**

## 4. Edge Functions

### `amara-api`

- Versão validada: **v9**.
- `verify_jwt: false` por decisão arquitetural, pois a função implementa autenticação customizada com Bearer token próprio.
- Corrigida para aceitar os dois formatos de pathname que podem chegar no runtime do Supabase:
  - `/functions/v1/amara-api/...`
  - `/amara-api/...`

Esse bug anteriormente fazia todas as rotas `/entities/...` retornarem 404 depois do login.

Rotas principais:

```text
GET  /health
GET  /me
POST /auth/logout

GET  /users
POST /users
POST /users/:id/password
PATCH /users/:id/active

GET    /entities/:entity
POST   /entities/:entity
GET    /entities/:entity/:id
PATCH  /entities/:entity/:id
PUT    /entities/:entity/:id
DELETE /entities/:entity/:id

POST /orders/:id/cut
POST /ops/:id/point
POST /ops/:id/quality
GET  /ops/:id/history
POST /orders/:id/shipment
POST /shipments/:id/deliver
GET  /alerts
```

Entities mapeadas:

```text
clients
products
colors
workers
materials
productMaterials
orders
cuts
ops
productionLogs
quality
stockMoves
shipments
finished
audit
workerTargets
qualityDefects
opEvents
```

### `amara-login`

- Versão validada: **v3**.
- Suporta hashes de senha PBKDF2 e bcrypt.
- Isso é importante porque o admin histórico usa PBKDF2, enquanto usuários criados pelo ERP recebem bcrypt.
- Antes da v3, usuários novos eram criados corretamente mas não conseguiam fazer login.

Fluxo:

1. Busca usuário ativo em `public.users`.
2. Valida senha.
3. Gera token aleatório de 32 bytes.
4. Persiste somente SHA-256 do token em `app_sessions`.
5. Sessão expira após 12 horas.
6. Retorna token raw apenas ao cliente.

### `amara-costing`

- Versão validada: **v1**.
- Calcula custo por produto usando ficha técnica, desperdício, mão de obra, custo fixo, overhead, impostos e margem alvo.

Fórmula principal:

```text
Preço recomendado = custo total / (1 - impostos% - margem alvo%)
```

### `amara-finance`

- Versão validada: **v2**.
- Também recebeu correção de normalização de pathname para o runtime atual do Supabase.

Rotas:

```text
POST /orders/:id/financialize
GET  /receivables
POST /receivables/:id/pay
GET  /expenses
POST /expenses
PATCH /expenses/:id
GET  /orders-profit
GET  /summary
```

### `amara-selftest`

Foi usado temporariamente para testes de integração e depois neutralizado.

A versão atual retorna HTTP 410 e não executa testes.

Não reative isso em produção sem proteção administrativa explícita. Pode ser removido em uma futura limpeza.

## 5. Autenticação e segurança

O ERP **não usa Supabase Auth** neste momento.

Tabelas relevantes:

```text
users
app_sessions
```

Papéis atuais:

```text
Administrador
Gestor
Produção
Estoque
Expedição
```

Regras gerais já implementadas:

- Administrador: usuários e acesso total.
- Administrador/Gestor: cadastros, custos, ficha técnica e financeiro.
- Produção: apontamento e qualidade conforme rotas permitidas.
- Expedição: operações de expedição.

RLS foi habilitado anteriormente e o acesso direto anon/authenticated às tabelas relevantes foi revogado. As operações passam pelas Edge Functions com service role interna.

Não colocar credenciais administrativas no código ou documentação pública.

## 6. Banco de dados

Principais tabelas existentes:

```text
users
app_settings
colors
clients
products
workers
materials
orders
cuts
ops
production_logs
quality
stock_moves
shipments
finished
audit
sync_devices
sync_conflicts
worker_targets
quality_defects
op_events
app_sessions
product_materials
receivables
receipt_payments
expenses
```

O banco também possui colunas comerciais e de custeio em `products` e snapshots financeiros em `orders`.

Migrations históricas relevantes:

```text
20260816022307 add_secure_app_sessions_and_admin
20260816024258 add_product_materials_and_targets
20260816031645 add_product_costing
20260816032004 add_commercial_finance
20260816032015 add_order_cost_snapshot
```

## 7. Dados-base já cadastrados

Não criar pedidos fictícios permanentes.

### Cores

```text
Preto
Marinho
Chocolate
Rubi
Sanremo
```

### Clientes-base

```text
Aeroposter — Nova Friburgo
Beijoca
Frivel — Nova Friburgo
```

### Modelos-base

```text
Pruana
Sabrina ribana
Claudia ribana
Afrodite ribana
Harley
Duda
Isadora
Tanga Lis
Tangão Luma Microfibra
Luma Marcas
Tanga Lara
Tangão Lara
```

### Equipe-base

```text
Tereza
Angélica
Núbia
Graciane
Sabrina
Marlon
Érica
Aline
```

### Materiais-base

```text
Viés — m
Elástico — m
Linha — m
```

Estoques e custos foram inicialmente cadastrados como zero para serem preenchidos com dados reais.

## 8. Regra de grade

Grade padrão da operação:

```text
M  = 20%
G  = 40%
GG = 40%
```

Ao criar OPs a partir de uma quantidade por cor, o backend atualmente usa:

```js
M = Math.round(q * 0.2)
G = Math.round(q * 0.4)
GG = q - M - G
```

Isso garante fechamento exato da quantidade total mesmo quando o valor não é divisível perfeitamente.

Não alterar essa regra sem solicitação do proprietário.

## 9. Fluxo de negócio

Fluxo principal esperado:

```text
Pedido
  → Corte
  → OP por cor e grade
  → Apontamento de produção
  → Qualidade
  → Pronto
  → Expedição
  → Entregue
```

### Status do pedido

A função `recalc()` deriva o status do pedido a partir de OPs, cortes e expedições.

Estados usados incluem:

```text
Aguardando corte
Corte planejado
Em produção
Pronto
Separando
Entregue
Cancelado
```

### Produção

Um apontamento não pode ultrapassar a quantidade planejada da OP.

Ao apontar produção:

- cria registro em `production_logs`;
- atualiza `done_m`, `done_g`, `done_gg`;
- atualiza status da OP;
- baixa automaticamente materiais da ficha técnica;
- registra movimento em `stock_moves`;
- registra evento em `op_events`;
- recalcula pedido.

### Qualidade

Aprovação leva a OP para `Concluído`.

Reprovação leva a `Retrabalho`.

Defeitos podem ser registrados em `quality_defects`.

### Expedição

Criar expedição coloca o pedido em separação.

Marcar como entregue atualiza shipment e pedido para `Entregue`.

## 10. Custos e ficha técnica

A ficha técnica é baseada em:

```text
product_materials
```

Campos importantes:

```text
product_id
material_id
consumption_per_piece
waste_percent
sequence
active
```

Custos de produto também consideram em `products`:

```text
labor_cost_per_piece
overhead_percent
tax_percent
target_margin_percent
fixed_cost_per_piece
sale_price
```

Ao produzir, a baixa de material usa:

```text
necessidade = consumo_por_peça × quantidade × (1 + desperdício% / 100)
```

A operação deve bloquear produção quando o material necessário não existir ou o saldo for insuficiente.

## 11. Financeiro

O financeiro trabalha com:

```text
receivables
receipt_payments
expenses
```

Ao financializar pedido:

```text
receita bruta = qty × unit_price
valor total = receita bruta - desconto + frete
```

É salvo um snapshot de custo por peça no pedido para preservar a rentabilidade histórica mesmo que a ficha técnica seja alterada depois.

Status financeiros:

```text
Pendente
Parcial
Pago
```

O teste de integração confirmou:

- criação da conta a receber;
- pagamento integral;
- saldo zero;
- status Pago;
- resumo financeiro;
- rentabilidade estimada.

## 12. Frontend atual

Arquivo publicado final:

```text
index.html
```

Entretanto, **não edite `index.html` como fonte primária** sem entender o workflow.

O workflow de Pages monta o HTML com:

```bash
./scripts/build.sh
```

A fonte `src/index.html` é copiada para `_site/index.html`. O arquivo da raiz deve permanecer sincronizado no próprio commit, sem commits automáticos do workflow.

### Estrutura atual do frontend

O HTML histórico foi consolidado em uma fonte convencional:

```text
src/index.html
```

`scripts/build.sh` copia essa fonte para `_site/index.html`, e `scripts/check.sh` valida o artefato, a estrutura HTML essencial e a sintaxe JavaScript. O `index.html` da raiz é mantido sincronizado para compatibilidade com o GitHub Pages, mas não é a fonte primária.

### Prioridade técnica recomendada

Separar gradualmente a fonte consolidada em arquivos dedicados, por exemplo:

```text
src/index.html
src/app.js
src/styles.css
```

ou migrar para uma stack simples como Vite, se houver benefício real.

Depois simplificar o workflow para publicar o artefato sem concatenar fragments arbitrários.

Preserve comportamento e compatibilidade antes de refatorar.

## 13. GitHub Pages

Workflow:

```text
.github/workflows/deploy-pages.yml
```

O workflow atual:

1. checkout;
2. executa `scripts/build.sh`, copiando `src/index.html` para `_site/index.html`;
3. cria `.nojekyll`;
4. configura Pages;
5. envia artifact;
6. faz deploy.

O workflow não cria mais commits automáticos durante o deploy e usa apenas permissão de leitura para o conteúdo do repositório.

O GitHub Pages já está habilitado.

Últimas execuções relacionadas ao patch Safari concluíram com sucesso em todas as etapas.

## 14. Safari / iPhone

Foi reportado que o sistema não abria corretamente no Safari móvel.

### Causa identificada

O CSS antigo continha:

```css
@media(max-width:700px){.side{display:none}}
```

Ou seja: depois do login o menu principal desaparecia completamente no iPhone, sem navegação substituta.

### Correção aplicada

Foi implementado:

- botão móvel `☰`;
- sidebar deslizante;
- backdrop para fechar menu;
- `viewport-fit=cover`;
- `100dvh` com fallback `100vh`;
- `env(safe-area-inset-*)`;
- `-webkit-overflow-scrolling: touch`;
- inputs com 16 px em mobile para evitar zoom automático do Safari;
- `touch-action: manipulation`;
- JavaScript do menu escrito de forma conservadora, sem optional chaining;
- remoção de um caractere `>` solto no markup histórico.

Após o patch, o deploy do Pages passou com sucesso.

### Próxima validação

Fazer teste visual real em Safari/iPhone e confirmar:

- login;
- botão `☰` visível;
- menu abre e fecha;
- navegação entre todas as telas;
- modal abre sem escapar da viewport;
- tabelas têm scroll horizontal;
- teclado do iPhone não quebra formulários;
- orientação portrait/landscape;
- sessão continua após navegação normal da página.

## 15. Compatibilidade de JavaScript

O frontend usa JavaScript moderno em diversos pontos, incluindo:

- arrow functions;
- template literals;
- `async/await`;
- spread objects;
- optional/nullish operators em partes do código legado.

Safari moderno suporta isso, mas se a meta passar a incluir iPhones antigos, considerar build/transpile via Babel/esbuild/Vite em vez de remendar sintaxe manualmente.

## 16. Problemas já corrigidos — não reintroduzir

### 16.1 Backend 404 depois do login

Causa: pathname do Supabase Edge Runtime não era normalizado corretamente.

Correção: remover tanto prefixo `/functions/v1/<fn>` quanto `/<fn>`.

### 16.2 Usuário novo não conseguia entrar

Causa: API criava bcrypt, login aceitava apenas PBKDF2.

Correção: `amara-login` v3 aceita ambos.

### 16.3 Safari móvel sem menu

Causa: sidebar simplesmente escondida abaixo de 700px.

Correção: drawer móvel.

### 16.4 Supabase não serve frontend HTML normalmente

Não tentar hospedar o frontend diretamente em Supabase Storage ou Edge Function default domain.

O ambiente Supabase reescreve/serve HTML como plain text em cenários relevantes de segurança. O frontend deve continuar em um host apropriado, hoje GitHub Pages.

### 16.5 Deploys Vercel anteriores

Houve tentativas de Vercel que apareciam READY e depois ficavam inacessíveis/404. Não reutilizar URLs antigas de Vercel como produção.

GitHub Pages é o host funcional atual.

## 17. UX esperada

O usuário prefere operação direta e simples.

Não transformar o ERP em uma interface excessivamente complexa.

Prioridades:

1. poucos cliques para criar pedido;
2. grade e cores fáceis de entender;
3. produção rápida para costureiras/gestão;
4. dashboards com números acionáveis;
5. boa experiência móvel;
6. mensagens de erro claras;
7. nenhuma perda silenciosa de dados.

## 18. Domínio da Amara

Produtos recorrentes conhecidos:

```text
Tanga Lis
Tangão Luma Microfibra
Luma Marcas
Tanga Lara
Tangão Lara
Pruana
Sabrina ribana
Claudia ribana
Afrodite ribana
Harley
Duda
Isadora
```

Cores recorrentes:

```text
Preto
Marinho
Chocolate
Rubi
Sanremo
```

Outras cores históricas incluem Rubro, Sandia e Romance.

Equipe de produção histórica conhecida:

```text
Tereza
Angélica
Núbia
Graciane
Sabrina
Marlon
Érica
Aline
```

Exemplo histórico de produção:

```text
Tereza   — 1000 Pruana + 820 Sabrina ribana
Angélica — 1000 Sabrina ribana
Núbia    — 2000 Claudia ribana
Graciane — 800 Afrodite ribana
Sabrina  — 1000 Harley
Marlon   — 2000 Harley
Érica    — 2000 Harley
Aline    — 1000 Aphrodite ribana + 600 Duda + 2000 Isadora
```

Esses números são contexto operacional e **não devem ser inseridos como produção atual sem confirmação**.

## 19. Próximos passos recomendados para o Codex

Ordem sugerida:

### P0 — estabilidade

- Abrir o sistema publicado e fazer teste visual mobile + desktop.
- Verificar console do navegador.
- Verificar Network após login.
- Confirmar Safari/iPhone após o patch móvel.
- Não alterar dados reais durante testes; usar dados temporários com prefixo inequívoco e limpeza garantida.

### P1 — refatorar frontend

- Eliminar concatenação frágil `parts/part*.txt`.
- Criar estrutura fonte convencional.
- Preservar o mesmo comportamento inicialmente.
- Adicionar lint/format e algum teste automatizado mínimo.

### P1 — UX mobile

- Melhorar cabeçalho no iPhone.
- Avaliar navegação inferior ou drawer mais refinado.
- Melhorar formulários longos.
- Tornar tabelas mais legíveis em telas estreitas.

### P1 — resiliência do carregamento

`refreshAll()` já isola falhas das entidades carregadas em paralelo: mantém o último cache válido, inicializa listas ausentes com segurança e exibe um aviso com os módulos que não atualizaram. Como próxima evolução, adicionar estados de erro específicos dentro de cada painel e botão de nova tentativa por módulo.

### P2 — segurança

- Revisar RLS e grants.
- Revisar política de sessão customizada.
- Considerar migrar para Supabase Auth no futuro apenas se houver benefício concreto e plano de migração seguro.
- Implementar rate limiting apropriado no login.
- Considerar CSRF/origin policy se houver mudança do modelo de autenticação.
- Nunca expor service-role no cliente.

### P2 — observabilidade

- Structured logging nas Edge Functions.
- IDs de correlação por request.
- Auditoria de ações administrativas.
- Dashboard de erros 4xx/5xx.

### P2 — produto

- Melhorar cadastro de ficha técnica.
- Metas por costureira.
- Indicadores de produtividade.
- Perdas/refugo.
- Estoque mínimo e previsão de compra.
- Relatórios por cliente/modelo/período.
- Rentabilidade por pedido e produto.

## 20. Regras para alterações

Antes de editar:

1. leia este arquivo;
2. inspecione o código atual e o workflow;
3. confirme a estrutura real do Supabase antes de escrever SQL;
4. faça mudança pequena e verificável;
5. valide backend e UI;
6. preserve dados reais;
7. nunca coloque segredo em commit.

Após editar:

1. verificar sintaxe;
2. executar testes relevantes;
3. confirmar GitHub Actions/Pages;
4. abrir a URL de produção;
5. verificar console e network;
6. documentar mudança importante neste handoff se ela alterar arquitetura ou decisões.

## 21. Prompt recomendado para iniciar no Codex

Use algo próximo de:

```text
Leia CODEX_HANDOFF.md inteiro antes de alterar qualquer arquivo.
Depois inspecione o repositório e valide o estado atual do AMARA ERP.
Prioridade: estabilidade, Safari/iPhone, funcionamento real dos módulos e refatoração segura do frontend sem regressões.
Não altere nem apague dados reais do Supabase. Não exponha segredos. Faça commits pequenos e verifique o deploy do GitHub Pages após mudanças.
```

## 22. Critério de pronto

Uma mudança só deve ser considerada pronta quando:

- código está no repositório;
- build/deploy terminou com sucesso;
- página publicada carrega;
- login funciona;
- fluxo alterado foi testado;
- não há erro relevante de console/network;
- nenhum dado temporário ficou no banco;
- nenhuma credencial foi exposta.

---

Este arquivo é o ponto de continuidade entre a conversa de produto e o trabalho de engenharia no Codex. Atualize-o quando decisões arquiteturais relevantes mudarem.
