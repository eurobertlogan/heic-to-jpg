/**
 * Escritor de ZIP com o método "store", sem compressão.
 *
 * JPG já é comprimido, então recomprimir só gastaria tempo. São umas oitenta
 * linhas contra uma dependência inteira, e o resultado abre em qualquer sistema.
 */

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

export function crc32(dados: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < dados.length; i++) {
    crc = (TABELA_CRC[(crc ^ dados[i]!) & 0xff]! ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface EntradaZip {
  nome: string;
  dados: Uint8Array;
}

/** Data e hora no formato do MS-DOS, que é o que o ZIP usa. */
function dataDos(data: Date): { hora: number; dia: number } {
  const hora = (data.getHours() << 11) | (data.getMinutes() << 5) | Math.floor(data.getSeconds() / 2);
  const dia = ((data.getFullYear() - 1980) << 9) | ((data.getMonth() + 1) << 5) | data.getDate();
  return { hora, dia };
}

class Escritor {
  #partes: Uint8Array[] = [];
  tamanho = 0;

  adicionar(dados: Uint8Array): void {
    this.#partes.push(dados);
    this.tamanho += dados.length;
  }

  juntar(): Uint8Array<ArrayBuffer> {
    const total = new Uint8Array(new ArrayBuffer(this.tamanho));
    let deslocamento = 0;
    for (const parte of this.#partes) {
      total.set(parte, deslocamento);
      deslocamento += parte.length;
    }
    return total;
  }
}

function cabecalhoLocal(nome: Uint8Array, crc: number, tamanho: number, hora: number, dia: number): Uint8Array {
  const buffer = new Uint8Array(30 + nome.length);
  const visao = new DataView(buffer.buffer);
  visao.setUint32(0, 0x04034b50, true);
  visao.setUint16(4, 20, true);
  visao.setUint16(6, 0x0800, true); // nomes em UTF-8
  visao.setUint16(8, 0, true); // sem compressão
  visao.setUint16(10, hora, true);
  visao.setUint16(12, dia, true);
  visao.setUint32(14, crc, true);
  visao.setUint32(18, tamanho, true);
  visao.setUint32(22, tamanho, true);
  visao.setUint16(26, nome.length, true);
  visao.setUint16(28, 0, true);
  buffer.set(nome, 30);
  return buffer;
}

export function zip(entradas: EntradaZip[], quando = new Date()): Uint8Array<ArrayBuffer> {
  if (entradas.length > 65535) {
    throw new Error("o ZIP simples aceita até 65535 arquivos");
  }

  const { hora, dia } = dataDos(quando);
  const escritor = new Escritor();
  const centrais: Uint8Array[] = [];
  const codificador = new TextEncoder();

  for (const entrada of entradas) {
    const nome = codificador.encode(entrada.nome);
    const crc = crc32(entrada.dados);
    const deslocamento = escritor.tamanho;

    escritor.adicionar(cabecalhoLocal(nome, crc, entrada.dados.length, hora, dia));
    escritor.adicionar(entrada.dados);

    const central = new Uint8Array(46 + nome.length);
    const visao = new DataView(central.buffer);
    visao.setUint32(0, 0x02014b50, true);
    visao.setUint16(4, 20, true);
    visao.setUint16(6, 20, true);
    visao.setUint16(8, 0x0800, true);
    visao.setUint16(10, 0, true);
    visao.setUint16(12, hora, true);
    visao.setUint16(14, dia, true);
    visao.setUint32(16, crc, true);
    visao.setUint32(20, entrada.dados.length, true);
    visao.setUint32(24, entrada.dados.length, true);
    visao.setUint16(28, nome.length, true);
    visao.setUint32(42, deslocamento, true);
    central.set(nome, 46);
    centrais.push(central);
  }

  const inicioCentral = escritor.tamanho;
  for (const central of centrais) escritor.adicionar(central);
  const tamanhoCentral = escritor.tamanho - inicioCentral;

  const fim = new Uint8Array(22);
  const visao = new DataView(fim.buffer);
  visao.setUint32(0, 0x06054b50, true);
  visao.setUint16(8, entradas.length, true);
  visao.setUint16(10, entradas.length, true);
  visao.setUint32(12, tamanhoCentral, true);
  visao.setUint32(16, inicioCentral, true);
  escritor.adicionar(fim);

  return escritor.juntar();
}
