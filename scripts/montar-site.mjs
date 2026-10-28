/**
 * Monta a pasta site/ pronta para publicar em qualquer host estático.
 *
 * Junta a casca (public/) com o JavaScript compilado (dist/), e deixa a pasta
 * final sem nada de desenvolvimento.
 */
import { cp, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(raiz, "site");

await rm(destino, { recursive: true, force: true });
await cp(join(raiz, "public"), destino, { recursive: true });
await cp(join(raiz, "dist"), destino, {
  recursive: true,
  filter: (origem) => !origem.includes(`${join("dist", "test")}`),
});

console.log("site pronto em site/");
