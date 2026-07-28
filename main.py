from usuario.login import login 
from usuario.anamnese import anamnese
from usuario.cadastro import  cadastrar,cadastroEmpresa
from usuario.comentario import comentario 

print("Bem vindo ao SenseWay" )
print("Você é um usuário ou uma empresa?")
quemE = input("Usuário       |      Empresa\n")
if quemE.lower() == "usuario":
    print("Ja tem um login? Digite 'Login' para acessar ou 'Cadastrar' para criar uma conta.ca")
    acesso = input("Login       |     Cadastrar \n")
    if acesso.lower()== "cadastrar":
        cadastrar()
    elif acesso.lower()== "login":
        login()
    print ("fazer anamnese do usuário ou um comentário?: ")
    escolha = input ("Anamnese       |       Comentário       |       Prosseguir para o sistema ")
    if escolha.lower()== "Anamnese":
        anamnese()
    elif escolha.lower() == "Comentário":
        comentario()

elif quemE.lower()== "Empresa":
    acesso = input("Login       |     Cadastrar \n")
    if acesso.lower()== "cadastrar":
            cadastroEmpresa()
    elif acesso.lower()== "login":
            login()

    print ("fazer anamnese do usuário ou um comentário?: ")
    escolha = input ("Anamnese       |       Comentário       |       Prosseguir para o sistema ")
    if escolha.lower()== "Anamnese":
        anamnese()
    elif escolha.lower() == "Comentário":
        comentario()

     
