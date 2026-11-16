// =============================================================
// api.js — A ÚNICA PORTA DE ENTRADA DOS DADOS
// -------------------------------------------------------------
// As telas NUNCA fazem fetch direto: sempre chamam as funções
// daqui. Assim, para trocar o "banco de teste" (arquivos JSON)
// pelo back-end de verdade, só este arquivo muda.
//
// MODO 'mock' -> lê os arquivos da pasta /data e simula as
//                gravações na sessionStorage do navegador
//                (somem ao fechar a aba).
// MODO 'api'  -> chama o back-end real em CONFIG.urlApi.
//
// IMPORTANTE (segurança): tudo o que está no navegador pode ser
// visto e alterado pelo F12. Por isso:
//   - senha NUNCA é guardada nem conferida aqui;
//   - quem decide se o usuário pode ver/alterar algo é o BACK-END.
// O que o mock faz aqui é só fingir as respostas do servidor.
// =============================================================

const CONFIG = {
  modo: 'mock', // troque para 'api' quando o back-end existir
  urlApi: 'http://localhost:3000/api'
};

const PASTA_DADOS = new URL('../data/', import.meta.url);
const CHAVE_MEMORIA = 'senseway-mock';

// ---------- Utilitários internos ----------

async function lerJson(arquivo) {
  const resposta = await fetch(new URL(arquivo, PASTA_DADOS));
  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar ${arquivo}.`);
  }
  return resposta.json();
}

// Usada no modo 'api'. Já envia JSON e os cookies de sessão.
async function chamarApi(rota, { metodo = 'GET', corpo } = {}) {
  const resposta = await fetch(CONFIG.urlApi + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status}.`;
    try {
      mensagem = (await resposta.json()).mensagem || mensagem;
    } catch {
      // resposta sem JSON: mantém a mensagem padrão
    }
    throw new Error(mensagem);
  }
  return resposta.status === 204 ? null : resposta.json();
}

// "Memória" do mock: guarda o que o usuário criou/alterou
// para que as outras telas enxerguem a mudança.
function lerMemoria() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_MEMORIA)) || {};
  } catch {
    return {};
  }
}

function salvarMemoria(memoria) {
  try {
    sessionStorage.setItem(CHAVE_MEMORIA, JSON.stringify(memoria));
  } catch {
    // navegador bloqueou o armazenamento: o mock segue sem memória
  }
}

function alterarMemoria(alteracao) {
  const memoria = lerMemoria();
  alteracao(memoria);
  salvarMemoria(memoria);
  return memoria;
}

function proximoId(lista) {
  return lista.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function agoraIso() {
  return new Date().toISOString().slice(0, 19);
}

// Junta os registros do JSON com os criados/editados na sessão.
function mesclarPorId(originais, alterados = []) {
  const resultado = originais.map((item) => alterados.find((a) => a.id === item.id) || item);
  alterados.forEach((item) => {
    if (!resultado.some((r) => r.id === item.id)) resultado.push(item);
  });
  return resultado;
}

function exigirTexto(valor, mensagem) {
  if (!valor || !String(valor).trim()) throw new Error(mensagem);
}

// =============================================================
// LOCAIS
// =============================================================

export async function listarLocais() {
  if (CONFIG.modo === 'api') return chamarApi('/locais');
  const locais = await lerJson('locais.json');
  return mesclarPorId(locais, lerMemoria().locais).filter((l) => l.publicado);
}

export async function buscarLocal(id) {
  if (CONFIG.modo === 'api') return chamarApi(`/locais/${id}`);
  const locais = mesclarPorId(await lerJson('locais.json'), lerMemoria().locais);
  const local = locais.find((l) => l.id === Number(id));
  if (!local) throw new Error('Local não encontrado.');
  return local;
}

// =============================================================
// SESSÃO DO USUÁRIO
// =============================================================

export async function login(email, senha) {
  exigirTexto(email, 'Informe o e-mail.');
  exigirTexto(senha, 'Informe a senha.');
  if (CONFIG.modo === 'api') {
    return chamarApi('/auth/login', { metodo: 'POST', corpo: { email, senha } });
  }
  // Mock: aceita qualquer e-mail/senha. No back-end real, a senha
  // é conferida no servidor (com hash) e nunca volta para o front.
  alterarMemoria((m) => { m.sessao = { tipo: 'usuario' }; });
  return buscarUsuarioLogado();
}

export async function cadastrarUsuario(dados) {
  exigirTexto(dados.nome, 'Informe o nome.');
  if (dados.senha !== dados.confirmarSenha) throw new Error('As senhas não conferem.');
  const { confirmarSenha, ...corpo } = dados;
  if (CONFIG.modo === 'api') return chamarApi('/usuarios', { metodo: 'POST', corpo });
  // Mock: guarda os dados do perfil (sem a senha!)
  const { senha, ...perfil } = corpo;
  alterarMemoria((m) => {
    m.usuario = { ...(m.usuario || {}), ...perfil, tutor: perfil.tutor === 'sim' };
    m.sessao = { tipo: 'usuario' };
  });
  return buscarUsuarioLogado();
}

export async function redefinirSenha(email, novaSenha, confirmarSenha) {
  exigirTexto(email, 'Informe o e-mail.');
  if (novaSenha !== confirmarSenha) throw new Error('As senhas não conferem.');
  if (CONFIG.modo === 'api') {
    return chamarApi('/auth/nova-senha', { metodo: 'POST', corpo: { email, novaSenha } });
  }
  return { ok: true };
}

export async function sair() {
  if (CONFIG.modo === 'api') return chamarApi('/auth/logout', { metodo: 'POST' });
  alterarMemoria((m) => { delete m.sessao; });
  return { ok: true };
}

// =============================================================
// PERFIL E TUTELADOS
// =============================================================

export async function buscarUsuarioLogado() {
  if (CONFIG.modo === 'api') return chamarApi('/usuarios/me');
  const usuario = await lerJson('usuario.json');
  return { ...usuario, ...(lerMemoria().usuario || {}) };
}

export async function atualizarUsuario(dados) {
  exigirTexto(dados.nome, 'Informe o nome.');
  const corpo = { ...dados, tutor: dados.tutor === 'sim' };
  if (CONFIG.modo === 'api') return chamarApi('/usuarios/me', { metodo: 'PUT', corpo });
  alterarMemoria((m) => { m.usuario = { ...(m.usuario || {}), ...corpo }; });
  return buscarUsuarioLogado();
}

export async function adicionarTutelado(nome) {
  exigirTexto(nome, 'Informe o nome do tutelado.');
  if (CONFIG.modo === 'api') {
    return chamarApi('/usuarios/me/tutelados', { metodo: 'POST', corpo: { nome } });
  }
  const usuario = await buscarUsuarioLogado();
  const tutelados = usuario.tutelados || [];
  const novo = { id: proximoId(tutelados), nome: nome.trim(), preferencias: {} };
  alterarMemoria((m) => {
    m.usuario = { ...(m.usuario || {}), tutor: true, tutelados: [...tutelados, novo] };
  });
  return novo;
}

// =============================================================
// QUESTIONÁRIO DE PREFERÊNCIAS
// =============================================================

export async function listarPerguntas() {
  if (CONFIG.modo === 'api') return chamarApi('/questionario');
  return lerJson('questionario.json');
}

// tuteladoId vazio = respostas do próprio usuário
export async function salvarQuestionario(respostas, tuteladoId) {
  if (CONFIG.modo === 'api') {
    const rota = tuteladoId ? `/usuarios/me/tutelados/${tuteladoId}/preferencias` : '/usuarios/me/preferencias';
    return chamarApi(rota, { metodo: 'PUT', corpo: respostas });
  }
  const usuario = await buscarUsuarioLogado();
  alterarMemoria((m) => {
    if (tuteladoId) {
      const tutelados = (usuario.tutelados || []).map((t) =>
        t.id === Number(tuteladoId) ? { ...t, preferencias: respostas } : t
      );
      m.usuario = { ...(m.usuario || {}), tutelados };
    } else {
      m.usuario = { ...(m.usuario || {}), preferencias: respostas };
    }
  });
  return { ok: true };
}

// =============================================================
// FAVORITOS
// =============================================================

export async function listarIdsFavoritos() {
  if (CONFIG.modo === 'api') return chamarApi('/usuarios/me/favoritos/ids');
  const memoria = lerMemoria();
  if (memoria.favoritos) return memoria.favoritos;
  return (await lerJson('favoritos.json')).locais;
}

export async function listarLocaisFavoritos() {
  if (CONFIG.modo === 'api') return chamarApi('/usuarios/me/favoritos');
  const [ids, locais] = await Promise.all([listarIdsFavoritos(), listarLocais()]);
  return locais.filter((l) => ids.includes(l.id));
}

// Liga/desliga o favorito. Devolve true se ficou favoritado.
export async function alternarFavorito(localId) {
  const id = Number(localId);
  if (CONFIG.modo === 'api') {
    const resposta = await chamarApi(`/usuarios/me/favoritos/${id}`, { metodo: 'POST' });
    return resposta.favorito;
  }
  const ids = await listarIdsFavoritos();
  const favoritado = !ids.includes(id);
  const novos = favoritado ? [...ids, id] : ids.filter((i) => i !== id);
  alterarMemoria((m) => { m.favoritos = novos; });
  return favoritado;
}

// =============================================================
// AVALIAÇÕES E MENSAGENS DO USUÁRIO
// =============================================================

export async function listarMinhasAvaliacoes() {
  if (CONFIG.modo === 'api') return chamarApi('/usuarios/me/avaliacoes');
  const originais = await lerJson('avaliacoes.json');
  return [...(lerMemoria().avaliacoes || []), ...originais];
}

export async function enviarAvaliacao(dados) {
  if (!dados.localId) throw new Error('Escolha o local.');
  exigirTexto(dados.experiencia, 'Conte como foi a sua experiência.');
  if (!dados.nota) throw new Error('Escolha uma nota de 1 a 5.');
  const corpo = {
    localId: Number(dados.localId),
    nome: dados.nome,
    experiencia: dados.experiencia.trim(),
    acessivel: dados.acessivel === 'sim',
    muitoRuido: dados.muitoRuido === 'sim',
    nota: Number(dados.nota)
  };
  if (CONFIG.modo === 'api') return chamarApi('/avaliacoes', { metodo: 'POST', corpo });
  const todas = await listarMinhasAvaliacoes();
  const nova = { id: proximoId(todas), usuarioId: 1, ...corpo, data: hojeIso() };
  alterarMemoria((m) => { m.avaliacoes = [nova, ...(m.avaliacoes || [])]; });
  return nova;
}

export async function enviarMensagemParaEmpresa(localId, texto) {
  exigirTexto(texto, 'Escreva a sua mensagem.');
  const corpo = { localId: Number(localId), texto: texto.trim() };
  if (CONFIG.modo === 'api') return chamarApi('/mensagens', { metodo: 'POST', corpo });
  return { ok: true, ...corpo, dataHora: agoraIso() };
}

// =============================================================
// ÁREA DA EMPRESA
// =============================================================

export async function loginEmpresa(email, senha) {
  exigirTexto(email, 'Informe o e-mail.');
  exigirTexto(senha, 'Informe a senha.');
  if (CONFIG.modo === 'api') {
    return chamarApi('/empresas/login', { metodo: 'POST', corpo: { email, senha } });
  }
  alterarMemoria((m) => { m.sessao = { tipo: 'empresa' }; });
  return buscarEmpresaLogada();
}

export async function cadastrarEmpresa(dados) {
  exigirTexto(dados.nome, 'Informe o nome do local.');
  if (!dados.senha || dados.senha.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
  if (CONFIG.modo === 'api') return chamarApi('/empresas', { metodo: 'POST', corpo: dados });
  const { senha, ...perfil } = dados;
  alterarMemoria((m) => {
    m.empresa = { ...(m.empresa || {}), ...perfil };
    m.sessao = { tipo: 'empresa' };
  });
  return buscarEmpresaLogada();
}

export async function buscarEmpresaLogada() {
  if (CONFIG.modo === 'api') return chamarApi('/empresas/me');
  const empresa = await lerJson('empresa.json');
  return { ...empresa, ...(lerMemoria().empresa || {}) };
}

export async function listarLocaisDaEmpresa() {
  if (CONFIG.modo === 'api') return chamarApi('/empresas/me/locais');
  const [empresa, locais] = await Promise.all([buscarEmpresaLogada(), lerJson('locais.json')]);
  return mesclarPorId(locais, lerMemoria().locais).filter((l) => l.empresaId === empresa.id);
}

// Cria (sem id) ou atualiza (com id) um local da empresa.
// A foto vai separada: no back-end real ela é enviada com FormData.
export async function salvarLocal(dados) {
  exigirTexto(dados.nome, 'Informe o nome do local.');
  exigirTexto(dados.descricao, 'Descreva o local.');
  const corpo = {
    nome: dados.nome.trim(),
    categoria: dados.categoria,
    cidade: dados.cidade,
    descricao: dados.descricao.trim(),
    resumo: dados.descricao.trim().slice(0, 140),
    recursos: dados.recursos || []
  };
  if (CONFIG.modo === 'api') {
    return dados.id
      ? chamarApi(`/locais/${dados.id}`, { metodo: 'PUT', corpo })
      : chamarApi('/locais', { metodo: 'POST', corpo });
  }
  const empresa = await buscarEmpresaLogada();
  const todos = mesclarPorId(await lerJson('locais.json'), lerMemoria().locais);
  const existente = todos.find((l) => l.id === Number(dados.id));
  const local = {
    ...(existente || { id: proximoId(todos), foto: null }),
    ...corpo,
    empresaId: empresa.id,
    publicado: true
  };
  alterarMemoria((m) => {
    m.locais = [...(m.locais || []).filter((l) => l.id !== local.id), local];
  });
  return local;
}

export async function listarConversas() {
  if (CONFIG.modo === 'api') return chamarApi('/empresas/me/conversas');
  const conversas = await lerJson('conversas.json');
  const respostas = lerMemoria().respostas || {};
  return conversas.map((c) => ({
    ...c,
    mensagens: [...c.mensagens, ...(respostas[c.id] || [])]
  }));
}

export async function responderConversa(conversaId, texto) {
  exigirTexto(texto, 'Escreva a resposta.');
  if (CONFIG.modo === 'api') {
    return chamarApi(`/conversas/${conversaId}/mensagens`, { metodo: 'POST', corpo: { texto } });
  }
  const mensagem = { autor: 'empresa', texto: texto.trim(), dataHora: agoraIso() };
  alterarMemoria((m) => {
    m.respostas = m.respostas || {};
    m.respostas[conversaId] = [...(m.respostas[conversaId] || []), mensagem];
  });
  return mensagem;
}

// Útil para testes: volta tudo ao estado dos arquivos JSON.
export function limparDadosDeTeste() {
  try {
    sessionStorage.removeItem(CHAVE_MEMORIA);
  } catch {
    // nada a limpar
  }
}
