# NovaPlataformaSeven — Documentação do Sistema

Frontend Angular 21 para gestão de **diárias de colaboradores** em postos de serviço. Consome a API REST hospedada no Azure.

**Base URL (dev):** `https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api`

---

## Visão geral

O sistema permite:

- Cadastrar colaboradores, postos, supervisores e funções
- Definir **diárias disponíveis** por data (quantidade × função × supervisor × posto)
- Lançar diárias para colaboradores (em lote ou unitário)
- Registrar adiantamentos (descontos) por colaborador
- Gerar relatórios consolidados
- Controlar acesso por usuário, perfil e permissões granulares
- Aprovar ou rejeitar solicitações sensíveis via fluxo de aprovação

---

## Fluxo de negócio

```
Cadastros base (Posto, Supervisor, Função, Usuário)
        ↓
Colaborador + ColaboradorDetalhe (vínculo com posto/função/supervisor)
        ↓
Diária Disponível (vagas por data)
        ↓
Lançamento de Diárias (+ Adiantamento opcional)
        ↓
Relatórios (consolidado, por data, lista de diárias)
```

Algumas operações passam pelo módulo de **Aprovações** antes de serem efetivadas.

---

## Entidades

### Colaborador

Dados pessoais e de endereço do colaborador.

| Campo | Tipo | Descrição |
|---|---|---|
| id | number | Identificador |
| nome | string | Nome completo |
| pix | string | Chave PIX |
| referencia | string | Referência interna |
| endereco, numero, complemento, bairro, cidade, uf, cep | string | Endereço |
| userCad, userAlt | string | Auditoria |
| dataCadastro, dataAlteracao | datetime | Auditoria |
| excluido | boolean | Exclusão lógica |

**Exemplos JSON:** `json/colaborador/`

---

### ColaboradorDetalhe

Vínculo do colaborador com um posto/função/supervisor específico. Um colaborador pode ter vários detalhes (contratos distintos).

| Campo | Tipo | Descrição |
|---|---|---|
| idColaborador | number | FK para Colaborador |
| valorDiaria | number | Valor unitário da diária |
| idFuncao, idSupervisor, idPosto | number | FKs |
| cpf, rg, dataNascimento | string | Dados pessoais |
| pix, banco, agencia, conta | string | Dados bancários |
| telefone, celular, email | string | Contato |

**Endpoint:** `/api/ColaboradorDetalhe`

---

### Diária Disponível

Define quantas diárias estão disponíveis em uma data para uma combinação função + supervisor + posto.

| Campo | Tipo | Descrição |
|---|---|---|
| quantidadeDiaria | number | Quantidade de vagas |
| dataReferencia | datetime | Data de referência |
| idFuncao, idSupervisor, idPosto | number | FKs |
| usuarioCadAlt | string | Usuário que cadastrou/alterou |

**Endpoints especiais:**
- `GET /DiariaDisponivel/lista` — retorna nomes resolvidos (função, supervisor, posto)

**Exemplos JSON:** `json/diaria/`

---

### Diária

Registro efetivo de uma diária lançada para um colaborador.

| Campo | Tipo | Descrição |
|---|---|---|
| idColaboradorDetalhe | number | FK para ColaboradorDetalhe |
| dataDiaria | date | Data da diária |
| userCadastro | string | Usuário que lançou |

**Endpoints especiais:**
- `GET /Diaria/colaborador-detalhe/{id}` — diárias de um detalhe
- `GET /Diaria/periodo?startDate=&endDate=` — por período
- `GET /GetPostoFuncaoSuper?detalhe={id}` — opções de posto/função/supervisor
- `GET /DatasPeriodos?detalhe={id}` — datas de períodos disponíveis

---

### Adiantamento (DiariaDesconto)

Valor antecipado ao colaborador, descontado no consolidado.

| Campo | Tipo | Descrição |
|---|---|---|
| idColaborador | number | FK para Colaborador |
| valor | number | Valor do adiantamento |
| data | date | Data do adiantamento |
| userCadastro | string | Usuário que registrou |

**Endpoint:** `/api/DiariaDesconto`

---

### Cadastros auxiliares

| Entidade | Endpoint | Campo principal |
|---|---|---|
| Posto | `/api/Posto` | nome |
| Supervisor | `/api/Supervisor` | nome |
| Função | `/api/funcao` | nome |
| Usuário | `/api/Usuario` | user, password, tipo |

**Exemplos JSON:** `json/posto/`, `json/supervisor/`, `json/funcao/`, `json/usuario/`

---

## Autenticação e permissões

### Autenticação (`/api/Autenticacao`)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/login` | Retorna token JWT, refreshToken, user e menu |
| POST | `/register` | Cadastro de usuário |
| GET | `/me` | Dados do usuário logado |
| GET | `/validate` | Valida token |
| POST | `/refresh-token` | Renova token |
| POST | `/change-passwoard` | Altera senha |

O token é enviado automaticamente pelo `auth.interceptor.ts` em todas as requisições à API.

### Permissões (`/api/UsuarioPermissao`)

Controle granular por controller/ação. Carregado no login via `PermissionService`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/usuario/{id}` | Permissões de um usuário |
| POST | `/salvar-lote` | Salva permissões em lote |
| GET | `/controllers` | Lista controllers disponíveis |

### Guards do frontend

| Guard | Uso |
|---|---|
| `authGuard` | Exige login |
| `adminGuard` | Exige perfil administrador |
| `permissionGuard` | Exige permissão por submenu (ex: codigoSubMenu 11) |
| `homeGuard` | Redireciona para primeira rota permitida |

---

## Aprovações (`/api/Aprovacao`)

Fluxo para operações que exigem aprovação de um administrador.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/solicitar` | Cria solicitação (entidade + payloadJson) |
| GET | `/minhas-solicitacoes` | Solicitações do usuário logado |
| GET | `/pendentes` | Pendentes para o aprovador |
| POST | `/{id}/aprovar` | Aprova |
| POST | `/{id}/rejeitar` | Rejeita (com observação) |
| GET | `/config` | Configuração de aprovadores por entidade |
| POST | `/config` | Adiciona aprovador |
| DELETE | `/config/{id}` | Remove aprovador |

---

## Relatórios (`/api/Relatorio`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/consolidado` | Consolidado geral (nome, valorTotal, adiantamento, pix) |
| GET | `/consolidadoPorData?inicial=&final=` | Consolidado por período |
| GET | `/lista-diaria-relatorio?inicial=&final=&colaborador=&posto=` | Lista detalhada de diárias |

---

## Rotas do frontend

| Rota | Módulo | Acesso |
|---|---|---|
| `/login` | Login | Público |
| `/colaboradores` | Listagem de colaboradores | Autenticado |
| `/colaboradores/novo`, `/colaboradores/:id/editar` | Cadastro | Autenticado |
| `/adicionar-diaria` | Lançamento em lote | Autenticado |
| `/adicionar-unica-diaria` | Lançamento unitário | Autenticado |
| `/lista-diarias` | Consulta de diárias | Autenticado |
| `/diaria-disponivel` | Gestão de vagas | Autenticado |
| `/cadastro-posto` | Cadastro de postos | Autenticado |
| `/cadastro-supervisor` | Cadastro de supervisores | Autenticado |
| `/cadastro-funcao` | Cadastro de funções | Autenticado |
| `/cadastro-usuario` | Cadastro de usuários | Admin |
| `/controle-acesso`, `/gestao-permissoes` | Permissões | Admin |
| `/relatorio-dashboard` | Dashboard | Permissão (submenu 11) |
| `/relatorio-curriculos` | Currículos | Autenticado |
| `/relatorio-diarias` | Relatório de diárias | Autenticado |
| `/relatorio-consolidado` | Consolidado geral | Autenticado |
| `/relatorio-consolidado-data` | Consolidado por data | Autenticado |
| `/aprovacoes/pendentes` | Aprovações pendentes | Admin |
| `/aprovacoes/minhas` | Minhas solicitações | Autenticado |
| `/aprovacoes/configurar` | Configurar aprovadores | Admin |

---

## Padrão CRUD da API

Todas as entidades principais seguem o mesmo padrão:

```
GET    /Entidade          → listagem
GET    /Entidade/{id}     → por ID
POST   /Entidade          → criar
PUT    /Entidade/{id}     → atualizar
DELETE /Entidade/{id}     → exclusão lógica
```

Registros possuem campos de auditoria (`dataCadastro`, `dataAlteracao`, `userCad`/`userAlt`, `excluido`).

---

## Estrutura da pasta `docs/`

```
docs/
├── README.md                          ← este arquivo
└── json/
    ├── colaborador/                   ← request, response, list, delete
    ├── diaria/                        ← diaria-disponivel (request, response, lista, put)
    ├── funcao/
    ├── posto/
    ├── supervisor/
    └── usuario/
```

Cada subpasta contém exemplos de payload para integração e testes manuais da API.

---

## Serviços Angular (mapeamento)

| Service | Entidade API |
|---|---|
| `auth.service.ts` | Autenticacao |
| `collaborator.service.ts` | Colaborador |
| `collaborator-detail.service.ts` | ColaboradorDetalhe |
| `daily.service.ts` | Diaria |
| `diaria-disponivel.service.ts` | DiariaDisponivel |
| `adiantamento.service.ts` | DiariaDesconto |
| `station.service.ts` | Posto |
| `supervisor.service.ts` | Supervisor |
| `role.service.ts` | funcao |
| `user.service.ts` | Usuario |
| `permission.service.ts` | UsuarioPermissao |
| `menu.service.ts` | Menu |
| `aprovacao.service.ts` | Aprovacao |
| `relatorio.service.ts` | Relatorio |

---

## Desenvolvimento local

```bash
npm install
ng serve
```

Acesse `http://localhost:4200/`. A URL da API é configurada em `src/app/environments/environment.ts`.
