-- Biblioteca de POPs: os modelos do RTQuímico passam a vir por migration (antes só existiam no seed local, e a
-- produção ficava sem nenhum). Cada modelo tem resumo, texto completo e as fontes oficiais em que se baseia.
-- São modelos de referência, não documentos oficiais: o químico adapta à empresa e confere a versão vigente das normas.
alter table public.sop_templates
  add column slug text unique,
  add column summary text,
  add column sources text[] not null default '{}';

-- Modelos antigos sem slug (só existiam no seed local, com uma frase de conteúdo)
delete from public.sop_templates where tenant_id is null and slug is null;

insert into public.sop_templates (slug, title, segment, summary, content, sources)
values
  ('calibracao-phmetro', 'Calibração e verificação de pHmetro', 'Laboratório', 'Calibração diária com soluções-tampão rastreáveis, critério de aceite pela inclinação e registro de cada leitura.', 'OBJETIVO
Garantir que as medições de pH sejam confiáveis, calibrando o medidor antes do uso e registrando o resultado.

APLICAÇÃO
Medidores de pH de bancada e portáteis usados em ensaios, controle de processo e monitoramento de efluentes.

RESPONSABILIDADES
- Analista: calibra antes do uso e registra.
- Químico responsável: define o critério de aceite e revisa os registros todo mês.

MATERIAIS
- Soluções-tampão com certificado e validade (normalmente pH 4,00, 7,00 e 10,00 a 25 °C)
- Água purificada para enxágue
- Béqueres limpos e papel absorvente macio
- Termômetro ou sensor de temperatura do medidor
- Solução de armazenamento do eletrodo indicada pelo fabricante

PROCEDIMENTO
1. Confira a validade e a integridade dos frascos de tampão; não use tampão vencido nem devolva tampão usado ao frasco.
2. Separe porções novas de cada tampão em béqueres identificados.
3. Retire o eletrodo da solução de armazenamento, enxágue com água purificada e seque com toque leve, sem esfregar o bulbo.
4. Ligue a compensação de temperatura ou anote a temperatura dos tampões.
5. Calibre começando pelo tampão pH 7,00 e depois pelos demais, na ordem indicada no manual do medidor.
6. Anote a inclinação (slope) e o desvio (offset) mostrados pelo medidor.
7. Aceite a calibração somente se a inclinação estiver dentro do critério definido (usualmente 95% a 105%; confirme no manual).
8. Verifique a calibração lendo um tampão que não foi usado no ajuste e registre a diferença.
9. Se a calibração for reprovada, limpe ou regenere o eletrodo conforme o manual e repita; persistindo, retire o equipamento de uso e identifique-o.
10. Após o uso, enxágue o eletrodo e guarde-o na solução de armazenamento.

REGISTROS
- Planilha de calibração: data, hora, analista, lote e validade dos tampões, temperatura, inclinação, desvio e leitura de verificação.
- Etiqueta de situação do equipamento (aprovado ou fora de uso).', array['ABNT NBR ISO/IEC 17025:2017 — requisitos para equipamentos e rastreabilidade metrológica em laboratórios', 'Manual do fabricante do medidor e do eletrodo — sequência de calibração e critério de aceite', 'Certificados das soluções-tampão — rastreabilidade (RBC/Inmetro ou equivalente)']),
  ('controle-qualidade-interno', 'Controle de qualidade interno dos ensaios', 'Laboratório', 'Brancos, duplicatas, padrões de controle e carta de controle para provar que cada lote de resultados é confiável.', 'OBJETIVO
Monitorar a validade dos resultados analíticos com controles em cada lote e agir quando algo sair do esperado.

APLICAÇÃO
Todos os ensaios quantitativos realizados no laboratório.

RESPONSABILIDADES
- Analista: inclui os controles no lote e registra os resultados.
- Químico responsável: define critérios, analisa as cartas de controle e aprova a liberação dos resultados.

MATERIAIS
- Material de referência ou padrão de controle com valor conhecido
- Água ou matriz isenta do analito para o branco
- Planilha ou software de carta de controle

PROCEDIMENTO
1. Defina para cada ensaio quais controles entram em todo lote: branco, duplicata, padrão de controle e, quando aplicável, amostra fortificada.
2. Defina a frequência mínima (por exemplo, um conjunto de controles a cada lote ou a cada 20 amostras) e registre no procedimento do ensaio.
3. Analise os controles nas mesmas condições das amostras.
4. Lance o resultado do padrão de controle na carta de controle (média e limites de alerta e de ação).
5. Confira o branco: resultado acima do limite definido indica contaminação; investigue antes de liberar.
6. Confira a diferença entre as duplicatas contra o critério de repetibilidade do método.
7. Se um controle sair do limite de ação, não libere o lote: investigue a causa, corrija e reanalise.
8. Registre a não conformidade, a causa encontrada e a ação tomada.
9. Revise as cartas de controle todo mês, procurando tendências mesmo dentro dos limites.

REGISTROS
- Carta de controle por ensaio.
- Registro de não conformidades e ações corretivas.
- Registro de liberação do lote (quem aprovou e quando).', array['ABNT NBR ISO/IEC 17025:2017 — item 7.7, garantia da validade dos resultados', 'Inmetro DOQ-CGCRE-008 — orientação sobre validação de métodos analíticos']),
  ('lavagem-vidrarias', 'Lavagem e descontaminação de vidrarias', 'Laboratório', 'Sequência de pré-enxágue, detergente, enxágue ácido quando necessário e secagem, para não contaminar as análises.', 'OBJETIVO
Evitar que resíduos na vidraria interfiram nos resultados dos ensaios.

APLICAÇÃO
Vidrarias e utensílios reutilizáveis do laboratório.

RESPONSABILIDADES
- Auxiliar ou analista: lava, seca e guarda.
- Químico responsável: define quando é obrigatório o enxágue ácido ou a lavagem específica por ensaio.

MATERIAIS
- Detergente neutro de laboratório
- Escovas próprias para vidraria
- Solução ácida diluída para enxágue, quando o ensaio exigir (por exemplo, metais)
- Água de torneira e água purificada
- Luvas, óculos de proteção e avental

PROCEDIMENTO
1. Esvazie a vidraria e descarte o conteúdo conforme o POP de resíduos; nunca jogue reagente na pia sem orientação.
2. Faça o pré-enxágue com água de torneira logo após o uso, antes que o resíduo seque.
3. Lave com detergente neutro e escova, sem riscar o vidro.
4. Enxágue abundantemente com água de torneira até remover todo o detergente.
5. Quando o ensaio exigir, faça o enxágue com a solução ácida, usando EPI, e depois enxágue com água de torneira.
6. Faça o enxágue final com água purificada, no mínimo três vezes.
7. Seque em estufa ou escorredor limpo; vidraria volumétrica não vai à estufa quente.
8. Inspecione: vidraria trincada ou lascada sai de uso.
9. Guarde protegida de poeira, separada por ensaio quando houver exigência.

REGISTROS
- Controle da preparação das soluções de lavagem (data, concentração, quem preparou).
- Verificação periódica de limpeza, quando o ensaio exigir (por exemplo, branco de vidraria).', array['Standard Methods for the Examination of Water and Wastewater (APHA/AWWA/WEF) — parte 1000, práticas gerais de laboratório', 'ABNT NBR ISO/IEC 17025:2017 — condições que não comprometam a validade dos resultados']),
  ('coleta-amostras-agua-efluentes', 'Coleta e preservação de amostras de água e efluentes', 'Amostragem', 'Do frasco certo à cadeia de custódia: identificação, preservação, refrigeração e prazo até o laboratório.', 'OBJETIVO
Coletar amostras representativas e preservá-las até a análise, sem alterar o que se quer medir.

APLICAÇÃO
Coletas de água bruta, água tratada, efluente e corpo receptor, para controle interno ou laudos.

RESPONSABILIDADES
- Coletor: coleta, preserva, identifica e preenche a cadeia de custódia.
- Químico responsável: define pontos, frascos, preservantes e prazos por parâmetro.

MATERIAIS
- Frascos adequados a cada parâmetro (vidro ou plástico, conforme o ensaio)
- Preservantes definidos por parâmetro, com EPI
- Caixa térmica com gelo ou gelo reciclável
- Etiquetas resistentes à água e caneta permanente
- Formulário de cadeia de custódia
- Medidores de campo calibrados (pH, temperatura, cloro), quando aplicável

PROCEDIMENTO
1. Confira o plano de amostragem: ponto, parâmetros, frascos, preservantes e prazo máximo até a análise.
2. Identifique cada frasco antes da coleta: ponto, data, hora, parâmetros e coletor.
3. No ponto, deixe a água escoar o tempo necessário para representar a condição real (torneira ou saída da tubulação).
4. Colete sem tocar a parte interna do frasco ou da tampa; para microbiologia, use frasco estéril e não enxágue.
5. Encha conforme o parâmetro: alguns exigem frasco cheio sem bolha de ar, outros exigem espaço livre.
6. Adicione o preservante indicado para cada parâmetro e feche bem.
7. Faça as medições de campo exigidas (por exemplo, temperatura, pH e cloro residual) e anote.
8. Acondicione na caixa térmica refrigerada, sem congelar, protegida da luz.
9. Preencha a cadeia de custódia e entregue ao laboratório dentro do prazo de validade de cada parâmetro.
10. Registre qualquer ocorrência: chuva, vazão anormal, cheiro, cor ou ponto inacessível.

REGISTROS
- Cadeia de custódia assinada na coleta e no recebimento.
- Planilha de medições de campo.
- Registro fotográfico do ponto, quando útil.', array['ABNT NBR 9898:1987 — preservação e técnicas de amostragem de efluentes líquidos e corpos receptores', 'Guia Nacional de Coleta e Preservação de Amostras (ANA/CETESB, 2011)', 'Standard Methods for the Examination of Water and Wastewater (APHA/AWWA/WEF) — prazos e preservantes por parâmetro']),
  ('operacao-ete', 'Operação da estação de tratamento de efluentes', 'Água e efluentes', 'Rotina diária da ETE: inspeção, parâmetros de controle, dosagem de produtos, lodo e o que fazer quando algo sai do padrão.', 'OBJETIVO
Manter o efluente tratado dentro dos padrões de lançamento da licença ambiental, com registro da operação.

APLICAÇÃO
Estação de tratamento de efluentes da empresa, do recebimento ao lançamento ou envio à rede.

RESPONSABILIDADES
- Operador: executa a rotina e registra.
- Químico responsável: define parâmetros e faixas de controle, analisa tendências e responde perante a licença.

MATERIAIS
- Medidores de campo calibrados
- Reagentes e produtos de tratamento com FDS disponível
- EPI: luvas, óculos, botas e avental
- Planilha de operação

PROCEDIMENTO
1. Leia a licença de operação e liste os parâmetros, limites e frequências de monitoramento exigidos.
2. No início do turno, inspecione as unidades: nível, vazão, odor, cor, espuma e funcionamento de bombas e misturadores.
3. Meça os parâmetros de controle de processo na frequência definida (por exemplo, pH, temperatura e vazão).
4. Ajuste a dosagem de produtos conforme os resultados e a faixa definida pelo químico responsável.
5. Controle o lodo: descarte, desaguamento e armazenamento em local adequado até a destinação.
6. Colete as amostras de monitoramento conforme o POP de coleta e o calendário da licença.
7. Se algum parâmetro sair da faixa, aplique a ação prevista (ajuste, recirculação, parada do lançamento) e avise o químico responsável na hora.
8. Registre a operação do turno, inclusive paradas, manutenções e ocorrências.
9. Mantenha os laudos e relatórios exigidos pelo órgão ambiental organizados e dentro do prazo.

REGISTROS
- Planilha diária de operação.
- Laudos de monitoramento.
- Registro de não conformidades e comunicações ao órgão ambiental, quando exigidas.
- Manifestos de transporte do lodo (MTR).', array['Resolução CONAMA nº 430/2011 — condições e padrões de lançamento de efluentes', 'Licença ambiental de operação da empresa — parâmetros, limites e condicionantes', 'Legislação estadual, quando houver (por exemplo, em SP, Decreto Estadual nº 8.468/1976)']),
  ('potabilidade-reservatorio', 'Controle da potabilidade e limpeza do reservatório', 'Água e efluentes', 'Higienização semestral da caixa d''água, controle do cloro residual e laudos de potabilidade.', 'OBJETIVO
Garantir que a água usada pela empresa seja potável, com reservatórios limpos e controle registrado.

APLICAÇÃO
Reservatórios, caixas d''água e pontos de consumo de água da empresa.

RESPONSABILIDADES
- Responsável pela manutenção: executa ou acompanha a limpeza.
- Químico responsável: define a frequência, o controle e avalia os laudos.

MATERIAIS
- Produto saneante regularizado na Anvisa para desinfecção de reservatórios
- Escovas e panos exclusivos, sem uso de produtos abrasivos que danifiquem o revestimento
- Kit ou medidor de cloro residual livre
- EPI: botas, luvas, óculos e, quando indicado, proteção respiratória

PROCEDIMENTO
1. Programe a limpeza dos reservatórios na frequência definida (usualmente a cada seis meses) e após qualquer contaminação suspeita.
2. Feche a entrada de água e esvazie o reservatório, reservando água para uso essencial.
3. Remova a sujeira das paredes e do fundo com escova e água, sem produtos que deixem resíduo.
4. Retire a água suja pela descarga de fundo, sem passar pela rede de consumo.
5. Desinfete com o saneante regularizado, na diluição e no tempo de contato indicados no rótulo.
6. Enxágue, encha novamente e confira o cloro residual nos pontos de consumo.
7. Verifique tampa, vedação e telas: o reservatório precisa ficar fechado e protegido.
8. Meça o cloro residual na frequência definida e registre.
9. Envie amostras para laudo de potabilidade na frequência definida e após cada limpeza.

REGISTROS
- Registro de limpeza do reservatório (data, produto, responsável) ou certificado da empresa contratada.
- Planilha de cloro residual.
- Laudos de potabilidade.', array['Portaria GM/MS nº 888/2021 — procedimentos de controle e vigilância da qualidade da água para consumo humano e seu padrão de potabilidade', 'RDC Anvisa nº 275/2002 — POPs de higienização do reservatório e de potabilidade da água em estabelecimentos produtores de alimentos']),
  ('gestao-residuos-quimicos', 'Gestão de resíduos químicos', 'Resíduos', 'Segregação por compatibilidade, rotulagem, armazenamento temporário, transporte com MTR e certificado de destinação.', 'OBJETIVO
Separar, guardar e destinar os resíduos químicos de forma segura e rastreável, cumprindo a legislação.

APLICAÇÃO
Todos os resíduos químicos gerados pela empresa, incluindo embalagens contaminadas.

RESPONSABILIDADES
- Gerador (cada setor): separa e identifica o resíduo na origem.
- Químico responsável: classifica, define a compatibilidade e aprova a destinação.
- Responsável pelo PGRS: contrata transportador e destinador licenciados e guarda os documentos.

MATERIAIS
- Recipientes compatíveis com cada resíduo, com tampa
- Etiquetas de identificação de resíduo
- Bandejas de contenção
- EPI conforme a FDS dos produtos

PROCEDIMENTO
1. Identifique os resíduos gerados em cada setor e classifique-os (perigoso ou não perigoso).
2. Separe por compatibilidade química: nunca misture ácidos com bases, oxidantes com orgânicos ou resíduos que reajam entre si.
3. Use recipiente compatível, fechado, sem encher até a boca.
4. Identifique cada recipiente: nome do resíduo, setor, data de início e pictogramas de perigo.
5. Leve ao abrigo temporário de resíduos: coberto, ventilado, com piso impermeável e contenção.
6. Controle o tempo e a quantidade armazenada conforme o PGRS e a licença.
7. Destine somente por transportador e destinador licenciados, emitindo o MTR no sistema do SINIR.
8. Guarde o certificado de destinação final (CDF) de cada envio.
9. Declare os resíduos no inventário ou relatório anual exigido pelo órgão ambiental.

REGISTROS
- Planilha de geração de resíduos.
- MTR e CDF de cada destinação.
- Licenças do transportador e do destinador.
- PGRS atualizado.', array['Lei nº 12.305/2010 — Política Nacional de Resíduos Sólidos', 'ABNT NBR 10004 — classificação de resíduos sólidos', 'ABNT NBR 12235 — armazenamento de resíduos sólidos perigosos', 'Portaria MMA nº 280/2020 — Manifesto de Transporte de Resíduos (MTR) nacional no SINIR']),
  ('descarte-reagentes-vencidos', 'Descarte de reagentes vencidos ou sem identificação', 'Resíduos', 'Inventário, segregação, identificação e envio para destinação licenciada, sem descarte na pia.', 'OBJETIVO
Retirar com segurança reagentes vencidos, deteriorados ou sem rótulo, sem risco para pessoas e ambiente.

APLICAÇÃO
Estoques de reagentes e produtos químicos de laboratório e produção.

RESPONSABILIDADES
- Responsável pelo estoque: faz o inventário e separa os itens.
- Químico responsável: avalia cada item e define a destinação.

MATERIAIS
- Inventário de reagentes
- FDS dos produtos
- Recipientes de contenção e etiquetas
- EPI conforme a FDS

PROCEDIMENTO
1. Faça o inventário periódico e marque os reagentes vencidos, deteriorados ou sem identificação.
2. Não abra nem cheire frascos sem identificação; trate como perigosos até a avaliação.
3. Consulte a seção 13 da FDS (considerações sobre destinação final) de cada produto identificado.
4. Separe os itens por compatibilidade, mantendo cada um na embalagem original sempre que possível.
5. Identifique o lote para descarte com a lista dos produtos e as quantidades.
6. Guarde no abrigo de resíduos até a coleta.
7. Envie para destinador licenciado com MTR e guarde o CDF.
8. Para produtos controlados pela Polícia Federal ou pelo Exército, siga as regras próprias de baixa e destinação antes do envio.
9. Atualize o inventário e o controle de estoque.

REGISTROS
- Lista dos reagentes descartados.
- MTR e CDF.
- Baixa de produtos controlados, quando houver.', array['ABNT NBR 14725 — FDS, seção 13 (considerações sobre destinação final)', 'Lei nº 12.305/2010 — Política Nacional de Resíduos Sólidos', 'Portaria MJSP nº 240/2019 — controle de produtos químicos pela Polícia Federal, quando aplicável']),
  ('resposta-derramamento', 'Resposta a derramamento de produto químico', 'Segurança', 'Isolar, proteger, conter, recolher e registrar: o passo a passo para um vazamento pequeno, e quando acionar socorro.', 'OBJETIVO
Agir rápido e com segurança quando um produto químico derramar, protegendo pessoas, instalações e ambiente.

APLICAÇÃO
Derramamentos e vazamentos de produtos químicos nas áreas da empresa.

RESPONSABILIDADES
- Quem presencia: isola a área e avisa.
- Equipe treinada: contém e limpa.
- Químico responsável: avalia o risco, orienta a destinação e investiga a causa.

MATERIAIS
- Kit de emergência: material absorvente compatível, barreiras de contenção, pá e recipientes
- Neutralizantes indicados para os produtos da empresa, quando aplicável
- EPI conforme a FDS
- Lista de telefones de emergência e FDS acessíveis no local

PROCEDIMENTO
1. Afaste as pessoas e isole a área; se houver gás, fumaça ou fogo, acione a brigada ou o Corpo de Bombeiros (193).
2. Identifique o produto pelo rótulo e consulte a FDS, seção 6 (medidas de controle para derramamento ou vazamento).
3. Vista o EPI indicado antes de se aproximar.
4. Elimine fontes de ignição se o produto for inflamável e ventile o local, quando seguro.
5. Contenha o espalhamento com barreiras, impedindo que o produto chegue a ralos e à rede de esgoto.
6. Absorva com material compatível (ou neutralize, se a FDS indicar) e recolha em recipiente identificado.
7. Limpe a superfície conforme a FDS e destine o material recolhido como resíduo perigoso.
8. Atenda vítimas conforme a FDS, seção 4 (primeiros socorros), e encaminhe ao atendimento médico com a FDS.
9. Registre a ocorrência, investigue a causa e reponha o kit de emergência.

REGISTROS
- Registro de ocorrência: data, produto, quantidade, local, ações e pessoas envolvidas.
- Investigação da causa e ação corretiva.
- Destinação do resíduo gerado (MTR e CDF).', array['ABNT NBR 14725 — FDS, seções 4 (primeiros socorros) e 6 (medidas de controle para derramamento ou vazamento)', 'NR-06 — equipamento de proteção individual', 'NR-26 — sinalização de segurança e identificação de produtos químicos']),
  ('uso-epi', 'Uso, guarda e troca de EPI', 'Segurança', 'EPI certo para cada tarefa, com CA válido, entrega registrada, inspeção antes do uso e troca no prazo.', 'OBJETIVO
Garantir que cada pessoa use o EPI adequado ao risco, em bom estado e com registro de entrega.

APLICAÇÃO
Todas as atividades com exposição a produtos químicos e demais riscos identificados.

RESPONSABILIDADES
- Empresa: fornece o EPI gratuitamente, treina e fiscaliza o uso.
- Colaborador: usa, guarda e comunica dano.
- Químico responsável: indica o EPI para os riscos químicos com base na FDS.

MATERIAIS
- EPIs com Certificado de Aprovação (CA) válido
- Ficha de entrega de EPI
- Local limpo para guarda

PROCEDIMENTO
1. Liste as tarefas com risco químico e defina o EPI de cada uma com base na FDS, seção 8 (controle de exposição e proteção individual).
2. Confira se o CA de cada EPI está válido antes de comprar e de entregar.
3. Entregue o EPI e registre na ficha, com assinatura do colaborador.
4. Treine o uso correto, a colocação, a retirada e a guarda.
5. Antes de cada uso, o colaborador inspeciona o EPI e não usa se estiver danificado.
6. Após o uso, limpe conforme o fabricante e guarde em local limpo, longe de produtos químicos.
7. Troque na data de validade, após contaminação ou dano; luvas e filtros respiratórios seguem a troca definida.
8. Registre as trocas na ficha de entrega.

REGISTROS
- Ficha de entrega de EPI assinada.
- Registro de treinamento.
- Controle de validade dos CAs.', array['NR-06 — equipamento de proteção individual (fornecimento, CA, obrigações do empregador e do empregado)', 'ABNT NBR 14725 — FDS, seção 8 (controle de exposição e proteção individual)']),
  ('rotulagem-produtos-quimicos', 'Rotulagem de produtos químicos e frascos secundários', 'Segurança', 'Rótulo do fornecedor preservado e rótulo de frasco secundário com nome, perigos (GHS) e data.', 'OBJETIVO
Garantir que todo recipiente com produto químico esteja identificado e comunique os perigos.

APLICAÇÃO
Embalagens originais, frascos secundários, soluções preparadas e recipientes de processo.

RESPONSABILIDADES
- Quem transfere ou prepara o produto: identifica o novo recipiente.
- Químico responsável: define o modelo de rótulo e confere periodicamente.

MATERIAIS
- Etiquetas resistentes a produtos químicos
- Pictogramas de perigo do GHS
- FDS dos produtos

PROCEDIMENTO
1. Mantenha o rótulo original legível; não cubra nem remova.
2. Ao transferir para outro recipiente, identifique-o na hora: nome do produto, concentração, pictogramas de perigo, palavra de advertência e data.
3. Em soluções preparadas, inclua quem preparou, data de preparo e validade.
4. Use os elementos de rotulagem da FDS, seção 2 (identificação de perigos).
5. Não use recipientes de alimentos ou bebidas para produtos químicos.
6. Recipiente sem identificação não é usado: segregue e siga o POP de descarte.
7. Confira os rótulos na inspeção periódica e substitua os danificados.

REGISTROS
- Registro de preparo de soluções.
- Checklist de inspeção de rotulagem.', array['ABNT NBR 14725 — sistema de classificação de perigos, FDS e rotulagem (GHS)', 'NR-26 — sinalização de segurança e identificação de produtos químicos']),
  ('recebimento-armazenamento', 'Recebimento e armazenamento de produtos químicos', 'Armazenamento', 'Conferência na chegada, FDS disponível, separação por incompatibilidade e controle de produtos controlados.', 'OBJETIVO
Receber e guardar produtos químicos com segurança, separando os incompatíveis e mantendo o controle de estoque.

APLICAÇÃO
Almoxarifado, depósitos e armários de produtos químicos.

RESPONSABILIDADES
- Almoxarife: confere, registra e armazena.
- Químico responsável: define o arranjo do armazenamento e as incompatibilidades.

MATERIAIS
- FDS de todos os produtos
- Tabela de incompatibilidade química
- Bandejas de contenção e prateleiras resistentes
- EPI para manuseio

PROCEDIMENTO
1. Na chegada, confira a nota, o produto, a quantidade, o lote, a validade e a integridade da embalagem.
2. Recuse ou isole embalagem danificada ou com vazamento.
3. Confirme que a FDS atualizada está disponível no local de uso e de armazenamento.
4. Armazene conforme a FDS, seções 7 (manuseio e armazenamento) e 10 (estabilidade e reatividade).
5. Separe os incompatíveis: ácidos, bases, oxidantes, inflamáveis e reativos com água em áreas ou armários distintos.
6. Guarde líquidos em prateleiras baixas e sobre contenção; nunca acima da altura dos olhos.
7. Mantenha o local ventilado, sinalizado, com acesso restrito e kit de derramamento próximo.
8. Aplique o PVPS (primeiro que vence, primeiro que sai) e controle a validade.
9. Para produtos controlados pela Polícia Federal ou pelo Exército, mantenha a licença e os mapas de controle em dia.

REGISTROS
- Registro de recebimento.
- Controle de estoque e validade.
- Mapas e relatórios de produtos controlados, quando aplicável.', array['ABNT NBR 14725 — FDS, seções 7 (manuseio e armazenamento) e 10 (estabilidade e reatividade)', 'NR-26 — identificação de produtos químicos', 'Portaria MJSP nº 240/2019 — produtos químicos controlados pela Polícia Federal', 'Decreto nº 10.030/2019 — produtos controlados pelo Exército, quando aplicável']),
  ('armazenamento-inflamaveis', 'Armazenamento de líquidos inflamáveis', 'Armazenamento', 'Local ventilado, sem fontes de ignição, com contenção, aterramento e quantidades dentro do permitido.', 'OBJETIVO
Reduzir o risco de incêndio e explosão no armazenamento e manuseio de líquidos inflamáveis e combustíveis.

APLICAÇÃO
Áreas, armários e tanques com líquidos inflamáveis e combustíveis.

RESPONSABILIDADES
- Responsável pela área: mantém as condições e controla o acesso.
- Químico responsável: identifica os produtos e as quantidades e verifica o enquadramento na NR-20.

MATERIAIS
- Armário corta-fogo ou área específica para inflamáveis
- Extintores adequados à classe de fogo
- Sistema de aterramento para transferências
- Bandejas de contenção e material absorvente
- Sinalização de proibido fumar e de produto inflamável

PROCEDIMENTO
1. Levante os inflamáveis e combustíveis e as quantidades armazenadas para verificar o enquadramento na NR-20.
2. Guarde em armário corta-fogo ou área própria, ventilada, longe de fontes de calor e de ignição.
3. Mantenha as embalagens fechadas e identificadas, sobre contenção.
4. Separe dos oxidantes e de outros incompatíveis.
5. Nas transferências, aterre e conecte os recipientes para evitar eletricidade estática.
6. Use somente equipamentos e instalações elétricas adequados à área.
7. Mantenha extintores, sinalização e rota de fuga desobstruídos e inspecionados.
8. Limite a quantidade nos locais de uso ao necessário para o turno.
9. Treine as pessoas que manuseiam inflamáveis conforme a NR-20.

REGISTROS
- Inventário de inflamáveis e combustíveis.
- Inspeção da área e dos extintores.
- Registro de treinamento NR-20.', array['NR-20 — segurança e saúde no trabalho com inflamáveis e combustíveis', 'ABNT NBR 17505 — armazenamento de líquidos inflamáveis e combustíveis', 'Instrução técnica do Corpo de Bombeiros do estado']),
  ('higienizacao-instalacoes', 'Higienização de instalações, equipamentos e utensílios', 'Alimentos', 'O que limpar, com qual produto, em que diluição, com qual frequência e quem confere.', 'OBJETIVO
Manter instalações, equipamentos e utensílios limpos e desinfetados, evitando a contaminação dos alimentos.

APLICAÇÃO
Áreas de produção, armazenamento e manipulação de alimentos.

RESPONSABILIDADES
- Equipe de higienização: executa e registra.
- Responsável técnico: define produtos, diluições e frequências e verifica a execução.

MATERIAIS
- Detergentes e desinfetantes regularizados na Anvisa, com ficha técnica e FDS
- Utensílios de limpeza exclusivos por área
- EPI: luvas, botas e avental impermeável, óculos quando houver respingo

PROCEDIMENTO
1. Monte a planilha por item: o que limpar, frequência, produto, diluição, tempo de contato e responsável.
2. Retire os resíduos grosseiros.
3. Lave com detergente e enxágue com água potável.
4. Desinfete com o produto definido, respeitando a diluição e o tempo de contato do rótulo.
5. Enxágue, quando o rótulo exigir, e deixe secar naturalmente ou com material descartável.
6. Prepare as diluições com medidor, nunca no olho, e identifique o frasco.
7. Guarde os produtos de limpeza separados dos alimentos.
8. O responsável técnico verifica a execução e registra; repita quando a limpeza estiver insatisfatória.

REGISTROS
- Planilha de higienização assinada.
- Registro de verificação.
- Fichas técnicas e FDS dos produtos.', array['RDC Anvisa nº 275/2002 — POPs em estabelecimentos produtores e industrializadores de alimentos (higienização de instalações, equipamentos, móveis e utensílios)', 'RDC Anvisa nº 216/2004 — boas práticas para serviços de alimentação']),
  ('controle-pragas', 'Controle integrado de vetores e pragas urbanas', 'Alimentos', 'Barreiras físicas, inspeção, empresa controladora licenciada e comprovante de cada aplicação.', 'OBJETIVO
Impedir a entrada, o abrigo e a proliferação de pragas, com medidas preventivas e controle químico só por empresa habilitada.

APLICAÇÃO
Todas as áreas internas e externas da empresa.

RESPONSABILIDADES
- Responsável técnico: coordena o programa e avalia os relatórios.
- Empresa controladora de pragas licenciada: executa o controle químico.
- Todos: comunicam sinais de pragas.

MATERIAIS
- Telas, vedações, ralos sifonados e portas com fechamento
- Mapa de iscas e armadilhas
- Contrato e licença sanitária da empresa controladora

PROCEDIMENTO
1. Mantenha as barreiras físicas: telas íntegras, vedação de frestas, ralos fechados e portas com fechamento automático.
2. Não acumule lixo, entulho ou materiais em desuso que sirvam de abrigo.
3. Inspecione as áreas na frequência definida e registre os sinais de pragas.
4. Contrate apenas empresa controladora com licença sanitária e responsável técnico.
5. Exija, a cada serviço, o comprovante de execução com os produtos usados, as quantidades, o responsável técnico e as precauções.
6. Proteja alimentos, embalagens e equipamentos durante a aplicação e respeite o tempo de reentrada.
7. Mantenha o mapa de iscas e armadilhas atualizado.
8. Avalie os relatórios e cobre ações quando houver infestação recorrente.

REGISTROS
- Comprovantes de execução de serviço.
- Mapa de iscas e armadilhas.
- Registro de inspeções.
- Licença sanitária da empresa controladora.', array['RDC Anvisa nº 275/2002 — POP de controle integrado de vetores e pragas urbanas', 'RDC Anvisa nº 622/2022 — funcionamento das empresas especializadas em controle de vetores e pragas urbanas'])
on conflict (slug) do update set
  title = excluded.title, segment = excluded.segment, summary = excluded.summary,
  content = excluded.content, sources = excluded.sources;
