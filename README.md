# SenseWay

Aplicativo assistivo de avaliação de locais, com foco em acessibilidade e inclusão. O SenseWay ajuda a identificar, avaliar e recomendar ambientes **autism-friendly** e adequados para pessoas com deficiência física, visual e/ou auditiva — levando em conta fatores sensoriais como nível de ruído, iluminação, lotação e estímulos táteis.

## 🎯 Objetivos

- Reduzir crises sensoriais causadas por ambientes inadequados
- Ajudar famílias a planejarem melhor passeios e atividades
- Promover a inclusão social
- Incentivar estabelecimentos a adaptarem seus espaços
- Criar uma rede colaborativa de informação confiável

## 🧩 Funcionalidades

### Já em desenvolvimento
- **Login de empresas** — autenticação para estabelecimentos gerenciarem suas informações no sistema
- **Avaliação de locais** — formulário de comentário/avaliação cobrindo:
  - Acessibilidade do local
  - Nível de ruído
  - Outros fatores sensoriais (em expansão)

### Planejadas
- Cadastro e login de usuários finais (famílias/visitantes)
- Busca e recomendação de locais com base em critérios sensoriais e de acessibilidade
- Sistema de avaliação colaborativa (rede de informação entre usuários)
- Painel para estabelecimentos visualizarem feedback e se adaptarem
- Interface web (a partir do design já iniciado no Figma)

## 📁 Estrutura do projeto

Estrutura atual do repositório:

```
SenseWay/
├── index.html          # Página inicial (front-end)
├── main.py              # Ponto de entrada da aplicação
└── usuario/
    ├── login.py          # Lógica de login/cadastro
    └── sla.py            # Variáveis de validação (email/senha cadastrados)
```

Estrutura sugerida conforme o projeto crescer:

```
SenseWay/
├── main.py                  # Ponto de entrada
├── requirements.txt         # Dependências do projeto
├── README.md
├── usuario/
│   ├── __init__.py
│   ├── login.py             # Autenticação de empresas/usuários
│   └── models.py            # Estrutura de dados de usuário/empresa
├── locais/
│   ├── __init__.py
│   ├── avaliacao.py          # Lógica de avaliação/comentário de locais
│   └── models.py             # Estrutura de dados do local (ruído, acessibilidade, etc.)
├── templates/                # Páginas HTML (se for web)
│   └── index.html
├── static/                   # CSS, JS, imagens
└── design/                   # Referências do Figma (prints ou links)
```

> 💡 Sugestão: separar a lógica de **usuário/empresa** da lógica de **locais/avaliações** em módulos distintos facilita manter e testar cada parte independentemente.

## 🛠️ Tecnologias

- **Python** — lógica principal do back-end
- **HTML** — interface (`index.html`)
- *(stack de front-end/back-end ainda a ser definida — ver seção "Próximos passos")*

## 🎨 Design

O design do aplicativo está sendo desenvolvido no Figma. *(adicionar link do protótipo aqui)*

## 🚀 Como rodar o projeto

```bash
git clone https://github.com/TheusAugusto19/SenseWay.git
cd SenseWay
python main.py
```

> ⚠️ Instruções de instalação de dependências serão adicionadas conforme o projeto define sua stack definitiva.

## 🗺️ Próximos passos

- [ ] Definir se o projeto será web (Flask/Django) ou desktop (Eel/PyWebview/Tkinter)
- [ ] Estruturar o banco de dados para armazenar locais e avaliações
- [ ] Integrar o design do Figma à interface
- [ ] Implementar cadastro de usuários finais
- [ ] Implementar sistema de busca/recomendação de locais

## 🤝 Contribuindo

Projeto em desenvolvimento inicial. Sugestões e contribuições são bem-vindas — abra uma *issue* ou *pull request*.

## 📄 Licença

*(definir licença do projeto)*
