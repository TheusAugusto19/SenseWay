def comentario():
   print("Deixe seu comentário!")
   local = input("Local: ")
   experiencia = input("experiência: ")
   nome_local = input("Nome do local: ")
   local_acessivel = input("O local é acessível? (Sim/Não): ")
   while local_acessivel.lower() not in ["sim", "não"]:
      print("Resposta inválida. Por favor, responda com 'Sim' ou 'Não'.")
      local_acessivel = input("O local é acessível? (Sim/Não): ")

   local_ruidoso = input("O local é ruidoso? (Sim/Não): ")
   while local_ruidoso.lower() not in ["sim", "não"]:
      print("Resposta inválida. Por favor, responda com 'Sim' ou 'Não'.")
      local_ruidoso = input("O local é ruidoso? (Sim/Não): ")