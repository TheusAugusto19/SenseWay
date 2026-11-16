// Tela: Acesse sua empresa (empresa/login.html)
import { loginEmpresa } from '../api.js';
import { aoEnviar, ir } from '../ui.js';

aoEnviar(document.getElementById('form-login-empresa'), async (dados) => {
  await loginEmpresa(dados.email, dados.senha);
  ir('meus-locais.html');
});
