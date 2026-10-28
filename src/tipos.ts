/** Tipos compartilhados entre a página e o worker. */

export type EstadoArquivo = "esperando" | "convertendo" | "pronto" | "erro";

export interface Item {
  id: number;
  arquivo: File;
  nome: string;
  bytes: number;
  estado: EstadoArquivo;
  resultado?: {
    nome: string;
    bytes: number;
    largura: number;
    altura: number;
    url: string;
  };
  erro?: string;
}

export interface Ajustes {
  qualidade: number;
  larguraMaxima: number;
}

export interface PedidoWorker {
  id: number;
  bytes: ArrayBuffer;
  qualidade: number;
  larguraMaxima: number;
}

export interface RespostaOk {
  id: number;
  ok: true;
  bytes: ArrayBuffer;
  largura: number;
  altura: number;
}

export interface RespostaErro {
  id: number;
  ok: false;
  erro: string;
}

export type RespostaWorker = RespostaOk | RespostaErro;
