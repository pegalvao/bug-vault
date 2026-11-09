import { test, expect } from './fixtures';

test.describe('Página', () => {
  test('Mostra o título e a área do jogo no tamanho anunciado', async ({ page, homePage }) => {
    await expect(page).toHaveTitle('BUG VAULT');
    await expect(homePage.heading).toBeVisible();
    await expect(homePage.canvas).toBeVisible();
    expect(await homePage.canvasDisplaySize()).toEqual({ width: 640, height: 400 });
  });

  test('Lista todos os comandos do jogo', async ({ homePage }) => {
    await expect(homePage.commandKeys).toHaveText([
      'Setas',
      'CTRL',
      'ESPAÇO',
      'SHIFT',
      '1 - 7',
      'ESC',
    ]);
  });

  test('Mantém disponíveis as licenças e o código-fonte exigidos', async ({
    homePage,
    request,
  }) => {
    const links = await homePage.legalLinkUrls();
    expect(links).toHaveLength(6);

    for (const link of links) {
      const response = await request.head(link);
      expect(response.status(), link).toBe(200);
    }
  });
});
