// Tela: Detalhe do local (pages/local.html?id=1)
import { buscarLocal, listarIdsFavoritos, alternarFavorito, enviarMensagemParaEmpresa } from '../api.js';
import {
  escaparHtml, parametroUrl, caminhoImagem, botaoFavoritoHtml,
  atualizarBotaoFavorito, aoEnviar, mostrarMensagem
} from '../ui.js';

const detalhe = document.getElementById('detalhe-local');
const formMensagem = document.getElementById('form-mensagem');
const id = parametroUrl('id');

async function iniciar() {
  if (!id) {
    detalhe.innerHTML = '<p class="carregando">Nenhum local escolhido. <a href="locais.html">Ver locais</a></p>';
    formMensagem.hidden = true;
    return;
  }
  try {
    const [local, favoritos] = await Promise.all([buscarLocal(id), listarIdsFavoritos()]);
    document.title = `${local.nome} | SenseWay`;
    detalhe.innerHTML = `
      <div class="detalhe-topo">
        <h2>${escaparHtml(local.nome)}</h2>
        ${botaoFavoritoHtml(local.id, favoritos.includes(local.id), true)}
      </div>
      <img src="${caminhoImagem(local.foto)}" alt="Foto de ${escaparHtml(local.nome)}" class="foto-local">
      <p>${escaparHtml(local.descricao)}</p>
      <div class="selos">
        <span class="selo selo--lilas">${escaparHtml(local.categoria)}</span>
        <span class="selo selo--lilas">${escaparHtml(local.cidade)}</span>
        ${local.recursos.map((r) => `<span class="selo">${escaparHtml(r)}</span>`).join('')}
      </div>
      <div class="detalhe-rodape">
        <span class="texto-pequeno">Já visitou? Conte para a comunidade.</span>
        <a href="comentario.html?local=${local.id}" class="btn btn--secundario btn--pequeno">Avaliar este local</a>
      </div>`;
  } catch (erro) {
    detalhe.innerHTML = `<p class="carregando">${escaparHtml(erro.message)} <a href="locais.html">Voltar aos locais</a></p>`;
    formMensagem.hidden = true;
  }
}

detalhe.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('[data-favorito]');
  if (!botao) return;
  atualizarBotaoFavorito(botao, await alternarFavorito(botao.dataset.favorito));
});

aoEnviar(formMensagem, async (dados, form) => {
  await enviarMensagemParaEmpresa(id, dados.mensagem);
  form.reset();
  mostrarMensagem(form, 'Mensagem enviada! A empresa vai responder pela sua área de mensagens.', 'sucesso');
});

iniciar();
