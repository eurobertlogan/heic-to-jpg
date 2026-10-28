/**
 * Textos da página em português e inglês.
 *
 * A escolha inicial segue o idioma do navegador e fica guardada. O tom é o do
 * site: minúsculo, direto, sem promessa de marketing.
 */

export type Idioma = "pt" | "en";

export interface Textos {
  marca: string;
  tituloPagina: string;
  titulo: string;
  tituloAcento: string;
  subtitulo: string;
  selo: string;
  soltar: string;
  soltarToque: string;
  soltarAtivo: string;
  escolher: string;
  pasta: string;
  qualidade: string;
  largura: string;
  original: string;
  converter: string;
  convertendo: string;
  baixarTodas: string;
  limpar: string;
  baixar: string;
  remover: string;
  vazia: string;
  comErro: string;
  ignorados: (quantos: number) => string;
  naoSuportado: string;
  rodape: (ano: number) => string;
  comoFunciona: string;
  explicacao: string;
}

export const TEXTOS: Record<Idioma, Textos> = {
  pt: {
    marca: "heic para jpg",
    tituloPagina: "heic para jpg: converta fotos do iPhone sem enviar nada",
    titulo: "fotos do iPhone em",
    tituloAcento: "JPG",
    subtitulo:
      "O iPhone costuma salvar as fotos em HEIC, um formato que o Windows, o Photoshop antigo e muitos sites não abrem. Solte as fotos aqui e baixe em JPG.",
    selo: "// nada é enviado para nenhum servidor",
    soltar: "solte as fotos aqui",
    soltarToque: "toque para escolher as fotos",
    soltarAtivo: "pode soltar",
    escolher: "escolher fotos",
    pasta: "escolher uma pasta",
    qualidade: "// qualidade do jpg",
    largura: "// largura máxima",
    original: "tamanho original",
    converter: "converter",
    convertendo: "convertendo",
    baixarTodas: "baixar todas (.zip)",
    limpar: "limpar lista",
    baixar: "baixar",
    remover: "remover",
    vazia: "nenhuma foto na lista ainda.",
    comErro: "com erro",
    ignorados: (quantos) => `${quantos} arquivo(s) ignorado(s): não são HEIC.`,
    naoSuportado:
      "Este navegador não tem o que a página precisa para converter no próprio aparelho. Atualize o Chrome, o Safari, o Firefox ou o Edge.",
    rodape: (ano) => `${ano} · robertlogan.cc · a conversão roda no seu navegador`,
    comoFunciona: "// como funciona",
    explicacao:
      "A página decodifica o arquivo com uma biblioteca que roda dentro do navegador e redimensiona na placa de vídeo do seu aparelho. Nada sai daqui: se você desligar a internet depois de abrir, ela continua funcionando.",
  },
  en: {
    marca: "heic to jpg",
    tituloPagina: "heic to jpg: convert iPhone photos without uploading",
    titulo: "iPhone photos as",
    tituloAcento: "JPG",
    subtitulo:
      "iPhones usually save photos as HEIC, a format Windows, older Photoshop and many websites cannot open. Drop the photos here and download them as JPG.",
    selo: "// nothing is uploaded anywhere",
    soltar: "drop the photos here",
    soltarToque: "tap to choose the photos",
    soltarAtivo: "you can drop",
    escolher: "choose photos",
    pasta: "choose a folder",
    qualidade: "// jpg quality",
    largura: "// maximum width",
    original: "original size",
    converter: "convert",
    convertendo: "converting",
    baixarTodas: "download all (.zip)",
    limpar: "clear list",
    baixar: "download",
    remover: "remove",
    vazia: "no photos in the list yet.",
    comErro: "failed",
    ignorados: (quantos) => `${quantos} file(s) ignored: not HEIC.`,
    naoSuportado:
      "This browser lacks what the page needs to convert on your own device. Update Chrome, Safari, Firefox or Edge.",
    rodape: (ano) => `${ano} · robertlogan.cc · the conversion runs in your browser`,
    comoFunciona: "// how it works",
    explicacao:
      "The page decodes the file with a library that runs inside the browser and resizes on your device's graphics chip. Nothing leaves: if you turn off the network after loading, the page keeps working.",
  },
};

export function idiomaInicial(preferido: string | null, salvo: string | null): Idioma {
  const guardado = salvo === "pt" || salvo === "en" ? salvo : null;
  if (guardado) return guardado;
  const idioma = (preferido ?? "pt").toLowerCase();
  return idioma.startsWith("pt") ? "pt" : "en";
}
