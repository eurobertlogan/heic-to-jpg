let heif = null;
async function carregarHeif() {
    if (heif)
        return heif;
    // Relativo ao próprio worker, para funcionar também quando o site é
    // publicado dentro de uma subpasta, como acontece no GitHub Pages.
    const url = new URL("./vendor/libheif-bundle.mjs", import.meta.url).href;
    const modulo = (await import(/* @vite-ignore */ url));
    heif = await modulo.default();
    return heif;
}
async function decodificar(bytes) {
    const biblioteca = await carregarHeif();
    const imagens = new biblioteca.HeifDecoder().decode(bytes);
    if (imagens.length === 0)
        throw new Error("não encontrei imagem dentro do arquivo");
    // Um HEIC pode carregar várias imagens, como no modo retrato. A primeira é a
    // que o iPhone mostra na galeria.
    const imagem = imagens[0];
    const largura = imagem.get_width();
    const altura = imagem.get_height();
    if (!largura || !altura)
        throw new Error("a imagem veio sem dimensão");
    // O buffer é alocado como ArrayBuffer explícito porque o construtor de
    // ImageData exige isso, e não um SharedArrayBuffer.
    const dados = new Uint8ClampedArray(new ArrayBuffer(largura * altura * 4));
    const desenhada = await new Promise((resolver) => {
        imagem.display({ data: dados, width: largura, height: altura }, (resultado) => resolver(resultado !== null));
    });
    if (!desenhada)
        throw new Error("a biblioteca não conseguiu decodificar esta foto");
    return { dados, largura, altura };
}
async function converter(pedido) {
    try {
        const { dados, largura, altura } = await decodificar(new Uint8Array(pedido.bytes));
        const escala = pedido.larguraMaxima > 0 ? Math.min(1, pedido.larguraMaxima / largura) : 1;
        const novaLargura = Math.max(1, Math.round(largura * escala));
        const novaAltura = Math.max(1, Math.round(altura * escala));
        const canvas = new OffscreenCanvas(novaLargura, novaAltura);
        const contexto = canvas.getContext("2d");
        if (!contexto)
            throw new Error("sem canvas 2d");
        if (escala === 1) {
            contexto.putImageData(new ImageData(dados, largura, altura), 0, 0);
        }
        else {
            // Reduzir em duas etapas evita o serrilhado que o navegador cria quando
            // encolhe de uma vez só.
            const bitmap = await createImageBitmap(new ImageData(dados, largura, altura));
            contexto.imageSmoothingEnabled = true;
            contexto.imageSmoothingQuality = "high";
            contexto.drawImage(bitmap, 0, 0, novaLargura, novaAltura);
            bitmap.close();
        }
        const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: pedido.qualidade / 100 });
        const buffer = await blob.arrayBuffer();
        return { id: pedido.id, ok: true, bytes: buffer, largura: novaLargura, altura: novaAltura };
    }
    catch (falha) {
        return { id: pedido.id, ok: false, erro: falha.message };
    }
}
self.onmessage = async (evento) => {
    const resposta = await converter(evento.data);
    self.postMessage(resposta, resposta.ok ? [resposta.bytes] : []);
};
export {};
