/**
 * Servidor local para desenvolvimento, sem dependência.
 *
 * Serve public/ e dist/ no mesmo endereço, para o import de módulo funcionar do
 * jeito que funciona no ar.
 *
 *   npm start              # http://localhost:4332
 *   npm start -- --porta 5000
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const raizes = [join(raiz, "public"), join(raiz, "dist")];

const argumentos = process.argv.slice(2);
const indicePorta = argumentos.indexOf("--porta");
const porta = Number(indicePorta !== -1 ? argumentos[indicePorta + 1] : (process.env.PORT ?? 4332));

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
};

async function tentar(arquivo, resposta, cabecalhos = {}) {
  try {
    const conteudo = await readFile(arquivo);
    resposta.writeHead(200, {
      "content-type": TIPOS[extname(arquivo).toLowerCase()] ?? "application/octet-stream",
      "cache-control": "no-store",
      ...cabecalhos,
    });
    resposta.end(conteudo);
    return true;
  } catch {
    return false;
  }
}

const servidor = createServer(async (requisicao, resposta) => {
  const caminho = decodeURIComponent(new URL(requisicao.url ?? "/", "http://localhost").pathname);
  const relativo = caminho === "/" ? "index.html" : normalize(caminho).replace(/^(\.\.[/\\])+/g, "").replace(/^[/\\]+/, "");

  for (const pasta of raizes) {
    const arquivo = join(pasta, relativo);
    if (!arquivo.startsWith(pasta)) continue;
    const cabecalhos = arquivo.endsWith("sw.js") ? { "service-worker-allowed": "/" } : {};
    if (await tentar(arquivo, resposta, cabecalhos)) return;
  }

  resposta.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  resposta.end(`não encontrei ${caminho}`);
});

servidor.listen(porta, "127.0.0.1", () => {
  console.log(`heic-to-jpg em http://localhost:${porta}`);
});
