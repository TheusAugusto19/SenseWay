// Tela: Acesse sua conta (pages/login.html)
import { login } from '../api.js';
import { aoEnviar, ir } from '../ui.js';

aoEnviar(document.getElementById('form-login'), async (dados) => {
  await login(dados.email, dados.senha);
  ir('locais.html');
});
