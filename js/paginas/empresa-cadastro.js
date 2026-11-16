// Tela: Crie sua conta — empresa (empresa/cadastro.html)
import { cadastrarEmpresa } from '../api.js';
import { aoEnviar, ir } from '../ui.js';

aoEnviar(document.getElementById('form-cadastro-empresa'), async (dados) => {
  await cadastrarEmpresa(dados);
  // Conta criada: próximo passo é cadastrar o primeiro local
  ir('cadastrar-local.html');
});
