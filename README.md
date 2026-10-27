# 🎮 QA Doom Portfolio - Ambiente de Homologação & Automação E2E

Ambiente de homologação para execução do jogo **Doom** no navegador via **WebAssembly (`js-dos v6.22`)**, integrado com automação de testes E2E utilizando **Node.js** e **Playwright**.

---

## 🛠️ Tecnologias Utilizadas

* **Front-end:** HTML5, CSS3, JavaScript (ES6+).
* **Emulação:** WebAssembly, `js-dos v6.22` (MS-DOS Box).
* **Automação & QA:** Node.js, Playwright.
* **Hospedagem & CI/CD:** GitHub Pages / GitHub Actions.

---

## 📋 Pré-requisitos

* **Node.js** (versão 18 ou superior)
* **npm** (gerenciador de pacotes do Node.js)

---

## 🚀 Instalação e Execução Local

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/seu-repositorio.git
   cd seu-repositorio
   ```

2. **Instalar as dependências do Node.js:**
   ```bash
   npm install
   ```

3. **Instalar os navegadores do Playwright:**
   ```bash
   npx playwright install
   ```

4. **Executar os testes automatizados:**
   ```bash
   # Execução em modo headless
   npm test

   # Execução com interface gráfica do navegador
   npm run test:headed

   # Execução via Playwright UI Mode
   npm run test:ui
   ```

---

## 📂 Estrutura do Projeto

```text
├── index.html          # Aplicação web com o container WebAssembly
├── doom_dos.ZIP        # Pacote comprimido contendo o binário MS-DOS (DOOM.EXE / DOOM1.WAD)
├── package.json        # Dependências e scripts do ecossistema Node.js / Playwright
├── tests/
│   └── doom.spec.js    # Suite de testes E2E com Playwright
└── README.md           # Documentação do projeto
```

---

## 🧪 Cobertura de Testes Automatizados

A suite de testes em Playwright valida:
* Presença e renderização do elemento `<canvas id="dos">`.
* Resolução e proporções do container de emulação (`640x400`).
* Monitorização e captura de erros na consola do navegador.
* Disparo de eventos de teclado e clique para interação com o jogo.