// Tela: Editar perfil (pages/editar-perfil.html)
import { buscarUsuarioLogado, atualizarUsuario } from '../api.js';
import { aoEnviar, marcarRadio, ir } from '../ui.js';

const form = document.getElementById('form-editar-perfil');
const campoFoto = document.getElementById('foto');
const previaAvatar = document.getElementById('previa-avatar');

async function iniciar() {
  const usuario = await buscarUsuarioLogado();
  form.elements.nome.value = usuario.nome;
  form.elements.email.value = usuario.email;
  form.elements.dataNascimento.value = usuario.dataNascimento || '';
  marcarRadio(form, 'tutor', usuario.tutor ? 'sim' : 'nao');
}

// Mostra a foto escolhida antes de enviar (só no navegador)
campoFoto.addEventListener('change', () => {
  const arquivo = campoFoto.files[0];
  if (!arquivo) return;
  const img = document.createElement('img');
  img.src = URL.createObjectURL(arquivo);
  img.alt = 'Prévia da nova foto';
  previaAvatar.replaceChildren(img);
});

aoEnviar(form, async (dados) => {
  // A foto vai para o servidor na integração (FormData). Aqui só os dados.
  const { foto, ...perfil } = dados;
  await atualizarUsuario(perfil);
  ir('perfil.html');
});

iniciar();
