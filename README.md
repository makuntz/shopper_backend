
# Projeto de Gerenciamento de Leitura de Consumo
Este projeto é um serviço backend para o gerenciamento de leituras individualizadas de consumo de água e gás. Utiliza inteligência artificial para processar imagens de medidores e extrair as leituras de consumo. O serviço fornece endpoints para upload de imagens, validação de dados, e consulta de medições.

## Funcionalidades
Upload de Imagens: Recebe uma imagem de medidor em base64 e extrai a leitura de consumo.
Validação de Dados: Verifica se a leitura é válida e se não há duplicidade de leitura no mesmo mês.
Consulta a AI (Gemini): Usa a API Gemini da Google para processar a imagem e obter a leitura.

## Tecnologias Utilizadas
Node.js
Express
TypeScript
Docker
Google Cloud - Gemini API
Requisitos
Node.js v16.x ou superior
Docker
Chave Gemini API

## Instalação
1. Clone o repositório:

git clone https://github.com/makuntz/shopper_backend.git

2. Instale as dependências:

npm install

3. Configure as variáveis de ambiente:

Crie um arquivo .env na raiz do projeto com as seguintes informações:

GOOGLE_API_KEY=sua_chave

4. Execute o Docker:

docker-compose up --build

## Endpoint

POST /upload
Este endpoint recebe uma imagem de medidor em base64 e retorna a leitura extraída, juntamente com um UUID para referência.

Requisição:

URL: /upload

Método: POST

Body (exemplo):
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
  "customer_code": "12345",
  "measure_datetime": "2023-08-29T12:00:00Z",
  "measure_type": "WATER"
}


### Respostas

1. 200 OK: 

{
  "image_url": "http://example.com/leitura.jpeg",
  "measure_value": 42,
  "measure_uuid": "some-uuid"
}

2. 400 Bad Request:

{
  "error_code": "INVALID_DATA",
  "error_description": "Invalid or missing required fields"
}

3. 409 Conflict:

{
  "error_code": "DOUBLE_REPORT",
  "error_description": "Leitura do mês já realizada"
}

4. 500 Internal Server Error:

{
  "error_code": "SERVER_ERROR",
  "error_description": "Erro interno do servidor"
}


## Testes
Os testes para o projeto são escritos com o framework Jest e a biblioteca Supertest para testar a API Express. Para rodar os testes, siga as instruções abaixo:

### Executar testes

npm test


## Gestão de Cotas e Limites
O projeto utiliza a API Gemini do Google para extrair leituras das imagens. Este serviço tem uma cota limitada de requisições, que pode ser verificada e gerida através do Google Cloud Console.

Resolução de Problemas
Erro 429 (Too Many Requests): Esse erro indica que a cota foi excedida. Você pode aguardar a renovação da cota ou solicitar um aumento através do Google Cloud Console.