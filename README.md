# API Monitor

Plataforma open-source para monitoramento de APIs e disponibilidade — construída de forma transparente, colaborativa e extensível.

![API Monitor — dashboard](./print-readme.png)

## Overview

Manter APIs saudáveis exige visibilidade contínua sobre disponibilidade, tempo de resposta e falhas. O **API Monitor** nasce com a missão de oferecer uma solução open-source para acompanhar endpoints, detectar indisponibilidade e centralizar informações essenciais sobre a saúde das APIs.

O projeto está sendo desenvolvido em estágio inicial, com foco em uma base sólida de arquitetura, qualidade de código e boas práticas de colaboração open-source.

## Status

**Em desenvolvimento inicial.**

A API backend já possui uma rota básica de verificação. Demais componentes — como frontend, pacotes compartilhados e funcionalidades de monitoramento — ainda estão em construção.

## Features

### Atualmente disponível

- API backend com Fastify 5
- Persistência em PostgreSQL (monitores, checks, incidentes e alertas)
- Rota `GET /` retornando status básico da aplicação
- Monitores, health checks, histórico, métricas, incidentes e alertas
- Scheduler automático de checks (intervalo padrão: 30 segundos)
- Monorepo com npm workspaces
- Configuração de ESLint e Prettier
- Documentação e templates para contribuição open-source

### Planejado

As funcionalidades abaixo fazem parte da visão do projeto, mas **ainda não estão implementadas**:

- Monitoramento contínuo de endpoints
- Health checks configuráveis
- Rastreamento de uptime
- Métricas de tempo de resposta
- Alertas e notificações
- Dashboard web
- Histórico de eventos e incidentes
- Integrações com ferramentas externas

## Tech Stack

Tecnologias utilizadas atualmente no repositório:

| Tecnologia                                    | Uso                                 |
| --------------------------------------------- | ----------------------------------- |
| [Node.js 24](https://nodejs.org/)             | Runtime                             |
| [npm 11](https://www.npmjs.com/)              | Gerenciador de pacotes e workspaces |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática                    |
| [Fastify 5](https://fastify.dev/)             | Framework HTTP da API               |
| [PostgreSQL](https://www.postgresql.org/)     | Persistência de dados               |
| [pg](https://node-postgres.com/)              | Driver PostgreSQL para Node.js      |
| [tsx](https://github.com/privatenumber/tsx)   | Execução da API em desenvolvimento  |
| ES Modules                                    | Módulos na aplicação `apps/api`     |
| [ESLint](https://eslint.org/)                 | Análise estática de código          |
| [Prettier](https://prettier.io/)              | Formatação de código                |

## Architecture

O repositório é organizado como monorepo:

```text
api-monitor/
├── apps/
│   ├── api/       # API backend (Fastify) — em desenvolvimento ativo
│   └── web/       # Frontend — em desenvolvimento
├── packages/      # Pacotes compartilhados — em desenvolvimento
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── SECURITY.md
```

- **`apps/api`** — contém a API backend. Atualmente expõe a rota `GET /`.
- **`apps/web`** — reservado para o frontend. Ainda não possui implementação neste repositório.
- **`packages/`** — reservado para bibliotecas e utilitários compartilhados. Ainda em desenvolvimento.

## Getting Started

### Pré-requisitos

- Node.js 24
- npm 11
- PostgreSQL 14+ (obrigatório para execução da API em produção/desenvolvimento com persistência)

### Instalação e execução

1. Clone o repositório:

```bash
git clone https://github.com/Geendersom/api-monitor.git
cd api-monitor
```

2. Instale as dependências na raiz do monorepo:

```bash
npm install
```

3. Configure o banco de dados:

Use o arquivo `.env.example` como referência e exporte a variável de ambiente antes de executar a API:

```bash
export DATABASE_URL=postgresql://usuario:senha@localhost:5432/api_monitor
```

Ou crie um arquivo `.env` local (não versionado) e carregue-o com `--env-file` ao executar comandos Node.js 24+.

4. Crie o schema do banco:

```bash
npm run migrate --workspace=api
```

5. Inicie a API em modo de desenvolvimento:

```bash
npm run dev --workspace=api
```

A API ficará disponível em `http://127.0.0.1:3000`.

Para testar a rota principal:

```bash
curl http://127.0.0.1:3000/
```

### Testes

Os testes unitários padrão **não exigem PostgreSQL**:

```bash
npm test
```

Para executar testes de integração com PostgreSQL (requer `DATABASE_URL` configurada):

```bash
npm run test:integration --workspace=api
```

## API

### `GET /`

Retorna o status básico da aplicação.

**Resposta de exemplo:**

```json
{
  "name": "API Monitor",
  "status": "online"
}
```

### `GET /monitors/:id/uptime?period=24h|7d|30d`

Retorna a disponibilidade histórica de um monitor no período solicitado, com base **somente nos checks efetivamente registrados** em `check_results`.

**Query parameter obrigatório:** `period` (`24h`, `7d` ou `30d`)

**Resposta de exemplo:**

```json
{
  "monitorId": "00000000-0000-0000-0000-000000000001",
  "period": "7d",
  "from": "2026-08-07T20:00:00.000Z",
  "to": "2026-08-14T20:00:00.000Z",
  "totalChecks": 100,
  "successfulChecks": 97,
  "failedChecks": 3,
  "uptimePercentage": 97,
  "averageResponseTimeMs": 142
}
```

**Erros comuns:**

- `400` — `{ "error": "Invalid period" }` quando `period` está ausente ou é inválido
- `404` — `{ "error": "Monitor not found" }` quando o monitor não existe

### `GET /monitors/:id/sla?period=24h|7d|30d`

Retorna a avaliação de SLA do monitor no período solicitado, com base nos checks reais registrados.

**SLA padrão:** 99.9%

**Resposta de exemplo:**

```json
{
  "monitorId": "00000000-0000-0000-0000-000000000001",
  "period": "30d",
  "from": "2026-07-15T20:00:00.000Z",
  "to": "2026-08-14T20:00:00.000Z",
  "slaTargetPercentage": 99.9,
  "uptimePercentage": 99.97,
  "downtimeMs": 123456,
  "allowedDowntimeMs": 2592000,
  "exceededDowntimeMs": 0,
  "status": "compliant"
}
```

**Status possíveis:** `compliant` ou `breached`

### Manutenção programada

| Método   | Rota                                       | Descrição                           |
| -------- | ------------------------------------------ | ----------------------------------- |
| `POST`   | `/monitors/:id/maintenance`                | Cria janela de manutenção           |
| `GET`    | `/monitors/:id/maintenance`                | Lista janelas do monitor            |
| `GET`    | `/monitors/:id/maintenance/active`         | Retorna manutenção ativa no momento |
| `DELETE` | `/monitors/:id/maintenance/:maintenanceId` | Remove janela de manutenção         |

Durante manutenção ativa, checks DOWN continuam sendo registrados, mas **não abrem incidentes nem alertas**.

## Development

Comandos disponíveis na raiz do repositório:

| Comando                | Descrição                                  |
| ---------------------- | ------------------------------------------ |
| `npm test`             | Executa os testes unitários da API         |
| `npm run lint`         | Analisa o código com ESLint                |
| `npm run format`       | Formata os arquivos com Prettier           |
| `npm run format:check` | Verifica a formatação sem alterar arquivos |

Recomendamos executar `npm run lint` e `npm run format:check` antes de enviar contribuições.

## Roadmap

Visão inicial do projeto — sujeita a evolução conforme a comunidade e os mantenedores definem prioridades:

- [ ] **API monitoring** — cadastro e verificação periódica de endpoints
- [ ] **Health checks** — checagens configuráveis por serviço
- [ ] **Uptime tracking** — acompanhamento de disponibilidade ao longo do tempo
- [ ] **Response time metrics** — coleta e visualização de latência
- [ ] **Alerting** — notificações quando limites forem ultrapassados
- [ ] **Dashboard** — interface web para acompanhar o status dos serviços
- [ ] **History** — registro histórico de eventos e incidentes
- [ ] **Integrations** — conexão com ferramentas externas

> Itens acima representam planejamento futuro. Nenhuma data foi definida.

## Contributing

Contribuições são bem-vindas — seja com código, documentação, revisões ou reportes de problemas.

Consulte o [Guia de Contribuição](CONTRIBUTING.md) para instruções sobre fork, setup local, padrões de commit e abertura de Pull Requests.

## Security

Se você identificar uma vulnerabilidade de segurança, consulte a [Política de Segurança](SECURITY.md) e reporte de forma responsável. **Não** abra Issues públicas para vulnerabilidades.

## Code of Conduct

Este projeto adota o [Contributor Covenant](CODE_OF_CONDUCT.md). Ao participar, você concorda em respeitar um ambiente acolhedor e inclusivo.

## License

Este projeto está licenciado sob a **ISC License**, conforme definido no `package.json` do repositório.

## Star the project

Se o API Monitor faz sentido para você, considere deixar uma ⭐ Star no repositório. Isso ajuda outras pessoas a descobrirem o projeto e acompanhar sua evolução ao longo do tempo.
