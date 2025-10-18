Uso do assets/environment.json

Objetivo

Centralizar parâmetros configuráveis (endpoints, client IDs, flags) num arquivo JSON que pode ser alterado sem rebuild da aplicação.

Comportamento implementado

- `src/assets/runtime-config.js` tenta (síncronamente) carregar `/assets/environment.json` no carregamento da página e aplica suas chaves como variáveis globais `window.<KEY>` (ex.: `window.NG_API_DNS`, `window.NG_GOOGLE_CLIENT_ID`, `window.NG_LOGIN_URL`).
- Se `environment.json` não existir, o `runtime-config.js` aplica valores padrão e também respeita quaisquer variáveis previamente definidas no `window` (por exemplo via CI/CD ou outro script injetado no HTML).
- O app lê `window.NG_GOOGLE_CLIENT_ID` e `window.NG_LOGIN_URL` (via `app.config.ts` e `index.html`), mantendo compatibilidade com o fluxo anterior.

Exemplo de arquivo (`src/assets/environment.json`)

{
  "NG_API_DNS": "https://api.minha-app.com",
  "NG_LOGIN_URL": "https://api.minha-app.com/auth/login",
  "NG_GOOGLE_CLIENT_ID": "SEU_CLIENT_ID.apps.googleusercontent.com",
  "APP_NAME": "Postmortem Hub",
  "SENTRY_DSN": "",
  "FEATURE_FLAGS": {
    "enableExperimental": false
  }
}

Como usar em produção

Opção A — Deploy do arquivo JSON
- No servidor/host onde você publica os artefatos estáticos (a pasta `browser` do build), deixe um arquivo `environment.json` em `assets/` contendo as chaves desejadas. Isso permite mudar comportamento sem rebuild.

Opção B — Injeção por script (alternativa)
- Em ambientes que não permitem escrever arquivos estáticos após o build, você pode injetar variáveis globais antes do `runtime-config.js` (por exemplo via template do servidor):

<script>window.NG_GOOGLE_CLIENT_ID = '...'; window.NG_API_DNS = 'https://...';</script>
<script src="assets/runtime-config.js"></script>

Considerações técnicas

- O `runtime-config.js` usa uma requisição XHR síncrona para garantir que as variáveis estejam definidas antes do boot da aplicação Angular. Isso é intencional para evitar condições de corrida na inicialização.
- Alternativa (mais moderna): usar um `APP_INITIALIZER` Angular que busca o JSON de forma assíncrona, porém isso requer alterações na inicialização do app e pode atrasar o bootstrap.

Segurança

- Não coloque segredos sensíveis (client secrets, chaves privadas) neste JSON público — qualquer conteúdo em `assets/` será visível ao cliente.

Próximos passos sugeridos

- Adicionar suporte a múltiplos arquivos (ex.: `environment.prod.json`) e lógica de fallback por `NODE_ENV` em pipeline de deploy.
- Implementar `APP_INITIALIZER` para carregamento assíncrono caso queira evitar XHR síncrono.
- Documentar no README principal do projeto os passos de deploy com `environment.json`.


