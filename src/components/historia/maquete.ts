// Maquete low-poly do "dia do RT" para o palco da landing (three.js puro, sem React).
// Estilo "maquete de arquiteto": volumes claros, sombras suaves, poucas cores de destaque (azul e verde da marca).
// Só este arquivo e o Palco3D importam three.js: os dois vão num pedaço separado, baixado sob demanda.
import {
  BoxGeometry, CanvasTexture, Color, ConeGeometry, CurvePath, CylinderGeometry, DirectionalLight, DoubleSide, ExtrudeGeometry,
  Fog, Group, HemisphereLight, IcosahedronGeometry, LineCurve3, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry,
  SRGBColorSpace, Scene, Shape, SphereGeometry, TubeGeometry, Vector3, type Material, type Texture,
} from "three";
import {
  DIAS_PARA_VENCER, EMPRESAS, ESCRITORIO, PATIO_TAMBORES, TOTAL_TAMBORES, aleatorio, clamp, lerp, minutosEm, noiteEm,
  presenca, smoothstep, type Empresa,
} from "./historia";

export type EstadoCena = {
  /** T da rolagem (no movimento reduzido, já arredondado para o capítulo). */
  t: number;
  /** Relógio da animação, em segundos. */
  segundos: number;
  /** 0..1 da subida dos blocos na abertura. */
  subida: number;
  /** false no movimento reduzido: sem loops (carros, pessoas, bolhas) e cada capítulo já no estado final. */
  animar: boolean;
  /** Tema escuro da página (a noite do último capítulo independe dele). */
  escuro: boolean;
};

export type Maquete = {
  cena: Scene;
  atualizar: (e: EstadoCena) => void;
  /** Cor de fundo do momento (o renderizador limpa com ela). */
  fundo: Color;
  descartar: () => void;
};

const COR = {
  dia: { ceu: "#eaf1f6", chao: "#e3e4dd", lote: "#dbe5d0" },
  diaEscuro: { ceu: "#142234", chao: "#243241", lote: "#2d4038" },
  noite: { ceu: "#070c18", chao: "#131a27", lote: "#17231f" },
  predio: "#f4f1ea", laje: "#e1dcd1", muro: "#fbfaf6", rua: "#c6cad0", calcada: "#ebe8e1", patio: "#efece4",
  copa: "#a9c98f", copa2: "#8db87a", tronco: "#a68a6a", vidro: "#aabdcf", vidroNoite: "#1f2a3f", luz: "#ffd27a",
  marca: "#0d3b66", verde: "#2d936c", verdeClaro: "#5fc496", ambar: "#f4a261", azul: "#2673a7", agua: "#7fb8d8",
  tinta: "#e9707f", silo: "#ebe7de", tampa: "#cfd4db", lampada: "#e8ebf0",
  tambores: ["#3f6fa3", "#8a94a3", "#d9a05b", "#4a7f77"],
  liquidos: ["#2d936c", "#2673a7", "#f4a261"],
} as const;

type Seq = { inicio: number | null };

function textura(desenhar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) desenhar(ctx, w, h);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const FONTE = '"Manrope", "DM Sans", system-ui, sans-serif';

function placaDaMarca() {
  return textura((ctx, w, h) => {
    ctx.fillStyle = COR.marca;
    ctx.fillRect(0, 0, w, h);
    ctx.font = `800 ${h * 0.5}px ${FONTE}`;
    ctx.textBaseline = "middle";
    const rt = ctx.measureText("RT").width;
    const quimico = ctx.measureText("Químico").width;
    const x0 = (w - rt - quimico) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("RT", x0, h / 2 + 4);
    ctx.fillStyle = COR.verdeClaro;
    ctx.fillText("Químico", x0 + rt, h / 2 + 4);
  }, 512, 128);
}

/** Folha branca com cabeçalho, linhas e carimbo verde: o laudo emitido. */
function folhaDoLaudo() {
  return textura((ctx, w, h) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = COR.marca;
    ctx.fillRect(0, 0, w, 86);
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 34px ${FONTE}`;
    ctx.textBaseline = "middle";
    ctx.fillText("LAUDO TÉCNICO", 32, 44);
    ctx.fillStyle = "#172534";
    ctx.font = `700 26px ${FONTE}`;
    ctx.fillText("Tintas Alfa", 32, 130);
    ctx.fillStyle = "#6b7987";
    ctx.font = `500 20px ${FONTE}`;
    ctx.fillText("Análise físico-química · lote 0427", 32, 166);
    ctx.fillStyle = "#dfe5ea";
    for (let i = 0; i < 9; i++) ctx.fillRect(32, 215 + i * 36, w - 64 - (i % 3) * 70, 12);
    ctx.save();
    ctx.translate(w - 150, h - 130);
    ctx.rotate(-0.25);
    ctx.strokeStyle = COR.verde;
    ctx.lineWidth = 7;
    ctx.strokeRect(-110, -36, 220, 72);
    ctx.fillStyle = COR.verde;
    ctx.font = `800 36px ${FONTE}`;
    ctx.textAlign = "center";
    ctx.fillText("EMITIDO", 0, 2);
    ctx.restore();
  }, 400, 520);
}

/** Cartão do prazo: certificado da Aqua Vale vencendo em N dias. */
function cartaoDoPrazo() {
  return textura((ctx, w, h) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = COR.ambar;
    ctx.fillRect(0, 0, 18, h);
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#6b7987";
    ctx.font = `800 20px ${FONTE}`;
    ctx.fillText("CERTIFICADO DE RT", 48, 46);
    ctx.fillStyle = "#172534";
    ctx.font = `700 30px ${FONTE}`;
    ctx.fillText("Aqua Vale", 48, 92);
    ctx.fillStyle = COR.ambar;
    ctx.font = `800 96px ${FONTE}`;
    ctx.fillText(`${DIAS_PARA_VENCER}`, 48, 190);
    const largura = ctx.measureText(`${DIAS_PARA_VENCER}`).width;
    ctx.fillStyle = "#172534";
    ctx.font = `700 34px ${FONTE}`;
    ctx.fillText("dias", 48 + largura + 14, 206);
    ctx.fillStyle = "#6b7987";
    ctx.font = `500 20px ${FONTE}`;
    ctx.fillText("Alerta enviado aos 30 · avisa de novo aos 7", 48, 272);
  }, 480, 320);
}

/** Prancheta do checklist: itens conferidos e o total de FISPQ em dia. */
function prancheta() {
  return textura((ctx, w, h) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = COR.marca;
    ctx.fillRect(0, 0, w, 78);
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 30px ${FONTE}`;
    ctx.textBaseline = "middle";
    ctx.fillText("CHECKLIST · FISPQ", 30, 40);
    const itens = ["Rotulagem GHS", "Fichas atualizadas", "Armazenagem", "EPIs disponíveis", "Ventilação", "Registro de lote"];
    itens.forEach((item, i) => {
      const y = 126 + i * 56;
      ctx.beginPath();
      ctx.arc(52, y, 16, 0, Math.PI * 2);
      ctx.fillStyle = COR.verde;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(44, y);
      ctx.lineTo(50, y + 6);
      ctx.lineTo(61, y - 7);
      ctx.stroke();
      ctx.fillStyle = "#172534";
      ctx.font = `600 24px ${FONTE}`;
      ctx.fillText(item, 84, y);
    });
    ctx.fillStyle = COR.verde;
    ctx.font = `800 40px ${FONTE}`;
    ctx.fillText(`${TOTAL_TAMBORES}/${TOTAL_TAMBORES} em dia`, 30, h - 50);
  }, 400, 520);
}

function caminho(pontos: [number, number, number][]) {
  const c = new CurvePath<Vector3>();
  for (let i = 0; i < pontos.length - 1; i++) c.add(new LineCurve3(new Vector3(...pontos[i]), new Vector3(...pontos[i + 1])));
  return c;
}

const easeOutBack = (x: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return x <= 0 ? 0 : x >= 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export function montarMaquete({ mapaSombra }: { mapaSombra: number }): Maquete {
  const cena = new Scene();
  const fundo = new Color(COR.dia.ceu);
  cena.fog = new Fog(fundo.clone(), 110, 240);
  const descartaveis: { dispose: () => void }[] = [];
  const geo = <G extends { dispose: () => void }>(g: G) => (descartaveis.push(g), g);
  const mat = <M extends Material>(m: M) => (descartaveis.push(m), m);
  const tex = (t: Texture) => (descartaveis.push(t), t);

  const padrao = (cor: string, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) =>
    mat(new MeshStandardMaterial({ color: cor, roughness: 0.92, metalness: 0, ...extra }));
  const caixa = (w: number, hh: number, d: number, m: Material, x = 0, y = 0, z = 0, sombra = true) => {
    const mesh = new Mesh(geo(new BoxGeometry(w, hh, d)), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = sombra;
    mesh.receiveShadow = true;
    return mesh;
  };
  const cilindro = (rTopo: number, rBase: number, hh: number, segmentos: number, m: Material, x = 0, y = 0, z = 0, sombra = true) => {
    const mesh = new Mesh(geo(new CylinderGeometry(rTopo, rBase, hh, segmentos)), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = sombra;
    mesh.receiveShadow = true;
    return mesh;
  };

  // ---- Luz ----
  const hemi = new HemisphereLight("#ffffff", "#d9d2c3", 1.5);
  cena.add(hemi);
  const sol = new DirectionalLight("#fff4e0", 2.3);
  sol.castShadow = true;
  sol.shadow.mapSize.set(mapaSombra, mapaSombra);
  sol.shadow.camera.left = -32;
  sol.shadow.camera.right = 32;
  sol.shadow.camera.top = 32;
  sol.shadow.camera.bottom = -32;
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 120;
  sol.shadow.bias = -0.0006;
  sol.shadow.normalBias = 0.03;
  sol.shadow.radius = 4;
  cena.add(sol, sol.target);

  // ---- Chão, lote, rua, caminhos internos ----
  const matChao = padrao(COR.dia.chao);
  const chao = new Mesh(geo(new PlaneGeometry(400, 400)), matChao);
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  cena.add(chao);
  const matLote = padrao(COR.dia.lote);
  cena.add(caixa(40, 0.2, 30, matLote, 0, 0.1, -1, false));
  const matPatio = padrao(COR.patio);
  cena.add(caixa(34, 0.24, 2.4, matPatio, 0, 0.12, 1.5, false)); // via interna
  cena.add(caixa(2.2, 0.24, 11, matPatio, 4.2, 0.12, 6.9, false)); // acesso da rua até a via interna
  cena.add(caixa(5.4, 0.22, 3.8, matPatio, PATIO_TAMBORES.x, 0.11, PATIO_TAMBORES.z, false)); // pátio dos tambores
  cena.add(caixa(400, 0.06, 5, padrao(COR.rua), 0, 0.03, 15, false));
  cena.add(caixa(400, 0.18, 2, padrao(COR.calcada), 0, 0.09, 12.2, false));
  const matFaixa = padrao("#f7f5ef");
  for (let x = -60; x <= 60; x += 4) cena.add(caixa(1.6, 0.07, 0.18, matFaixa, x, 0.06, 15, false));

  // ---- Muro com o vão do portão (x 3..5,4) ----
  const matMuro = padrao(COR.muro);
  const muro = (w: number, d: number, x: number, z: number) => cena.add(caixa(w, 1, d, matMuro, x, 0.7, z));
  muro(23, 0.3, -8.5, 11.2);
  muro(14.6, 0.3, 12.7, 11.2);
  muro(40, 0.3, 0, -16);
  muro(0.3, 27.5, -20, -2.25);
  muro(0.3, 27.5, 20, -2.25);

  // ---- Materiais compartilhados dos prédios ----
  const matPredio = padrao(COR.predio);
  const matLaje = padrao(COR.laje);
  const matVidro = mat(new MeshStandardMaterial({ color: COR.vidro, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false }));
  const geoJanela = geo(new BoxGeometry(0.72, 0.6, 0.06));
  type Janela = { mat: MeshBasicMaterial; acende: number; atraso: number };
  const janelas: Janela[] = [];
  const rnd = aleatorio(2026);
  const janela = (grupo: Group, x: number, y: number, z: number, girada = false) => {
    const m = mat(new MeshBasicMaterial({ color: COR.vidro }));
    const j = new Mesh(geoJanela, m);
    j.position.set(x, y, z);
    if (girada) j.rotation.y = Math.PI / 2;
    grupo.add(j);
    janelas.push({ mat: m, acende: rnd(), atraso: rnd() });
  };
  // Lâmpada de "conforme" no alto de cada empresa (acende verde no último capítulo)
  const geoLampada = geo(new SphereGeometry(0.26, 12, 10));
  const matLampada = mat(new MeshBasicMaterial({ color: COR.lampada }));
  const farois: { mat: MeshBasicMaterial; mesh: Mesh }[] = [];
  const farol = (grupo: Group, x: number, y: number, z: number) => {
    const m = mat(new MeshBasicMaterial({ color: COR.tampa }));
    const l = new Mesh(geoLampada, m);
    l.position.set(x, y, z);
    grupo.add(l);
    grupo.add(caixa(0.1, 0.6, 0.1, matLaje, x, y - 0.4, z));
    farois.push({ mat: m, mesh: l });
  };

  // ---- Empresas (sobem do chão na abertura) ----
  const grupos: Group[] = [];
  const grupoEm = (x: number, z: number) => {
    const g = new Group();
    g.position.set(x, 0.2, z);
    cena.add(g);
    grupos.push(g);
    return g;
  };

  const cosmetica = (g: Group) => {
    g.add(caixa(8.4, 0.3, 6.4, matLaje, 0, 0.15, 0));
    g.add(caixa(8, 4.5, 6, matPredio, 0, 2.55, 0));
    // Telhado "dente de serra": três prismas triangulares deitados ao longo de x
    const geoDente = geo(new CylinderGeometry(1.0, 1.0, 2.5, 3));
    [-2.6, 0, 2.6].forEach((x) => {
      const d = new Mesh(geoDente, matLaje);
      d.rotation.z = Math.PI / 2;
      d.position.set(x, 5.1, 0);
      d.scale.set(1, 1, 2.4);
      d.castShadow = true;
      g.add(d);
    });
    g.add(cilindro(0.28, 0.34, 2.6, 10, padrao("#d8d3c8"), 3.2, 6.1, -2));
    g.add(caixa(1.4, 2, 0.1, padrao(COR.marca), 0, 1.3, 3.02, false)); // porta
    for (const x of [-3, -1.8, 1.8, 3]) for (const y of [1.7, 3.5]) janela(g, x, y, 3.03);
    for (const z of [-1.8, 0, 1.8]) janela(g, 4.03, 3.5, z, true);
    farol(g, -3, 6.2, 2.2);
  };
  const tintas = (g: Group) => {
    g.add(caixa(7.4, 0.3, 5.9, matLaje, -1.5, 0.15, 0));
    g.add(caixa(7, 5, 5.5, matPredio, -1.5, 2.8, 0));
    g.add(caixa(7.1, 0.5, 5.6, padrao(COR.tinta), -1.5, 4.6, 0, false)); // faixa colorida da fábrica de tintas
    g.add(caixa(7.3, 0.25, 5.8, matLaje, -1.5, 5.42, 0));
    const matSilo = padrao(COR.silo, { roughness: 0.6 });
    const matTopo = padrao("#d9d4c9", { roughness: 0.6 });
    for (const z of [-1.5, 1.5]) {
      g.add(cilindro(1.2, 1.2, 6.5, 18, matSilo, 4.3, 3.55, z));
      const cone = new Mesh(geo(new ConeGeometry(1.25, 1.0, 18)), matTopo);
      cone.position.set(4.3, 7.3, z);
      cone.castShadow = true;
      g.add(cone);
      const tubo = cilindro(0.12, 0.12, 2.4, 8, matTopo, 2.8, 4.6, z);
      tubo.rotation.z = Math.PI / 2;
      g.add(tubo);
    }
    g.add(caixa(2.4, 2.2, 0.1, padrao(COR.marca), -1.5, 1.4, 2.78, false)); // portão
    for (const x of [-4.2, -3.1, 0.1, 1.2]) for (const y of [1.9, 3.6]) janela(g, x, y, 2.79);
    farol(g, -4.5, 6.3, 2);
  };
  const agua = (g: Group) => {
    const matTanque = padrao("#e6e9ec", { roughness: 0.7 });
    const matAgua = mat(new MeshStandardMaterial({ color: COR.agua, roughness: 0.3, metalness: 0, emissive: COR.agua, emissiveIntensity: 0.12 }));
    for (const x of [-2.5, 2.5]) {
      g.add(cilindro(2.4, 2.4, 2.0, 26, matTanque, x, 1.0, 1));
      g.add(cilindro(2.22, 2.22, 0.1, 26, matAgua, x, 2.05, 1, false));
      g.add(cilindro(0.08, 0.08, 1.2, 6, matLaje, x, 2.6, 1 - 2.2)); // bocal
    }
    g.add(caixa(5.6, 0.14, 0.6, matLaje, 0, 2.2, 1)); // passarela entre os tanques
    g.add(caixa(3.2, 0.3, 2.6, matLaje, 0, 0.15, -2.6));
    g.add(caixa(3.0, 2.4, 2.4, matPredio, 0, 1.4, -2.6)); // casa de bombas
    g.add(caixa(3.2, 0.2, 2.6, matLaje, 0, 2.7, -2.6));
    janela(g, -0.8, 1.6, -1.38);
    janela(g, 0.8, 1.6, -1.38);
    // Tubulação da casa de bombas aos tanques
    const matTubo = padrao(COR.azul, { roughness: 0.5 });
    for (const x of [-2.5, 2.5]) {
      const t = cilindro(0.1, 0.1, 2.6, 8, matTubo, x, 0.45, -0.6);
      t.rotation.x = Math.PI / 2;
      g.add(t);
    }
    const h = cilindro(0.1, 0.1, 5, 8, matTubo, 0, 0.45, -1.3);
    h.rotation.z = Math.PI / 2;
    g.add(h);
    farol(g, 0, 3.6, -2.6);
  };
  const distribuidora = (g: Group) => {
    g.add(caixa(8.4, 0.3, 6.4, matLaje, 0, 0.15, 0));
    g.add(caixa(8, 3.6, 6, matPredio, 0, 2.1, 0));
    // Telhado de duas águas: triângulo extrudado ao longo de x (base de 6,2 m, cumeeira a 1,65 m)
    const perfil = new Shape();
    perfil.moveTo(-3.1, 0);
    perfil.lineTo(3.1, 0);
    perfil.lineTo(0, 1.65);
    perfil.closePath();
    const telhado = new Mesh(geo(new ExtrudeGeometry(perfil, { depth: 8.6, bevelEnabled: false })), matLaje);
    telhado.rotation.y = Math.PI / 2; // a extrusão (z) passa a correr em x
    telhado.position.set(-4.3, 3.9, 0);
    telhado.castShadow = true;
    telhado.receiveShadow = true;
    g.add(telhado);
    g.add(caixa(3.2, 3, 0.1, padrao(COR.marca), 0, 1.8, 3.02, false)); // porta de correr
    for (const x of [-3, 3]) janela(g, x, 3.1, 3.03);
    for (const z of [-1.8, 0, 1.8]) janela(g, 4.03, 3.1, z, true);
    farol(g, -3, 5.9, 2.4);
  };
  const montagens: Record<Empresa["tipo"], (g: Group) => void> = { cosmetica, tintas, agua, distribuidora };
  EMPRESAS.forEach((e) => montagens[e.tipo](grupoEm(e.x, e.z)));

  // ---- Tambores no pátio da distribuidora (tampa vira verde no checklist) ----
  const geoTambor = geo(new CylinderGeometry(0.36, 0.36, 0.9, 14));
  const geoTampa = geo(new CylinderGeometry(0.37, 0.37, 0.08, 14));
  const matTambores = COR.tambores.map((c) => padrao(c, { roughness: 0.6 }));
  const tambores: { tampa: Mesh; mat: MeshStandardMaterial }[] = [];
  for (let i = 0; i < TOTAL_TAMBORES; i++) {
    const col = i % PATIO_TAMBORES.colunas;
    const lin = Math.floor(i / PATIO_TAMBORES.colunas);
    const x = PATIO_TAMBORES.x + (col - (PATIO_TAMBORES.colunas - 1) / 2) * PATIO_TAMBORES.passo;
    const z = PATIO_TAMBORES.z + (lin - (PATIO_TAMBORES.linhas - 1) / 2) * PATIO_TAMBORES.passo;
    const corpo = new Mesh(geoTambor, matTambores[(i * 7 + lin) % matTambores.length]);
    corpo.position.set(x, 0.67, z);
    corpo.castShadow = true;
    corpo.receiveShadow = true;
    const m = padrao(COR.tampa, { roughness: 0.5 });
    const tampa = new Mesh(geoTampa, m);
    tampa.position.set(x, 1.16, z);
    tampa.castShadow = true;
    cena.add(corpo, tampa);
    tambores.push({ tampa, mat: m });
  }

  // ---- Escritório e laboratório do RT (caixa de vidro de frente para a rua) ----
  const escritorio = grupoEm(ESCRITORIO.x, ESCRITORIO.z);
  escritorio.add(caixa(5.6, 0.3, 4.6, matLaje, 0, 0.15, 0));
  escritorio.add(caixa(5, 0.1, 4, padrao("#f3efe6"), 0, 0.35, 0, false));
  const vidro = new Mesh(geo(new BoxGeometry(5, 3, 4)), matVidro);
  vidro.position.set(0, 1.85, 0);
  escritorio.add(vidro);
  for (const [x, z] of [[-2.4, -1.9], [2.4, -1.9], [-2.4, 1.9], [2.4, 1.9]]) escritorio.add(caixa(0.25, 3, 0.25, matLaje, x, 1.85, z));
  escritorio.add(caixa(5.8, 0.3, 4.8, matLaje, 0, 3.5, 0));
  escritorio.add(caixa(1.2, 0.9, 1.0, matLaje, -1.8, 4.1, -1.2)); // casa de máquinas
  // Placa com a marca no alto, voltada para a rua
  const matPlaca = mat(new MeshBasicMaterial({ map: tex(placaDaMarca()), side: DoubleSide }));
  const placa = new Mesh(geo(new PlaneGeometry(3.6, 0.9)), matPlaca);
  placa.position.set(0, 4.25, 1.9);
  escritorio.add(placa);
  escritorio.add(caixa(0.12, 0.7, 0.12, matLaje, -1.5, 3.95, 1.85));
  escritorio.add(caixa(0.12, 0.7, 0.12, matLaje, 1.5, 3.95, 1.85));
  // Bancada do laboratório com três frascos
  const matBancada = padrao("#dcd6ca");
  escritorio.add(caixa(3.4, 0.12, 1.0, matBancada, 0, 1.2, 0.7));
  for (const x of [-1.5, 1.5]) escritorio.add(caixa(0.1, 0.8, 0.9, matBancada, x, 0.75, 0.7));
  const geoFrasco = geo(new CylinderGeometry(0.14, 0.42, 0.7, 16));
  const geoGargalo = geo(new CylinderGeometry(0.14, 0.14, 0.26, 12));
  const geoLiquido = geo(new CylinderGeometry(0.21, 0.39, 0.3, 16));
  const geoBolha = geo(new SphereGeometry(0.035, 8, 6));
  const matFrasco = mat(new MeshStandardMaterial({ color: "#dfeaf2", roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false }));
  type Frasco = { liquido: MeshStandardMaterial; bolhas: Mesh[]; corFinal: Color };
  const frascos: Frasco[] = [];
  COR.liquidos.forEach((corLiquido, i) => {
    const f = new Group();
    f.position.set(-1.1 + i * 1.1, 1.26, 0.7);
    const liquidoMat = mat(new MeshStandardMaterial({ color: "#d7dde3", roughness: 0.3, emissive: corLiquido, emissiveIntensity: 0 }));
    const liquido = new Mesh(geoLiquido, liquidoMat);
    liquido.position.y = 0.16;
    f.add(liquido);
    const bolhas: Mesh[] = [];
    for (let b = 0; b < 5; b++) {
      const bolha = new Mesh(geoBolha, mat(new MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.8 })));
      bolha.visible = false;
      f.add(bolha);
      bolhas.push(bolha);
    }
    const corpo = new Mesh(geoFrasco, matFrasco);
    corpo.position.y = 0.35;
    const gargalo = new Mesh(geoGargalo, matFrasco);
    gargalo.position.y = 0.82;
    f.add(corpo, gargalo);
    escritorio.add(f);
    frascos.push({ liquido: liquidoMat, bolhas, corFinal: new Color(corLiquido) });
  });

  // ---- Documentos que sobem da maquete (laudo, cartão do prazo, prancheta) ----
  const cartaz = (textura3: Texture, w: number, h: number, x: number, y: number, z: number, giro: number) => {
    const g = new Group();
    g.position.set(x, y, z);
    g.rotation.y = giro;
    const m = mat(new MeshBasicMaterial({ map: tex(textura3), side: DoubleSide }));
    const folha = new Mesh(geo(new PlaneGeometry(w, h)), m);
    folha.position.y = h / 2;
    g.add(folha);
    g.add(caixa(0.06, 0.6, 0.06, matLaje, 0, -0.3, 0, false)); // haste
    g.visible = false;
    cena.add(g);
    return g;
  };
  const laudo = cartaz(folhaDoLaudo(), 1.7, 2.2, ESCRITORIO.x, 4.6, ESCRITORIO.z, 0.25);
  const aqua = EMPRESAS.find((e) => e.id === "aqua")!;
  const prazo = cartaz(cartaoDoPrazo(), 2.7, 1.8, aqua.x + 5.2, 3.3, aqua.z - 2.2, -0.55); // à direita da casa de bombas, sem cobrir o pino do alerta
  const checklist = cartaz(prancheta(), 1.6, 2.1, PATIO_TAMBORES.x, 2.3, PATIO_TAMBORES.z, 0.55);
  // Casa de bombas da Aqua Vale: lâmpada que pulsa âmbar no capítulo do prazo
  const matAviso = mat(new MeshBasicMaterial({ color: COR.tampa }));
  const aviso = new Mesh(geoLampada, matAviso);
  aviso.position.set(aqua.x + 1.1, 3.35, aqua.z - 2.6);
  aviso.scale.setScalar(0.8);
  cena.add(aviso);
  // Marcador verde sobre a Cosmética Lume: visita registrada
  const cosmeticaRef = EMPRESAS.find((e) => e.id === "cosmetica")!;
  const matVisita = mat(new MeshBasicMaterial({ color: COR.verde }));
  const visita = new Mesh(geo(new SphereGeometry(0.45, 14, 12)), matVisita);
  visita.position.set(cosmeticaRef.x, 7.0, cosmeticaRef.z + 1);
  visita.visible = false;
  cena.add(visita);

  // ---- Árvores ----
  const matCopa = padrao(COR.copa, { flatShading: true });
  const matCopa2 = padrao(COR.copa2, { flatShading: true });
  const matTronco = padrao(COR.tronco);
  const geoCopa = geo(new IcosahedronGeometry(1, 0));
  const geoCone = geo(new ConeGeometry(0.9, 2.2, 7));
  const geoTronco = geo(new CylinderGeometry(0.12, 0.16, 1, 6));
  const arvores: Group[] = [];
  const lugares: [number, number, number][] = [
    [-17, 9.5, 1], [-3.5, 9.8, 0.8], [-17.5, -11, 1.1], [17.5, -11, 1], [-4, -12, 0.9], [4, -12, 0.9], [2, -3, 0.8],
    [-2, -3, 0.75], [17.5, 1.5, 0.9], [-24, 9, 1.3], [24, 8, 1.2], [-27, -6, 1.4], [26, -8, 1.3], [-18, 20, 1.1], [16, 21, 1.2],
  ];
  lugares.forEach(([x, z, s], i) => {
    const g = new Group();
    const tronco = new Mesh(geoTronco, matTronco);
    tronco.position.y = 0.5;
    tronco.castShadow = true;
    g.add(tronco);
    const copa = new Mesh(i % 3 === 0 ? geoCone : geoCopa, i % 2 ? matCopa : matCopa2);
    copa.position.y = i % 3 === 0 ? 2 : 1.7;
    copa.castShadow = true;
    g.add(copa);
    g.position.set(x, 0.2, z);
    g.scale.setScalar(s);
    g.userData.escala = s;
    cena.add(g);
    arvores.push(g);
  });

  // ---- Postes de luz (acendem à noite) ----
  const matPoste = padrao("#9aa3b2");
  for (const x of [-26, -16, -6, 6, 16, 26]) { // sem poste no centro: ele ficaria na frente do laboratório no capítulo do laudo
    cena.add(caixa(0.1, 2.6, 0.1, matPoste, x, 1.3, 13.1));
    const l = new Mesh(geoLampada, matLampada);
    l.position.set(x, 2.7, 13.1);
    l.scale.setScalar(0.85);
    cena.add(l);
  }

  // ---- Pessoas ----
  const geoCorpo = geo(new CylinderGeometry(0.18, 0.22, 0.75, 8));
  const geoCabeca = geo(new SphereGeometry(0.17, 10, 8));
  const pessoa = (cor: string) => {
    const g = new Group();
    const corpo = new Mesh(geoCorpo, padrao(cor));
    corpo.position.y = 0.38;
    corpo.castShadow = true;
    const cabeca = new Mesh(geoCabeca, padrao("#e8c9a6"));
    cabeca.position.y = 0.95;
    cabeca.castShadow = true;
    g.add(corpo, cabeca);
    g.scale.setScalar(1.15);
    cena.add(g);
    return g;
  };
  const andantes = [
    { p: pessoa("#ffffff"), cx: -4, cz: 1.5, rx: 6, rz: 0.5, vel: 0.16, fase: 0 },
    { p: pessoa(COR.azul), cx: 9, cz: 2.2, rx: 2.5, rz: 1.2, vel: -0.2, fase: 2 },
    { p: pessoa(COR.ambar), cx: 0, cz: 13.2, rx: 18, rz: 0, vel: 0.05, fase: 4 },
  ];

  // ---- Carros ----
  const carro = (cor: string) => {
    const g = new Group();
    g.add(caixa(2.2, 0.55, 1.1, padrao(cor, { roughness: 0.5 }), 0, 0.45, 0));
    g.add(caixa(1.2, 0.45, 0.95, padrao("#e6ebf2", { roughness: 0.3 }), -0.1, 0.92, 0));
    const geoRoda = geo(new CylinderGeometry(0.22, 0.22, 0.15, 10));
    for (const [x, z] of [[-0.7, 0.55], [0.7, 0.55], [-0.7, -0.55], [0.7, -0.55]]) {
      const r = new Mesh(geoRoda, padrao("#2a2f3a"));
      r.rotation.x = Math.PI / 2;
      r.position.set(x, 0.22, z);
      g.add(r);
    }
    cena.add(g);
    return g;
  };
  const carros = [{ g: carro(COR.azul), z: 14, dir: 1, fase: 0 }, { g: carro("#f05d5d"), z: 16, dir: -1, fase: 0.55 }];
  const matFarol = mat(new MeshBasicMaterial({ color: "#fff3c4" }));
  carros.forEach((c) => c.g.add(caixa(0.06, 0.16, 0.8, matFarol, 1.12, 0.5, 0, false)));

  // Carro do RT: sai do escritório pela via interna até a Cosmética Lume (capítulo da visita)
  const carroRt = carro(COR.verde);
  const rota = caminho([[4.2, 0.3, 10.2], [4.2, 0.3, 1.5], [-11, 0.3, 1.5], [-11, 0.3, -0.2]]);
  const RADIAL = 6;
  const SEGMENTOS = 120;
  const geoRastro = geo(new TubeGeometry(rota, SEGMENTOS, 0.08, RADIAL, false));
  geoRastro.setDrawRange(0, 0);
  const rastro = new Mesh(geoRastro, mat(new MeshBasicMaterial({ color: COR.verde })));
  cena.add(rastro);
  const ponto = new Vector3();
  const tangente = new Vector3();
  const posicionarCarro = (k: number) => {
    const kk = clamp(k, 0, 1);
    rota.getPointAt(kk, ponto);
    rota.getTangentAt(kk, tangente);
    carroRt.position.set(ponto.x, 0.06, ponto.z);
    carroRt.rotation.y = Math.atan2(-tangente.z, tangente.x);
  };
  posicionarCarro(0);

  // ---- Sequências por capítulo: começam quando o capítulo entra, recomeçam ao voltar ----
  const seqs: Seq[] = [0, 1, 2, 3, 4, 5].map(() => ({ inicio: null }));
  const progresso = (c: number, e: EstadoCena, duracao: number) => {
    const s = seqs[c];
    const dist = Math.abs(e.t - c);
    if (dist > 0.9) s.inicio = null;
    else if (s.inicio === null && dist < 0.4) s.inicio = e.segundos;
    if (s.inicio === null) return 0;
    return e.animar ? clamp((e.segundos - s.inicio) / duracao, 0, 1) : 1;
  };
  /** Cartaz que sobe com easeOutBack e some quando o capítulo sai de cena. */
  const mostrarCartaz = (g: Group, k: number, vis: number, segundos: number, animar: boolean) => {
    const s = easeOutBack(k) * smoothstep(0, 0.6, vis);
    g.visible = s > 0.01;
    g.scale.setScalar(Math.max(0.001, s));
    g.position.y = g.userData.y0 ?? (g.userData.y0 = g.position.y);
    g.position.y += animar ? Math.sin(segundos * 1.3) * 0.08 : 0;
  };

  const cores = {
    vidro: new Color(COR.vidro), vidroNoite: new Color(COR.vidroNoite), luz: new Color(COR.luz),
    tampa: new Color(COR.tampa), verde: new Color(COR.verde), verdeClaro: new Color(COR.verdeClaro), ambar: new Color(COR.ambar),
    liquidoBase: new Color("#d7dde3"),
    dia: { ceu: new Color(COR.dia.ceu), chao: new Color(COR.dia.chao), lote: new Color(COR.dia.lote) },
    diaEscuro: { ceu: new Color(COR.diaEscuro.ceu), chao: new Color(COR.diaEscuro.chao), lote: new Color(COR.diaEscuro.lote) },
    noite: { ceu: new Color(COR.noite.ceu), chao: new Color(COR.noite.chao), lote: new Color(COR.noite.lote) },
    sol: new Color("#fff4e0"), solTarde: new Color("#ffc58a"), lua: new Color("#8ea6d8"), branco: new Color("#ffffff"), ceuNoite: new Color("#9fb3dd"),
    lampadaDia: new Color(COR.lampada), lampadaNoite: new Color("#ffd98a"),
  };
  function atualizar(e: EstadoCena) {
    const { t, segundos, animar } = e;
    const minutos = minutosEm(t);
    const noite = noiteEm(minutos);
    const base = e.escuro ? cores.diaEscuro : cores.dia;

    // Céu, chão e luz conforme a hora
    fundo.copy(base.ceu).lerp(cores.noite.ceu, noite);
    (cena.fog as Fog).color.copy(fundo);
    matChao.color.copy(base.chao).lerp(cores.noite.chao, noite);
    matLote.color.copy(base.lote).lerp(cores.noite.lote, noite);
    hemi.intensity = lerp(e.escuro ? 1.1 : 1.5, 0.35, noite);
    hemi.color.copy(cores.branco).lerp(cores.ceuNoite, noite);
    sol.intensity = lerp(2.3, 0.35, noite);
    sol.color.copy(minutos > 16 * 60 ? cores.solTarde : cores.sol).lerp(cores.lua, noite);
    // O sol atravessa o céu de leste (manhã) a oeste (fim de tarde); à noite vira a lua
    const ang = lerp(-1.1, 1.1, clamp((minutos - 7 * 60) / (11 * 60), 0, 1));
    sol.position.set(Math.sin(ang) * 30, lerp(22, 30, Math.cos(ang)), 18);
    matLampada.color.copy(cores.lampadaDia).lerp(cores.lampadaNoite, smoothstep(0.3, 0.7, noite));

    // Subida dos blocos
    grupos.forEach((g, i) => {
      const k = easeOutBack(clamp(e.subida * 1.5 - i * 0.14, 0, 1));
      g.scale.set(1, Math.max(0.001, k), 1);
    });
    arvores.forEach((g, i) => g.scale.setScalar(g.userData.escala * Math.max(0.001, easeOutBack(clamp(e.subida * 1.6 - 0.4 - (i % 5) * 0.06, 0, 1)))));

    // Janelas: vidro de dia, luz acesa ou apagada à noite
    janelas.forEach((j) => {
      const acesa = j.acende < 0.75 && noite > j.atraso * 0.6 + 0.3;
      j.mat.color.copy(cores.vidro).lerp(acesa ? cores.luz : cores.vidroNoite, noite);
    });

    // Capítulo 1: o carro do RT vai até a Tintas Alfa deixando o rastro; a visita fica registrada
    const p1 = progresso(1, e, 5);
    const vis1 = presenca(t, 1);
    const emCena1 = vis1 > 0.02;
    const andou = emCena1 ? smoothstep(0.05, 0.65, p1) : t > 1 ? 1 : 0;
    posicionarCarro(andou);
    geoRastro.setDrawRange(0, Math.floor((emCena1 ? smoothstep(0, 0.6, p1) : t > 1 ? 1 : 0) * SEGMENTOS) * RADIAL * 6);
    const registrou = emCena1 ? easeOutBack(smoothstep(0.7, 0.9, p1)) : 0;
    visita.visible = registrou > 0.01;
    visita.scale.setScalar(Math.max(0.001, registrou * (1 + (animar ? Math.sin(segundos * 4) * 0.06 : 0))));
    visita.position.y = 7.0 + (animar ? Math.sin(segundos * 1.7) * 0.1 : 0);

    // Capítulo 2: a análise termina nos frascos (cor e bolhas) e o laudo sobe do escritório
    const p2 = progresso(2, e, 4.5);
    const vis2 = presenca(t, 2);
    frascos.forEach((f, i) => {
      const pronto = smoothstep(0.1 + i * 0.1, 0.45 + i * 0.1, p2) * (vis2 > 0.02 ? 1 : t > 2 ? 1 : 0);
      f.liquido.color.copy(cores.liquidoBase).lerp(f.corFinal, pronto);
      f.liquido.emissiveIntensity = pronto * 0.35;
      const borbulha = animar && vis2 > 0.02 && p2 < 0.75;
      f.bolhas.forEach((b, n) => {
        b.visible = borbulha;
        if (!borbulha) return;
        const ciclo = ((segundos * (0.55 + n * 0.07) + n * 0.37 + i) % 1 + 1) % 1;
        b.position.set(Math.sin(n * 2.1 + i) * 0.14, 0.04 + ciclo * 0.55, Math.cos(n * 1.7) * 0.14);
        b.scale.setScalar(0.6 + ciclo * 0.6);
      });
    });
    mostrarCartaz(laudo, smoothstep(0.5, 0.8, p2), vis2, segundos, animar);

    // Capítulo 3: o cartão do prazo sobe sobre a Aqua Vale e a lâmpada de aviso pulsa âmbar
    const p3 = progresso(3, e, 3);
    const vis3 = presenca(t, 3);
    mostrarCartaz(prazo, smoothstep(0.05, 0.4, p3), vis3, segundos, animar);
    const pulso = vis3 * (animar ? 0.6 + 0.4 * Math.sin(segundos * 5) : 1) * smoothstep(0.3, 0.5, p3);
    matAviso.color.copy(cores.tampa).lerp(cores.ambar, pulso);

    // Capítulo 4: a prancheta sobe e as tampas dos tambores vão ficando verdes, uma a uma
    const p4 = progresso(4, e, 4.5);
    const vis4 = presenca(t, 4);
    mostrarCartaz(checklist, smoothstep(0, 0.3, p4), vis4, segundos, animar);
    tambores.forEach((tb, i) => {
      const chegou = vis4 > 0.02 ? smoothstep(0.3 + i * 0.045, 0.36 + i * 0.045, p4) : t > 4 ? 1 : 0;
      tb.mat.color.copy(cores.tampa).lerp(cores.verde, chegou);
      tb.mat.emissive.copy(cores.verde).multiplyScalar(chegou * 0.35);
      const pop = chegou > 0 && chegou < 1 ? 1 + Math.sin(chegou * Math.PI) * 0.5 : 1;
      tb.tampa.scale.set(pop, 1, pop);
    });

    // Capítulo 5: as lâmpadas de "conforme" acendem verdes em cada empresa
    const p5 = progresso(5, e, 3.5);
    const vis5 = presenca(t, 5);
    farois.forEach((f, i) => {
      const aceso = smoothstep(0.15 + i * 0.16, 0.3 + i * 0.16, p5) * vis5;
      f.mat.color.copy(cores.tampa).lerp(cores.verdeClaro, aceso);
      f.mesh.scale.setScalar(1 + aceso * 0.35 * (animar ? 0.7 + 0.3 * Math.sin(segundos * 3 + i) : 1));
    });

    // Loops: carros da rua e pessoas (parados no movimento reduzido)
    const tempo = animar ? segundos : 0;
    carros.forEach((c) => {
      const ciclo = ((tempo / 12 + c.fase) % 1 + 1) % 1;
      c.g.position.set(c.dir * lerp(-45, 45, ciclo), 0.06, c.z);
      c.g.rotation.y = c.dir > 0 ? 0 : Math.PI;
    });
    andantes.forEach((a) => {
      const ang2 = tempo * a.vel + a.fase;
      a.p.position.set(a.cx + Math.cos(ang2) * a.rx, 0.24 + (animar ? Math.abs(Math.sin(tempo * 6 + a.fase)) * 0.05 : 0), a.cz + Math.sin(ang2) * a.rz);
      a.p.rotation.y = -ang2 + (a.vel > 0 ? 0 : Math.PI);
    });
  }

  return {
    cena,
    fundo,
    atualizar,
    descartar: () => descartaveis.forEach((d) => d.dispose()),
  };
}
