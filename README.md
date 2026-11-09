# 🎮 BUG VAULT - Ambiente de Homologação & Automação E2E

Ambiente de homologação para execução do **Freedoom** no navegador via **WebAssembly (`js-dos v6.22.60`)**, integrado com automação de testes E2E utilizando **Node.js** e **Playwright**.

O jogo usa apenas componentes livres: o motor é GPL e os dados do jogo original foram substituídos pelos do Freedoom. Veja [Licenças](#-licenças).

---

## 🛠️ Tecnologias Utilizadas

- **Front-end:** HTML5, CSS3, JavaScript (ES6+).
- **Emulação:** WebAssembly, `js-dos v6.22.60` (MS-DOS Box).
- **Jogo:** motor FastDoom v1.3.0 (DOS) com os dados do Freedoom Phase 1 v0.13.0.
- **Automação & QA:** Node.js, Playwright, TypeScript.
- **Hospedagem & CI/CD:** GitHub Pages / GitHub Actions.

---

## 📋 Pré-requisitos

- **Node.js** (versão 20 ou superior, exigida pelo Playwright)
- **npm** (gerenciador de pacotes do Node.js)

---

## 🚀 Instalação e Execução Local

1. **Clonar o repositório:**

   ```bash
   git clone https://github.com/pegalvao/bug-vault.git
   cd bug-vault
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

5. **Abrir o jogo no navegador (opcional):**
   ```bash
   npm run serve
   ```
   O jogo fica em `http://127.0.0.1:4173`. Os testes sobem esse servidor sozinhos. O emulador é servido pelo próprio projeto, então nem o jogo nem os testes precisam de internet depois do `npm install`.

---

## 🧹 Qualidade de Código

| Comando                | O que faz                                               |
| ---------------------- | ------------------------------------------------------- |
| `npm run lint`         | ESLint nos testes, na configuração e no `public/app.js` |
| `npm run format`       | Formata o projeto com o Prettier                        |
| `npm run format:check` | Só confere a formatação, sem alterar arquivos           |
| `npm run typecheck`    | Checa os tipos dos testes com o TypeScript              |

O `npm install` ativa dois hooks do Git pelo husky:

- **pre-commit:** roda o lint, a checagem de formatação e a de tipos. Se algo falhar, o commit não é criado.
- **commit-msg:** o commitlint exige o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), com a mensagem em português. Exemplos: `feat(ui): novo layout da página`, `fix(audio): retoma o AudioContext`, `docs: atualiza o README`.

O TypeScript fica na versão 6.0 porque o typescript-eslint ainda não suporta a 7.

---

## 📂 Estrutura do Projeto

```text
├── public/
│   ├── index.html      # Aplicação web com o container WebAssembly
│   ├── app.js          # Inicialização do emulador, do jogo e do áudio
│   ├── style.css       # Estilos da página
│   ├── avatar.webp     # Foto do cartão do operador
│   ├── freedoom.zip    # Pacote do jogo (FDOOM.EXE, FREEDM1.WAD, FDOOM.CFG)
│   ├── vendor/js-dos/  # Emulador js-dos 6.22.60 (js-dos.js, wdosbox.js, wdosbox.wasm.js)
│   ├── licenses/       # Textos das licenças do emulador, do motor e do jogo
│   └── source/         # Código-fonte do FastDoom e do js-dos (exigência da GPL)
├── tests/
│   ├── pages/              # Page Objects: seletores, comandos e leitura da tela
│   │   ├── home-page.ts    # Página em volta do jogo
│   │   └── game-page.ts    # Jogo dentro do canvas
│   ├── fixtures.ts         # Entrega o jogo aberto, iniciado ou em partida
│   ├── page.spec.ts        # Testes da página
│   ├── boot.spec.ts        # Testes da inicialização do emulador
│   └── gameplay.spec.ts    # Testes das regras do jogo
├── playwright.config.ts    # Configuração do Playwright e do servidor de testes
├── .github/workflows/deploy.yml  # CI: qualidade e testes antes de publicar no GitHub Pages
├── .husky/                 # Hooks do Git: lint antes do commit e padrão da mensagem
├── eslint.config.mjs       # Regras do ESLint
├── .prettierrc.json        # Regras do Prettier
├── commitlint.config.mjs   # Padrão das mensagens de commit
├── tsconfig.json           # Checagem de tipos dos testes (`npm run typecheck`)
├── package.json            # Dependências e scripts do ecossistema Node.js / Playwright
└── README.md               # Documentação do projeto
```

---

## 🧪 Cobertura de Testes Automatizados

A suite é escrita em TypeScript, usa o padrão Page Object Model e se divide em três camadas:

- **Página:** título, tamanho do canvas (`640x400`), guia de comandos e links de licença.
- **Boot:** ordem de inicialização, ausência de erros, tela desenhada, animação sem jogador, áudio liberado na primeira interação e erro registrado quando o `freedoom.zip` não carrega.
- **Gameplay:** valores iniciais do HUD, câmera parada sem input, andar, girar, tiro que consome munição e pausa pelo menu.

### Como o jogo é verificado

O jogo não tem elementos HTML para consultar: tudo é pixel dentro do canvas. Por isso os testes leem os pixels e usam duas técnicas:

- **Impressão digital do HUD:** um hash da região dos números. A munição e a vida têm um valor conhecido no início da partida, e o tiro precisa mudar só o da munição.
- **Diferença entre leituras:** a fração de pixels que mudou. Parado, o cenário varia até cerca de 5%. Andando ou girando, varia mais de 50%.

Os testes rodam um por vez, porque o emulador é pesado e a disputa por CPU pode atrasar o jogo. Se o `FREEDM1.WAD` mudar, as impressões digitais em `tests/pages/game-page.ts` precisam ser recapturadas.

### Integração contínua

A cada push e pull request na `main`, o GitHub Actions confere as mensagens dos commits novos, roda o lint, a checagem de formatação, o `npm run typecheck` e a suite do Playwright. O site só é publicado no GitHub Pages depois de um push em que os testes passaram. Quando algum teste falha, o relatório do Playwright fica disponível como artefato da execução.

---

## 📜 Licenças

| Componente                        | Versão  | Licença                     | Origem                                                                   |
| --------------------------------- | ------- | --------------------------- | ------------------------------------------------------------------------ |
| Freedoom Phase 1 (`FREEDM1.WAD`)  | 0.13.0  | BSD-3-Clause                | [freedoom.github.io](https://freedoom.github.io/)                        |
| FastDoom (`FDOOM.EXE`)            | 1.3.0   | GPL-2.0                     | [viti95/FastDoom](https://github.com/viti95/FastDoom/tree/1.3.0)         |
| DOS/32A (embutido no `FDOOM.EXE`) | -       | Licença própria, permissiva | [public/licenses/DOS32A-LICENSE.txt](public/licenses/DOS32A-LICENSE.txt) |
| js-dos (com DOSBox)               | 6.22.60 | GPL-2.0                     | [caiiiycuk/js-dos](https://github.com/caiiiycuk/js-dos/tree/6.22.60)     |

Os textos das licenças estão em [`public/licenses/`](public/licenses/).

This product uses DOS/32 Advanced DOS Extender technology.

### Código-fonte do FastDoom

O arquivo [`public/source/FastDoom-1.3.0-src.zip`](public/source/FastDoom-1.3.0-src.zip) é o fonte da tag 1.3.0, publicado junto do binário como pede a GPL. Dele foram retirados os arquivos `WAD/*.WAD`, que têm lumps de fontes e não são usados pelo `FDOOM.EXE`. O arquivo original completo está em [viti95/FastDoom](https://github.com/viti95/FastDoom/tree/1.3.0).

### Emulador js-dos

Os arquivos em [`public/vendor/js-dos/`](public/vendor/js-dos/) vêm do pacote npm `js-dos@6.22.60` (pasta `dist/`) e são idênticos aos que o CDN `js-dos.com/6.22/current/` servia. Servi-los pelo próprio site evita que o jogo e os testes quebrem se o CDN cair ou trocar a versão `current`.

Como o site passa a distribuir o emulador, o fonte da tag 6.22.60 fica em [`public/source/js-dos-6.22.60-src.zip`](public/source/js-dos-6.22.60-src.zip), com o DOSBox incluído. Para atualizar a versão, troque os três arquivos, o zip do fonte e os números de versão no `index.html` e no `app.js`.

### Como o `freedoom.zip` é montado

- `freedoom1.wad` é renomeado para `FREEDM1.WAD`, porque o DOS limita o nome a 8 caracteres e o FastDoom procura esse nome.
- `FDOOM.CFG` ativa o som (`snd_sfxdevice 3` e `snd_musicdevice 3`, Sound Blaster). Sem ele, o jogo roda mudo.
- O pacote tem só esses três arquivos. O `FONTH.WAD` da release do FastDoom fica de fora de propósito: o `FDOOM.EXE` não o usa, e os nomes dos lumps coincidem com as fontes do Doom original.
- Se um dia o zip tiver subpastas, cada uma precisa de uma entrada própria. Sem ela, o js-dos falha na extração com `extract-zip: No error`.
