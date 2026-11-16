// Tela: Nova senha (pages/nova-senha.html)
import { redefinirSenha } from '../api.js';
import { aoEnviar, mostrarMensagem, ir } from '../ui.js';

const form = document.getElementById('form-nova-senha');

aoEnviar(form, async (dados) => {
  await redefinirSenha(dados.email, dados.novaSenha, dados.confirmarSenha);
  mostrarMensagem(form, 'Senha alterada! Levando você para o login...', 'sucesso');
  setTimeout(() => ir('login.html'), 1200);
});
