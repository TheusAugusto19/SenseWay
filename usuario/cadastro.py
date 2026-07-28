#Faz o cadastro do usuário
def cadastrar():
    nome = input("Nome: ")
    email_cadastrado= input("Email: ")
    while True:
        data = input("Data de nascimento: ")
        if data.isdigit() and len(data)>7:
            data = int(data) 
            break
    senha_cadastrada= input("Senha: ")
    while True:
        csenha= input("Confirme a senha: ")
        if csenha == senha_cadastrada:
            break
        else:
            print("As senhas não coincidem, tente novamente!")
    while True:
     tutor = input("Você é um tutor? (Sim/Não): ")
     if tutor.lower() in ["sim", "não"]:
       break
     else:
        print("Resposta inválida. Por favor, responda com 'Sim' ou 'Não'.")
    print("Cadastro completo!")
    
    print("Bem vindo ao SenseWay")
    while True:
     email = input("Email: ")
     senha = input("Senha: ")

     if email == email_cadastrado and senha == senha_cadastrada:
         print("Login realizado com sucesso!")
         break
     else:
         print("Email ou senha incorretos. Tente novamente.")  


#faz o cadastro da empresa
def cadastroEmpresa():
    print("=== CADASTRO DE EMPRESA ===")
    nome_empresa = input("Nome da empresa: ")   
    cnpj = input("CNPJ: ")
    endereco = input("Endereço: ")
    cidade = input("Cidade: ")
    telefone = input("Telefone: ")
    email = input("Email: ")
    categoria = input("Categoria da empresa: ")
