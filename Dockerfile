FROM node:18-alpine

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar o restante do código
COPY . .

# Compilar o TypeScript
RUN npm run build

# Expor a porta da aplicação
EXPOSE 80

# Comando para iniciar a aplicação
CMD ["npm", "run", "dev"]

