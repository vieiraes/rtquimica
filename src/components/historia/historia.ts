// História da maquete da landing: lógica pura (sem three.js), para a página usar sem baixar o 3D.
// A rolagem vira um número T contínuo (0 = abertura, ULTIMO = noite). Em T inteiro o cartão do capítulo está no meio
// da tela e a câmera fica quase parada; entre dois inteiros ela viaja de uma pose para a outra com smoothstep.

export type Vec3 = [number, number, number];
export type Pose = { pos: Vec3; alvo: Vec3; fov: number };
export type IdCapitulo = "abertura" | "visita" | "laudo" | "prazo" | "checklist" | "noite";
export type Capitulo = { id: IdCapitulo; minutos: number; pose: Pose };

const h = (hora: number, minuto = 0) => hora * 60 + minuto;

/** Capítulos na ordem da rolagem: hora do relógio e pose da câmera (coordenadas da maquete, em metros de maquete). */
export const CAPITULOS: readonly Capitulo[] = [
  { id: "abertura", minutos: h(7), pose: { pos: [33, 24, 38], alvo: [0, 1.5, 0], fov: 35 } },
  { id: "visita", minutos: h(8, 30), pose: { pos: [-24, 12, 16], alvo: [-8, 1.5, -1], fov: 36 } },
  { id: "laudo", minutos: h(11), pose: { pos: [7, 6.5, 19.5], alvo: [0.5, 3.6, 8], fov: 36 } },
  { id: "prazo", minutos: h(14), pose: { pos: [-21, 9, 19], alvo: [-10, 2.6, 5], fov: 36 } },
  { id: "checklist", minutos: h(16, 30), pose: { pos: [17, 8, 20], alvo: [10, 1.6, 8], fov: 36 } },
  { id: "noite", minutos: h(19), pose: { pos: [-25, 16, 29], alvo: [0, 2.5, 1], fov: 37 } },
];
export const ULTIMO = CAPITULOS.length - 1;

export const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export function smoothstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * T a partir da rolagem. `centros` é o meio de cada capítulo na tela (getBoundingClientRect, em px) e `meio` é o meio
 * da janela. T = i quando o meio do capítulo i está no meio da janela; entre dois capítulos, a fração do caminho.
 */
export function tPelaRolagem(centros: readonly number[], meio: number) {
  const n = centros.length;
  if (n === 0 || meio <= centros[0]) return 0;
  if (meio >= centros[n - 1]) return n - 1;
  let i = 0;
  while (i < n - 2 && meio >= centros[i + 1]) i++;
  const vao = centros[i + 1] - centros[i];
  return vao > 0 ? i + clamp((meio - centros[i]) / vao, 0, 1) : i;
}

/** Trecho entre dois capítulos: índice de saída e quanto já andou (com platô perto dos inteiros, para a leitura). */
export function trecho(t: number, total = CAPITULOS.length) {
  const tt = clamp(t, 0, total - 1);
  const i = Math.min(Math.floor(tt), total - 2);
  return { i, k: smoothstep(0.2, 0.8, tt - i) };
}

const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

export function poseEm(t: number, capitulos: readonly Capitulo[] = CAPITULOS): Pose {
  const { i, k } = trecho(t, capitulos.length);
  const a = capitulos[i].pose;
  const b = capitulos[i + 1].pose;
  return { pos: lerp3(a.pos, b.pos, k), alvo: lerp3(a.alvo, b.alvo, k), fov: lerp(a.fov, b.fov, k) };
}

/** Tela em pé (celular): a câmera recua e abre um pouco o ângulo para a maquete caber na largura. */
export function ajustarParaTela(pose: Pose, aspecto: number): Pose {
  if (aspecto >= 1.2) return pose;
  const falta = 1.2 - clamp(aspecto, 0.3, 1.2);
  const k = 1 + falta * 1.05;
  const pos = pose.alvo.map((a, n) => a + (pose.pos[n] - a) * k) as Vec3;
  return { pos, alvo: pose.alvo, fov: pose.fov + falta * 9 };
}

/** "Respiração" da câmera parada: deslocamento lento, multiplicado por `parado` (0 rolando, 1 parado). */
export function respiro(segundos: number, parado: number): Vec3 {
  const p = clamp(parado, 0, 1);
  return [Math.sin(segundos * 0.31) * 0.9 * p, Math.sin(segundos * 0.23 + 1) * 0.45 * p, Math.cos(segundos * 0.27) * 0.7 * p];
}

export function minutosEm(t: number, capitulos: readonly Capitulo[] = CAPITULOS) {
  const { i, k } = trecho(t, capitulos.length);
  return lerp(capitulos[i].minutos, capitulos[i + 1].minutos, k);
}

/** Hora em HH:MM, de 5 em 5 minutos (o relógio do canto). */
export function formatarHora(minutos: number) {
  const m = Math.round(minutos / 5) * 5;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export const relogio = (t: number) => formatarHora(minutosEm(t));
export const horaDoCapitulo = (i: number) => formatarHora(CAPITULOS[i].minutos);

/** 0 de dia, 1 de noite (o céu escurece a partir das 16h45 e fecha às 19h). Não depende do tema da página. */
export const noiteEm = (minutos: number) => smoothstep(h(16, 45), h(19), minutos);

/** Quanto o capítulo `c` está em cena: 1 perto do inteiro, some até 0,75 de distância. */
export const presenca = (t: number, c: number) => 1 - smoothstep(0.25, 0.75, Math.abs(t - c));

export type Layout = {
  tipo: "celular" | "desktop";
  /** Deslocamento do centro da cena, em fração da tela (+x direita, +y para baixo). */
  deslocX: number;
  deslocY: number;
  dpr: number;
};

/** Celular (abaixo de 1024 px ou tela em pé): cartão embaixo e assunto no terço de cima. Desktop: cartão à esquerda. */
export function escolherLayout(largura: number, altura: number, dprDispositivo: number): Layout {
  const dpr = dprDispositivo > 0 ? dprDispositivo : 1;
  if (largura < 1024 || largura < altura) return { tipo: "celular", deslocX: 0, deslocY: -1 / 6, dpr: Math.min(dpr, 1.5) };
  return { tipo: "desktop", deslocX: 0.16, deslocY: 0, dpr: Math.min(dpr, 2) };
}

// ---- Empresas da maquete (mesmos dados para a cena e para os pinos) ----

export type TipoEmpresa = "cosmetica" | "tintas" | "agua" | "distribuidora";
export type Empresa = { id: string; nome: string; tipo: TipoEmpresa; x: number; z: number; /** Altura do ponto do pino acima do chão. */ topo: number };
export const EMPRESAS: readonly Empresa[] = [
  { id: "cosmetica", nome: "Cosmética Lume", tipo: "cosmetica", x: -11, z: -4, topo: 7.4 },
  { id: "tintas", nome: "Tintas Alfa", tipo: "tintas", x: 10, z: -4, topo: 7.6 },
  { id: "aqua", nome: "Aqua Vale", tipo: "agua", x: -11, z: 6, topo: 4.6 },
  { id: "distrib", nome: "QuimDistrib", tipo: "distribuidora", x: 10, z: 5, topo: 6.6 },
];
/** Escritório/laboratório do RT, de frente para a rua. */
export const ESCRITORIO = { x: 0, z: 8, topo: 5.4 };
/** Pátio dos tambores da distribuidora (capítulo do checklist). */
export const PATIO_TAMBORES = { x: 10, z: 9.6, colunas: 4, linhas: 3, passo: 0.95 };
export const TOTAL_TAMBORES = PATIO_TAMBORES.colunas * PATIO_TAMBORES.linhas;
/** Dias que faltam para o certificado da Aqua Vale (capítulo do prazo). */
export const DIAS_PARA_VENCER = 18;

/** Gerador determinístico (mulberry32): a maquete é sempre igual. */
export function aleatorio(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Pinos (rótulos HTML sobre pontos da maquete) ----

export type Pino = { id: string; texto: string; capitulo: number; pos: Vec3; tom?: "destaque" | "alerta" };

export function pinos(): Pino[] {
  const e = Object.fromEntries(EMPRESAS.map((x) => [x.id, x])) as Record<string, Empresa>;
  const sobre = (x: Empresa, extra = 0): Vec3 => [x.x, x.topo + 0.4 + extra, x.z];
  return [
    ...EMPRESAS.map((x) => ({ id: `empresa-${x.id}`, texto: x.nome, capitulo: 0, pos: sobre(x) })),
    { id: "radar", texto: "Leitura do dia · Radar regulatório", capitulo: 0, pos: [0, ESCRITORIO.topo + 2.8, ESCRITORIO.z], tom: "destaque" },
    { id: "visita", texto: "Visita registrada · Cosmética Lume", capitulo: 1, pos: sobre(e.cosmetica, 0.6), tom: "destaque" },
    { id: "ia", texto: "Registro formal redigido com IA", capitulo: 1, pos: [-6.2, 2.4, 1.5] },
    { id: "diario", texto: "Diário técnico · 08:42", capitulo: 1, pos: [-4, 1.9, 1.5] },
    { id: "laudo", texto: "Laudo emitido · Tintas Alfa", capitulo: 2, pos: [0, ESCRITORIO.topo + 1.6, ESCRITORIO.z], tom: "destaque" },
    { id: "analise", texto: "Análise concluída", capitulo: 2, pos: [-1.1, 2.3, ESCRITORIO.z + 1.4] },
    { id: "prazo", texto: `Certificado de RT · vence em ${DIAS_PARA_VENCER} dias`, capitulo: 3, pos: sobre(e.aqua, 2.6), tom: "alerta" },
    { id: "alerta", texto: "Alerta no painel · lembrete na agenda", capitulo: 3, pos: [e.aqua.x + 1.1, 4.3, e.aqua.z - 2.6] },
    { id: "fispq", texto: `${TOTAL_TAMBORES}/${TOTAL_TAMBORES} tambores rotulados`, capitulo: 4, pos: [PATIO_TAMBORES.x, 4.9, PATIO_TAMBORES.z], tom: "destaque" },
    { id: "checklist", texto: "Checklist de conformidade · 100%", capitulo: 4, pos: sobre(e.distrib, 0.2) },
    { id: "pop", texto: "POP com NBR 14725 e NR-20", capitulo: 4, pos: sobre(e.distrib, 1.1) },
    { id: "crq", texto: "Quadro do CRQ · protocolo registrado", capitulo: 5, pos: [0, ESCRITORIO.topo + 1.2, ESCRITORIO.z], tom: "destaque" },
    { id: "carne", texto: "Carnê-leão do mês calculado", capitulo: 5, pos: [-2.6, ESCRITORIO.topo + 0.6, ESCRITORIO.z] },
    ...EMPRESAS.map((x) => ({ id: `conforme-${x.id}`, texto: "Conforme", capitulo: 5, pos: sobre(x, 0.2) })),
  ];
}
