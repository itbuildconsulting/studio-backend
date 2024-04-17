# Use a imagem oficial do Node.js como base
FROM node:20

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie os arquivos do seu projeto para o diretório de trabalho
COPY package.json /app/package.json
COPY index.js /app/index.js

# Instale as dependências do projeto
RUN npm install

# Exponha a porta em que sua aplicação estará escutando
EXPOSE 3000

# Comando para iniciar sua aplicação quando o contêiner for iniciado
CMD ["npm", "start"]