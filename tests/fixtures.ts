import { test as base, expect } from '@playwright/test';
import { HomePage } from './pages/home-page';
import { GamePage } from './pages/game-page';

interface GameFixtures {
  homePage: HomePage;
  gamePage: GamePage;
  bootedGame: GamePage;
  runningGame: GamePage;
}

/**
 * Cada fixture entrega o jogo em um estado: `gamePage` antes de abrir,
 * `bootedGame` já na tela inicial e `runningGame` já dentro de uma partida.
 */
export const test = base.extend<GameFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await use(homePage);
  },
  gamePage: async ({ page }, use) => {
    await use(new GamePage(page));
  },
  bootedGame: async ({ gamePage }, use) => {
    await gamePage.goto();
    await gamePage.waitForBoot();
    await use(gamePage);
  },
  runningGame: async ({ bootedGame }, use) => {
    await bootedGame.startNewGame();
    await use(bootedGame);
  },
});

export { expect };
