(function () {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attributes) {
        if (type === '2d') {
            attributes = Object.assign({ willReadFrequently: true }, attributes);
        }
        return originalGetContext.call(this, type, attributes);
    };

    window.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById("dos");

        if (!canvas) {
            console.error("[QA Error] Elemento #dos não encontrado no DOM.");
            return;
        }

        Dos(canvas, {
            wdosboxUrl: "https://js-dos.com/6.22/current/wdosbox.js"
        }).ready((fs, main) => {
            console.log("[QA Log] Emulador WebAssembly pronto. Extraindo doom_dos.ZIP...");

            fs.extract("doom_dos.ZIP").then(() => {
                console.log("[QA Log] Extração concluída. Iniciando DOOM.EXE...");
                main(["-c", "DOOM.EXE"]);
            }).catch((err) => {
                console.error("[QA Error] Falha ao extrair ou executar o pacote ZIP:", err);
            });
        });

        const unlockAudio = () => {
            console.log("[QA Log] Interação do utilizador detectada: Áudio ativo.");
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
    });
})();