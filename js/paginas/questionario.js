// Tela: Questionário (pages/questionario.html  ou  ?tutelado=1)
import { listarPerguntas, salvarQuestionario, buscarUsuarioLogado } from '../api.js';
import { escaparHtml, aoEnviar, parametroUrl, marcarRadio, ir } from '../ui.js';

const form = document.getElementById('form-questionario');
const listaPerguntas = document.getElementById('lista-perguntas');
const titulo = document.getElementById('titulo-questionario');
const tuteladoId = parametroUrl('tutelado');

// Cada pergunta vira um grupo Sim/Não. O "name" é o id da pergunta,
// então o formulário já sai no formato { sonsAltos: 'sim', ... }
function perguntaHtml(pergunta) {
  const id = escaparHtml(pergunta.id);
  return `
    <fieldset class="pergunta">
      <legend>${escaparHtml(pergunta.texto)}</legend>
      <div class="opcoes-radio">
        <label><input type="radio" name="${id}" value="sim" required> Sim</label>
        <label><input type="radio" name="${id}" value="nao"> Não</label>
      </div>
    </fieldset>`;
}

async function iniciar() {
  const [perguntas, usuario] = await Promise.all([listarPerguntas(), buscarUsuarioLogado()]);
  listaPerguntas.innerHTML = perguntas.map(perguntaHtml).join('');

  // Se já respondeu antes, marca as respostas salvas
  let respostasSalvas = usuario.preferencias || {};
  if (tuteladoId) {
    const tutelado = (usuario.tutelados || []).find((t) => t.id === Number(tuteladoId));
    if (tutelado) {
      titulo.textContent = `Preferências de ${tutelado.nome}`;
      respostasSalvas = tutelado.preferencias || {};
    }
  }
  Object.entries(respostasSalvas).forEach(([pergunta, resposta]) => marcarRadio(form, pergunta, resposta));
}

aoEnviar(form, async (respostas) => {
  await salvarQuestionario(respostas, tuteladoId);
  ir('perfil.html');
});

iniciar();
