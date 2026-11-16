// Tela: Mensagens dos usuários (empresa/mensagens.html  ou  ?conversa=1)
import { listarConversas, listarLocaisDaEmpresa, responderConversa } from '../api.js';
import {
  escaparHtml, iniciais, caminhoImagem, formatarHora, formatarDataCurta,
  parametroUrl, aoEnviar, desenharIcones
} from '../ui.js';
import { preencherCabecalhoEmpresa } from './empresa-comum.js';

const listaConversas = document.getElementById('lista-conversas');
const painel = document.getElementById('painel-conversa');
const busca = document.getElementById('busca-conversa');
const filtroLocal = document.getElementById('filtro-local');

let conversas = [];
let locais = [];
let conversaAberta = Number(parametroUrl('conversa')) || null;

const nomeDoLocal = (id) => locais.find((l) => l.id === id)?.nome || 'Local';

function quando(iso) {
  const hoje = new Date().toISOString().slice(0, 10);
  return iso.startsWith(hoje) ? formatarHora(iso) : formatarDataCurta(iso);
}

function itemConversa(conversa) {
  const ultima = conversa.mensagens.at(-1);
  return `
    <button type="button" class="conversa-item" data-conversa="${conversa.id}" aria-current="${conversa.id === conversaAberta}">
      <span class="avatar-iniciais">${escaparHtml(iniciais(conversa.usuario.nome))}</span>
      <span class="conversa-info">
        <span class="conversa-linha">
          <strong>${escaparHtml(conversa.usuario.nome)}</strong>
          <span class="texto-pequeno">${quando(ultima.dataHora)}</span>
        </span>
        <span class="conversa-local">${escaparHtml(nomeDoLocal(conversa.localId))}</span>
        <span class="conversa-previa">${escaparHtml(ultima.texto)}</span>
      </span>
    </button>`;
}

function balao(mensagem, nomeUsuario) {
  const daEmpresa = mensagem.autor === 'empresa';
  return `
    <div class="balao ${daEmpresa ? 'balao--empresa' : ''}">
      <p class="balao-autor">${daEmpresa ? 'Você' : escaparHtml(nomeUsuario)}</p>
      <p>${escaparHtml(mensagem.texto)}</p>
      <p class="balao-hora">${formatarDataCurta(mensagem.dataHora)} · ${formatarHora(mensagem.dataHora)}</p>
    </div>`;
}

function mostrarLista() {
  const termo = busca.value.trim().toLowerCase();
  const local = Number(filtroLocal.value);
  const filtradas = conversas.filter(
    (c) => c.usuario.nome.toLowerCase().includes(termo) && (!local || c.localId === local)
  );
  listaConversas.innerHTML = filtradas.length
    ? filtradas.map(itemConversa).join('')
    : '<p class="carregando carregando--recuo">Nenhuma conversa encontrada.</p>';
}

function mostrarConversa() {
  const conversa = conversas.find((c) => c.id === conversaAberta);
  if (!conversa) return;
  const local = locais.find((l) => l.id === conversa.localId);
  const primeiroNome = escaparHtml(conversa.usuario.nome.split(' ')[0]);

  painel.innerHTML = `
    <div class="chat-cabecalho">
      <h2>${escaparHtml(conversa.usuario.nome)}</h2>
      <span class="texto-pequeno">Usuário(a) do SenseWay</span>
    </div>
    <div class="chat-contexto">
      <img src="${caminhoImagem(local?.foto)}" alt="">
      <span class="conversa-info">
        <span class="texto-pequeno">Conversa sobre o local</span><br>
        <strong>${escaparHtml(nomeDoLocal(conversa.localId))}</strong>
      </span>
      <a href="../pages/local.html?id=${conversa.localId}" class="link-pequeno">Ver local</a>
    </div>
    <div class="chat-mensagens" id="mensagens">
      ${conversa.mensagens.map((m) => balao(m, conversa.usuario.nome)).join('')}
    </div>
    <form id="form-resposta" class="chat-resposta" action="#" method="post">
      <div class="campo campo--branco">
        <label for="resposta">Sua resposta para ${primeiroNome}</label>
        <textarea id="resposta" name="resposta" placeholder="Escreva uma resposta clara e acolhedora" required></textarea>
      </div>
      <p class="mensagem-form" data-mensagem role="alert"></p>
      <div class="grupo-botoes">
        <button type="submit" class="btn btn--primario"><span data-icone="seta-direita"></span> Enviar resposta</button>
      </div>
    </form>`;

  desenharIcones(painel);
  const caixaMensagens = document.getElementById('mensagens');
  caixaMensagens.scrollTop = caixaMensagens.scrollHeight;

  aoEnviar(document.getElementById('form-resposta'), async (dados) => {
    const nova = await responderConversa(conversa.id, dados.resposta);
    conversa.mensagens.push(nova);
    mostrarLista();
    mostrarConversa();
  });
}

async function iniciar() {
  try {
    await preencherCabecalhoEmpresa();
    [conversas, locais] = await Promise.all([listarConversas(), listarLocaisDaEmpresa()]);
    locais.forEach((l) => filtroLocal.add(new Option(l.nome, l.id)));
    if (!conversaAberta && conversas.length) conversaAberta = conversas[0].id;
    mostrarLista();
    mostrarConversa();
  } catch (erro) {
    listaConversas.innerHTML = `<p class="carregando carregando--recuo">${escaparHtml(erro.message)}</p>`;
  }
}

listaConversas.addEventListener('click', (evento) => {
  const item = evento.target.closest('[data-conversa]');
  if (!item) return;
  conversaAberta = Number(item.dataset.conversa);
  mostrarLista();
  mostrarConversa();
});

busca.addEventListener('input', mostrarLista);
filtroLocal.addEventListener('change', mostrarLista);

iniciar();
