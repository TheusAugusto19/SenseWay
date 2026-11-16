// Tela: Avaliações enviadas (pages/avaliacoes.html)
import { listarMinhasAvaliacoes, listarLocais } from '../api.js';
import { escaparHtml, formatarData } from '../ui.js';

const lista = document.getElementById('lista-avaliacoes');
const vazio = document.getElementById('avaliacoes-vazio');

function cardAvaliacao(avaliacao, nomeLocal) {
  const estrelas = '★'.repeat(avaliacao.nota) + '☆'.repeat(5 - avaliacao.nota);
  return `
    <article class="cartao card-avaliacao">
      <div class="card-avaliacao-topo">
        <div>
          <h2><a href="local.html?id=${avaliacao.localId}">${escaparHtml(nomeLocal)}</a></h2>
          <span class="texto-pequeno">Enviada em ${formatarData(avaliacao.data)}</span>
        </div>
        <span class="nota-estrelas" aria-label="Nota ${avaliacao.nota} de 5">${estrelas}</span>
      </div>
      <p class="card-avaliacao-texto">${escaparHtml(avaliacao.experiencia)}</p>
      <div class="selos">
        <span class="selo ${avaliacao.acessivel ? 'selo--sucesso' : ''}">Local acessível: ${avaliacao.acessivel ? 'Sim' : 'Não'}</span>
        <span class="selo">Muitos ruídos: ${avaliacao.muitoRuido ? 'Sim' : 'Não'}</span>
      </div>
      <p class="texto-pequeno espaco-acima">Nome: ${escaparHtml(avaliacao.nome)}</p>
    </article>`;
}

async function iniciar() {
  try {
    const [avaliacoes, locais] = await Promise.all([listarMinhasAvaliacoes(), listarLocais()]);
    const nomeDoLocal = (id) => locais.find((l) => l.id === id)?.nome || 'Local removido';
    lista.innerHTML = avaliacoes.map((a) => cardAvaliacao(a, nomeDoLocal(a.localId))).join('');
    vazio.hidden = avaliacoes.length > 0;
  } catch (erro) {
    lista.innerHTML = `<p class="carregando">${escaparHtml(erro.message)}</p>`;
  }
}

iniciar();
