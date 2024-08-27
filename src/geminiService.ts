import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import axios from 'axios';

import dotenv from 'dotenv';
dotenv.config();


const API_KEY = process.env.GEMINI_API_KEY || '';

const fileManager = new GoogleAIFileManager(API_KEY)
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({model: 'gemini-1.5-pro' });

interface GeminiRequest {
    image: string;
    customer_code: string;
    measure_datetime: string;
    measure_type: 'WATER' | 'GAS';
}

export async function consultGemini({ image, customer_code, measure_datetime, measure_type }: GeminiRequest): Promise<{ measurement: number; id: string }> {
    try {

        const buffer = Buffer.from(image, 'base64');

        const filePart = {
          inlineData: buffer.toString('base64'),
          mimeType: 'image/jpeg'
        }

        const uploadResponse = await fileManager.uploadFile('uploaded_image', {
          mimeType: 'image/jpeg',
          displayName: 'Uploaded Image'
        })

        const result = await model.generateContent([
          {
            fileData: {
              mimeType: uploadResponse.file.mimeType,
              fileUri: uploadResponse.file.uri
            }
          },
          {
            text: "Extract the measure from this image"
          }
        ]);

        console.log('Generate Content Response:', result);

        const responseText = await result.response.text();
        const measurement = parseFloat(responseText)
        const id = uploadResponse.file.uri

        return {
          measurement: isNaN(measurement) ? 0 : measurement,
          id: id
        }

        

       
    } catch (error) {
      console.error('Error consulting Gemini: ', error);
      throw new Error('Error consulting Gemini');
    }
};