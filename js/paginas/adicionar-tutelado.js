// Tela: Adicionar tutelado (pages/adicionar-tutelado.html)
import { adicionarTutelado } from '../api.js';
import { aoEnviar, ir } from '../ui.js';

aoEnviar(document.getElementById('form-tutelado'), async (dados) => {
  const tutelado = await adicionarTutelado(dados.nome);
  // Próximo passo: preferências de acessibilidade deste tutelado
  ir(`questionario.html?tutelado=${tutelado.id}`);
});
