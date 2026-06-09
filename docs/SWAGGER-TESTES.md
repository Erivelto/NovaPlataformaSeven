# Testes no Swagger — Plataforma Seven

**Base URL:** `https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api`

**Swagger (se disponível):** `https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/swagger`

---

## 1. Autenticar

**POST** `/Autenticacao/login`

Arquivo: `json/autenticacao/login-request.json`

```json
{
  "user": "admin",
  "password": "SUA_SENHA_AQUI"
}
```

Copie o `token` da resposta e clique em **Authorize** no Swagger:

```
Bearer SEU_TOKEN_AQUI
```

---

## 2. Cenário completo — cadastro de colaborador + contratação

Execute **nesta ordem** (ajuste IDs se já existirem no banco):

| # | Método | Endpoint | JSON |
|---|--------|----------|------|
| 1 | POST | `/funcao` | `json/funcao/funcao-request.json` |
| 2 | POST | `/Supervisor` | `json/supervisor/supervisor-request.json` |
| 3 | POST | `/Posto` | `json/posto/posto-request.json` |
| 4 | POST | `/Colaborador` | `json/colaborador/colaborador-post-teste.json` |
| 5 | POST | `/ColaboradorDetalhe` | `json/colaborador-detalhe/post-request-minimo.json` |

> Após o passo 4, anote o **id** retornado e use em `idColaborador` no passo 5.  
> Após o passo 1–3, anote os IDs de função, supervisor e posto.

---

## 3. Testar PUT ColaboradorDetalhe (caso 1973)

Use para reproduzir o erro 500 ao editar contratação.

### 3.1 Consultar registro atual

**GET** `/ColaboradorDetalhe/1973`

Compare a resposta com os JSONs de PUT abaixo.

### 3.2 PUT — payload mínimo (igual ao frontend)

**PUT** `/ColaboradorDetalhe/1973`

Arquivo: `json/colaborador-detalhe/put-request-minimo.json`

```json
{
  "id": 1973,
  "idColaborador": 932,
  "valorDiaria": 121.00,
  "idFuncao": 7,
  "idSupervisor": 15,
  "idPosto": 56
}
```

### 3.3 PUT — payload completo (sem campos null)

**PUT** `/ColaboradorDetalhe/1973`

Arquivo: `json/colaborador-detalhe/put-request-completo.json`

> **Importante:** antes do PUT completo, faça GET `/ColaboradorDetalhe/1973` e copie os valores reais de `dataCadastro`, `userCad`, etc. para o JSON.

### 3.4 PUT — variante com excluido

Arquivo: `json/colaborador-detalhe/put-request-caso-1973.json`

---

## 4. Outros endpoints úteis

### Lançar diária

**POST** `/Diaria`  
Arquivo: `json/diaria/diaria-post-request.json`

```json
{
  "idColaboradorDetalhe": 1973,
  "dataDiaria": "2026-06-09",
  "userCadastro": "admin"
}
```

### Adiantamento (DiariaDesconto)

**POST** `/DiariaDesconto`  
Arquivo: `json/adiantamento/diaria-desconto-post-request.json`

### Diária disponível

**POST** `/DiariaDisponivel`  
Arquivo: `json/diaria/diaria-disponivel-request.json`

---

## 5. IDs do seu ambiente (referência)

| Campo | Valor |
|-------|-------|
| ColaboradorDetalhe | 1973 |
| Colaborador | 932 |
| Função | 7 |
| Supervisor (GC) | 15 |
| Posto | 56 |

Substitua pelos IDs válidos do seu banco se forem diferentes.

---

## 6. Interpretação de erros

| Status | Significado |
|--------|-------------|
| 200/204 | Sucesso |
| 401 | Token inválido ou expirado — faça login de novo |
| 403 | Sem permissão para esta operação |
| 404 | Registro ou endpoint não encontrado |
| 500 | Erro interno da API — ver logs do Azure App Service |

Se **PUT mínimo** e **PUT completo** retornarem 500, o bug está no backend .NET, não no payload do frontend.

---

## 7. Pasta de JSONs

```
docs/json/
├── autenticacao/login-request.json
├── colaborador/colaborador-post-teste.json
├── colaborador-detalhe/
│   ├── post-request-minimo.json
│   ├── post-request-completo.json
│   ├── put-request-minimo.json
│   ├── put-request-caso-1973.json
│   ├── put-request-completo.json
│   └── response.json
├── diaria/diaria-post-request.json
└── adiantamento/diaria-desconto-post-request.json
```

Copie e cole o conteúdo de cada arquivo no **Request body** do Swagger.
