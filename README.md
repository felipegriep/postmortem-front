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

## Suporte

Para mais informações sobre Angular, consulte a [documentação oficial do Angular](https://angular.dev).
