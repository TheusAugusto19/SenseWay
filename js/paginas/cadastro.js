// Tela: Crie sua conta (pages/cadastro.html)
import { cadastrarUsuario } from '../api.js';
import { aoEnviar, ir } from '../ui.js';

const form = document.getElementById('form-cadastro');
const senha = form.elements.senha;
const confirmar = form.elements.confirmarSenha;

// Avisa na hora se as senhas forem diferentes (validação nativa do navegador)
function conferirSenhas() {
  confirmar.setCustomValidity(confirmar.value && confirmar.value !== senha.value ? 'As senhas não conferem.' : '');
}
senha.addEventListener('input', conferirSenhas);
confirmar.addEventListener('input', conferirSenhas);

aoEnviar(form, async (dados) => {
  await cadastrarUsuario(dados);
  ir(dados.tutor === 'sim' ? 'adicionar-tutelado.html' : 'questionario.html');
});
