/** Nomes de arquivo e formatação de tamanho. Funções puras, testáveis fora do navegador. */

const EXTENSOES_HEIC = [".heic", ".heif", ".hif"];

export function ehHeic(nome: string, tipo = ""): boolean {
  const minusculo = nome.toLowerCase();
  if (EXTENSOES_HEIC.some((extensao) => minusculo.endsWith(extensao))) return true;
  return tipo === "image/heic" || tipo === "image/heif";
}

/** Troca a extensão por .jpg, preservando o resto do nome. */
export function nomeJpg(nome: string): string {
  const ponto = nome.lastIndexOf(".");
  const base = ponto > 0 ? nome.slice(0, ponto) : nome;
  return `${base}.jpg`;
}

/** Resolve nomes repetidos com sufixo, para o zip não perder arquivo. */
export function nomesUnicos(nomes: string[]): string[] {
  const usados = new Map<string, number>();
  return nomes.map((nome) => {
    const minusculo = nome.toLowerCase();
    const vezes = usados.get(minusculo) ?? 0;
    usados.set(minusculo, vezes + 1);
    if (vezes === 0) return nome;
    const ponto = nome.lastIndexOf(".");
    const base = ponto > 0 ? nome.slice(0, ponto) : nome;
    const extensao = ponto > 0 ? nome.slice(ponto) : "";
    return `${base}-${vezes}${extensao}`;
  });
}

export function tamanho(bytes: number, idioma: "pt" | "en" = "pt"): string {
  const unidades = idioma === "pt" ? ["B", "KB", "MB", "GB"] : ["B", "KB", "MB", "GB"];
  let valor = bytes;
  let indice = 0;
  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice++;
  }
  const casas = valor >= 100 || indice === 0 ? 0 : 1;
  const numero = valor.toFixed(casas).replace(".", idioma === "pt" ? "," : ".");
  return `${numero} ${unidades[indice]}`;
}
