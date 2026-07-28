from usuario.sla import email_cadastrado, senha_cadastrada
#faz o login do usuário / empresa 
def login():
    print("Bem vindo ao SenseWay")
    while True:
     email = input("Email: ")
     senha = input("Senha: ")

     if email == email_cadastrado and senha == senha_cadastrada:
         print("Login realizado com sucesso!")
         break
     else:
         print("Email ou senha incorretos. Tente novamente.")
