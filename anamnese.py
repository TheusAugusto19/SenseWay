print("Bem-vindo(a) a anamnese do usuário")
defi = input(
    "O usuário possui neurodivergência (tipo 1) e/ou deficiência física?(tipo 2):"
)

if defi.lower() == "tipo 1":
    condicao1 = input(
        "Qual é ou quais são os fatores que causam incômodo ao usuário? (luz forte, som alto, texturas, multidão): "
    )
    print(
        "Anamnese salva com sucesso! O usuário foi classificado como tipo 1 (neurodivergente). O usuário se incomoda com: ",
        condicao1,
    )

elif defi.lower() == "tipo 2":
    condicao2 = input(
        "Qual é ou quais são as deficiências físicas que impactam na vida do usuário? (cegueira, surdez, cadeirante, utiliza bengala, andador ou objetos de apoio): "
    )
    print(
        "Anamnese salva com sucesso! O usuário foi classificado como tipo 2 (deficiente físico). O usuário possui e/ou necessita de: ",
        condicao2,
    )

# Esse bloco trata o erro caso digitem algo diferente!
else:
    print("Opção inválida! Por favor, execute novamente e digite 'tipo 1' ou 'tipo 2'.")