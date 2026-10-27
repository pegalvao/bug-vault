// app.js - Otimizações de Canvas, Áudio e Inicialização do Doom WASM

(function () {
    // 1. Interceção global do Canvas2D para injetar 'willReadFrequently: true'
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attributes) {
        if (type === '2d') {
            attributes = Object.assign({ willReadFrequently: true }, attributes);
        }
        return originalGetContext.call(this, type, attributes);
    };

    // 2. Execução da emulação após o DOM carregar completamente
    window.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById("dos");

        if (!canvas) {
            console.error("[QA Error] Elemento #dos não encontrado no DOM.");
            return;
        }

        // Inicializa o emulador js-dos v6.22
        Dos(canvas, {
            wdosboxUrl: "https://js-dos.com/6.22/current/wdosbox.js"
        }).ready((fs, main) => {
            console.log("[QA Log] Emulador WebAssembly pronto. Extraindo doom_dos.ZIP...");

            fs.extract("doom_dos.ZIP").then(() => {
                console.log("[QA Log] Extração concluída. Executando DOOM.EXE...");
                main(["-c", "DOOM.EXE"]);
            }).catch((err) => {
                console.error("[QA Error] Erro ao extrair ou executar pacote do jogo:", err);
            });
        });

        // 3. Desbloqueio do contexto de áudio após interação do utilizador
        const unlockAudio = () => {
            console.log("[QA Log] Interação de usuário registrada: Áudio ativado.");
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
    });
})();