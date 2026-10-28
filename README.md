# heic-to-jpg

Convert iPhone HEIC photos to JPG, in the browser, without uploading anything.

The iPhone saves photos as HEIC. Windows, older Photoshop versions and a lot of websites refuse that file. The converters you find online ask you to upload personal photos to somebody else's server, one at a time. This page does the whole job inside your browser: you drop the photos, pick the quality, and download JPG or a single zip.

```
npm install
npm start        # http://localhost:4332
```

The interface is in Portuguese and English, with a toggle in the corner.

## What it does

- Converts **HEIC and HEIF** to JPG, one file or a whole folder
- Works with the **folder picker**, drag and drop, and dropping a directory
- **Quality** from 60 to 95, and a maximum width for people who need a smaller file
- Converts **one at a time in a Web Worker**, so the page never freezes, not even with fifty photos
- Shows the thumbnail, the size before and after, the final dimensions and a download link per photo
- **Downloads everything as a zip** at the end
- Keeps the Portuguese and English interface, remembering the choice
- **Works offline** after the first load, through a service worker

## Why it is local

Converting in wasm inside the page is not a detail, it is the product. Photos of family, documents and children do not belong on a random server, and the page says so in the first line. You can turn off the network after loading it and keep converting: the service worker caches the whole thing, including the decoder.

## How it works

1. `libheif` compiled to WebAssembly decodes the HEIC into raw pixels inside a Web Worker.
2. An `OffscreenCanvas` resizes the image if you asked for a maximum width.
3. The canvas exports JPEG at the quality you chose.
4. The zip is written by hand in TypeScript, with no compression, since JPG is already compressed.

No backend, no analytics, no server. The project is a static site: any static host serves it.

## Publishing it

```bash
npm run build
npm run site        # builds site/ with the shell and the compiled code
```

Then publish the `site/` folder on Cloudflare Pages, Netlify, Vercel or GitHub Pages. There is nothing to configure: no environment variable, no function, no build step on the host.

Two things are easy to forget when publishing:

- the paths in `index.html`, in the manifest and in the service worker are **relative**, so the site works from a subfolder such as `usuario.github.io/heic-to-jpg/`;
- bump `CACHE` in `src/sw.ts` on every publish, otherwise the service worker keeps serving the previous version to people who already visited.

## Commands

```
npm start        # local server on http://localhost:4332
npm run build    # copies the decoder and compiles the TypeScript
npm test         # 13 tests of the zip writer and the helpers, no browser needed
npm run site     # merges public/ and dist/ into site/, ready to publish
```

## Structure

```
src/app.ts       the page: state, events, list rendering
src/worker.ts    decoding, resizing and JPEG export, off the main thread
src/zip.ts       the zip writer and CRC32
src/formato.ts   file names, HEIC detection, size formatting
src/i18n.ts      Portuguese and English texts
src/sw.ts        service worker for offline use
public/          the shell: one page, one stylesheet, one icon
scripts/         local server, vendor copy, site build
src/test/        tests with node:test
```

TypeScript compiled by `tsc`, no bundler. The only third-party code is the HEIC decoder in `public/vendor`, copied from the `libheif-js` package by `npm run build`, with its license next to it.

## Known limits

- **Live Photos** arrive as a still image, without the video part.
- **HDR** and wide color are converted to standard sRGB, since the JPG has no place for the extra information.
- The JPEG is often **larger than the HEIC**, because HEIC compresses better. That is a property of the formats, not a defect of the conversion.
- Very large batches are limited by the memory of the machine, not by the page.

## Em português

A página converte fotos HEIC do iPhone para JPG dentro do navegador, sem enviar nada para servidor nenhum. Você solta as fotos ou escolhe uma pasta, ajusta a qualidade e baixa uma por uma ou tudo num zip. Funciona offline depois do primeiro carregamento, porque o decodificador também fica em cache. Leia o [README.pt-BR.md](README.pt-BR.md).

## Author

[robertlogan.cc](https://robertlogan.cc)

## License

MIT. Two exceptions ship with their own texts: the HEIC decoder is LGPL-3.0, and the interface uses the Geist and Geist Mono fonts, which are SIL OFL-1.1. Both licenses travel inside the folder they belong to.
