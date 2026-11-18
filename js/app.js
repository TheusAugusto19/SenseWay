// =============================================================
// app.js — todo o JavaScript do SenseWay
//   1. Dados: única porta de entrada (mock em JSON ou API real)
//   2. Ajudantes de tela
//   3. Cabeçalho e rodapé (iguais em todas as telas)
//   4. Telas: cada HTML diz qual é em <body data-pagina="...">
//
// Segurança: tudo no navegador pode ser visto pelo F12. Senha nunca
// é guardada nem conferida aqui (quem confere é o back-end) e todo
// texto do banco só vira HTML passando por esc() ou textContent (XSS).
// =============================================================

const CONFIG = {
  modo: 'mock', // troque para 'api' quando o back-end existir
  urlApi: 'http://localhost:3000/api'
};

const RAIZ = new URL('../', import.meta.url);
const MOCK = CONFIG.modo === 'mock';
const CHAVE_MEMORIA = 'senseway-mock';
const IMAGEM_PADRAO = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#ece9f5"/>' +
  '<g fill="none" stroke="#a294c9" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="140" y="105" width="120" height="90" rx="10"/><circle cx="172" cy="135" r="10"/>' +
  '<polyline points="140 180 185 145 215 170 235 155 260 175"/></g></svg>'
);

const rota = (caminho) => new URL(caminho, RAIZ).href;
const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

// =============================================================
// 1. DADOS
// Modo 'mock': lê data/banco.json e guarda as alterações na
// sessionStorage (somem ao fechar a aba). Modo 'api': back-end real.
// =============================================================

let bancoCarregado;
async function banco() {
  bancoCarregado ??= fetch(rota('data/banco.json')).then((resposta) => {
    if (!resposta.ok) throw new Error('Não foi possível carregar os dados.');
    return resposta.json();
  });
  return structuredClone(await bancoCarregado);
}

async function chamarApi(caminho, { metodo = 'GET', corpo } = {}) {
  const resposta = await fetch(CONFIG.urlApi + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.mensagem || `Erro ${resposta.status}.`);
  }
  return resposta.status === 204 ? null : resposta.json();
}

function memoria() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_MEMORIA)) || {};
  } catch {
    return {};
  }
}

function alterarMemoria(alteracao) {
  const m = memoria();
  alteracao(m);
  try {
    sessionStorage.setItem(CHAVE_MEMORIA, JSON.stringify(m));
  } catch {
    // navegador bloqueou o armazenamento: o mock segue sem memória
  }
}

const proximoId = (lista) => lista.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
const agoraIso = () => new Date().toISOString().slice(0, 19);

function exigir(valor, mensagem) {
  if (!valor || !String(valor).trim()) throw new Error(mensagem);
}

// Junta os registros do JSON com os criados/editados na sessão
async function todosLocais() {
  const alterados = memoria().locais || [];
  const locais = (await banco()).locais.map((l) => alterados.find((a) => a.id === l.id) || l);
  alterados.forEach((a) => { if (!locais.some((l) => l.id === a.id)) locais.push(a); });
  return locais;
}

// ---------- Locais ----------
async function listarLocais() {
  if (!MOCK) return chamarApi('/locais');
  return (await todosLocais()).filter((l) => l.publicado);
}

async function buscarLocal(id) {
  if (!MOCK) return chamarApi(`/locais/${encodeURIComponent(id)}`);
  const local = (await todosLocais()).find((l) => l.id === Number(id));
  if (!local) throw new Error('Local não encontrado.');
  return local;
}

// ---------- Sessão e perfil do usuário ----------
async function login(email, senha) {
  exigir(email, 'Informe o e-mail.');
  exigir(senha, 'Informe a senha.');
  if (!MOCK) return chamarApi('/auth/login', { metodo: 'POST', corpo: { email, senha } });
  // Mock aceita qualquer login. No back-end, a senha é conferida com hash.
  alterarMemoria((m) => { m.sessao = { tipo: 'usuario' }; });
  return buscarUsuario();
}

async function cadastrarUsuario({ confirmarSenha, ...dados }) {
  exigir(dados.nome, 'Informe o nome.');
  if (dados.senha !== confirmarSenha) throw new Error('As senhas não conferem.');
  if (!MOCK) return chamarApi('/usuarios', { metodo: 'POST', corpo: dados });
  const { senha, ...perfil } = dados; // a senha nunca é guardada no navegador
  alterarMemoria((m) => {
    m.usuario = { ...m.usuario, ...perfil, tutor: perfil.tutor === 'sim' };
    m.sessao = { tipo: 'usuario' };
  });
  return buscarUsuario();
}

async function redefinirSenha({ email, novaSenha, confirmarSenha }) {
  exigir(email, 'Informe o e-mail.');
  if (novaSenha !== confirmarSenha) throw new Error('As senhas não conferem.');
  if (!MOCK) return chamarApi('/auth/nova-senha', { metodo: 'POST', corpo: { email, novaSenha } });
  return { ok: true };
}

async function sair() {
  if (!MOCK) return chamarApi('/auth/logout', { metodo: 'POST' });
  alterarMemoria((m) => { delete m.sessao; });
}

async function buscarUsuario() {
  if (!MOCK) return chamarApi('/usuarios/me');
  return { ...(await banco()).usuario, ...memoria().usuario };
}

async function atualizarUsuario(dados) {
  exigir(dados.nome, 'Informe o nome.');
  const corpo = { ...dados, tutor: dados.tutor === 'sim' };
  if (!MOCK) return chamarApi('/usuarios/me', { metodo: 'PUT', corpo });
  alterarMemoria((m) => { m.usuario = { ...m.usuario, ...corpo }; });
}

async function adicionarTutelado(nome) {
  exigir(nome, 'Informe o nome do tutelado.');
  if (!MOCK) return chamarApi('/usuarios/me/tutelados', { metodo: 'POST', corpo: { nome } });
  const tutelados = (await buscarUsuario()).tutelados || [];
  const novo = { id: proximoId(tutelados), nome: nome.trim(), preferencias: {} };
  alterarMemoria((m) => { m.usuario = { ...m.usuario, tutor: true, tutelados: [...tutelados, novo] }; });
  return novo;
}

// ---------- Questionário (tuteladoId vazio = o próprio usuário) ----------
async function listarPerguntas() {
  if (!MOCK) return chamarApi('/questionario');
  return (await banco()).questionario;
}

async function salvarQuestionario(respostas, tuteladoId) {
  if (!MOCK) {
    const caminho = tuteladoId
      ? `/usuarios/me/tutelados/${encodeURIComponent(tuteladoId)}/preferencias`
      : '/usuarios/me/preferencias';
    return chamarApi(caminho, { metodo: 'PUT', corpo: respostas });
  }
  const usuario = await buscarUsuario();
  alterarMemoria((m) => {
    m.usuario = tuteladoId
      ? { ...m.usuario, tutelados: (usuario.tutelados || []).map((t) => (t.id === Number(tuteladoId) ? { ...t, preferencias: respostas } : t)) }
      : { ...m.usuario, preferencias: respostas };
  });
}

// ---------- Favoritos ----------
async function listarIdsFavoritos() {
  if (!MOCK) return chamarApi('/usuarios/me/favoritos/ids');
  return memoria().favoritos || (await banco()).favoritos;
}

async function listarLocaisFavoritos() {
  if (!MOCK) return chamarApi('/usuarios/me/favoritos');
  const [ids, locais] = await Promise.all([listarIdsFavoritos(), listarLocais()]);
  return locais.filter((l) => ids.includes(l.id));
}

// Liga/desliga o favorito. Devolve true se ficou favoritado.
async function alternarFavorito(localId) {
  const id = Number(localId);
  if (!MOCK) return (await chamarApi(`/usuarios/me/favoritos/${id}`, { metodo: 'POST' })).favorito;
  const ids = await listarIdsFavoritos();
  const favoritado = !ids.includes(id);
  alterarMemoria((m) => { m.favoritos = favoritado ? [...ids, id] : ids.filter((i) => i !== id); });
  return favoritado;
}

// ---------- Avaliações e mensagens do usuário ----------
async function listarAvaliacoes() {
  if (!MOCK) return chamarApi('/usuarios/me/avaliacoes');
  return [...(memoria().avaliacoes || []), ...(await banco()).avaliacoes];
}

async function enviarAvaliacao(dados) {
  if (!dados.localId) throw new Error('Escolha o local.');
  exigir(dados.experiencia, 'Conte como foi a sua experiência.');
  if (!dados.nota) throw new Error('Escolha uma nota de 1 a 5.');
  const corpo = {
    localId: Number(dados.localId),
    nome: dados.nome,
    experiencia: dados.experiencia.trim(),
    acessivel: dados.acessivel === 'sim',
    muitoRuido: dados.muitoRuido === 'sim',
    nota: Number(dados.nota)
  };
  if (!MOCK) return chamarApi('/avaliacoes', { metodo: 'POST', corpo });
  const nova = { id: proximoId(await listarAvaliacoes()), usuarioId: 1, ...corpo, data: agoraIso().slice(0, 10) };
  alterarMemoria((m) => { m.avaliacoes = [nova, ...(m.avaliacoes || [])]; });
}

async function enviarMensagem(localId, texto) {
  exigir(texto, 'Escreva a sua mensagem.');
  const corpo = { localId: Number(localId), texto: texto.trim() };
  if (!MOCK) return chamarApi('/mensagens', { metodo: 'POST', corpo });
}

// ---------- Área da empresa ----------
async function loginEmpresa(email, senha) {
  exigir(email, 'Informe o e-mail.');
  exigir(senha, 'Informe a senha.');
  if (!MOCK) return chamarApi('/empresas/login', { metodo: 'POST', corpo: { email, senha } });
  alterarMemoria((m) => { m.sessao = { tipo: 'empresa' }; });
}

async function cadastrarEmpresa(dados) {
  exigir(dados.nome, 'Informe o nome do local.');
  if (!dados.senha || dados.senha.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
  if (!MOCK) return chamarApi('/empresas', { metodo: 'POST', corpo: dados });
  const { senha, ...perfil } = dados;
  alterarMemoria((m) => {
    m.empresa = { ...m.empresa, ...perfil };
    m.sessao = { tipo: 'empresa' };
  });
}

async function buscarEmpresa() {
  if (!MOCK) return chamarApi('/empresas/me');
  return { ...(await banco()).empresa, ...memoria().empresa };
}

async function listarLocaisDaEmpresa() {
  if (!MOCK) return chamarApi('/empresas/me/locais');
  const [empresa, locais] = await Promise.all([buscarEmpresa(), todosLocais()]);
  return locais.filter((l) => l.empresaId === empresa.id);
}

// Cria (sem id) ou atualiza (com id). A foto vai por FormData no back-end real.
async function salvarLocal(dados) {
  exigir(dados.nome, 'Informe o nome do local.');
  exigir(dados.descricao, 'Descreva o local.');
  const corpo = {
    nome: dados.nome.trim(),
    categoria: dados.categoria,
    cidade: dados.cidade,
    descricao: dados.descricao.trim(),
    resumo: dados.descricao.trim().slice(0, 140),
    recursos: dados.recursos || []
  };
  if (!MOCK) {
    return dados.id
      ? chamarApi(`/locais/${encodeURIComponent(dados.id)}`, { metodo: 'PUT', corpo })
      : chamarApi('/locais', { metodo: 'POST', corpo });
  }
  const [empresa, todos] = await Promise.all([buscarEmpresa(), todosLocais()]);
  const existente = todos.find((l) => l.id === Number(dados.id));
  const local = { ...(existente || { id: proximoId(todos), foto: null }), ...corpo, empresaId: empresa.id, publicado: true };
  alterarMemoria((m) => { m.locais = [...(m.locais || []).filter((l) => l.id !== local.id), local]; });
}

async function listarConversas() {
  if (!MOCK) return chamarApi('/empresas/me/conversas');
  const respostas = memoria().respostas || {};
  return (await banco()).conversas.map((c) => ({ ...c, mensagens: [...c.mensagens, ...(respostas[c.id] || [])] }));
}

async function responderConversa(conversaId, texto) {
  exigir(texto, 'Escreva a resposta.');
  if (!MOCK) {
    return chamarApi(`/conversas/${encodeURIComponent(conversaId)}/mensagens`, { metodo: 'POST', corpo: { texto } });
  }
  const mensagem = { autor: 'empresa', texto: texto.trim(), dataHora: agoraIso() };
  alterarMemoria((m) => {
    m.respostas ??= {};
    m.respostas[conversaId] = [...(m.respostas[conversaId] || []), mensagem];
  });
  return mensagem;
}

// =============================================================
// 2. AJUDANTES DE TELA
// =============================================================

const ICONES = {
  'seta-esquerda': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  'seta-direita': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  coracao: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  envelope: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
  mais: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  lapis: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  baloes: '<path d="M14 9a2 2 0 0 1-2 2H6l-3 3V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2z"/><path d="M18 9h1a2 2 0 0 1 2 2v10l-3-3h-6a2 2 0 0 1-2-2v-1"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  'check-circulo': '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><polyline points="22 4 12 14 9 11"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/>',
  olho: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  'olho-fechado': '<path d="M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2m-6.7-1.1a3 3 0 1 1-4.2-4.2"/><line x1="1" y1="1" x2="23" y2="23"/>',
  upload: '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.4 18.4A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 3 16.3"/>',
  busca: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.7" y2="16.7"/>',
  cadeado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  predio: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="8" y1="6" x2="8" y2="6"/><line x1="12" y1="6" x2="12" y2="6"/><line x1="16" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>',
  editar: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  lampada: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  usuario: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  traco: '<line x1="6" y1="12" x2="18" y2="12"/>'
};

const icone = (nome) =>
  `<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONES[nome] || ''}</svg>`;

function desenharIcones(raiz = document) {
  raiz.querySelectorAll('[data-icone]').forEach((el) => { el.innerHTML = icone(el.dataset.icone); });
}

// Escapa texto antes de virar HTML (proteção contra XSS). SEMPRE use com dados.
function esc(texto) {
  const trocas = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(texto ?? '').replace(/[&<>"']/g, (c) => trocas[c]);
}

const parametro = (nome) => new URLSearchParams(location.search).get(nome);
const ir = (pagina) => { location.href = pagina; };

function caminhoImagem(caminho) {
  if (!caminho) return IMAGEM_PADRAO;
  return /^(https?:|data:|blob:)/.test(caminho) ? caminho : rota(caminho);
}

const iniciais = (nome) =>
  String(nome || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

const formatarHora = (iso) => (iso ? iso.slice(11, 16) : '');
const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
const formatarDataCurta = (iso) => `${iso.slice(8, 10)} ${MESES[Number(iso.slice(5, 7)) - 1]}`;

const selos = (recursos) => recursos.map((r) => `<span class="selo">${esc(r)}</span>`).join('');

function mostrarMensagem(form, texto, tipo = 'erro') {
  const caixa = $('[data-mensagem]', form);
  if (!caixa) return;
  caixa.textContent = texto;
  caixa.className = `mensagem-form${texto ? ` mensagem-form--${tipo}` : ''}`;
}

// Liga um formulário: junta os campos em { name: valor } e mostra erros na tela
function aoEnviar(form, acao) {
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = $('[type="submit"]', form);
    if (botao) botao.disabled = true;
    mostrarMensagem(form, '');
    try {
      await acao(Object.fromEntries(new FormData(form)), form);
    } catch (erro) {
      mostrarMensagem(form, erro.message || 'Algo deu errado. Tente novamente.');
    } finally {
      if (botao) botao.disabled = false;
    }
  });
}

function marcarRadio(form, nome, valor) {
  const opcao = $(`input[name="${CSS.escape(nome)}"][value="${CSS.escape(valor)}"]`, form);
  if (opcao) opcao.checked = true;
}

// Botão de favorito (coração), com ou sem texto
function botaoFavorito(localId, favoritado, comTexto = false) {
  const rotulo = favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos';
  return comTexto
    ? `<button type="button" class="btn-pilula" data-favorito="${esc(localId)}" aria-pressed="${favoritado}">${icone('coracao')}<span>${favoritado ? 'Favorito salvo' : 'Salvar favorito'}</span></button>`
    : `<button type="button" class="btn-icone" data-favorito="${esc(localId)}" aria-pressed="${favoritado}" aria-label="${rotulo}" title="${rotulo}">${icone('coracao')}</button>`;
}

// Um único "ouvinte" para todos os corações dentro de `area`
function ligarFavoritos(area, aoMudar) {
  area.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-favorito]');
    if (!botao) return;
    const favoritado = await alternarFavorito(botao.dataset.favorito);
    const rotulo = favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos';
    botao.setAttribute('aria-pressed', String(favoritado));
    const texto = $('span', botao);
    if (texto) texto.textContent = favoritado ? 'Favorito salvo' : 'Salvar favorito';
    else { botao.setAttribute('aria-label', rotulo); botao.title = rotulo; }
    botao.classList.remove('batida');
    void botao.offsetWidth; // reinicia a animação do pulso
    botao.classList.add('batida');
    aoMudar?.(Number(botao.dataset.favorito), favoritado);
  });
}

// Várias telas na mesma página, trocadas pelo # do endereço (ex.: acesso.html#cadastro).
// Cada <div data-modo="..." data-titulo="..."> é uma tela; a primeira é a padrão.
function alternarModos(aoMudar) {
  const modos = [...document.querySelectorAll('[data-modo]')];
  const mostrar = (inicial) => {
    const hash = location.hash.slice(1);
    let ativo = hash ? modos.find((m) => m.dataset.modo === hash) : modos[0];
    if (!ativo && !inicial) return; // âncora que não é tela: mantém a atual
    ativo ||= modos[0];
    modos.forEach((m) => { m.hidden = m !== ativo; });
    document.title = `${ativo.dataset.titulo} | SenseWay`;
    if (ativo.dataset.nav) {
      document.querySelectorAll('[data-nav-link]').forEach((a) => {
        if (a.dataset.navLink === ativo.dataset.nav) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    }
    if (!inicial) {
      scrollTo(0, 0);
      revelador.reiniciar(ativo); // a tela nova entra com a mesma transição
    }
    aoMudar?.(ativo.dataset.modo);
  };
  addEventListener('hashchange', () => mostrar(false));
  mostrar(true);
}

// =============================================================
// 3. CABEÇALHO, RODAPÉ E COMPORTAMENTOS GERAIS
// <body data-area="publico|usuario|empresa|empresa-acesso" data-nav="...">
// =============================================================

function montarLayout() {
  const { area = 'publico', nav: atual } = document.body.dataset;
  const link = (href, texto, nav, extra = '') =>
    `<li><a href="${rota(href)}" data-nav-link="${nav}"${nav === atual ? ' aria-current="page"' : ''}${extra}><span>${texto}</span></a></li>`;

  // Botão "?" com o que cada item do menu faz (aparece ao passar o mouse ou tocar)
  const ajuda = (itens) => `<div class="ajuda">
    <button type="button" class="ajuda-botao" aria-label="O que tem em cada menu" aria-describedby="ajuda-balao">?</button>
    <div class="ajuda-balao" id="ajuda-balao" role="tooltip">
      <p class="ajuda-titulo">O que tem em cada menu</p>
      <dl>${itens.map(([nome, texto]) => `<dt>${nome}</dt><dd>${texto}</dd>`).join('')}</dl>
    </div>
  </div>`;

  const navs = {
    usuario: `<div class="cabecalho-direita"><nav class="nav" aria-label="Navegação principal"><ul>
      ${link('pages/locais.html', 'Explorar locais', 'locais')}
      ${link('pages/favoritos.html', 'Favoritos', 'favoritos')}
      ${link('pages/perfil.html', 'Meu perfil', 'perfil')}
      ${link('empresa/acesso.html', 'Área da empresa', '', ' class="btn btn--secundario btn--pequeno"')}
    </ul></nav>${ajuda([
      ['Explorar locais', 'Busque lugares acessíveis e veja os recursos de cada um.'],
      ['Favoritos', 'Os locais que você salvou tocando no coração.'],
      ['Meu perfil', 'Seus dados, tutelados, avaliações e preferências de acessibilidade.'],
      ['Área da empresa', 'Para quem tem um espaço e quer apresentá-lo no SenseWay.']
    ])}</div>`,
    empresa: `<nav class="nav nav--empresa" aria-label="Navegação da empresa"><ul>
      ${link('empresa/meus-locais.html', 'Meus locais', 'meus-locais')}
      ${link('empresa/meus-locais.html#cadastro', 'Cadastrar local', 'cadastrar-local')}
      ${link('empresa/mensagens.html', 'Mensagens', 'mensagens')}
    </ul></nav>
    <div class="cabecalho-direita">
      <div class="chip-empresa"><span class="avatar-iniciais" data-empresa-iniciais>--</span><span data-empresa-nome>Carregando...</span></div>
      ${ajuda([
        ['Meus locais', 'Veja e edite os espaços que você já publicou.'],
        ['Cadastrar local', 'Publique um novo espaço com descrição, foto e recursos de acessibilidade.'],
        ['Mensagens', 'Leia e responda às dúvidas dos usuários sobre seus locais.']
      ])}
    </div>`,
    'empresa-acesso': `<nav class="nav nav--empresa" aria-label="Navegação da empresa"><ul>
      <li><a href="${rota('empresa/acesso.html')}" aria-current="page"><span>Área da empresa</span></a></li>
    </ul></nav><span></span>`
  };

  const naInicio = document.body.dataset.pagina === 'inicio';
  const dicaMarca = naInicio ? 'Você está na página inicial' : 'Voltar para a página inicial';
  const cabecalho = `<header class="cabecalho container">
    <a href="${rota('index.html')}" class="marca" aria-label="SenseWay: ${dicaMarca.toLowerCase()}" data-dica="${dicaMarca}">
      <img src="${rota('img/logoSenseWay.jpeg')}" alt="" class="marca-logo"><span class="marca-nome">SenseWay</span>
    </a>${navs[area] || ''}</header>`;
  document.body.insertAdjacentHTML('afterbegin', area.startsWith('empresa') ? `<div class="barra-empresa">${cabecalho}</div>` : cabecalho);

  if (!area.startsWith('empresa')) {
    document.body.insertAdjacentHTML('beforeend', `<footer class="rodape container"><div class="cartao rodape-conteudo">
      <div>
        <p class="rodape-marca">SenseWay</p>
        <p class="texto-suave">Acessibilidade e conforto em cada local.</p>
        <p class="rodape-nota">SenseWay • Uma comunidade por experiências mais inclusivas.</p>
      </div>
      <nav class="rodape-links" aria-label="Links para empresas">
        <a href="${rota('empresa/acesso.html#cadastro')}">Cadastrar empresa</a>
        <a href="${rota('empresa/meus-locais.html#cadastro')}">Cadastrar local</a>
        <a href="${rota('empresa/mensagens.html')}" class="btn btn--secundario">Mensagens dos usuários</a>
      </nav></div></footer>`);
  }

  if (area === 'empresa') {
    buscarEmpresa().then((empresa) => {
      document.querySelectorAll('[data-empresa-nome]').forEach((el) => { el.textContent = empresa.nome; });
      document.querySelectorAll('[data-empresa-iniciais]').forEach((el) => { el.textContent = iniciais(empresa.nome); });
    }).catch(() => {});
  }
}

function ligarComportamentosGerais() {
  // Mostrar/ocultar senha
  document.querySelectorAll('[data-alternar-senha]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const campo = document.getElementById(botao.dataset.alternarSenha);
      const mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      botao.innerHTML = icone(mostrar ? 'olho' : 'olho-fechado');
    });
  });

  // Esc fecha o balão de ajuda do menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.activeElement?.closest('.ajuda')) document.activeElement.blur();
  });

  // "Voltar" volta para a página anterior quando ela é do próprio site
  document.querySelectorAll('[data-voltar]').forEach((link) => {
    link.addEventListener('click', (evento) => {
      if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
        evento.preventDefault();
        history.back();
      }
    });
  });

  // Imagem que não carregou vira a imagem padrão (inclusive as criadas pelo JS)
  const usarPadrao = (img) => {
    if (img.dataset.semImagem) return;
    img.dataset.semImagem = 'true';
    img.src = IMAGEM_PADRAO;
  };
  document.querySelectorAll('img').forEach((img) => { if (img.complete && img.naturalWidth === 0) usarPadrao(img); });
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') usarPadrao(e.target); }, true);
}

// Entrada suave dos blocos ao rolar a página. Só esconde o que o JS
// consegue mostrar de volta, e respeita quem pediu menos movimento.
const revelador = (() => {
  const SELETOR = '.cartao, .painel-lilas, .painel-empresa, .painel-mensagens, .topo-pagina, .form-empresa, .chat, .alerta, .estado-vazio, .busca, .nova-senha-marca';
  const ativo = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!ativo) return { preparar() {}, reiniciar() {} };

  // Depois de entrar, o bloco volta ao normal (hover e cliques sem atraso)
  const terminar = (el, atraso) => setTimeout(() => {
    el.classList.remove('revelar', 'visivel');
    el.style.transitionDelay = '';
  }, 650 + atraso);
  const observador = new IntersectionObserver((entradas) => {
    entradas.filter((e) => e.isIntersecting).forEach((e, i) => {
      const atraso = Math.min(i, 6) * 70; // efeito cascata
      e.target.style.transitionDelay = `${atraso}ms`;
      e.target.classList.add('visivel');
      observador.unobserve(e.target);
      terminar(e.target, atraso);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  const marcar = (el) => {
    if (el.closest('.revelar') || el.parentElement?.closest(SELETOR)) return; // anima só o bloco de fora
    el.classList.remove('visivel');
    el.classList.add('revelar');
    observador.observe(el);
  };
  const preparar = (raiz) => {
    if (raiz.matches?.(SELETOR)) marcar(raiz);
    raiz.querySelectorAll?.(SELETOR).forEach(marcar);
  };

  // Blocos criados depois (cards vindos do banco) também entram suaves
  new MutationObserver((mudancas) => mudancas.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType === 1) preparar(n);
  }))).observe(document.body, { childList: true, subtree: true });

  return { preparar, reiniciar: (raiz) => raiz.querySelectorAll(SELETOR).forEach(marcar) };
})();

// =============================================================
// 4. TELAS
// =============================================================

const TELAS = {
  // ---------- pages/acesso.html (#entrar | #cadastro | #nova-senha) ----------
  acesso() {
    alternarModos();
    aoEnviar($('#form-login'), async (dados) => {
      await login(dados.email, dados.senha);
      ir('locais.html');
    });

    const form = $('#form-cadastro');
    const conferir = () => {
      const { senha, confirmarSenha } = form.elements;
      confirmarSenha.setCustomValidity(confirmarSenha.value && confirmarSenha.value !== senha.value ? 'As senhas não conferem.' : '');
    };
    form.elements.senha.addEventListener('input', conferir);
    form.elements.confirmarSenha.addEventListener('input', conferir);
    aoEnviar(form, async (dados) => {
      await cadastrarUsuario(dados);
      ir(dados.tutor === 'sim' ? 'perfil.html#tutelado' : 'questionario.html');
    });

    aoEnviar($('#form-nova-senha'), async (dados, formSenha) => {
      await redefinirSenha(dados);
      mostrarMensagem(formSenha, 'Senha alterada! Levando você para o login...', 'sucesso');
      setTimeout(() => {
        formSenha.reset();
        mostrarMensagem(formSenha, '');
        location.hash = 'entrar';
      }, 1200);
    });
  },

  async locais() {
    const lista = $('#lista-locais');
    const busca = $('#busca-locais');
    let [locais, favoritos] = await Promise.all([listarLocais(), listarIdsFavoritos()]);
    const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    const mostrar = () => {
      const termo = semAcento(busca.value.trim());
      const filtrados = locais.filter((l) => semAcento(`${l.nome} ${l.descricao} ${l.categoria} ${l.recursos.join(' ')}`).includes(termo));
      lista.innerHTML = filtrados.length
        ? filtrados.map((l) => `
          <article class="cartao card-local">
            <div class="card-local-topo">
              <h2><a href="local.html?id=${esc(l.id)}">${esc(l.nome)}</a></h2>
              ${botaoFavorito(l.id, favoritos.includes(l.id))}
            </div>
            <p>${esc(l.descricao)}</p>
            <div class="selos">${selos(l.recursos)}</div>
          </article>`).join('')
        : '<p class="carregando">Nenhum local encontrado para essa busca.</p>';
    };

    busca.addEventListener('input', mostrar);
    ligarFavoritos(lista, (id, favoritado) => {
      favoritos = favoritado ? [...favoritos, id] : favoritos.filter((i) => i !== id);
    });
    mostrar();
  },

  async local() {
    const detalhe = $('#detalhe-local');
    const form = $('#form-mensagem');
    const id = parametro('id');
    try {
      if (!id) throw new Error('Nenhum local escolhido.');
      const [local, favoritos] = await Promise.all([buscarLocal(id), listarIdsFavoritos()]);
      document.title = `${local.nome} | SenseWay`;
      detalhe.innerHTML = `
        <div class="detalhe-topo">
          <h2>${esc(local.nome)}</h2>
          ${botaoFavorito(local.id, favoritos.includes(local.id), true)}
        </div>
        <img src="${esc(caminhoImagem(local.foto))}" alt="Foto de ${esc(local.nome)}" class="foto-local">
        <p>${esc(local.descricao)}</p>
        <div class="selos">
          <span class="selo selo--lilas">${esc(local.categoria)}</span>
          <span class="selo selo--lilas">${esc(local.cidade)}</span>
          ${selos(local.recursos)}
        </div>
        <div class="detalhe-rodape">
          <span class="texto-pequeno">Já visitou? Conte para a comunidade.</span>
          <a href="avaliacoes.html?local=${esc(local.id)}#nova" class="btn btn--secundario btn--pequeno">Avaliar este local</a>
        </div>`;
    } catch (erro) {
      detalhe.innerHTML = `<p class="carregando">${esc(erro.message)} <a href="locais.html">Ver locais</a></p>`;
      form.hidden = true;
      return;
    }
    ligarFavoritos(detalhe);
    aoEnviar(form, async (dados) => {
      await enviarMensagem(id, dados.mensagem);
      form.reset();
      mostrarMensagem(form, 'Mensagem enviada! A empresa vai responder pela sua área de mensagens.', 'sucesso');
    });
  },

  async favoritos() {
    const lista = $('#lista-favoritos');
    const mostrar = async () => {
      const locais = await listarLocaisFavoritos();
      lista.innerHTML = locais.map((l) => `
        <article class="cartao card-favorito">
          <img src="${esc(caminhoImagem(l.foto))}" alt="Foto de ${esc(l.nome)}">
          <div>
            <h2>${icone('coracao')} ${esc(l.nome)}</h2>
            <p>${esc(l.descricao)}</p>
            <div class="grupo-botoes">
              <a href="local.html?id=${esc(l.id)}" class="btn btn--secundario">Ver local</a>
              <button type="button" class="btn btn--sair" data-remover="${esc(l.id)}">Remover</button>
            </div>
          </div>
        </article>`).join('');
      $('#favoritos-vazio').hidden = locais.length > 0;
    };
    lista.addEventListener('click', async (evento) => {
      const botao = evento.target.closest('[data-remover]');
      if (!botao) return;
      await alternarFavorito(botao.dataset.remover);
      mostrar();
    });
    await mostrar();
  },

  // ---------- avaliacoes.html (#lista | #nova; ?local=1 já escolhe o local) ----------
  async avaliacoes() {
    const form = $('#form-avaliacao');
    const [locais, usuario] = await Promise.all([listarLocais(), buscarUsuario()]);
    const nomeDoLocal = (id) => locais.find((l) => l.id === id)?.nome || 'Local removido';

    const mostrarLista = async () => {
      const avaliacoes = await listarAvaliacoes();
      $('#lista-avaliacoes').innerHTML = avaliacoes.map((a) => `
        <article class="cartao card-avaliacao">
          <div class="card-avaliacao-topo">
            <div>
              <h2><a href="local.html?id=${esc(a.localId)}">${esc(nomeDoLocal(a.localId))}</a></h2>
              <span class="texto-pequeno">Enviada em ${esc(formatarData(a.data))}</span>
            </div>
            <span class="nota-estrelas" aria-label="Nota ${esc(a.nota)} de 5">${'★'.repeat(a.nota)}${'☆'.repeat(5 - a.nota)}</span>
          </div>
          <p class="card-avaliacao-texto">${esc(a.experiencia)}</p>
          <div class="selos">
            <span class="selo ${a.acessivel ? 'selo--sucesso' : ''}">Local acessível: ${a.acessivel ? 'Sim' : 'Não'}</span>
            <span class="selo">Muitos ruídos: ${a.muitoRuido ? 'Sim' : 'Não'}</span>
          </div>
          <p class="texto-pequeno espaco-acima">Nome: ${esc(a.nome)}</p>
        </article>`).join('');
      $('#avaliacoes-vazio').hidden = avaliacoes.length > 0;
    };

    // Formulário "Deixe seu comentário"
    locais.forEach((l) => form.elements.localId.add(new Option(l.nome, l.id)));
    if (parametro('local')) form.elements.localId.value = parametro('local');
    form.elements.nome.value = usuario.nome;
    aoEnviar(form, async (dados) => {
      await enviarAvaliacao(dados);
      form.reset();
      form.elements.nome.value = usuario.nome;
      await mostrarLista();
      location.hash = 'lista';
    });

    alternarModos();
    await mostrarLista();
  },

  // ---------- perfil.html (#perfil | #editar | #tutelado) ----------
  async perfil() {
    const formEditar = $('#form-editar-perfil');
    const campoFoto = $('#foto');

    const carregar = async () => {
      const usuario = await buscarUsuario();
      const campos = {
        nome: usuario.nome,
        email: usuario.email,
        dataNascimento: formatarData(usuario.dataNascimento) || 'Não informada',
        tutor: usuario.tutor ? 'Sim' : 'Não'
      };
      Object.entries(campos).forEach(([campo, valor]) => { $(`[data-campo="${campo}"]`).textContent = valor; });
      const tutelados = usuario.tutelados || [];
      $('#cartao-tutelados').hidden = tutelados.length === 0;
      $('#lista-tutelados').innerHTML = tutelados.map((t) => `
        <li><span>${esc(t.nome)}</span><a href="questionario.html?tutelado=${esc(t.id)}" class="link-pequeno">Preferências</a></li>`).join('');

      // Formulário de edição já vem preenchido
      formEditar.elements.nome.value = usuario.nome;
      formEditar.elements.email.value = usuario.email;
      formEditar.elements.dataNascimento.value = usuario.dataNascimento || '';
      marcarRadio(formEditar, 'tutor', usuario.tutor ? 'sim' : 'nao');
    };

    $('#botao-sair').addEventListener('click', async () => {
      await sair();
      ir('../index.html');
    });

    campoFoto.addEventListener('change', () => {
      const arquivo = campoFoto.files[0];
      if (!arquivo) return;
      const img = document.createElement('img');
      img.src = URL.createObjectURL(arquivo);
      img.alt = 'Prévia da nova foto';
      $('#previa-avatar').replaceChildren(img);
    });
    aoEnviar(formEditar, async ({ foto, ...perfil }) => { // a foto vai por FormData na integração
      await atualizarUsuario(perfil);
      await carregar();
      location.hash = 'perfil';
    });

    aoEnviar($('#form-tutelado'), async (dados) => {
      const tutelado = await adicionarTutelado(dados.nome);
      ir(`questionario.html?tutelado=${encodeURIComponent(tutelado.id)}`);
    });

    alternarModos();
    await carregar();
  },

  // questionario.html  ou  ?tutelado=1
  async questionario() {
    const form = $('#form-questionario');
    const tuteladoId = parametro('tutelado');
    aoEnviar(form, async (respostas) => {
      await salvarQuestionario(respostas, tuteladoId);
      ir('perfil.html');
    });
    const [perguntas, usuario] = await Promise.all([listarPerguntas(), buscarUsuario()]);
    // O "name" de cada grupo é o id da pergunta: { sonsAltos: 'sim', ... }
    $('#lista-perguntas').innerHTML = perguntas.map((p) => `
      <fieldset class="pergunta">
        <legend>${esc(p.texto)}</legend>
        <div class="opcoes-radio">
          <label><input type="radio" name="${esc(p.id)}" value="sim" required> Sim</label>
          <label><input type="radio" name="${esc(p.id)}" value="nao"> Não</label>
        </div>
      </fieldset>`).join('');

    let salvas = usuario.preferencias || {};
    const tutelado = tuteladoId && (usuario.tutelados || []).find((t) => t.id === Number(tuteladoId));
    if (tutelado) {
      $('#titulo-questionario').textContent = `Preferências de ${tutelado.nome}`;
      salvas = tutelado.preferencias || {};
    }
    Object.entries(salvas).forEach(([pergunta, resposta]) => marcarRadio(form, pergunta, resposta));
  },

  // ---------- empresa/acesso.html (#entrar | #cadastro) ----------
  'empresa-acesso'() {
    alternarModos();
    aoEnviar($('#form-login-empresa'), async (dados) => {
      await loginEmpresa(dados.email, dados.senha);
      ir('meus-locais.html');
    });
    aoEnviar($('#form-cadastro-empresa'), async (dados) => {
      await cadastrarEmpresa(dados);
      ir('meus-locais.html#cadastro');
    });
  },

  // ---------- meus-locais.html (#lista | #cadastro; ?id=1#cadastro edita; ?publicado=1) ----------
  async 'meus-locais'() {
    $('#alerta-publicado').hidden = parametro('publicado') !== '1';
    if (parametro('id')) {
      $('[data-modo="cadastro"]').dataset.titulo = 'Edite seu local';
      $('#titulo-pagina').textContent = 'Edite seu local';
    }
    alternarModos();
    const formulario = this.formularioLocal();
    const [locais, conversas] = await Promise.all([listarLocaisDaEmpresa(), listarConversas()]);

    $('#lista-locais-empresa').innerHTML = locais.length
      ? locais.map((l) => `
        <article class="cartao local-empresa">
          <div class="card-local-topo">
            <div>
              <h2>${esc(l.nome)}</h2>
              <span class="texto-pequeno">${esc(l.categoria)} · ${esc(l.cidade)}</span>
            </div>
            <span class="selo selo--sucesso">${icone('check')} Publicado</span>
          </div>
          <div class="local-empresa-corpo">
            <img src="${esc(caminhoImagem(l.foto))}" alt="Foto de ${esc(l.nome)}">
            <div>
              <span class="sobretitulo">Sobre o local</span>
              <p>${esc(l.descricao)}</p>
            </div>
          </div>
          <div class="local-empresa-rodape">
            <span class="texto-pequeno">Visível no site do SenseWay · <a href="../pages/local.html?id=${esc(l.id)}">ver página</a></span>
            <a href="meus-locais.html?id=${esc(l.id)}#cadastro" class="btn btn--secundario btn--pequeno">${icone('lapis')} Editar local</a>
          </div>
        </article>`).join('')
      : '<p class="carregando">Você ainda não tem locais. <a href="#cadastro">Cadastre o primeiro</a>.</p>';

    const recente = conversas
      .map((c) => ({ usuario: c.usuario, ultima: c.mensagens.at(-1) }))
      .sort((a, b) => b.ultima.dataHora.localeCompare(a.ultima.dataHora))[0];
    $('#ultima-mensagem').innerHTML = recente
      ? `<strong>${esc(recente.usuario.nome)} · ${esc(formatarHora(recente.ultima.dataHora))}</strong> "${esc(recente.ultima.texto)}"`
      : 'Nenhuma mensagem por enquanto.';
    await formulario;
  },

  // Formulário "Cadastre seu local" (parte da tela meus-locais)
  async formularioLocal() {
    const form = $('#form-local');
    const { foto: campoFoto, nome, descricao } = form.elements;
    const dropzone = $('#dropzone');
    const previaFoto = $('#previa-foto');
    previaFoto.src = IMAGEM_PADRAO;

    const atualizarPrevia = () => {
      $('#previa-nome').textContent = nome.value || 'Nome do local';
      const texto = descricao.value;
      $('#previa-descricao').textContent = texto
        ? texto.slice(0, 140) + (texto.length > 140 ? '...' : '')
        : 'A descrição aparece aqui enquanto você digita.';
    };
    const mostrarFoto = (arquivo) => {
      if (!arquivo?.type.startsWith('image/')) return;
      previaFoto.src = URL.createObjectURL(arquivo);
      $('#texto-dropzone').textContent = arquivo.name;
    };

    nome.addEventListener('input', atualizarPrevia);
    descricao.addEventListener('input', atualizarPrevia);
    campoFoto.addEventListener('change', () => mostrarFoto(campoFoto.files[0]));
    ['dragenter', 'dragover'].forEach((tipo) => dropzone.addEventListener(tipo, (e) => {
      e.preventDefault();
      dropzone.classList.add('arrastando');
    }));
    ['dragleave', 'drop'].forEach((tipo) => dropzone.addEventListener(tipo, () => dropzone.classList.remove('arrastando')));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!e.dataTransfer.files.length) return;
      campoFoto.files = e.dataTransfer.files;
      mostrarFoto(campoFoto.files[0]);
    });

    aoEnviar(form, async (_dados, formulario) => {
      const dados = new FormData(formulario);
      await salvarLocal({
        id: dados.get('id'),
        nome: dados.get('nome'),
        categoria: dados.get('categoria'),
        cidade: dados.get('cidade'),
        descricao: dados.get('descricao'),
        recursos: dados.getAll('recursos') // checkboxes: várias respostas
      });
      ir('meus-locais.html?publicado=1');
    });

    const idEdicao = parametro('id');
    if (!idEdicao) return;
    const local = await buscarLocal(idEdicao);
    $('#status-local').textContent = 'Publicado';
    ['id', 'nome', 'categoria', 'cidade', 'descricao'].forEach((campo) => { form.elements[campo].value = local[campo]; });
    form.querySelectorAll('input[name="recursos"]').forEach((caixa) => { caixa.checked = local.recursos.includes(caixa.value); });
    previaFoto.src = caminhoImagem(local.foto);
    atualizarPrevia();
  },

  // mensagens.html  ou  ?conversa=1
  async mensagens() {
    const listaConversas = $('#lista-conversas');
    const painel = $('#painel-conversa');
    const busca = $('#busca-conversa');
    const filtroLocal = $('#filtro-local');
    const [conversas, locais] = await Promise.all([listarConversas(), listarLocaisDaEmpresa()]);
    let aberta = Number(parametro('conversa')) || conversas[0]?.id;

    const nomeDoLocal = (id) => locais.find((l) => l.id === id)?.nome || 'Local';
    const hoje = new Date().toISOString().slice(0, 10);
    const quando = (iso) => (iso.startsWith(hoje) ? formatarHora(iso) : formatarDataCurta(iso));

    const mostrarLista = () => {
      const termo = busca.value.trim().toLowerCase();
      const local = Number(filtroLocal.value);
      const filtradas = conversas.filter((c) => c.usuario.nome.toLowerCase().includes(termo) && (!local || c.localId === local));
      listaConversas.innerHTML = filtradas.length
        ? filtradas.map((c) => {
          const ultima = c.mensagens.at(-1);
          return `
          <button type="button" class="conversa-item" data-conversa="${esc(c.id)}" aria-current="${c.id === aberta}">
            <span class="avatar-iniciais">${esc(iniciais(c.usuario.nome))}</span>
            <span class="conversa-info">
              <span class="conversa-linha"><strong>${esc(c.usuario.nome)}</strong><span class="texto-pequeno">${esc(quando(ultima.dataHora))}</span></span>
              <span class="conversa-local">${esc(nomeDoLocal(c.localId))}</span>
              <span class="conversa-previa">${esc(ultima.texto)}</span>
            </span>
          </button>`;
        }).join('')
        : '<p class="carregando carregando--recuo">Nenhuma conversa encontrada.</p>';
    };

    const mostrarConversa = () => {
      const conversa = conversas.find((c) => c.id === aberta);
      if (!conversa) return;
      const local = locais.find((l) => l.id === conversa.localId);
      const balao = (m) => {
        const daEmpresa = m.autor === 'empresa';
        return `
          <div class="balao ${daEmpresa ? 'balao--empresa' : ''}">
            <p class="balao-autor">${daEmpresa ? 'Você' : esc(conversa.usuario.nome)}</p>
            <p>${esc(m.texto)}</p>
            <p class="balao-hora">${esc(formatarDataCurta(m.dataHora))} · ${esc(formatarHora(m.dataHora))}</p>
          </div>`;
      };
      painel.innerHTML = `
        <div class="chat-cabecalho">
          <h2>${esc(conversa.usuario.nome)}</h2>
          <span class="texto-pequeno">Usuário(a) do SenseWay</span>
        </div>
        <div class="chat-contexto">
          <img src="${esc(caminhoImagem(local?.foto))}" alt="">
          <span class="conversa-info"><span class="texto-pequeno">Conversa sobre o local</span><br><strong>${esc(nomeDoLocal(conversa.localId))}</strong></span>
          <a href="../pages/local.html?id=${esc(conversa.localId)}" class="link-pequeno">Ver local</a>
        </div>
        <div class="chat-mensagens" id="mensagens">${conversa.mensagens.map(balao).join('')}</div>
        <form id="form-resposta" class="chat-resposta" action="#" method="post">
          <div class="campo campo--branco">
            <label for="resposta">Sua resposta para ${esc(conversa.usuario.nome.split(' ')[0])}</label>
            <textarea id="resposta" name="resposta" placeholder="Escreva uma resposta clara e acolhedora" required></textarea>
          </div>
          <p class="mensagem-form" data-mensagem role="alert"></p>
          <div class="grupo-botoes"><button type="submit" class="btn btn--primario">${icone('seta-direita')} Enviar resposta</button></div>
        </form>`;
      const caixa = $('#mensagens');
      caixa.scrollTop = caixa.scrollHeight;
      aoEnviar($('#form-resposta'), async (dados) => {
        conversa.mensagens.push(await responderConversa(conversa.id, dados.resposta));
        mostrarLista();
        mostrarConversa();
      });
    };

    locais.forEach((l) => filtroLocal.add(new Option(l.nome, l.id)));
    listaConversas.addEventListener('click', (evento) => {
      const item = evento.target.closest('[data-conversa]');
      if (!item) return;
      aberta = Number(item.dataset.conversa);
      mostrarLista();
      mostrarConversa();
    });
    busca.addEventListener('input', mostrarLista);
    filtroLocal.addEventListener('change', mostrarLista);
    mostrarLista();
    mostrarConversa();
  }
};

// ---------- Início ----------
montarLayout();
desenharIcones();
ligarComportamentosGerais();
revelador.preparar(document.body);

// Se algo falhar ao carregar, a mensagem aparece no lugar do "Carregando..."
Promise.resolve(TELAS[document.body.dataset.pagina]?.()).catch((erro) => {
  const alvo = $('.carregando, [data-carregando]');
  if (alvo) alvo.textContent = erro.message;
  console.error(erro);
});
