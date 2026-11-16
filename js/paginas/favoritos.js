// Tela: Favoritos (pages/favoritos.html)
import { listarLocaisFavoritos, alternarFavorito } from '../api.js';
import { escaparHtml, caminhoImagem, icone } from '../ui.js';

const lista = document.getElementById('lista-favoritos');
const vazio = document.getElementById('favoritos-vazio');

function cardFavorito(local) {
  return `
    <article class="cartao card-favorito">
      <img src="${caminhoImagem(local.foto)}" alt="Foto de ${escaparHtml(local.nome)}">
      <div>
        <h2>${icone('coracao')} ${escaparHtml(local.nome)}</h2>
        <p>${escaparHtml(local.descricao)}</p>
        <div class="grupo-botoes">
          <a href="local.html?id=${local.id}" class="btn btn--secundario">Ver local</a>
          <button type="button" class="btn btn--sair" data-remover="${local.id}">Remover</button>
        </div>
      </div>
    </article>`;
}

async function mostrar() {
  try {
    const locais = await listarLocaisFavoritos();
    lista.innerHTML = locais.map(cardFavorito).join('');
    vazio.hidden = locais.length > 0;
  } catch (erro) {
    lista.innerHTML = `<p class="carregando">${escaparHtml(erro.message)}</p>`;
  }
}

lista.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('[data-remover]');
  if (!botao) return;
  await alternarFavorito(botao.dataset.remover);
  mostrar();
});

mostrar();
