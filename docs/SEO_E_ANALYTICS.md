# SEO e Google Analytics

Implementado em 26/10/2026. O que o código faz e o que se configura nos painéis do Google.

## Como funciona no código

| Parte | Onde | O que faz |
|---|---|---|
| Cabeçalho de cada página | `src/lib/seo.ts` | Título, descrição, `robots`, canonical e Open Graph das 6 páginas públicas (`ROTAS_PUBLICAS` em `src/lib/rotas.ts`). Painel e `/definir-senha` ficam `noindex`. |
| Pré-render | `src/prerender.tsx` + `scripts/prerender.mjs` (roda no `npm run build`) | Escreve `dist/index.html` (landing já renderizada), `privacidade.html`, `termos.html`, `cookies.html` (conteúdo renderizado), `entrar.html` e `criar-conta.html` (só o cabeçalho), `app.html` (casca do painel, `noindex`) e `sitemap.xml`. |
| Hosting | `firebase.json` | `cleanUrls` serve `/termos` a partir de `termos.html`; qualquer outra URL cai no `app.html`. HTML com `no-cache`, `/assets` imutável. |
| Imagem de prévia | `public/og-rtquimico.png` (1200×630), `favicon.svg`, `apple-touch-icon.png` | Prévia de link no WhatsApp/LinkedIn e ícone da aba. |
| Dados estruturados | `dadosEstruturados()` em `src/lib/seo.ts` | `SoftwareApplication` com o preço R$ 79,90, só na landing. Mudou o preço? Mude aqui e nos Termos. |
| Analytics | `src/lib/analytics.ts` | GA4 (gtag.js) só depois do **Aceitar** no aviso de cookies e só nas páginas públicas. Envia só o caminho (sem `?` nem `#`), sem Google Signals nem anúncios, cookie de 13 meses. Recusar depois apaga os cookies `_ga`. |
| Consentimento | `src/lib/cookies.ts`, `src/components/aviso-cookies.tsx` | Aviso com **Recusar** e **Aceitar**; versão `2` (quem só viu o aviso informativo antigo é perguntado de novo). Reabre por "Preferências de cookies" no rodapé. |

`VITE_GA_MEASUREMENT_ID` vazio = nada é carregado. Fica vazio no local (para não misturar visitas de teste) e preenchido só no `.env.production`: `G-X6P531HEBN`, do app web "RTQuímico site" (`1:1010485595918:web:345769edd66fca46a2915f`) no projeto Firebase `rtquimico`, ligado em 26/10/2026. Conferir com `firebase apps:sdkconfig WEB <appId>`.

A Política de Privacidade e a de Cookies foram atualizadas e `VERSAO_TERMOS` passou para `2026-10-26`: todos aceitam de novo ao entrar.

## Passo a passo nos painéis (Bruno)

### 1. Ligar o Analytics no Firebase ✅ (26/10/2026)

Feito. O vínculo antigo do projeto estava quebrado (o "Unlink" dava erro); o projeto legado `rt-quimica` foi apagado e o Analytics foi ligado de novo no `rtquimico`. O app web foi registrado pela CLI (`firebase apps:create WEB`).

### 2. Ajustes no Google Analytics (uma vez)

Abra https://analytics.google.com → propriedade **RTQuímico** → **Administrador** (engrenagem):

| Onde clicar | O que fazer |
|---|---|
| Coleta e modificação de dados → **Retenção de dados** | "Retenção de dados de eventos": **14 meses** → Salvar (a Política de Privacidade promete 14 meses) |
| Coleta e modificação de dados → **Coleta de dados** | Deixe **Coleta de dados do Google Signals** desligada |
| Fluxos de dados → fluxo da Web → **Medição otimizada** | Desligue **Visualizações de página: mudanças de histórico do navegador** (o site manda a visita sozinho; ligado, conta em dobro e mede o painel) |

### 3. Search Console (para aparecer no Google)

1. Abra https://search.google.com/search-console com a conta **vieira.es@gmail.com** → **Adicionar propriedade** → **Prefixo do URL** → `https://rtquimico.web.app`.
2. Em "Outros métodos de verificação", escolha **Tag HTML** e me passe o valor de `content` da tag `google-site-verification`. Eu coloco no `index.html` e publico; depois você clica em **Verificar**.
3. Já verificado: menu **Sitemaps** → digite `sitemap.xml` → **Enviar**.
4. Opcional: em **Inspeção de URL**, cole `https://rtquimico.web.app/` → **Solicitar indexação**.
