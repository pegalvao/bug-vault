# 🎮 BUG VAULT - Ambiente de Homologação & Automação E2E

Ambiente de homologação para execução do **Freedoom** no navegador via **WebAssembly (`js-dos v6.22`)**, integrado com automação de testes E2E utilizando **Node.js** e **Playwright**.

O jogo usa apenas componentes livres: o motor é GPL e os dados do jogo original foram substituídos pelos do Freedoom. Veja [Licenças](#-licenças).

---

## 🛠️ Tecnologias Utilizadas

* **Front-end:** HTML5, CSS3, JavaScript (ES6+).
* **Emulação:** WebAssembly, `js-dos v6.22` (MS-DOS Box).
* **Jogo:** motor FastDoom v1.3.0 (DOS) com os dados do Freedoom Phase 1 v0.13.0.
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
├── public/
│   ├── index.html      # Aplicação web com o container WebAssembly
│   ├── app.js          # Inicialização do emulador e do jogo
│   ├── freedoom.zip    # Pacote do jogo (FDOOM.EXE, FREEDM1.WAD, FDOOM.CFG)
│   ├── licenses/       # Textos das licenças do motor e do jogo
│   └── source/         # Código-fonte do FastDoom (exigência da GPL)
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

---

## 📜 Licenças

| Componente | Versão | Licença | Origem |
| --- | --- | --- | --- |
| Freedoom Phase 1 (`FREEDM1.WAD`) | 0.13.0 | BSD-3-Clause | [freedoom.github.io](https://freedoom.github.io/) |
| FastDoom (`FDOOM.EXE`) | 1.3.0 | GPL-2.0 | [viti95/FastDoom](https://github.com/viti95/FastDoom/tree/1.3.0) |
| DOS/32A (embutido no `FDOOM.EXE`) | - | Licença própria, permissiva | [public/licenses/DOS32A-LICENSE.txt](public/licenses/DOS32A-LICENSE.txt) |
| js-dos | 6.22 | GPL | [js-dos.com](https://js-dos.com/) |

Os textos das licenças estão em [`public/licenses/`](public/licenses/).

This product uses DOS/32 Advanced DOS Extender technology.

### Código-fonte do FastDoom

O arquivo [`public/source/FastDoom-1.3.0-src.zip`](public/source/FastDoom-1.3.0-src.zip) é o fonte da tag 1.3.0, publicado junto do binário como pede a GPL. Dele foram retirados os arquivos `WAD/*.WAD`, que têm lumps de fontes e não são usados pelo `FDOOM.EXE`. O arquivo original completo está em [viti95/FastDoom](https://github.com/viti95/FastDoom/tree/1.3.0).

### Como o `freedoom.zip` é montado

* `freedoom1.wad` é renomeado para `FREEDM1.WAD`, porque o DOS limita o nome a 8 caracteres e o FastDoom procura esse nome.
* `FDOOM.CFG` ativa o som (`snd_sfxdevice 3` e `snd_musicdevice 3`, Sound Blaster). Sem ele, o jogo roda mudo.
* O pacote tem só esses três arquivos. O `FONTH.WAD` da release do FastDoom fica de fora de propósito: o `FDOOM.EXE` não o usa, e os nomes dos lumps coincidem com as fontes do Doom original.
* Se um dia o zip tiver subpastas, cada uma precisa de uma entrada própria. Sem ela, o js-dos falha na extração com `extract-zip: No error`.