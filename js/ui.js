// =============================================================
// ui.js — ajudantes de interface usados por todas as páginas
// Ao ser carregado, ele também:
//   - desenha os ícones marcados com data-icone="nome";
//   - liga os botões de mostrar/ocultar senha;
//   - faz os links "Voltar" voltarem para a página anterior;
//   - troca imagens que não carregaram por uma imagem padrão.
// =============================================================

const IMAGEM_PADRAO = new URL('../img/placeholder.svg', import.meta.url).href;

// Ícones em SVG (traço simples). Use: <span data-icone="coracao"></span>
const ICONES = {
  'seta-esquerda': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  'seta-direita': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  coracao: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  envelope: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
  mais: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  lapis: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  balao: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
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
  'seta-baixo': '<polyline points="6 9 12 15 18 9"/>',
  reticencias: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  traco: '<line x1="6" y1="12" x2="18" y2="12"/>'
};

export function icone(nome) {
  const desenho = ICONES[nome] || '';
  return `<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${desenho}</svg>`;
}

export function desenharIcones(raiz = document) {
  raiz.querySelectorAll('[data-icone]').forEach((el) => {
    el.innerHTML = icone(el.dataset.icone);
  });
}

// Evita que um texto vindo do banco vire HTML (proteção contra XSS).
// SEMPRE use ao montar HTML com dados.
export function escaparHtml(texto) {
  const trocas = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(texto ?? '').replace(/[&<>"']/g, (c) => trocas[c]);
}

// Lê ?id=3 da URL -> parametroUrl('id') === '3'
export function parametroUrl(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

// Caminhos do banco são relativos à raiz do site ("img/locais/x.jpg").
// Esta função os converte para funcionar em qualquer pasta.
export function caminhoImagem(caminho) {
  if (!caminho) return IMAGEM_PADRAO;
  if (/^(https?:|data:|blob:)/.test(caminho)) return caminho;
  return new URL(`../${caminho}`, import.meta.url).href;
}

export function iniciais(nome) {
  return String(nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

export function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarHora(iso) {
  return iso ? iso.slice(11, 16) : '';
}

export function formatarDataCurta(iso) {
  const meses = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  const [, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia} ${meses.at(Number(mes) - 1)}`;
}

export function ir(pagina) {
  window.location.href = pagina;
}

export function mostrarMensagem(alvo, texto, tipo = 'erro') {
  const caixa = alvo.matches?.('[data-mensagem]') ? alvo : alvo.querySelector('[data-mensagem]');
  if (!caixa) return;
  caixa.textContent = texto;
  caixa.className = `mensagem-form${texto ? ` mensagem-form--${tipo}` : ''}`;
}

// Liga um formulário: impede o recarregamento da página, junta os
// campos em um objeto { name: valor } e mostra erros na tela.
export function aoEnviar(form, acao) {
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = form.querySelector('[type="submit"]');
    if (botao) botao.disabled = true;
    mostrarMensagem(form, '');
    try {
      await acao(Object.fromEntries(new FormData(form)), form);
    } catch (erro) {
      mostrarMensagem(form, erro.message || 'Algo deu errado. Tente novamente.', 'erro');
    } finally {
      if (botao) botao.disabled = false;
    }
  });
}

export function marcarRadio(form, nome, valor) {
  const opcao = form.querySelector(`input[name="${nome}"][value="${valor}"]`);
  if (opcao) opcao.checked = true;
}

// Botão de favorito (coração) usado em várias telas.
export function botaoFavoritoHtml(localId, favoritado, comTexto = false) {
  const rotulo = favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos';
  if (comTexto) {
    return `<button type="button" class="btn-pilula" data-favorito="${localId}" aria-pressed="${favoritado}">
      ${icone('coracao')}<span>${favoritado ? 'Favorito salvo' : 'Salvar favorito'}</span>
    </button>`;
  }
  return `<button type="button" class="btn-icone" data-favorito="${localId}" aria-pressed="${favoritado}" aria-label="${rotulo}" title="${rotulo}">
    ${icone('coracao')}
  </button>`;
}

export function atualizarBotaoFavorito(botao, favoritado) {
  botao.setAttribute('aria-pressed', String(favoritado));
  const rotulo = favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos';
  const texto = botao.querySelector('span');
  if (texto) {
    texto.textContent = favoritado ? 'Favorito salvo' : 'Salvar favorito';
  } else {
    botao.setAttribute('aria-label', rotulo);
    botao.title = rotulo;
  }
}

// ---------- Inicialização automática ----------

function ligarMostrarSenha() {
  document.querySelectorAll('[data-alternar-senha]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const campo = document.getElementById(botao.dataset.alternarSenha);
      const mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      botao.innerHTML = icone(mostrar ? 'olho' : 'olho-fechado');
    });
  });
}

function ligarVoltar() {
  document.querySelectorAll('[data-voltar]').forEach((link) => {
    link.addEventListener('click', (evento) => {
      const veioDoSite = document.referrer && new URL(document.referrer).origin === window.location.origin;
      if (veioDoSite && window.history.length > 1) {
        evento.preventDefault();
        window.history.back();
      }
      // senão, segue o href do link normalmente
    });
  });
}

function usarImagemPadrao(img) {
  if (img.dataset.semImagem) return;
  img.dataset.semImagem = 'true';
  img.src = IMAGEM_PADRAO;
}

function trocarImagensQuebradas() {
  // imagens que já falharam antes deste script rodar
  document.querySelectorAll('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) usarImagemPadrao(img);
  });
  // imagens que falharem daqui em diante (inclusive as criadas pelo JS)
  document.addEventListener(
    'error',
    (evento) => {
      if (evento.target.tagName === 'IMG') usarImagemPadrao(evento.target);
    },
    true
  );
}

trocarImagensQuebradas();
desenharIcones();
ligarMostrarSenha();
ligarVoltar();
