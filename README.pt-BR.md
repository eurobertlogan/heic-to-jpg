# heic-to-jpg

Converta fotos HEIC do iPhone para JPG, no navegador, sem enviar nada para lugar nenhum.

O iPhone salva as fotos em HEIC. O Windows, o Photoshop antigo e muitos sites não abrem esse arquivo. Os conversores que aparecem na busca pedem para você subir fotos pessoais para o servidor de um desconhecido, uma por uma. Esta página faz o trabalho todo dentro do navegador: você solta as fotos, escolhe a qualidade e baixa em JPG ou tudo num zip.

```
npm install
npm start        # http://localhost:4332
```

A interface é em português e inglês, com troca no canto da tela.

## O que ela faz

- Converte **HEIC e HEIF** para JPG, um arquivo ou uma pasta inteira
- Aceita **seleção de pasta**, arrastar e soltar, e soltar uma pasta em cima da página
- **Qualidade** de 60 a 95 e largura máxima, para quem precisa de arquivo menor
- Converte **um por vez dentro de um Web Worker**, então a página nunca trava, nem com cinquenta fotos
- Mostra miniatura, tamanho antes e depois, dimensões finais e link de download por foto
- **Baixa tudo num zip** no fim
- Guarda o idioma escolhido e a qualidade entre visitas
- **Funciona offline** depois do primeiro carregamento, por service worker

## Por que local

Converter em wasm dentro da página não é detalhe, é o produto. Foto de família, de documento e de criança não pertence ao servidor de um aleatório, e a página diz isso na primeira linha. Você pode desligar a internet depois de abrir e continuar convertendo: o service worker guarda tudo, inclusive o decodificador.

## Como funciona

1. O `libheif` compilado para WebAssembly decodifica o HEIC em pixels crus, dentro de um Web Worker.
2. Um `OffscreenCanvas` redimensiona a imagem, quando você escolhe uma largura máxima.
3. O canvas exporta JPEG na qualidade escolhida.
4. O zip é escrito à mão em TypeScript, sem compressão, porque JPG já é comprimido.

Sem backend, sem analytics, sem servidor. O projeto é um site estático: qualquer host estático serve.

## Publicando

```bash
npm run build
npm run site        # monta site/ com a casca e o código compilado
```

Depois publique a pasta `site/` no Cloudflare Pages, Netlify, Vercel ou GitHub Pages. Não há nada para configurar: sem variável de ambiente, sem função, sem passo de build no host.

Duas coisas fáceis de esquecer ao publicar:

- os caminhos no `index.html`, no manifest e no service worker são **relativos**, então o site funciona dentro de uma subpasta, como `usuario.github.io/heic-to-jpg/`;
- suba a versão em `CACHE`, no `src/sw.ts`, a cada publicação, senão o service worker continua servindo a versão anterior para quem já tinha visitado.

## Comandos

```
npm start        # servidor local em http://localhost:4332
npm run build    # copia o decodificador e compila o TypeScript
npm test         # 13 testes do escritor de zip e dos auxiliares, sem navegador
npm run site     # junta public/ e dist/ em site/, pronto para publicar
```

## Estrutura

```
src/app.ts       a página: estado, eventos, lista
src/worker.ts    decodificação, redimensionamento e exportação em JPEG, fora da linha principal
src/zip.ts       o escritor de zip e o CRC32
src/formato.ts   nomes de arquivo, detecção de HEIC, formatação de tamanho
src/i18n.ts      textos em português e inglês
src/sw.ts        service worker para uso offline
public/          a casca: uma página, uma folha de estilo, um ícone
scripts/         servidor local, cópia do decodificador, montagem do site
src/test/        testes com node:test
```

TypeScript compilado pelo `tsc`, sem bundler. O único código de terceiro é o decodificador de HEIC em `public/vendor`, copiado do pacote `libheif-js` pelo `npm run build`, com a licença ao lado.

## Limites conhecidos

- **Live Photos** chegam como imagem parada, sem a parte de vídeo.
- **HDR** e cor ampla são convertidos para sRGB, porque o JPG não tem onde guardar a informação extra.
- O JPG costuma ficar **maior que o HEIC**, porque o HEIC comprime melhor. É propriedade dos formatos, não defeito da conversão.
- Lotes muito grandes esbarram na memória da máquina, não na página.

## Autor

[robertlogan.cc](https://robertlogan.cc)

## Licença

MIT. Duas exceções vão com o próprio texto: o decodificador de HEIC é LGPL-3.0, e a interface usa as fontes Geist e Geist Mono, que são SIL OFL-1.1. Cada licença viaja na pasta a que pertence.
