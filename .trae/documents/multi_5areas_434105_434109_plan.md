# Plano 5 Áreas Separáveis (5 commits independentes) — 2026-09-15

## 0. Orquestração Geral (OBRIGATÓRIO ENTRE COMMITS)

Para CADA uma das 5 áreas (5 commits SEPARADOS, ordem abaixo), aplicar na seguinte sequência:

1. Implementar alterações apenas daquela área.
2. Rodar `node --check server.js` / `node --check patch.js` / `node --check sw.js`.
3. Rodar `git diff --stat` → se > 2000L linhas TOTAIS, **PARAR e reportar ANTES**.
4. **5 bumps de versão** com timestamp MAIOR que o anterior, seguindo a sequência:
   - Deploy 434104 em produção → patch `20260914434104`
   - 434105 = `20260915434105` (Fornecedores)
   - 434106 = `20260915434106` (OFs por Máquina)
   - 434107 = `20260915434107` (Clientes/Mapa)
   - 434108 = `20260915434108` (Compra de Papelão — CRÍTICO)
   - 434109 = `20260915434109` (Orçamentos)
   Locais de bump: [server.js:L1254-L1256](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L1254-L1256) (PATCH/SW runtime), [sw.js:L4](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/sw.js#L4-L4), index.html inline swVersion, index.html inline `<script src="/patch.js?v=TIMESTAMP">` (Fact4 exceção permitida só nesses 2 inline).
5. Commit único com mensagem descritiva (ex: `434105 Fornecedores: categoria cadastro + filtro toolbar`).
6. `git push origin main`.
7. Poll Railway até `/api/version` retornar `runtime.patch === TIMESTAMP` e `git.commit === 7 chars do SHA local`.
8. Smoke anônimo: 5 endpoints não podem retornar HTTP 500 (401 é esperado).
9. Console browser novo perfil: ZERO erros JS repetidos (excepto [PASSAGENS-MAQUINA] que é info).
10. Reportar para o usuário: SHA, patch, resultado checks, evidências.
11. **Aguardar confirmação do usuário** antes de começar a próxima área (exceto se o usuário disser "vai em frente" durante o dia).

---

## 1. ENTREGA 434105 — Fornecedores: Categoria no Cadastro + Filtro Listagem

### Research
- **Coluna TIPO já existe e é usada**: select `#forn-e-tipo` [index.html:L49574-L49577](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L49574-L49577) com opções Papelão/Tinta/Cola/Maquinário/Outros. Filtro toolbar `#forn-tipo` em [index.html:L48227-L48230](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L48227-L48230). SalvarFornecedor usa `payload.tipo` [index.html:L28983](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L28983-L28983). RenderFornecedores filtra `f.tipo===fil` [index.html:L28840](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L28840-L28840). Badge card mostra `f.tipo` [index.html:L28853](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L28853-L28853).
- **DECISÃO**: Manter coluna TIPO intacta (compatibilidade retroativa). **ADICIONAR NOVA coluna `categoria`** (como user pediu: Papelão, Água, Luz, Internet, Outros — permitir digitar novo).
- Backend: endpoint `/fornecedores` (supabase REST direto) — a coluna `categoria` precisa existir na tabela. Como user quer cadastrar nova categoria se quiser, usa padrão `datalist + input text` (não select fechado).

### Arquivos para alterar
- `index.html`:
  - [L49578-L49587](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L49578-L49587): Inserir campo NOME="Categoria" (abaixo de TIPO) com `<input list="forn-cat-opts" id="forn-e-categoria">` + `<datalist id="forn-cat-opts">` contendo `<option>Papelão</option><option>Água</option><option>Luz</option><option>Internet</option><option>Outros</option>`. Permite digitar categoria custom fora da lista.
  - [L48230-L48233](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L48230-L48233): Inserir **segundo filtro toolbar** `<select id="forn-categoria" onchange="renderFornecedores()"><option value="">Todas categorias</option></select>` — as `<option>` desse select são **populadas dinamicamente via JS** no `renderFornecedores()` (lê `[...new Set(FORNECEDORES.map(f=>f.categoria).filter(Boolean))]` → ordena e injeta).
  - [L28943-L28954](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L28943-L28954): `abrirModalFornecedor(id)` adicionar `document.getElementById('forn-e-categoria')?.value = f?.categoria ?? '';` (posição entre tipo e cnpj, usando optional chaining igual aos novos campos abaixo — **TAMBÉM já aplicar optional chaining `(x || {}).value =` em TODOS os campos desse bloco para resolver o TypeError null do commit 434106? NÃO, deixa o TypeError pro próximo commit de OFsMáquina como usuário pediu. Aqui só aplica null-check no NOVO forn-e-categoria.**)
  - [L28981-L28993](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L28981-L28993): `salvarFornecedor()` adicionar `categoria: document.getElementById('forn-e-categoria')?.value?.trim() || ''` no payload, E não deletar se vazio (manter `Object.keys` delete payload[k] vazio — categoria vazio é permitido).
- `patch.js`: **NÃO precisa alterar**. O override `abrirDetalhesFornecedor` mostra detalhes e já mostra apenas dados retornados do backend; categoria aparecerá naturalmente se for carregada.
- `server.js`: NÃO precisa migration SQL (Fact22 user disse não rodar DDL por enquanto via código; confiaremos que coluna `categoria` foi adicionada manualmente no banco ou user adicionará. Se NÃO existir, o POST via supabase REST retornará erro normal e usuário avisará). **Ponto de atenção**: Se o backend endpoint de fornecedores é via Supabase REST direto (sem handler server.js), então compatibilidade é automática — coluna inexistente retorna erro 400 normal.

### Implementation Steps
1. index.html L49578: inserir o `<div class="mf"><label>CATEGORIA</label><input list="forn-cat-opts" id="forn-e-categoria" placeholder="Selecione ou digite..."><datalist id="forn-cat-opts"><option>Papelão</option><option>Água</option><option>Luz</option><option>Internet</option><option>Outros</option></datalist></div>`.
2. index.html L48230 toolbar: inserir `<select id="forn-categoria" onchange="renderFornecedores()"><option value="">Todas categorias</option></select>` entre forn-tipo e forn-emp-fil.
3. index.html L28835-L28841 renderFornecedores:
   - Variável nova: `const catFil = (document.getElementById('forn-categoria')||{}).value||'';`
   - Popular options: `const catSel = document.getElementById('forn-categoria'); if (catSel && catSel.options && catSel.options.length <= 1) { const cats = [...new Set(FORNECEDORES.map(f=>String(f.categoria||'')).filter(Boolean))].sort(); const prev = catSel.value; catSel.innerHTML = '<option value="">Todas categorias</option>' + cats.map(c => `<option${c===prev?' selected':''}>${rrEsc?window.escH(c):c.replace(/</g,'&lt;')}</option>`).join(''); }`
   - Aplicar filtro: `if(catFil) lista = lista.filter(f => String(f.categoria||'') === catFil);`
4. index.html L28851-L28853 card: adicionar categoria no badge (ao lado de tipo, separado por ·):
   ```
   +'<span class="ramo-badge" style="margin:0">'+f.tipo+'</span>'
   + (f.categoria?`<span class="ramo-badge" style="margin:0;opacity:.85;background:#0ea5e9">${window.escH?window.escH(f.categoria):String(f.categoria).replace(/</g,'&lt;')}</span>`:'')
   ```
5. index.html L28945 (no abrirModalFornecedor): adicionar `const catEl = document.getElementById('forn-e-categoria'); if(catEl) catEl.value = f?.categoria ?? '';`
6. index.html L28983 (payload salvar): adicionar linha `categoria: document.getElementById('forn-e-categoria')?.value?.trim() ?? '',`

### Validation
- Syntax 3x node --check exit 0.
- `git diff --stat` esperado: 40-90 linhas (tudo index.html).
- UI manual: Abrir tela Fornecedores → Novo Fornecedor → campo Categoria aparece; digitar "Fretes" fora da lista funciona; salvar → recarregar tela → card mostra badge azul categoria "Fretes"; filtro toolbar Categoria lista todas categorias únicas cadastradas; selecionar "Papelão" filtra apenas fornecedores dessa categoria.
- Smoke endpoints: `/api/fornecedores` 401 (OK). /api/version bate.

### Risks
- Coluna `categoria` NÃO existe ainda no banco: POST/PUT de fornecedor com categoria retornará erro supabase normal visível ao usuário em toast. Não é bug, é DDL pendente do usuário. NÃO cair em loop. Apenas documentar no report. Lidar: se user relatar, pedir `ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS categoria TEXT;` no SQL Editor.

---

## 2. ENTREGA 434106 — OFs por Máquina 4 itens (Prioridade #1 real)

### Research 4 sub-itens:

#### Sub-item 2.1 TypeError: Cannot set properties of null (setting 'value') at abrirModalFornecedor (user reporta L28943)
- [index.html:L28941-L28954](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/index.html#L28941-L28954) = **11 set .value seguidos SEM NULL-CHECK**: `document.getElementById('forn-edit-id').value` → qualquer que seja o primeiro elemento não encontrado (modal não renderizado, DOM em navegação incompleta) explode TypeError null.setting value.
- Fix: Transformar todas as 11 atribuições em `const elX = document.getElementById('id'); if(elX) elX.value = valor;` ou `(document.getElementById('id') || {}).value = valor;`. A segunda opção é mais compacta, sem risco de erro, e é equivalente. Escolher opção 2.

#### Sub-item 2.2 Amostras Pendentes TAVADO em "Carregando amostras..."
- Fallback global JÁ EXISTIA em [patch.js:L61542-L61605](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L61542-L61605): a cada 6s varre DOM, encontra "Carregando amostras" +18s parado, injeta botão 🔄 Tentar Novamente (chama `__amostrasTentarNovamente`). Esse código existe, mas user diz que continua travado.
- Causa provável: 1) O shell não consegue encontrar `renderAmostrasSemana` via typeof ou 2) Os `_amostrasRendering` travas nunca resetam.
- Melhoria imediata (não quebrar regra "não assumir"):
  a) Adicionar **2 novos triggers** de disparo `window.__amostrasTentarNovamente()`: (i) ao finalizar salvarOF (hook after), (ii) após 5s de hashchange p/ OFs por Máquina.
  b) Em `__amostrasTentarNovamenteFn` ANTES de chamar render, também limpar explicitamente `s1._amostrasLoaded=false` e também `delete s1._amostrasLastData; delete s1._amostrasLastRender;` (se existirem no shell — usar try/delete).
  c) **Adicionar console.log info**: "[AMOSTRAS-FALLBACK] Tentando novamente: motivo=X; renderFnFound=bool; shellFound=bool;".
  d) No varrerCorrigir, após exibir o botão Tentar Novamente, **disparar automaticamente UMA VEZ** o clique após 300ms (assim user não precisa clicar — e ainda deixa o botão se precisar de 2ª tentativa).

#### Sub-item 2.3 Botão "Sem Papelão" não funciona como deveria
- Handlers existem em [patch.js:L4896-L5006](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L4896-L5006): clique → abre modal alterar data com motivo "Falta de Papelão" preselecionado → salva alteração de data.
- Não dá para adivinhar o "deveria" sem mais info. Estratégia correta: **ADICIONAR LOGS DETALHADOS de início e fim da operação para capturar o que é o comportamento real e o que user está achando errado**.
- Ação: patch `ofmaqConfirmarSemPapelao` wrapper em [patch.js:L5159-L5161](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L5159-L5161) (wrapper já existe). Adicionar no INÍCIO do wrapper:
  `console.log('[SEM-PAPELAO] clique confirmar:', { ofId, numeroDigits, currentSemPapel: of?.sem_papelao || of?.sem_papel, button: '🟨 Remover Sem Papelão' vs '🟨 Sem Papelão' });`
  e NO FIM (após finalizar): `console.log('[SEM-PAPELAO] resultado:', { sucesso: bool, novoValor: bool, toastMessage: '' }).`
- Também adicionar **TRATAMENTO DE DADO**: se após salvar, a badge `patch-sempapel-q-status` não atualizar no DOM, adicionar um `querySelectorAll + setInnerHTML` manual no FINAL do wrapper para refresh imediato.

#### Sub-item 2.4 Passagens de Máquina: ZERO gravação desde julho. Requer log [PASSAGENS-MAQUINA][ENTRY]
- **DESCOBERTA IMPORTANTE RESEARCH**: a função `_upsertPassagemMaquinaRegistro` [server.js:L11632](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L11632-L11645) **JÁ TEM** o [ENTRY] log na L11640. Se user diz que NUNCA aparece, SIGNIFICA QUE A FUNÇÃO NUNCA É CHAMADA.
- Existem **6 callers** diferentes dessa função em server.js (grep retornou 6 ocorrências L9581, L9802, L9969, L10487, L10830 e L11632 que é a própria def). Preciso, em CAD UM DOS 6 CALLERS ANTES do `try`:
  - Inserir log ÚNICO por cada um, com identificador de caller: `console.log('[PASSAGENS-MAQUINA] [CALLER-A] antes de chamar _upsertPassagemMaquinaRegistro: caller=POST salvarOF fluxo de conclusão OF, id=X, payload_keys=...');`
  - E no `catch` após cada chamada: `console.error('[PASSAGENS-MAQUINA] [CALLER-A] ERRO wrapper: mensagem=..., stack=...').`
  - Nomear os callers A–E (5 callers reais, o 6º é L11632 a própria função):
    - CALLER-A: L9581 → fluxo POST /api/ofs (criar OF novo)
    - CALLER-B: L9802 → fluxo salvar OF com passagens_maquina array no body
    - CALLER-C: L9969 → fluxo marcar como concluída / passar etapa
    - CALLER-D: L10487 → fluxo PATCH parcial OF (update status/data)
    - CALLER-E: L10830 → fluxo POST /ofs rápido (salvarOfRapida)
- Também: em **_upsertPassagemMaquinaRegistro L11679 antes do UPDATE** e **L11731 antes do INSERT** adicionar mais um par de logs [PASSAGENS-MAQUINA][BEFORE-UPDATE] e [PASSAGENS-MAQUINA][BEFORE-INSERT] com o payload compacto. Assim, quando user fizer um teste ao vivo de passar OF pela máquina, veremos QUAL caller chega (A–E) e se chegou na função. Sem isso, é impossível depurar, como o próprio user disse "já tentamos corrigir sem log várias vezes e sempre voltou quebrado".

### Arquivos para alterar
- `index.html`: Sub-item 2.1 (null-check abrirModalFornecedor).
- `patch.js`: Sub-item 2.2 (__amostrasPendentesGlobalFallback aprimorado), 2.3 (wrapper ofmaqConfirmarSemPapelão add logs + refresh DOM badge).
- `server.js`: Sub-item 2.4 → 6 CALLERS (A–E): adicionar logs antes do try + catch, e BEFORE-UPDATE/BEFORE-INSERT na função principal.

### Implementation Steps
1. Index.html L28943-L28954: trocar todas 11 linhas de `getElementById(id).value = X;` → `(document.getElementById('id') || {}).value = X;`.
2. Patch.js Sub-item 2.2:
   - L61544 `__amostrasTentarNovamenteFn`: no começo adicionar `if (s1) { try { delete s1._amostrasLoaded; delete s1._amostrasLastData; delete s1._amostrasLastRender; delete s1._amostrasLastSemana; } catch(_){} }` e no final da função console.log.
   - L61595 varrerCorrigir btnHtml: após setar innerHTML novo, disparar setTimeout click automático 300ms 1 vez.
   - Adicionar 2 triggers: (a) no hook salvarOfRapida after (ou onde tiver evento OF salvo disparar `__amostrasTentarNovamente`), (b) hashchange listener para `#ofs`, `#of-por-maquina`, `#pcp` → 5s delay disparar `__amostrasTentarNovamente`.
3. Patch.js Sub-item 2.3: L5159-5161 wrapper ofmaqConfirmarSemPapelao: adicionar console.log início + console.log fim + refresh badges DOM após sucesso.
4. Server.js Sub-item 2.4: Ler as 5 posições de CALLERS (L9581, L9802, L9969, L10487, L10830). Em CADA UMA: antes do bloco `try` que envolve `await _upsertPassagemMaquinaRegistro`, inserir log caller. No `catch` do mesmo bloco, inserir log erro caller.
   - No `_upsertPassagemMaquinaRegistro`: L11679 (antes UPDATE) → `console.log('[PASSAGENS-MAQUINA][BEFORE-UPDATE] of_id=... existente.id=... cols='+Object.keys(toUpdate).join(','));`
   - L11731 (antes INSERT) → `console.log('[PASSAGENS-MAQUINA][BEFORE-INSERT] of_id=... cols='+Object.keys(toInsert).join(','));`

### Validation (User vai precisar testar AO VIVO o CALLER)
- Syntax 3x node --check exit 0.
- Diff esperado: 80-180 linhas, 3 arquivos.
- /api/version bate, smoke endpoints passam, console 0 TypeError.
- **VALIDAÇÃO AO VIVO OBRIGATÓRIA QUE USUÁRIO PRECISA FAZER**: Abrir qualquer tela OF, passar uma OF pela máquina (qualquer etapa). ABRIR console DevTools, copiar TODO o output de [PASSAGENS-MAQUINA] que aparecer, colar para nós. Precisamos ver se pelo menos 1 [CALLER-X] aparece antes de [ENTRY]. Se nenhum CALLER-X aparecer → problema é ANTES da rota de salvar OF; se CALLER aparecer mas [ENTRY] NÃO → erro no código entre caller e a função; se [ENTRY], [BEFORE-INSERT/UPDATE] aparecerem mas nenhuma linha nova no banco → FK/constraint violada no insert. Log completo é o único caminho — o próprio user reconheceu isso na mensagem.

### Risks
- Sub-item 2.4: 6 callers inseridos logs. Se algum log for muito grande (payload muito longo) → poluir terminal Railway. Mitigar: limitar preview JSON com `.slice(0,500)` ou Object.keys.
- Sub-item 2.3 Sem Papelão: Se o wrapper original não tem acesso à variável `of` no escopo, o log fica vazio. Mitigar: pegar do DOM (card-of id, etc).

---

## 3. ENTREGA 434107 — Clientes / Mapa de Clientes

### Research
- **renderMapaClientes** em [patch.js:L13308-L13386](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L13308-L13386): ATUALMENTE só mostra **3 cards** (Estados / Cidades / Ramos de Atividade — cadastros auxiliares, sem cliente nenhum!). Não há nada de mapa de clientes geográfico ou lista de clientes ali. O nome da tela é enganoso.
- **Tela Clientes "normal"** está em outra página `#page-clientes` (não lida no research). O Mapa Clientes é outra tela.
- Bug cidade não sincroniza: Formulário cliente nativo + _p11InputToSelect (L13388) transforma input cidade em select e filtra por Estado. Se o cliente já tiver cidade pré-carregada mas o Estado select não for acertado ORDEM, o select da cidade não vai ter a opção e o valor some.
- Bug "Mapa abre formulário mas não salva": se a intenção do user é que o Mapa tenha também um botão ＋ Novo Cliente (igual a tela Clientes), preciso adicionar o botão no header de Mapa, que abre o modal nativo de cliente, e o submit do modal precisa salvar (igual tela Clientes).
- Bug edição difícil: botão editar no cli-card é pequeno, talvez adicionar em todo card top-right um ícone ✏ maior e mais visível.

### Arquivos para alterar
- `patch.js`: renderMapaClientes e _p11FillUfOptions/_p11InputToSelect helpers.
- `index.html`: se o formulário cliente e submit estão no index.html, ajustar o carregamento inicial dos valores cidade-UF (ordem de carregamento).

### Implementation Steps
1. **Sincronia cidade/estado**:
   - Patch.js L13388+: encontrar o trecho que troca input→select de cidade e preenche options. Atualmente o preenchimento pode acontecer antes do valor ter sido setado no select. **Ajuste**: depois do `sel.value = val;` L13407, se sel.selectedIndex === -1 (ou seja, o valor não consta nas options porque as options não foram carregadas), **adicionar uma option temporária** para a cidade atual:
     ```
     if (sel.selectedIndex === -1 && val) {
       var opt0 = document.createElement('option');
       opt0.value = val; opt0.textContent = (window.escH?window.escH(val):val.replace(/</g,'&lt;')) + ' (carregando...)';
       sel.insertBefore(opt0, sel.firstChild); sel.value = val;
       // e agendar populate real options UMA VEZ após 300ms e 1500ms
       setTimeout(function(){ _p11FillCidadeOptionsPorEstado(sel); }, 300); setTimeout(function(){ _p11FillCidadeOptionsPorEstado(sel); }, 1500);
     }
     ```
   - Criar helper `_p11FillCidadeOptionsPorEstado(selectCidade)`: lê o Estado selecionado no momento, recarrega cidades do estado, adiciona options, e preserva o valor anterior se possível. Se o estado for vazio, carrega todas as cidades.
2. **Adicionar cliente direto no Mapa**:
   - Patch.js renderMapaClientes L13339 toolbar: entre `<div style="display:flex;gap:8px;flex-wrap:wrap">` e o botão Voltar, adicionar `<button class="pep-btn primary" id="p11-novo-cliente">＋ Novo Cliente</button>`.
   - No bind (L13374), pegar o botão `p11-novo-cliente` e onclick → chamar a função `abrirModalCliente()` ou equivalente que a tela Clientes usa (precisar grep function abrirModalCliente). Se não existir função dedicada, chamar a mesma do go('clientes') + disparar clique no botão de novo cliente da página Clientes.
3. **Edição dados cliente facilitada**:
   - Encontrar a função `renderClientes()` no index.html (semelhante a renderFornecedores L28831). Aumentar tamanho e destaque do botão editar, e talvez adicionar também `onclick="event.stopPropagation(); editarCliente('{id}')"` no ÍCONE ✏ do top-right do card, separado do clique geral do card que abre detalhes.
   - No carregamento do modal editar cliente: garantir que cidade/estado sejam populados na ORDEM correta: primeiro popular o select de UF com a opção do cliente, disparar change, DEPOIS popular o select de cidade com a opção correspondente.

### Validation
- Syntax 3x node --check.
- Diff esperado: 50-150 linhas.
- UI manual: Tela Clientes → abrir cliente existente que tem cidade/UF → cidade aparece corretamente (não some). Mapa de Clientes → botão ＋ Novo Cliente no topo abre modal → preencher, salvar → cliente aparece. Cliente cards: botão editar mais visível funciona.

### Risks
- Função abrirModalCliente não existe e tem nome diferente (ex: abrirCliente). Mitigar: grep antes de implementar.
- Populate cidade select tem dependência de loadCidades() async. Garantir que aguarda 300ms 1500ms se cache ainda não hidratado.

---

## 4. ENTREGA 434108 — Compra de Papelão (CRÍTICO, USER: "nenhuma compra salva desde CMP-005")

### Research
- Frontend save click em [patch.js:L8442-L8464](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L8442-L8464): coleta payload → `_compraPapelaoApi('/api/compras-chapas', POST, payload)` → catch mostra toast com erro.
- Backend POST handler [server.js:L26815-L26853](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L26815-L26853):
  - Chama `_comprasChapasProximoNumero(empId)` → consulta maior `numero_compra` na tabela e retorna max+1. Como user só tem 5 compras (CMP-001 … CMP-005), próximo é 6.
  - `_comprasChapasBuildHeaderPayload` deleta id, itens, datas; preenche fornecedor, numero_compra, emp_id, empresa_id, criado_em, atualizado_em.
  - `_comprasChapasInsertCompat('compras_chapas', [headerPayload], '*')` [server.js:L26286-L26308](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L26286-L26308): insere em loop 16x, a cada erro "column does not exist" deleta a coluna do payload e tenta de novo. Se 16x falhar retorna `{data:null, error}`.
  - Se header inserido, processa itens em `_comprasChapasBuildItemPayload` [server.js:L26378+](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L26378-L26399): deleta colunas derivadas (areaM2, valorTotal, vlPMil, ...), calcula areaM2Calc, valorTotalCalc a partir de largura/comprimento/quantidade/valor_m2.
  - Se item tem erro → rollback deleta header.
- **PROBLEMA PRINCIPAL RESEARCH**: NÃO HÁ **NENHUM** console.log em nenhum ponto do fluxo POST /api/compras-chapas. O único log é no CATCH L26850, mas se o erro acontece no meio do try e é tratado silenciosamente, não sabemos.
- **HIPÓTESES NÃO ASSUMIDAS, SERÃO LOGADAS**:
  H1: `_comprasChapasBuildHeaderPayload` deleta alguma coluna NOT NULL obrigatória (errado), insert retorna NOT NULL violation, InsertCompat não trata esse erro (só trata "column does not exist"), loop 16x acaba → data:null, error: "Falha ao inserir em compras_chapas" — e cai return 500.
  H2: `_comprasChapasProximoNumero` retorna 6, mas alguma compra tem numero_compra NULL ou 0 → reduce undefined.
  H3: `_comprasChapasInsertCompat` está caindo em erro de **outro tipo** sem ser column does not exist (ex: foreign key violada, tipo de dado incorreto para `numero_compra` = integer vs text) → retorna erro e não loga.
  H4: `buildHeaderPayload` não coloca `data_compra` obrigatória, o banco exige NOT NULL e sem default.

### Implementation Steps (CRÍTICO primeiro não-salva, DEPOIS os 3 secundários)
1. **ITEM #1 CRÍTICO: LOGS PARA DESCOBRIR CAUSA NÃO-SALVA**
   Server.js:
   - `_comprasChapasInsertCompat` [server.js:L26286-L26308] → adicionar:
     - a) No início da função: `console.log('[COMPRA-PAPELAO][INSERT-COMPAT][INÍCIO] tabela='+table+' rows='+payloadRows.length+' cols[0]=' + JSON.stringify(Object.keys(payloadRows[0]||{})));`
     - b) No LOOP, a cada iteração i, se `out?.error`: `console.warn('[COMPRA-PAPELAO][INSERT-COMPAT][TENTATIVA-'+i+'] ERRO BRUTO: msg='+String(msg).slice(0,1500)+' col_match='+col+' cols_restantes='+JSON.stringify(Object.keys(payloadRows[0]||{})));`
     - c) Ao FINAL, se sucesso (return out sem error): `console.log('[COMPRA-PAPELAO][INSERT-COMPAT][SUCESSO] tabela='+table+' inserted_ids='+JSON.stringify((Array.isArray(out.data)?out.data.map(r=>r&&r.id):out.data&&out.data.id)).slice(0,500));`
     - d) Ao FINAL, se falhou (16x falhou, return data null): `console.error('[COMPRA-PAPELAO][INSERT-COMPAT][FALHA FINAL] tabela='+table+' msg_final='+String(((out && out.error) || '').message || (out && out.error) || 'desconhecido').slice(0, 2000));`
   - `_comprasChapasBuildHeaderPayload` [server.js:L26350-L26376]: adicionar console.log INÍCIO/FIM com os keys do objeto de saída e o numero_compra formatado.
   - POST /api/compras-chapas [L26815-L26853] (handler): adicionar:
     - INÍCIO (antes do try dentro do try): `console.log('[COMPRA-PAPELAO][POST][REQUEST] emp_id='+empId+' fornecedor='+String(body.fornecedor||'')+' itens='+Array.isArray(body.itens)?body.itens.length:0+' pasta_id='+String(pastaId||'')+' payload_header_keys='+JSON.stringify(Object.keys(headerPayload)).slice(0, 800));`
     - APÓS `insHeader` L26835: log `[COMPRA-PAPELAO][POST][HEADER-INSERTED] ins.error = ${insHeader?.error} compraCriada.id = ${compraCriada?.id} numero = ${compraCriada?.numero_compra}`.
     - APÓS inserir itens L26841: log `[COMPRA-PAPELAO][POST][ITENS-INSERTED] count=${itensPayload.length} error=${insItens?.error}`.
     - CATCH L26850 original: **MELHORAR** o log para ERROR com stack trace completo e body preview:
       ```
       _comprasChapasLog('POST /api/compras-chapas', e);
       console.error('[COMPRA-PAPELAO][POST][ERRO-FINAL-CAPTURA]', e);
       console.error('[COMPRA-PAPELAO][POST][ULTIMO-ERRO-JSON]', JSON.stringify({ message: e?.message, code: e?.code, hint: e?.hint, details: e?.details, stack: (e?.stack||'').slice(0,3000), headerPayload_keys: Object.keys(headerPayload||{}), numeroCompra }));
       ```
   - Também, se após `_comprasChapasInsertCompat('compras_chapas', [headerPayload], '*')` → `if (insHeader.error)` NÃO tem logs detalhados do erro além do return 500. Adicionar um `console.error` ANTES do return 500 com o full erro do insert (msg, code, hint, details, constraint).
   - **APLICAR EXATAMENTE a mesma lógica de logs** em `_comprasChapasUpdateCompat` (para PUT, que o user também vai precisar quando editar).

2. **ITEM #2: Impressão mais profissional**
   - Função `_compraPapelaoBuildCompraPrintHtmlFromPayload` em patch.js (linha após L8433). Melhorar:
     a) Adicionar `<div class="ccpx-print-header">` com logo placeholder (ITALY EMBALAGENS / CARTOESTE / OESTEPACK dependendo de empresa), data da compra, código CMP.
     b) Adicionar seção Dados da Compra (topo): Fornecedor, Pedido Fornecedor, Pasta, Observação.
     c) Tabela de itens completa (todas as colunas do formulário, não só 4).
     d) Totalizador R$ consolidado (soma valor total dos itens).
     e) Rodapé: "Impresso em {agora} · Usuário: {nome usuário}" se CURRENT_USER disponível.
   - Usar variáveis de estilo globais `_buildStyledPrintHtml` e `_openStyledPrintWindow`.

3. **ITEM #3: Mais de 4 vincos, formato compacto "9/9/9/9" quando iguais**
   - Encontrar onde os vincos são renderizados tanto no formulário quanto na impressão (lógica no patch.js `_compraPapelaoOpenCompraModal` L8400). A variável de vincos geralmente é `vincos` (array de números, ou v1,v2,v3,v4 separados).
   - Lógica: se array `vincos` tem comprimento >=2 E todos os elementos são iguais (comparar Number() e NaN seguro), mostrar `${valor}/…repetição/${valor}` ou formato `${vincos[0]}/…/${vincos[0]}` de acordo com quantidade. Ex: 4 vincos todos 9 → `9/9/9/9`.
   - O formulário de adicionar item deve aceitar **campos extras de vinco dinamicamente**: quando user chegar no 4º vinco e preencher, aparecer 5º, 6º etc, com máximo de 10 vincos.

4. **ITEM #4: Editar compra salva → reabrir com todos os dados preenchidos**
   - Abrir modal de compra: `window._compraPapelaoOpenCompraModal(compraId, compra)` existe. Quando `compraId` é fornecido (edição), ele recebe o objeto `compra` do GET /api/compras-chapas/:id.
   - Garantir que **todos os campos** do formulário são preenchidos: fornecedor select, pedido_fornecedor input, data_compra input, pasta select, observação textarea.
   - Garantir que **cada item** da lista compra.itens é renderizado na tabela de itens com TODOS os seus campos (largura, comprimento, quantidade, gramatura, tipo, impressão, vincos dinâmicos 1..N, ped_cliente, pedido, valor_m2, area_m2 manual, valor_total manual, etc).
   - Verificar se o botão save em modo edição chama PUT corretamente.

### Validation
- Syntax 3x node --check.
- Diff esperado: 250-600 linhas (todos os logs + impr + vincos + editar). Se >800, parar e checar com user.
- **DEPLOY + TAREFA AO VIVO DO USUÁRIO**: Após deploy Railway, usuário precisa ABRIR tela Compras de Papelão, preencher uma compra de teste e clicar em Salvar. Copiar TODO o console [COMPRA-PAPELAO] do Railway (server logs) e trazer para análise. Apenas 1 compra de teste, não precisa salvar real de cliente.
- Depois que os logs revelarem a causa do não-salva (H1-H4), **podemos lançar um hotfix IMEDIATO no mesmo deploy ou no próximo, dependendo da gravidade**. O importante é primeiro identificar a causa com os logs.
- Impr: abrir e verificar que PDF/impressão tem todas as seções.
- Vincos: adicionar item com 5 vincos todos = 5mm → aparece 5/5/5/5/5 na tabela e na impressão.
- Editar: reabrir a compra CMP-005 (última gravada) → todos os dados aparecem preenchidos.

### Risks
- Item #1 (CRÍTICO): Se depois de ler os logs descobrir que causa é coluna NOT NULL faltante `data_compra` ou `numero_compra TEXT vs INT`, há duas opções: (a) lançar ALTER TABLE via SQL Editor user (se DDL) ou (b) ajustar buildHeaderPayload para adicionar a coluna. Deixar preparado ambos os caminhos.
- Vincos dinâmicos: Se a estrutura de dados atual dos itens espera sempre só v1-v4 (fixos), adicionar v5+ pode quebrar leituras em outros lugares. Mitigar: ao renderizar itens salvos, ler tanto v1..v4 quanto array vincos[] (se existir).

---

## 5. ENTREGA 434109 — Orçamentos

### Research
- **Sub-item 5.1 Parâmetros Comerciais recalcular em tempo real**: Patch `__paramComerciaisRecalcGarantido` [patch.js:L61607-L61643](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/patch.js#L61607-L61643) **JÁ EXISTE** e usa selector:
  ```
  '#calc-cm,#calc-cf,#calc-mg,#calc-cv,#calc-imp,#calc-vkm,#calc-km,#calc-vb,#calc-vc,#calc-vbc,#calc-vb2,.param-input,[data-calc-field="cm"],[data-calc-field="cf"],[data-calc-field="mg"],[data-calc-field="cvend"],[data-calc-field="imp"],[data-calc-field="vkm"],[data-calc-field="km"]'
  ```
- Problema: selector pode estar FALTANDO campos. Os parâmetros comerciais típicos em calculadora orçamento:
  - Comissão vendedor (%) (calc-cv / calc-cvend): OK está
  - CM (%) custo material: OK
  - CF (%) custo fixo: OK
  - MG (%) margem: OK
  - Impostos (%): OK (#calc-imp)
  - Valor frete $/km (#calc-vkm) / Distância km (#calc-km): OK
  - Valor boca / valor caixa / valor base (#calc-vb, #calc-vc, #calc-vbc, #calc-vb2): OK
  - **MAS PODEM FALTAR**: selectores `#calc-comissao`, `#calc-desconto`, `.parametro-comercial input`, `.parametro-comercial select`, `[name*="comissao"]`, `[name*="desconto"]`, `[name*="icms"]`, `#calc-frete`, `#calc-valor-frete`, `.orc-calc-param input`, `.calc-row input`, `#calc-chapa-utilizada` (mudou chapa → afeta custo → afeta valor venda), `#calc-quant` (mudou quantidade → afeta valor unitário/total).
- Estratégia: **EXPANDIR o selector L61620 para incluir todos esses campos**. E também adicionar evento `blur` (quando user sair do campo, dispara recalc garantido 1 vez).

- **Sub-item 5.2 Troca de pasta persiste ao salvar**:
  - Já existe patch `patchApiOrcamentoNome` [server.js:L11119-L11193](file:///C:/Users/Usuario/PCP%20PROGRAMA/ITALYEMBALAGENS/server.js#L11119-L11193) que injeta `pasta_id` no POST/PUT orçamentos. L11173-L11190: lê valor de `document.getElementById('calc-pasta').value`, senão pega de `currentOrcamentoFromState()`, senão pega do `filtroAtual`. Injeta `payload.pasta_id = pastaValor; payload.pastaId = pastaValor;`.
  - Problema provável: Ao **ALTERAR** o select #calc-pasta dentro do modal calculadora e depois SALVAR, o valor do `filtroAtual` / `__orcPastaFiltro` GLOBAL pode estar sobrescrevendo o valor real do select L11187 `if(!pastaValor){ try filtro }`. ou seja: se user está navegando com filtro "Pasta X" e cria orçamento, mesmo que ele troque a pasta do orçamento para "Y" no select, ao salvar, o código L11183-11185 redefine "Y" voltando para X do filtro global → problema.
  - **Fix L11173-L11191**: a ordem de precedência deve ser: (1) `body.pasta_id / body.pastaId` (mais forte, user mandou explicitamente), (2) `calc-pasta.value` (selecionado no UI do modal na hora), (3) `currentOrcamentoFromState()` (orçamento existente), (4) e **SÓ DEPOIS** o filtro global de tela. Atualmente, L11173-11191 lê (2) primeiro, depois (3), depois (4) — e **nunca usa (1)**. O problema é que se `pastaValor` final vazio, ele usa filtro global. MAS o pior bug é: **se o select do modal trocou de valor para Y e filtro global é X, qual vale? Y. O código atual está CERTO nesse ponto**. Mas existe outro: **antes do patchApiOrcamentoNome, o código nativo (original) já pode enviar payload.pasta_id com X**. Quando o patch recebe o valor e passa para payload, ele assinala, mas se o select do modal não estava com value setado ou o select é limpo em algum re-render, a leitura vazio + filtro sobrescreve.
  - **Ação corretiva**: Além do patch no server API, adicionar **também no FRONTEND**, no submit do salvar orçamento (ou no patch que coleta os dados do modal), **uma leitura EXPLÍCITA do document.getElementById('calc-pasta').value E SETA DIRETAMENTE no body antes de enviar para api**. Assim, mesmo se o código nativo do frontend não setar, o frontend do patch garante que o valor do select vai junto → chegando no backend, body.pasta_id já tem valor → L11174 já terá valor não vazio → L11187 não aciona fallback filtro global.

### Implementation Steps
1. **5.1 Recalcular Parâmetros Comerciais tempo real**:
   - Patch.js L61620 selector `sel`: expandir para:
     `',#calc-comissao,#calc-desconto,#calc-icms,#calc-pis,#calc-cofins,#calc-frete,.parametro-comercial input,.parametro-comercial select,.orc-calc-param input,.calc-row input,.calc-row select,#calc-chapa-utilizada,#calc-quant,#calc-quantidade,#calc-data-validade,[name*="comissao"],[name*="desconto"],[name*="icms"],[name*="pis"],[name*="cofins"],[name*="frete"],[name*="margem"],[name*="custo"],[name*="valor_venda"],[name*="venda"]'`
   - Adicionar também o listener de `blur` (força recalc ao sair, garante que pega último valor): document.addEventListener('blur', fn, true); (mesmo pattern do input/change).

2. **5.2 Troca de pasta persiste ao salvar (FRONTEND reforço)**:
   - Patch.js: encontrar função `salvarOrcamento` ou equivalente (função que coleta dados do modal e envia POST/PUT via api()). Ou, se não tivermos certeza, adicionar **NOVO PATCH** no topo: monkeypatch a função `window.api` (ou função salvar orçamento) para quando método === POST/PUT E url começa `/orcamentos` → ANTES do originalApi call, **forçar leitura do `#calc-pasta.value` e escrever explicitamente em body.pasta_id e body.pastaId se body for objeto**. Dessa forma, o valor do select vai sempre no payload → backend patchApiOrcamentoNome tem o body.pasta_id preenchido → não cai fallback filtro global.

### Validation
- Syntax 3x node --check.
- Diff esperado: 30-80 linhas.
- UI 5.1 manual: Abrir Calculadora Orçamento → alterar qualquer parâmetro (CM, CF, MG, CV, Impostos, KM, $/km, Comissão, Desconto, ICMS, Frete, quantidade, chapa utilizada) → imediatamente o Valor Total / Valor Unitário recalcula sem precisar clicar em botão "Calcular".
- UI 5.2 manual: No filtro de pastas da tela Orçamentos, selecionar "Pasta A". → abrir orçamento existente, dentro do modal trocar o select da pasta para "Pasta B" → Salvar. → recarregar lista → confirmar que orçamento aparece em Pasta B (não voltou para Pasta A). Novo orçamento: filtro global em "Pasta X", dentro modal trocar para "Pasta Y" → salvar → novo orçamento está em Pasta Y (correto).

### Risks
- Sub-item 5.1 selector muito amplo (qualquer input .calc-row) pode causar recalc excessivo (muitos re-renders). Mitigar: manter debounce 120ms igual o original (L61625 `clearTimeout + setTimeout 120`). Não deve travar.
- Sub-item 5.2: Dobrar patches de api() se já houver 2 patches anteriores (patchApiOrcamentoNome já monkey patch window.api). Cuidado com recursão infinita. Forma correta: pegar a window.api atual que já é o patchApiOrcamentoNome patched, e monkey patchar de novo, ou adicionar a leitura pasta DENTRO do patchApiOrcamentoNome ANTES do payload ser montado. **Melhor opção**: editarmos diretamente dentro do patchApiOrcamentoNome que já existe. Na L11172, depois de `payload = Object.assign({}, body);` e ANTES de ler calc-pasta (L11173), primeiro FAZER:
  ```
  var pastaValorFromBody = String(payload.pasta_id || payload.pastaId || '').trim();
  if (!pastaValorFromBody) {
    // só então ler do DOM e setar no payload
    // ...restante do código original
  }
  ```
  Isso preserva precedência: body → DOM → state → filtro.

---

## Resumo Ordem Commits

| Ordem | ID commit | Timestamp 5 bumps | Área |
|-------|-----------|-------------------|------|
| 1 | 434105 | 20260915434105 | Fornecedores: categoria + filtro |
| 2 | 434106 | 20260915434106 | OFs por Máquina: 4 itens (TypeError null / Amostras trav / Sem Papelão logs / **[PASSAGENS-MAQUINA] 5 callers obrigatórios**) |
| 3 | 434107 | 20260915434107 | Clientes / Mapa Cli: sincronia cidade · Add novo cli direto · botão editar grande |
| 4 | 434108 | 20260915434108 | **COMPRA PAPELÃO CRÍTICO**: logs insert (para descobrir não-salva) + impr + vincos>4 (9/9/9/9) + editar carrega dados |
| 5 | 434109 | 20260915434109 | Orçamentos: params comerciais recalc tempo real + troca pasta persistir salvar |
