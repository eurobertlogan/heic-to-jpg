/**
 * Comportamento da página.
 *
 * O estado é uma lista de itens, e cada mudança redesenha só o que mudou. A
 * conversão roda num worker, um arquivo por vez, para não estourar a memória com
 * uma pasta inteira de fotos.
 */
import { ehHeic, nomeJpg, nomesUnicos, tamanho } from "./formato.js";
import { idiomaInicial, TEXTOS } from "./i18n.js";
import { zip } from "./zip.js";
const $ = (id) => document.getElementById(id);
const zona = $("zona");
const entrada = $("entrada");
const entradaPasta = $("entradaPasta");
const botoes = { escolher: $("escolher"), pasta: $("pasta") };
const lista = $("lista");
const itensEl = $("itens");
const progresso = $("progresso");
const barra = $("barra");
const acoes = $("acoes");
const converterBtn = $("converter");
const baixarBtn = $("baixar");
const limparBtn = $("limpar");
const aviso = $("aviso");
const ajustes = $("ajustes");
const qualidade = $("qualidade");
const qualidadeValor = $("qualidadeValor");
const largura = $("largura");
let idioma = idiomaInicial(navigator.language, localStorage.getItem("idioma"));
let t = TEXTOS[idioma];
let itens = [];
let proximoId = 1;
let trabalhando = false;
const suportado = typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap === "function";
function salvarAjustes() {
    localStorage.setItem("qualidade", qualidade.value);
    localStorage.setItem("largura", largura.value);
}
// No celular não existe arrastar e soltar, então a frase muda.
const semHover = window.matchMedia("(hover: none)");
semHover.addEventListener("change", () => {
    $("soltar").textContent = semHover.matches ? t.soltarToque : t.soltar;
});
function textos() {
    t = TEXTOS[idioma];
    document.documentElement.lang = idioma;
    document.title = t.tituloPagina;
    $("marca").textContent = t.marca;
    $("titulo").textContent = t.titulo;
    $("tituloAcento").textContent = t.tituloAcento;
    $("subtitulo").textContent = t.subtitulo;
    $("selo").textContent = t.selo;
    $("soltar").textContent = semHover.matches ? t.soltarToque : t.soltar;
    $("rotuloQualidade").textContent = t.qualidade;
    $("rotuloLargura").textContent = t.largura;
    $("original").textContent = t.original;
    botoes.escolher.textContent = t.escolher;
    botoes.pasta.textContent = t.pasta;
    limparBtn.textContent = t.limpar;
    baixarBtn.textContent = t.baixarTodas;
    $("comoFunciona").textContent = t.comoFunciona;
    $("explicacao").textContent = t.explicacao;
    $("rodape").textContent = t.rodape(new Date().getFullYear());
    for (const botao of document.querySelectorAll("[data-idioma]")) {
        botao.setAttribute("aria-pressed", String(botao.dataset.idioma === idioma));
    }
    converterBtn.textContent = trabalhando ? `${t.convertendo}...` : `${t.converter} (${pendentes().length})`;
    if (itens.length === 0)
        itensEl.replaceChildren(Object.assign(document.createElement("li"), {
            className: "vazia",
            textContent: t.vazia,
        }));
}
const pendentes = () => itens.filter((item) => item.estado === "esperando" || item.estado === "erro");
const prontos = () => itens.filter((item) => item.estado === "pronto");
function linha(item) {
    const li = document.createElement("li");
    li.className = `item ${item.estado}`;
    li.dataset.id = String(item.id);
    const miniatura = document.createElement("div");
    miniatura.className = "miniatura";
    if (item.resultado) {
        const img = new Image();
        img.src = item.resultado.url;
        img.alt = "";
        miniatura.append(img);
    }
    else {
        miniatura.textContent = "HEIC";
    }
    const texto = document.createElement("div");
    texto.className = "dados";
    const nome = document.createElement("p");
    nome.className = "nome";
    // Depois de convertido, o nome mostrado é o do arquivo que a pessoa vai baixar.
    nome.textContent = item.resultado ? item.resultado.nome : item.nome;
    const detalhe = document.createElement("p");
    detalhe.className = "detalhe";
    if (item.estado === "pronto" && item.resultado) {
        // HEIC comprime melhor que JPG, então o arquivo quase sempre cresce. Mostrar
        // a variação como se fosse ganho seria enganar quem está convertendo.
        detalhe.textContent = `${tamanho(item.bytes, idioma)} → ${tamanho(item.resultado.bytes, idioma)} · ${item.resultado.largura}x${item.resultado.altura} · ${qualidade.value}%`;
    }
    else if (item.estado === "erro") {
        detalhe.textContent = item.erro ?? t.comErro;
    }
    else if (item.estado === "convertendo") {
        detalhe.textContent = `${t.convertendo}...`;
    }
    else {
        detalhe.textContent = tamanho(item.bytes, idioma);
    }
    texto.append(nome, detalhe);
    const a = document.createElement("div");
    a.className = "acoes-linha";
    if (item.resultado) {
        const baixar = document.createElement("a");
        baixar.href = item.resultado.url;
        baixar.download = item.resultado.nome;
        baixar.className = "baixar";
        baixar.textContent = t.baixar;
        a.append(baixar);
    }
    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "remover";
    remover.textContent = t.remover;
    remover.addEventListener("click", () => removerItem(item.id));
    a.append(remover);
    li.append(miniatura, texto, a);
    return li;
}
function desenhar() {
    itensEl.replaceChildren(...(itens.length ? itens.map(linha) : [Object.assign(document.createElement("li"), {
            className: "vazia",
            textContent: t.vazia,
        })]));
    lista.hidden = itens.length === 0;
    ajustes.hidden = itens.length === 0;
    acoes.hidden = itens.length === 0;
    // A conversão começa sozinha ao soltar os arquivos, então o botão só aparece
    // quando sobrou algo pendente, como uma foto que falhou.
    converterBtn.hidden = !trabalhando && pendentes().length === 0;
    converterBtn.textContent = trabalhando ? `${t.convertendo}...` : `${t.converter} (${pendentes().length})`;
    converterBtn.disabled = trabalhando || pendentes().length === 0;
    // Um CTA principal por estado: sem arquivos, escolher; com arquivos, baixar.
    botoes.escolher.classList.toggle("principal", itens.length === 0);
    // Com uma foto só, o "Baixar" da própria linha já resolve, e um botão de zip
    // ao lado só confunde.
    baixarBtn.hidden = prontos().length < 2;
    baixarBtn.disabled = trabalhando || prontos().length < 2;
    baixarBtn.textContent = `${t.baixarTodas} (${prontos().length})`;
}
function removerItem(id) {
    const item = itens.find((candidato) => candidato.id === id);
    if (item?.resultado)
        URL.revokeObjectURL(item.resultado.url);
    itens = itens.filter((candidato) => candidato.id !== id);
    desenhar();
}
function adicionar(arquivos) {
    const lista = Array.from(arquivos);
    const heics = lista.filter((arquivo) => ehHeic(arquivo.name, arquivo.type));
    const ignorados = lista.length - heics.length;
    for (const arquivo of heics) {
        itens.push({
            id: proximoId++,
            arquivo,
            nome: arquivo.name,
            bytes: arquivo.size,
            estado: "esperando",
        });
    }
    aviso.hidden = ignorados === 0;
    if (ignorados > 0)
        aviso.textContent = t.ignorados(ignorados);
    desenhar();
    if (heics.length > 0)
        void converterPendentes();
}
async function converterPendentes() {
    if (trabalhando || !suportado)
        return;
    const fila = pendentes().slice();
    if (fila.length === 0)
        return;
    trabalhando = true;
    desenhar();
    lista.hidden = false;
    progresso.hidden = false;
    const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    const resposta = new Map();
    worker.onmessage = (evento) => {
        resposta.get(evento.data.id)?.(evento.data);
        resposta.delete(evento.data.id);
    };
    for (const [indice, item] of fila.entries()) {
        item.estado = "convertendo";
        itensEl.replaceChildren(...itens.map(linha));
        barra.style.width = `${Math.round((indice / fila.length) * 100)}%`;
        const buffer = await item.arquivo.arrayBuffer();
        const pedido = {
            id: item.id,
            bytes: buffer,
            qualidade: Number(qualidade.value),
            larguraMaxima: Number(largura.value),
        };
        const devolvido = await new Promise((resolver) => {
            resposta.set(item.id, resolver);
            worker.postMessage(pedido, [buffer]);
        });
        if (devolvido.ok) {
            item.estado = "pronto";
            item.resultado = {
                nome: nomeJpg(item.nome),
                bytes: devolvido.bytes.byteLength,
                largura: devolvido.largura,
                altura: devolvido.altura,
                url: URL.createObjectURL(new Blob([devolvido.bytes], { type: "image/jpeg" })),
            };
        }
        else {
            item.estado = "erro";
            item.erro = devolvido.erro;
        }
        itensEl.replaceChildren(...itens.map(linha));
    }
    worker.terminate();
    barra.style.width = "100%";
    trabalhando = false;
    desenhar();
    setTimeout(() => {
        progresso.hidden = true;
        barra.style.width = "0%";
    }, 600);
}
async function baixarZip() {
    const prontosAgora = prontos();
    if (prontosAgora.length === 0)
        return;
    baixarBtn.disabled = true;
    const nomes = nomesUnicos(prontosAgora.map((item) => item.resultado.nome));
    const entradas = [];
    for (const [indice, item] of prontosAgora.entries()) {
        const resposta = await fetch(item.resultado.url);
        entradas.push({ nome: nomes[indice], dados: new Uint8Array(await resposta.arrayBuffer()) });
    }
    const arquivo = zip(entradas);
    const url = URL.createObjectURL(new Blob([arquivo], { type: "application/zip" }));
    const ligacao = document.createElement("a");
    ligacao.href = url;
    ligacao.download = "fotos-jpg.zip";
    document.body.append(ligacao);
    ligacao.click();
    ligacao.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    baixarBtn.disabled = false;
}
// ---------- eventos ----------
zona.addEventListener("click", (evento) => {
    if (evento.target.closest("button"))
        return;
    entrada.click();
});
zona.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        entrada.click();
    }
});
for (const [elemento, campo] of [
    [botoes.escolher, entrada],
    [botoes.pasta, entradaPasta],
]) {
    elemento.addEventListener("click", (evento) => {
        evento.stopPropagation();
        campo.click();
    });
}
entrada.addEventListener("change", () => {
    if (entrada.files)
        adicionar(entrada.files);
    entrada.value = "";
});
entradaPasta.addEventListener("change", () => {
    if (entradaPasta.files)
        adicionar(entradaPasta.files);
    entradaPasta.value = "";
});
for (const tipo of ["dragenter", "dragover"]) {
    zona.addEventListener(tipo, (evento) => {
        evento.preventDefault();
        zona.classList.add("ativo");
        $("soltar").textContent = t.soltarAtivo;
    });
}
for (const tipo of ["dragleave", "drop"]) {
    zona.addEventListener(tipo, (evento) => {
        evento.preventDefault();
        zona.classList.remove("ativo");
        $("soltar").textContent = semHover.matches ? t.soltarToque : t.soltar;
    });
}
zona.addEventListener("drop", (evento) => {
    const transferencia = evento.dataTransfer;
    if (!transferencia)
        return;
    const arquivos = Array.from(transferencia.files);
    if (arquivos.length > 0) {
        adicionar(arquivos);
        return;
    }
    // Pasta solta: o navegador entrega os itens, e é preciso percorrer.
    const itensPasta = Array.from(transferencia.items);
    const encontrados = [];
    const filas = itensPasta
        .map((item) => item.webkitGetAsEntry?.() ?? null)
        .filter((entrada) => entrada !== null);
    const percorrer = async (entrada) => {
        if (entrada.isFile) {
            const arquivo = await new Promise((resolver) => entrada.file(resolver, () => resolver(null)));
            if (arquivo)
                encontrados.push(arquivo);
            return;
        }
        const leitor = entrada.createReader();
        const ler = () => new Promise((resolver) => leitor.readEntries(resolver, () => resolver([])));
        let lote = await ler();
        while (lote.length > 0) {
            for (const filho of lote)
                await percorrer(filho);
            lote = await ler();
        }
    };
    void (async () => {
        for (const fila of filas)
            await percorrer(fila);
        if (encontrados.length > 0)
            adicionar(encontrados);
    })();
});
converterBtn.addEventListener("click", () => void converterPendentes());
baixarBtn.addEventListener("click", () => void baixarZip());
limparBtn.addEventListener("click", () => {
    for (const item of itens)
        if (item.resultado)
            URL.revokeObjectURL(item.resultado.url);
    itens = [];
    aviso.hidden = true;
    desenhar();
});
qualidade.addEventListener("input", () => {
    qualidadeValor.textContent = qualidade.value;
    salvarAjustes();
});
largura.addEventListener("change", salvarAjustes);
for (const botao of document.querySelectorAll("[data-idioma]")) {
    botao.addEventListener("click", () => {
        idioma = botao.dataset.idioma === "en" ? "en" : "pt";
        localStorage.setItem("idioma", idioma);
        textos();
        desenhar();
    });
}
// window.addEventListener("unhandledrejection")? não: erros viram estado do item.
// ---------- início ----------
qualidade.value = localStorage.getItem("qualidade") ?? "85";
largura.value = localStorage.getItem("largura") ?? "0";
qualidadeValor.textContent = qualidade.value;
textos();
desenhar();
if (!suportado) {
    aviso.hidden = false;
    aviso.textContent = t.naoSuportado;
    aviso.classList.add("erro");
}
// Header transparente no topo, com fundo de vidro depois de rolar, como no site.
const topbar = document.getElementById("topbar");
if (topbar) {
    const atualizarTopo = () => {
        topbar.classList.toggle("rolou", window.scrollY > 4);
    };
    atualizarTopo();
    window.addEventListener("scroll", atualizarTopo, { passive: true });
}
// O service worker existe para a página funcionar offline no ar. Em
// desenvolvimento ele só atrapalha, porque serve a versão anterior do código.
const ehLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
if ("serviceWorker" in navigator && location.protocol !== "file:" && !ehLocal) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
        // Sem service worker a página funciona igual, só não fica offline.
    });
}
