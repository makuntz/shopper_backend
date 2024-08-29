import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.API_KEY || '';

// const key = 'AIzaSyCjzYjXSOKyeyk3QkXdzUsdg9-qhv9Qmb0';

const fileManager = new GoogleAIFileManager(key);
const genAI = new GoogleGenerativeAI(key);


export async function consultGemini(imageBase64: string) {
    try {

       // Salva a imagem base64 em um arquivo temporário
       const tempFilePath = path.join(__dirname, `temp_${uuidv4()}.jpeg`);
       fs.writeFileSync(tempFilePath, Buffer.from(imageBase64, 'base64'));
          
      const uploadResponse = await fileManager.uploadFile("leitura.jpeg", {
        mimeType: "image/jpeg",
        displayName: "Leitura",
      });
      
      fs.unlinkSync(tempFilePath);  // Deleta o arquivo temporário

      // console.log(`Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`);

      // const getResponse = await fileManager.getFile(uploadResponse.file.name);

      // console.log(`Retrieved file ${getResponse.displayName} as ${getResponse.uri}`);
        
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      
      const result = await model.generateContent([
          {
              fileData: {
                  mimeType: uploadResponse.file.mimeType,
                  fileUri: uploadResponse.file.uri
              }
          },

          { text: "Extract the measure from this image" }
      ]);

      console.log(result, 'result foi')
      const measure_value = parseFloat(result.response.text());

      
      return {
          image_url: uploadResponse.file.uri,
          measure_value,
      };

      
      // console.log(result.response.text())

        
    } catch (error) {
        console.error('Error consulting Gemini: ', error);
        throw new Error('Error consulting Gemini');
    }
};
