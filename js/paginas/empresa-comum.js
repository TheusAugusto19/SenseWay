// Partes repetidas da área da empresa (nome e iniciais no cabeçalho)
import { buscarEmpresaLogada } from '../api.js';
import { iniciais } from '../ui.js';

export async function preencherCabecalhoEmpresa() {
  const empresa = await buscarEmpresaLogada();
  document.querySelectorAll('[data-empresa-nome]').forEach((el) => {
    el.textContent = empresa.nome;
  });
  document.querySelectorAll('[data-empresa-iniciais]').forEach((el) => {
    el.textContent = iniciais(empresa.nome);
  });
  return empresa;
}
