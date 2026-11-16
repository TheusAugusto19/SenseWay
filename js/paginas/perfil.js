// Tela: Meu perfil (pages/perfil.html)
import { buscarUsuarioLogado, sair } from '../api.js';
import { escaparHtml, formatarData, ir } from '../ui.js';

const dados = document.getElementById('dados-perfil');
const cartaoTutelados = document.getElementById('cartao-tutelados');
const listaTutelados = document.getElementById('lista-tutelados');

function preencher(campo, valor) {
  // textContent nunca interpreta HTML: seguro para dados do banco
  dados.querySelector(`[data-campo="${campo}"]`).textContent = valor;
}

async function iniciar() {
  try {
    const usuario = await buscarUsuarioLogado();
    preencher('nome', usuario.nome);
    preencher('email', usuario.email);
    preencher('dataNascimento', formatarData(usuario.dataNascimento) || 'Não informada');
    preencher('tutor', usuario.tutor ? 'Sim' : 'Não');

    const tutelados = usuario.tutelados || [];
    cartaoTutelados.hidden = tutelados.length === 0;
    listaTutelados.innerHTML = tutelados
      .map((t) => `
        <li>
          <span>${escaparHtml(t.nome)}</span>
          <a href="questionario.html?tutelado=${t.id}" class="link-pequeno">Preferências</a>
        </li>`)
      .join('');
  } catch (erro) {
    preencher('nome', erro.message);
  }
}

document.getElementById('botao-sair').addEventListener('click', async () => {
  await sair();
  ir('../index.html');
});

iniciar();
