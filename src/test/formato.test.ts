import { test } from "node:test";
import assert from "node:assert/strict";
import { ehHeic, nomeJpg, nomesUnicos, tamanho } from "../formato.js";
import { idiomaInicial } from "../i18n.js";

test("reconhece HEIC pela extensão, sem depender de maiúscula", () => {
  assert.equal(ehHeic("IMG_1234.HEIC"), true);
  assert.equal(ehHeic("IMG_1234.heic"), true);
  assert.equal(ehHeic("foto.heif"), true);
});

test("reconhece HEIC pelo tipo, quando o nome não ajuda", () => {
  assert.equal(ehHeic("arquivo", "image/heic"), true);
  assert.equal(ehHeic("arquivo", "image/heif"), true);
});

test("recusa o que não é HEIC", () => {
  assert.equal(ehHeic("IMG_1234.JPG"), false);
  assert.equal(ehHeic("foto.png", "image/png"), false);
  assert.equal(ehHeic("heic.jpg", "image/jpeg"), false);
});

test("troca só a extensão ao virar JPG", () => {
  assert.equal(nomeJpg("IMG_1234.HEIC"), "IMG_1234.jpg");
  assert.equal(nomeJpg("foto.da.praia.heic"), "foto.da.praia.jpg");
  assert.equal(nomeJpg("sem-extensao"), "sem-extensao.jpg");
});

test("nomes repetidos ganham sufixo para não se sobrescreverem", () => {
  assert.deepEqual(nomesUnicos(["a.jpg", "a.jpg", "b.jpg", "A.jpg"]), ["a.jpg", "a-1.jpg", "b.jpg", "A-2.jpg"]);
});

test("tamanho em português e em inglês", () => {
  assert.equal(tamanho(900), "900 B");
  assert.equal(tamanho(1536), "1,5 KB");
  assert.equal(tamanho(1536, "en"), "1.5 KB");
  assert.equal(tamanho(3 * 1024 * 1024), "3,0 MB");
});

test("idioma inicial segue o que ficou salvo, depois o navegador", () => {
  assert.equal(idiomaInicial("en-US", "pt"), "pt");
  assert.equal(idiomaInicial("pt-BR", null), "pt");
  assert.equal(idiomaInicial("en-GB", null), "en");
  assert.equal(idiomaInicial("es-ES", null), "en");
  assert.equal(idiomaInicial(null, "en"), "en");
});
