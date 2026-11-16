// Tela: Cadastre seu local (empresa/cadastrar-local.html  ou  ?id=1 para editar)
import { buscarLocal, salvarLocal } from '../api.js';
import { aoEnviar, parametroUrl, caminhoImagem, ir } from '../ui.js';
import { preencherCabecalhoEmpresa } from './empresa-comum.js';

const form = document.getElementById('form-local');
const campoFoto = form.elements.foto;
const dropzone = document.getElementById('dropzone');
const textoDropzone = document.getElementById('texto-dropzone');
const previaFoto = document.getElementById('previa-foto');
const previaNome = document.getElementById('previa-nome');
const previaDescricao = document.getElementById('previa-descricao');
const idEdicao = parametroUrl('id');

// Prévia ao vivo: atualiza o cartão da direita enquanto a pessoa digita
function atualizarPrevia() {
  previaNome.textContent = form.elements.nome.value || 'Nome do local';
  const descricao = form.elements.descricao.value;
  previaDescricao.textContent = descricao
    ? descricao.slice(0, 140) + (descricao.length > 140 ? '...' : '')
    : 'A descrição aparece aqui enquanto você digita.';
}

function mostrarFoto(arquivo) {
  if (!arquivo || !arquivo.type.startsWith('image/')) return;
  previaFoto.src = URL.createObjectURL(arquivo);
  textoDropzone.textContent = arquivo.name;
}

form.elements.nome.addEventListener('input', atualizarPrevia);
form.elements.descricao.addEventListener('input', atualizarPrevia);
campoFoto.addEventListener('change', () => mostrarFoto(campoFoto.files[0]));

// Arrastar e soltar a foto
['dragenter', 'dragover'].forEach((tipo) =>
  dropzone.addEventListener(tipo, (evento) => {
    evento.preventDefault();
    dropzone.classList.add('arrastando');
  })
);
['dragleave', 'drop'].forEach((tipo) =>
  dropzone.addEventListener(tipo, () => dropzone.classList.remove('arrastando'))
);
dropzone.addEventListener('drop', (evento) => {
  evento.preventDefault();
  if (evento.dataTransfer.files.length) {
    campoFoto.files = evento.dataTransfer.files;
    mostrarFoto(campoFoto.files[0]);
  }
});

async function iniciar() {
  await preencherCabecalhoEmpresa();
  if (!idEdicao) return;

  // Modo edição: preenche o formulário com o local do banco
  const local = await buscarLocal(idEdicao);
  document.getElementById('titulo-pagina').textContent = 'Edite seu local';
  document.getElementById('status-local').textContent = 'Publicado';
  form.elements.id.value = local.id;
  form.elements.nome.value = local.nome;
  form.elements.categoria.value = local.categoria;
  form.elements.cidade.value = local.cidade;
  form.elements.descricao.value = local.descricao;
  form.querySelectorAll('input[name="recursos"]').forEach((caixa) => {
    caixa.checked = local.recursos.includes(caixa.value);
  });
  previaFoto.src = caminhoImagem(local.foto);
  atualizarPrevia();
}

aoEnviar(form, async (_dados, formulario) => {
  const dados = new FormData(formulario);
  await salvarLocal({
    id: dados.get('id'),
    nome: dados.get('nome'),
    categoria: dados.get('categoria'),
    cidade: dados.get('cidade'),
    descricao: dados.get('descricao'),
    recursos: dados.getAll('recursos') // checkboxes: várias respostas
  });
  ir('meus-locais.html?publicado=1');
});

iniciar();
