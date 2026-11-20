import { test as base, expect, type Page } from '@playwright/test';
import { HomePage } from './pages/home-page';
import { GamePage } from './pages/game-page';

/** Tudo o que a página escreveu no console e os erros que aconteceram nela. */
export class PageLog {
  readonly messages: string[] = [];
  readonly errors: string[] = [];

  constructor(page: Page) {
    page.on('console', (message) => {
      if (message.type() === 'error') this.errors.push(message.text());
      else this.messages.push(message.text());
    });
    page.on('pageerror', (error) => this.errors.push(error.message));
    page.on('requestfailed', (request) => this.errors.push(`Falha de rede: ${request.url()}`));
  }

  /** Mensagens e erros juntos, na ordem de chegada de cada lista. */
  text(): string {
    return [...this.messages, ...this.errors].join('\n');
  }
}

interface GameFixtures {
  pageLog: PageLog;
  homePage: HomePage;
  gamePage: GamePage;
  bootedGame: GamePage;
  runningGame: GamePage;
  failOnPageError: void;
}

/**
 * Cada fixture entrega o jogo em um estado: `gamePage` antes de abrir,
 * `bootedGame` já na tela inicial e `runningGame` já dentro de uma partida.
 */
export const test = base.extend<GameFixtures>({
  pageLog: async ({ page }, use) => {
    await use(new PageLog(page));
  },
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await use(homePage);
  },
  gamePage: async ({ page }, use) => {
    await use(new GamePage(page));
  },
  // De vez em quando o emulador trava no prompt do DOS. Para os testes que não
  // são sobre o boot, a página é recarregada uma vez, e o relatório registra o
  // ocorrido. Os testes do boot chamam `waitForBoot` direto e falham se travar.
  bootedGame: async ({ gamePage }, use, testInfo) => {
    await gamePage.goto();
    try {
      await gamePage.waitForBoot();
    } catch {
      testInfo.annotations.push({
        type: 'boot travou',
        description: 'O emulador parou no prompt do DOS e a página foi recarregada uma vez.',
      });
      await gamePage.goto();
      await gamePage.waitForBoot();
    }
    await use(gamePage);
  },
  runningGame: async ({ bootedGame }, use) => {
    await bootedGame.startNewGame();
    await use(bootedGame);
  },

  // Roda em todo teste, mesmo sem ser pedido: um erro de JavaScript na página
  // reprova o teste, ainda que as verificações dele tenham passado.
  failOnPageError: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(errors, 'Erros de JavaScript na página').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
