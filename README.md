# Postmortem - Frontend

## Descrição

Projeto Frontend do sistema Postmortem desenvolvido com Angular e Node.js v22.20.0.

## Tecnologias Utilizadas

### Requisitos

- **Node.js**: v22.20.0
- **npm**: (incluído com Node.js)
- **Angular CLI**: 20.3.5
- **Angular**: 20.3.0
- **TypeScript**: 5.9.2

### Frameworks e Bibliotecas

- **Angular Core**: 20.3.0
- **Angular Router**: 20.3.0
- **Angular Forms**: 20.3.0
- **RxJS**: 7.8.0
- **Zone.js**: 0.15.0

### Ferramentas de Desenvolvimento

- **Karma**: 6.4.0 (Test Runner)
- **Jasmine**: 5.9.0 (Testing Framework)
- **TypeScript**: 5.9.2

## Instalação

### 1. Pré-requisitos

Certifique-se de ter o Node.js v22.20.0 instalado em sua máquina. Você pode verificar a versão com:

```bash 
node --version
```

### 2. Instalar Dependências

No diretório raiz do projeto, execute:

```bash 
npm install
```

## Como Executar

### Modo Desenvolvimento

Para executar o projeto em modo de desenvolvimento:
```bash 
npm start
```
ou

```shell
ng serve
```

O aplicativo estará disponível em: `http://localhost:4200/`

### Build de Produção

Para gerar o build de produção:
```bash 
npm run build
```
ou
```bash 
ng build
```
Os arquivos compilados estarão na pasta `dist/`.

### Executar Testes

Para executar os testes unitários:
```bash 
npm test
```
ou
```bash 
ng test
```

### Executar Testes com Cobertura

Para executar os testes com relatório de cobertura:
```bash 
ng test --code-coverage
```
## Estrutura do Projeto

```
postmortem-front/ 
├── src/ 
│ ├── app/ # Componentes e módulos da aplicação 
│ ├── index.html # Página HTML principal 
│ ├── main.ts # Ponto de entrada da aplicação 
│ └── styles.scss # Estilos globais 
├── public/ # Arquivos públicos 
├── angular.json # Configuração do Angular 
├── package.json # Dependências e scripts 
└── tsconfig.json # Configuração do TypeScript
```


## Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera o build de produção
- `npm test` - Executa os testes unitários
- `npm run watch` - Compila e observa mudanças nos arquivos

## Configuração

### Configuração do TypeScript

O projeto utiliza TypeScript 5.9.2 com configurações definidas em:
- `tsconfig.json` - Configuração base
- `tsconfig.app.json` - Configuração para a aplicação
- `tsconfig.spec.json` - Configuração para testes

### Configuração do Angular

As configurações do Angular estão em `angular.json`, incluindo:
- Configurações de build
- Configurações de desenvolvimento
- Configurações de testes

## Autenticação com Google (GIS)

A aplicação está preparada para autenticação com Google utilizando Google Identity Services (GIS).

Como funciona:
- O provedor de autenticação é parametrizado via injeção de dependência (AUTH_PROVIDER), atualmente configurado como `google` em `src/app/app.config.ts`.
- Após autenticação bem-sucedida, o JWT (ID token do Google) é armazenado no `localStorage` na chave `auth_token`.
- Imediatamente após receber o ID token, o frontend realiza um POST para o endpoint de login do backend, enviando `{ "idToken": <TOKEN_JWT_GOOGLE>, "provider": "Google" }`.
- Quando o backend responde ao `/auth/login`, se o corpo contiver `{ token: "<JWT_BACKEND>" }`, esse valor é salvo no storage (localStorage por padrão) na chave `token`. 

Configurações:
- Client ID do Google:
  1. Crie um OAuth 2.0 Client ID (tipo Web) no Google Cloud Console e habilite o Google Identity Services.
  2. Defina o Client ID em tempo de execução adicionando uma variável global antes do bootstrap (já há um placeholder em `src/index.html`):
     ```html
     <script>
       window.NG_GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID.apps.googleusercontent.com';
     </script>
     ```
     - Alternativamente, você pode substituir o valor em `app.config.ts` (propriedade `clientId`).
- URL de Login do Backend (parametrizada):
  - Por padrão: `http://localhost:8080/auth/login`.
  - Para alterar sem rebuild, defina no runtime em `index.html`:
    ```html
    <script>
      window.NG_LOGIN_URL = 'https://seu-backend.com/auth/login';
    </script>
    ```
  - Internamente, a URL também é fornecida via DI (Injection Token `LOGIN_URL`).

Como usar:
- Ao carregar a página, o GIS faz o auto-prompt (One Tap) e exibe também um botão de login padrão no topo da página (inserido em `index.html`).
- Quando o usuário completa o login, o callback global `handleGoogleCredential` armazena o JWT em `localStorage` e faz a chamada POST para o backend usando a URL parametrizada.

Onde está a implementação:
- Tokens de configuração: `src/app/auth/auth.tokens.ts` (inclui `AUTH_PROVIDER`, `GOOGLE_AUTH_CONFIG` e `LOGIN_URL`)
- Provedor Google (GIS): `src/app/auth/google-auth.provider.ts` (faz o POST após receber o token)
- Serviço de autenticação com provedor parametrizado: `src/app/auth/auth.service.ts`
- Provedores configurados: `src/app/app.config.ts`
- Script GIS e integração HTML (auto-prompt e botão): `src/index.html`

Lendo o token no app:
- Leia o token com `localStorage.getItem('auth_token')`. Para sair, remova-o: `localStorage.removeItem('auth_token')`.

Notas de segurança:
- Armazenar tokens em `localStorage` é simples, porém vulnerável a XSS. Em produção prefira fluxo baseado em cookies HTTPOnly emitidos pelo backend.

## Suporte

Para mais informações sobre Angular, consulte a [documentação oficial do Angular](https://angular.dev).
