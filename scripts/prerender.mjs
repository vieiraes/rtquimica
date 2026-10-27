// Pré-render do site público, depois do `vite build`: para cada página de ROTAS_PUBLICAS escreve um HTML com o
// cabeçalho dela (título, descrição, canonical, Open Graph) e, na landing e nas páginas legais, o conteúdo já renderizado.
// Também gera o app.html (casca do painel, noindex; o Firebase reescreve para ele toda URL sem arquivo) e o sitemap.xml.
import { readFile, rm, writeFile } from "node:fs/promises";
import { build } from "vite";

const DIST = new URL("../dist/", import.meta.url);
const SSR = new URL("../dist-ssr/", import.meta.url);

await build({ logLevel: "warn", build: { ssr: "src/prerender.tsx", outDir: "dist-ssr", emptyOutDir: true } });
const { renderizar, cabecalhoHtml, ROTAS_PUBLICAS, SITE } = await import(new URL("prerender.js", SSR).href);

const modelo = await readFile(new URL("index.html", DIST), "utf8");
const BLOCO_SEO = /<!--seo:[\s\S]*?<!--\/seo-->/;
if (!BLOCO_SEO.test(modelo) || !modelo.includes('<div id="root"></div>')) throw new Error("dist/index.html sem o bloco <!--seo--> ou sem <div id=\"root\"></div>");

const pagina = (caminho, corpo) => modelo.replace(BLOCO_SEO, () => cabecalhoHtml(caminho)).replace('<div id="root"></div>', () => `<div id="root">${corpo}</div>`);

// "/" → index.html; "/termos" → termos.html (servido em /termos pelo cleanUrls do firebase.json)
for (const caminho of ROTAS_PUBLICAS) {
  const arquivo = caminho === "/" ? "index.html" : `${caminho.slice(1)}.html`;
  await writeFile(new URL(arquivo, DIST), pagina(caminho, renderizar(caminho)));
}
await writeFile(new URL("app.html", DIST), pagina("/painel", ""));

const hoje = new Date().toISOString().slice(0, 10);
const urls = ROTAS_PUBLICAS.map((c) => `  <url><loc>${SITE}${c}</loc><lastmod>${hoje}</lastmod></url>`).join("\n");
await writeFile(new URL("sitemap.xml", DIST), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

await rm(SSR, { recursive: true, force: true });
console.log(`pré-render: ${ROTAS_PUBLICAS.length} páginas públicas, app.html e sitemap.xml`);
