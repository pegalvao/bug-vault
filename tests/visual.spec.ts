import { test, expect } from './fixtures';

// As imagens saem da resolução interna do emulador (320x200), não de um
// screenshot da página. Não dependem de fonte, escala nem sistema operacional,
// então um único arquivo de referência serve para qualquer máquina.
test.describe('Regressão visual', { tag: '@visual' }, () => {
  test('A barra de status do início da partida não mudou', async ({ runningGame }) => {
    expect(await runningGame.statusBarImage()).toMatchSnapshot('barra-de-status-inicio.png');
  });
});
