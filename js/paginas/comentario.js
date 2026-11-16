// Tela: Deixe seu comentário (pages/comentario.html?local=1)
import { listarLocais, buscarUsuarioLogado, enviarAvaliacao } from '../api.js';
import { aoEnviar, parametroUrl, ir } from '../ui.js';

const form = document.getElementById('form-avaliacao');
const selectLocal = form.elements.localId;

async function iniciar() {
  const [locais, usuario] = await Promise.all([listarLocais(), buscarUsuarioLogado()]);

  // Cria uma <option> para cada local do banco (value = id)
  locais.forEach((local) => {
    selectLocal.add(new Option(local.nome, local.id));
  });

  const localDaUrl = parametroUrl('local');
  if (localDaUrl) selectLocal.value = localDaUrl;
  form.elements.nome.value = usuario.nome;
}

aoEnviar(form, async (dados) => {
  await enviarAvaliacao(dados);
  ir('avaliacoes.html');
});

iniciar();
