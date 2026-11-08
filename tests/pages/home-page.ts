import type { Locator, Page } from '@playwright/test';

/** A página do site em volta do jogo: cabeçalho, guia de comandos e rodapé. */
export class HomePage {
  readonly heading: Locator;
  readonly canvas: Locator;
  readonly commandKeys: Locator;
  readonly legalLinks: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'BUG VAULT', level: 1 });
    this.canvas = page.locator('#dos');
    this.commandKeys = page.locator('.controls-card .key');
    this.legalLinks = page.locator('footer a[href^="licenses/"], footer a[href^="source/"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** Tamanho em que o canvas aparece na tela, que difere da resolução do jogo. */
  async canvasDisplaySize(): Promise<{ width: number; height: number }> {
    return this.canvas.evaluate((c) => ({ width: c.clientWidth, height: c.clientHeight }));
  }

  async legalLinkUrls(): Promise<string[]> {
    return this.legalLinks.evaluateAll((anchors) =>
      anchors.map((a) => (a as HTMLAnchorElement).href),
    );
  }
}
