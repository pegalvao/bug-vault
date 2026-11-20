import { test, expect } from './fixtures';
import { AMMO, HEALTH, IDLE_MAX_DIFF, MOVEMENT_MIN_DIFF, diffRatio } from './pages/game-page';

test.describe('Gameplay', () => {
  test('Começa com 50 de munição e 100% de vida', { tag: '@smoke' }, async ({ runningGame }) => {
    expect(await runningGame.ammoFingerprint()).toBe(AMMO.full);
    expect(await runningGame.healthFingerprint()).toBe(HEALTH.full);
  });

  test.describe('Movimento', () => {
    test('A câmera não se mexe sem input', async ({ page, runningGame }) => {
      const before = await runningGame.frame();
      // Aqui a pausa é o próprio teste: uma janela de observação sem input.
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(1000);

      expect(diffRatio(before, await runningGame.frame())).toBeLessThan(IDLE_MAX_DIFF);
    });

    test('Seta para cima move o jogador', { tag: '@smoke' }, async ({ runningGame }) => {
      const before = await runningGame.frame();
      await runningGame.walkForward();

      expect(diffRatio(before, await runningGame.frame())).toBeGreaterThan(MOVEMENT_MIN_DIFF);
    });

    test('Seta para a esquerda gira a câmera', async ({ runningGame }) => {
      const before = await runningGame.frame();
      await runningGame.turnLeft();

      expect(diffRatio(before, await runningGame.frame())).toBeGreaterThan(MOVEMENT_MIN_DIFF);
    });
  });

  test.describe('Tiro', () => {
    test('Um tiro com CTRL gasta exatamente uma bala e não afeta a vida', async ({
      runningGame,
    }) => {
      await runningGame.fire();

      await expect.poll(() => runningGame.ammoFingerprint()).toBe(AMMO.afterOneShot);
      expect(await runningGame.healthFingerprint()).toBe(HEALTH.full);
    });

    test('Um clique do mouse também atira', async ({ runningGame }) => {
      await runningGame.fireWithMouse();

      await expect.poll(() => runningGame.ammoFingerprint()).toBe(AMMO.afterOneShot);
    });
  });

  test.describe('Armas', () => {
    test('A tecla 1 troca para o punho, que não usa munição', async ({ runningGame }) => {
      await runningGame.selectWeapon(1);

      await expect.poll(() => runningGame.ammoFingerprint()).toBe(AMMO.none);
    });

    test('O punho ataca sem gastar balas', async ({ runningGame }) => {
      await runningGame.selectWeapon(1);
      await expect.poll(() => runningGame.ammoFingerprint()).toBe(AMMO.none);
      await runningGame.fire();

      await runningGame.selectWeapon(2);
      await expect.poll(() => runningGame.ammoFingerprint()).toBe(AMMO.full);
    });

    test('As teclas 3 a 7 não trocam para armas que o jogador não tem', async ({ runningGame }) => {
      for (const slot of [3, 4, 5, 6, 7]) {
        await runningGame.selectWeapon(slot);
      }
      // A pistola continua na mão: o tiro gasta uma bala dela.
      await runningGame.fire();

      await expect.poll(() => runningGame.ammoFingerprint()).toBe(AMMO.afterOneShot);
    });
  });

  test('O menu pausa o jogo e a partida continua ao fechar', async ({ runningGame }) => {
    await runningGame.openMenu();
    const paused = await runningGame.worldStrip();

    await runningGame.turnRight();
    expect(diffRatio(paused, await runningGame.worldStrip())).toBe(0);

    await runningGame.closeMenu();
    await runningGame.turnRight();
    expect(diffRatio(paused, await runningGame.worldStrip())).toBeGreaterThan(MOVEMENT_MIN_DIFF);
  });
});
