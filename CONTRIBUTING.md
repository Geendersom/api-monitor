# Guia de Contribuição

Obrigado por considerar contribuir com o **API Monitor**. Este guia descreve como configurar o ambiente, executar o projeto e enviar contribuições de forma organizada.

## Pré-requisitos

- [Node.js 24](https://nodejs.org/)
- [npm 11](https://www.npmjs.com/)

## Como obter o código

### Fork e clone

1. Faça um fork do repositório no GitHub.
2. Clone o seu fork localmente:

```bash
git clone https://github.com/SEU-USUARIO/api-monitor.git
cd api-monitor
```

3. Adicione o repositório original como upstream (opcional, recomendado):

```bash
git remote add upstream https://github.com/Geendersom/api-monitor.git
```

## Instalação

Instale as dependências na raiz do monorepo:

```bash
npm install
```

O projeto utiliza **npm workspaces** com a seguinte estrutura:

```text
apps/
  api/    # API backend (Fastify)
  web/    # Frontend (em desenvolvimento)
packages/ # Pacotes compartilhados (em desenvolvimento)
```

## Executar o projeto localmente

### API

Para iniciar a API em modo de desenvolvimento:

```bash
npm run dev --workspace=api
```

A API ficará disponível em `http://127.0.0.1:3000`.

Para verificar se está respondendo:

```bash
curl http://127.0.0.1:3000/
```

Resposta esperada:

```json
{
  "name": "API Monitor",
  "status": "online"
}
```

## Qualidade de código

Execute os comandos abaixo na raiz do repositório.

### Lint

```bash
npm run lint
```

Para corrigir automaticamente problemas suportados pelo ESLint:

```bash
npm run lint:fix
```

### Formatação

Para formatar os arquivos:

```bash
npm run format
```

Para verificar a formatação sem alterar arquivos:

```bash
npm run format:check
```

Antes de abrir um Pull Request, certifique-se de que `npm run lint` e `npm run format:check` passam sem erros.

## Testes

No momento, a suíte de testes automatizados ainda não está configurada. O script disponível na raiz é:

```bash
npm test
```

Quando os testes forem adicionados ao projeto, este guia será atualizado com as instruções correspondentes.

## Fluxo de contribuição

### 1. Criar uma branch

Crie uma branch a partir da branch principal atualizada:

```bash
git checkout main
git pull upstream main
git checkout -b tipo/descricao-curta
```

Exemplos de prefixos recomendados:

- `feat/` — nova funcionalidade
- `fix/` — correção de bug
- `docs/` — documentação
- `chore/` — manutenção ou ajustes internos

### 2. Desenvolver e validar

- Faça alterações focadas e de escopo claro.
- Evite incluir mudanças não relacionadas no mesmo Pull Request.
- Execute `npm run lint` e `npm run format:check` antes de enviar.

### 3. Commits

Recomendamos mensagens de commit claras e descritivas. Quando possível, utilize o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```text
tipo(escopo): descrição curta no imperativo
```

Exemplos:

- `feat(api): add health check endpoint`
- `fix(api): handle listen errors on startup`
- `docs: update contributing guide`

### 4. Abrir uma Issue

Antes de iniciar uma mudança significativa, verifique se já existe uma Issue relacionada.

Para reportar bugs ou sugerir funcionalidades, utilize os templates disponíveis em:

- [Bug Report](https://github.com/Geendersom/api-monitor/issues/new?template=bug_report.yml)
- [Feature Request](https://github.com/Geendersom/api-monitor/issues/new?template=feature_request.yml)

Inclua o máximo de contexto possível para facilitar a análise.

### 5. Abrir um Pull Request

1. Envie a branch para o seu fork:

```bash
git push origin tipo/descricao-curta
```

2. Abra um Pull Request no GitHub contra a branch `main` do repositório original.
3. Preencha o template do Pull Request com descrição, tipo de mudança, checklist e testes realizados.
4. Relacione a Issue correspondente, quando aplicável.

## Revisão de código

Após abrir um Pull Request:

- Um mantenedor revisará a proposta o mais breve possível.
- Podem ser solicitados ajustes antes da aprovação.
- Contribuições serão avaliadas com base em clareza, qualidade, aderência ao escopo e impacto no projeto.
- Mudanças aprovadas serão integradas pela equipe de mantenedores.

## Código de Conduta

Este projeto segue o [Contributor Covenant](CODE_OF_CONDUCT.md). Ao participar, você concorda em respeitar essas diretrizes.

## Segurança

Se você identificar uma vulnerabilidade de segurança, **não** abra uma Issue pública. Consulte [SECURITY.md](SECURITY.md) para instruções de reporte responsável.

## Dúvidas

Se tiver dúvidas sobre como contribuir, abra uma Issue descrevendo sua pergunta. Ficaremos felizes em ajudar.
