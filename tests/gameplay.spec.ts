import { test, expect } from './fixtures';
import { NEW_GAME_HUD, IDLE_MAX_DIFF, MOVEMENT_MIN_DIFF, diffRatio } from './pages/game-page';

test.describe('Gameplay', () => {
  test('Começa com 50 de munição e 100% de vida', async ({ runningGame }) => {
    expect(await runningGame.ammoFingerprint()).toBe(NEW_GAME_HUD.ammo);
    expect(await runningGame.healthFingerprint()).toBe(NEW_GAME_HUD.health);
  });

  test('A câmera não se mexe sem input', async ({ page, runningGame }) => {
    const before = await runningGame.frame();
    await page.waitForTimeout(1000);

    expect(diffRatio(before, await runningGame.frame())).toBeLessThan(IDLE_MAX_DIFF);
  });

  test('Seta para cima move o jogador', async ({ runningGame }) => {
    const before = await runningGame.frame();
    await runningGame.walkForward();

    expect(diffRatio(before, await runningGame.frame())).toBeGreaterThan(MOVEMENT_MIN_DIFF);
  });

  test('Seta para a esquerda gira a câmera', async ({ runningGame }) => {
    const before = await runningGame.frame();
    await runningGame.turnLeft();

    expect(diffRatio(before, await runningGame.frame())).toBeGreaterThan(MOVEMENT_MIN_DIFF);
  });

  test('Atirar consome munição e não afeta a vida', async ({ runningGame }) => {
    await runningGame.fire();

    await expect.poll(() => runningGame.ammoFingerprint()).not.toBe(NEW_GAME_HUD.ammo);
    expect(await runningGame.healthFingerprint()).toBe(NEW_GAME_HUD.health);
  });

  test('o menu pausa o jogo e a partida continua ao fechar', async ({ runningGame }) => {
    await runningGame.toggleMenu();
    const paused = await runningGame.worldStrip();

    await runningGame.turnRight();
    expect(diffRatio(paused, await runningGame.worldStrip())).toBe(0);

    await runningGame.toggleMenu();
    await runningGame.turnRight();
    expect(diffRatio(paused, await runningGame.worldStrip())).toBeGreaterThan(MOVEMENT_MIN_DIFF);
  });
});
