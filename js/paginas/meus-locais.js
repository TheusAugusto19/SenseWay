// Tela: Meus locais (empresa/meus-locais.html  ou  ?publicado=1)
import { listarLocaisDaEmpresa, listarConversas } from '../api.js';
import { escaparHtml, caminhoImagem, parametroUrl, icone, formatarHora } from '../ui.js';
import { preencherCabecalhoEmpresa } from './empresa-comum.js';

const lista = document.getElementById('lista-locais-empresa');
const ultimaMensagem = document.getElementById('ultima-mensagem');

document.getElementById('alerta-publicado').hidden = parametroUrl('publicado') !== '1';

function cardLocalEmpresa(local) {
  return `
    <article class="cartao local-empresa">
      <div class="card-local-topo">
        <div>
          <h2>${escaparHtml(local.nome)}</h2>
          <span class="texto-pequeno">${escaparHtml(local.categoria)} · ${escaparHtml(local.cidade)}</span>
        </div>
        <span class="selo selo--sucesso">${icone('check')} Publicado</span>
      </div>
      <div class="local-empresa-corpo">
        <img src="${caminhoImagem(local.foto)}" alt="Foto de ${escaparHtml(local.nome)}">
        <div>
          <span class="sobretitulo">Sobre o local</span>
          <p>${escaparHtml(local.descricao)}</p>
        </div>
      </div>
      <div class="local-empresa-rodape">
        <span class="texto-pequeno">Visível no site do SenseWay · <a href="../pages/local.html?id=${local.id}">ver página</a></span>
        <a href="cadastrar-local.html?id=${local.id}" class="btn btn--secundario btn--pequeno">${icone('lapis')} Editar local</a>
      </div>
    </article>`;
}

async function iniciar() {
  try {
    await preencherCabecalhoEmpresa();
    const [locais, conversas] = await Promise.all([listarLocaisDaEmpresa(), listarConversas()]);

    lista.innerHTML = locais.length
      ? locais.map(cardLocalEmpresa).join('')
      : '<p class="carregando">Você ainda não tem locais. <a href="cadastrar-local.html">Cadastre o primeiro</a>.</p>';

    // Conversa com a mensagem mais recente
    const recente = conversas
      .map((c) => ({ conversa: c, ultima: c.mensagens.at(-1) }))
      .sort((a, b) => b.ultima.dataHora.localeCompare(a.ultima.dataHora))[0];

    ultimaMensagem.innerHTML = recente
      ? `<strong>${escaparHtml(recente.conversa.usuario.nome)} · ${formatarHora(recente.ultima.dataHora)}</strong>
         "${escaparHtml(recente.ultima.texto)}"`
      : 'Nenhuma mensagem por enquanto.';
  } catch (erro) {
    lista.innerHTML = `<p class="carregando">${escaparHtml(erro.message)}</p>`;
  }
}

iniciar();
