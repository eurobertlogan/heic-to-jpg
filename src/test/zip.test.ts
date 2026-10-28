import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32, zip, type EntradaZip } from "../zip.js";

const texto = (valor: string): Uint8Array => new TextEncoder().encode(valor);

test("crc32 bate com o valor de referência", () => {
  // Vetor clássico: o CRC-32 de "123456789" é 0xCBF43926.
  assert.equal(crc32(texto("123456789")), 0xcbf43926);
});

test("crc32 muda quando o conteúdo muda", () => {
  assert.notEqual(crc32(texto("foto")), crc32(texto("fot0")));
});

/** Lê o ZIP de volta, do fim para o começo, como um leitor de verdade faz. */
function lerZip(arquivo: Uint8Array): Array<{ nome: string; dados: Uint8Array }> {
  const visao = new DataView(arquivo.buffer, arquivo.byteOffset, arquivo.byteLength);

  let fim = -1;
  for (let i = arquivo.length - 22; i >= 0; i--) {
    if (visao.getUint32(i, true) === 0x06054b50) {
      fim = i;
      break;
    }
  }
  assert.notEqual(fim, -1, "não achei o fim do diretório central");

  const total = visao.getUint16(fim + 10, true);
  let deslocamento = visao.getUint32(fim + 16, true);
  const saida: Array<{ nome: string; dados: Uint8Array }> = [];

  for (let i = 0; i < total; i++) {
    assert.equal(visao.getUint32(deslocamento, true), 0x02014b50, "assinatura do diretório central");
    const metodo = visao.getUint16(deslocamento + 10, true);
    assert.equal(metodo, 0, "sem compressão");

    const tamanho = visao.getUint32(deslocamento + 20, true);
    const tamanhoNome = visao.getUint16(deslocamento + 28, true);
    const tamanhoExtra = visao.getUint16(deslocamento + 30, true);
    const tamanhoComentario = visao.getUint16(deslocamento + 32, true);
    const inicio = visao.getUint32(deslocamento + 42, true);

    const nome = new TextDecoder().decode(arquivo.subarray(deslocamento + 46, deslocamento + 46 + tamanhoNome));

    assert.equal(visao.getUint32(inicio, true), 0x04034b50, "assinatura do cabeçalho local");
    const tamanhoLocalNome = visao.getUint16(inicio + 26, true);
    const tamanhoLocalExtra = visao.getUint16(inicio + 28, true);
    const dadosInicio = inicio + 30 + tamanhoLocalNome + tamanhoLocalExtra;

    saida.push({ nome, dados: arquivo.subarray(dadosInicio, dadosInicio + tamanho) });
    deslocamento += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }

  return saida;
}

test("zip guarda os arquivos com nome e conteúdo intactos", () => {
  const entradas: EntradaZip[] = [
    { nome: "IMG_0001.jpg", dados: texto("conteudo da primeira foto") },
    { nome: "IMG_0002.jpg", dados: texto("segunda foto, um pouco maior que a outra") },
  ];

  const arquivo = zip(entradas, new Date("2026-01-02T03:04:06"));
  const lido = lerZip(arquivo);

  assert.equal(lido.length, 2);
  assert.equal(lido[0]?.nome, "IMG_0001.jpg");
  assert.equal(new TextDecoder().decode(lido[0]?.dados), "conteudo da primeira foto");
  assert.equal(lido[1]?.nome, "IMG_0002.jpg");
  assert.equal(new TextDecoder().decode(lido[1]?.dados), "segunda foto, um pouco maior que a outra");
});

test("zip preserva acento no nome do arquivo", () => {
  const arquivo = zip([{ nome: "foto ção.jpg", dados: texto("x") }]);
  const lido = lerZip(arquivo);
  assert.equal(lido[0]?.nome, "foto ção.jpg");
});

test("zip de um arquivo vazio continua válido", () => {
  const arquivo = zip([], new Date("2026-01-02T03:04:06"));
  assert.equal(lerZip(arquivo).length, 0);
  assert.ok(arquivo.length >= 22);
});

test("zip de muitos arquivos mantém a ordem", () => {
  const entradas = Array.from({ length: 40 }, (_, indice) => ({
    nome: `foto-${indice}.jpg`,
    dados: texto(`conteudo ${indice}`),
  }));

  const lido = lerZip(zip(entradas));
  assert.equal(lido.length, 40);
  assert.equal(lido[0]?.nome, "foto-0.jpg");
  assert.equal(lido[39]?.nome, "foto-39.jpg");
});
