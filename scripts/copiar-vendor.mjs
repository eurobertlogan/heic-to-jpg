/**
 * Copia a biblioteca de HEIC para public/vendor.
 *
 * Ela vem do pacote libheif-js, é o único código de terceiro do projeto e fica
 * versionada junto com a licença dela, porque a página precisa funcionar offline
 * e sem depender de CDN.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(raiz, "public", "vendor");
const origem = join(raiz, "node_modules", "libheif-js");

await mkdir(destino, { recursive: true });

const arquivos = [
  ["libheif-wasm/libheif-bundle.mjs", "libheif-bundle.mjs"],
  ["LICENSE", "LICENSE-libheif.txt"],
];

for (const [de, para] of arquivos) {
  await copyFile(join(origem, de), join(destino, para));
  console.log(`vendor: ${para}`);
}
