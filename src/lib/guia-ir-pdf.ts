// Desenha o guia do imposto de renda (montado em guia-ir.ts) num PDF A4. jsPDF só é carregado quando o químico pede o guia.
import type { GuiaIr } from "./guia-ir";

// As fontes padrão do PDF não têm alguns sinais tipográficos; troca por equivalentes simples
const limpo = (t: string) => t.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/[\u2013\u2014]/g, "-").replace(/\u00a0/g, " ");

export async function gerarPdfGuiaIr(guia: GuiaIr): Promise<{ bytes: ArrayBuffer; nomeArquivo: string; salvar: () => void }> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 18;
  const L = doc.internal.pageSize.getWidth() - 2 * M;
  const altura = doc.internal.pageSize.getHeight();
  let y = M;
  const AZUL: [number, number, number] = [11, 58, 99];
  const CINZA: [number, number, number] = [74, 90, 106];

  const garantir = (mm: number) => { if (y + mm > altura - 20) { doc.addPage(); y = M; } };
  const texto = (t: string, { tam = 10, cor = [15, 31, 46] as [number, number, number], negrito = false, recuo = 0, espaco = 1.5 } = {}) => {
    doc.setFont("helvetica", negrito ? "bold" : "normal");
    doc.setFontSize(tam);
    doc.setTextColor(...cor);
    const linhas = doc.splitTextToSize(limpo(t), L - recuo) as string[];
    for (const linha of linhas) {
      garantir(tam * 0.45);
      doc.text(linha, M + recuo, y);
      y += tam * 0.42;
    }
    y += espaco;
  };

  // Capa
  texto("RTQuímico", { tam: 11, cor: AZUL, negrito: true, espaco: 0.5 });
  texto(`Guia da declaração do Imposto de Renda ${guia.anoEntrega}`, { tam: 18, negrito: true, espaco: 1 });
  texto(`Ano-calendário ${guia.ano} · ${guia.quimico.nome}${guia.quimico.crq ? ` · CRQ ${guia.quimico.crq}` : ""} · ${guia.regime === "pj" ? "recebe pela própria empresa" : "recebe no CPF (autônomo)"}`, { tam: 10, cor: CINZA, espaco: 0.5 });
  texto(`Emitido em ${guia.emitidoEm}`, { tam: 9, cor: CINZA, espaco: 4 });

  // Quadro "Importante"
  const aviso = "Este guia mostra onde clicar e o que digitar no programa da Receita, com os valores que você lançou no Financeiro do RTQuímico. Ele não é o informe de rendimentos oficial: cada empresa que te pagou deve mandar o informe dela até o fim de fevereiro. Se algum valor for diferente, vale o do informe oficial. Os nomes das fichas foram conferidos com o programa IRPF 2026; se o programa mudar algum nome, procure a ficha de título mais parecido.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const linhasAviso = doc.splitTextToSize(limpo(aviso), L - 8) as string[];
  const hAviso = linhasAviso.length * 4.1 + 9;
  doc.setFillColor(253, 240, 225);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(M, y, L, hAviso, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 53, 15);
  doc.text("Importante", M + 4, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 31, 46);
  linhasAviso.forEach((linha, i) => doc.text(linha, M + 4, y + 10 + i * 4.1));
  y += hAviso + 6;

  // Resumo
  texto("Resumo do ano", { tam: 12, negrito: true, cor: AZUL, espaco: 1 });
  autoTable(doc, {
    startY: y, margin: { left: M, right: M }, theme: "grid",
    body: guia.resumo.map(([a, b]) => [limpo(a), b]),
    styles: { fontSize: 10, cellPadding: 2.2, textColor: [15, 31, 46] },
    columnStyles: { 0: { cellWidth: L * 0.62 }, 1: { halign: "right", fontStyle: "bold" } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  guia.secoes.forEach((secao, n) => {
    garantir(30);
    texto(`${n + 1}. ${secao.titulo}`, { tam: 13, negrito: true, cor: AZUL, espaco: 1 });
    texto(secao.explicacao, { tam: 10, cor: CINZA, espaco: 2 });
    secao.passos.forEach((passo, i) => texto(`Passo ${i + 1}. ${passo}`, { tam: 10, recuo: 2, espaco: 1.6 }));
    if (secao.passos.length) y += 1;

    for (const tabela of secao.tabelas) {
      garantir(25);
      texto(tabela.titulo, { tam: 10.5, negrito: true, espaco: 1 });
      autoTable(doc, {
        startY: y, margin: { left: M, right: M }, theme: "grid",
        head: [tabela.colunas ?? ["Campo no programa", "O que digitar", "Observação"]],
        body: tabela.linhas.map((x) => [limpo(x.campo), limpo(x.valor), limpo(x.obs ?? "")]),
        headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontSize: 9 },
        styles: { fontSize: 9.5, cellPadding: 2, textColor: [15, 31, 46], valign: "middle" },
        columnStyles: { 0: { cellWidth: L * 0.38 }, 1: { cellWidth: L * 0.27, fontStyle: "bold" }, 2: { textColor: CINZA, fontSize: 8.5 } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
    }

    if (secao.meses) {
      garantir(25);
      autoTable(doc, {
        startY: y, margin: { left: M, right: M }, theme: "grid",
        head: [["Mês", 'Recebido de PF\n(coluna "Trabalho não assalariado")', 'Livro-caixa\n(coluna "Livro caixa")', "Imposto estimado\n(só para conferir)"]],
        body: secao.meses.map((m) => [m.mes, m.rendimentos, m.livroCaixa, m.estimado]),
        headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontSize: 8.5 },
        styles: { fontSize: 9.5, cellPadding: 1.8, textColor: [15, 31, 46] },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right", textColor: CINZA } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
    }

    secao.avisos.forEach((a) => texto(`• ${a}`, { tam: 9.5, cor: CINZA, recuo: 2, espaco: 1.2 }));
    y += 5;
  });

  // Rodapé com página
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    doc.text(limpo(`RTQuímico · Guia do IR ${guia.anoEntrega} (ano-calendário ${guia.ano}) · ${guia.quimico.nome}`), M, altura - 10);
    doc.text(`Página ${p} de ${paginas}`, M + L, altura - 10, { align: "right" });
  }

  const nomeArquivo = `rtquimico-guia-ir-${guia.anoEntrega}-ano-calendario-${guia.ano}.pdf`;
  return { bytes: doc.output("arraybuffer"), nomeArquivo, salvar: () => doc.save(nomeArquivo) };
}
