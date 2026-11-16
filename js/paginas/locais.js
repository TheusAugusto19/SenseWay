// Tela: Sugestões de locais (pages/locais.html)
import { listarLocais, listarIdsFavoritos, alternarFavorito } from '../api.js';
import { escaparHtml, botaoFavoritoHtml, atualizarBotaoFavorito } from '../ui.js';

const lista = document.getElementById('lista-locais');
const busca = document.getElementById('busca-locais');

let locais = [];
let favoritos = [];

// Molde do card: o MESMO formato para todo local que vier do banco
function cardLocal(local) {
  const favoritado = favoritos.includes(local.id);
  return `
    <article class="cartao card-local">
      <div class="card-local-topo">
        <h2><a href="local.html?id=${local.id}">${escaparHtml(local.nome)}</a></h2>
        ${botaoFavoritoHtml(local.id, favoritado)}
      </div>
      <p>${escaparHtml(local.descricao)}</p>
      <div class="selos">
        ${local.recursos.map((r) => `<span class="selo">${escaparHtml(r)}</span>`).join('')}
      </div>
    </article>`;
}

function semAcento(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function mostrar() {
  const termo = semAcento(busca.value.trim());
  const filtrados = locais.filter((l) =>
    semAcento(`${l.nome} ${l.descricao} ${l.categoria} ${l.recursos.join(' ')}`).includes(termo)
  );
  lista.innerHTML = filtrados.length
    ? filtrados.map(cardLocal).join('')
    : '<p class="carregando">Nenhum local encontrado para essa busca.</p>';
}

async function iniciar() {
  try {
    [locais, favoritos] = await Promise.all([listarLocais(), listarIdsFavoritos()]);
    mostrar();
  } catch (erro) {
    lista.innerHTML = `<p class="carregando">${escaparHtml(erro.message)}</p>`;
  }
}

busca.addEventListener('input', mostrar);

// Um único "ouvinte" para todos os corações (delegação de eventos)
lista.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('[data-favorito]');
  if (!botao) return;
  const favoritado = await alternarFavorito(botao.dataset.favorito);
  favoritos = favoritado
    ? [...favoritos, Number(botao.dataset.favorito)]
    : favoritos.filter((id) => id !== Number(botao.dataset.favorito));
  atualizarBotaoFavorito(botao, favoritado);
});

iniciar();
