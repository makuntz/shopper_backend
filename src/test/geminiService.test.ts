import { consultGemini } from '../geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';


jest.mock('@google/generative-ai');
jest.mock('@google/generative-ai/server');
jest.mock('fs');
jest.mock('path');

describe('consultGemini', () => {
  it('should handle successful response', async () => {
    const mockUploadResponse = {
      file: {
        displayName: 'leitura.jpeg',
        uri: 'http://example.com/leitura.jpeg',
        mimeType: 'image/jpeg'
      }
    };

    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => '42'
      }
    });

    (GoogleAIFileManager.prototype.uploadFile as jest.Mock).mockResolvedValue(mockUploadResponse);
    (GoogleGenerativeAI.prototype.getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent
    });

    const base64Image = 'data:image/jpeg;base64,...';

    const result = await consultGemini(base64Image);

    expect(result).toEqual({
      image_url: 'http://example.com/leitura.jpeg',
      measure_value: 42
    });
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should handle errors during file upload', async () => {
    (GoogleAIFileManager.prototype.uploadFile as jest.Mock).mockRejectedValue(new Error('Upload error'));

    const base64Image = 'data:image/jpeg;base64,...';

    await expect(consultGemini(base64Image)).rejects.toThrow('Error consulting Gemini');
  });

  it('should handle errors during content generation', async () => {
    const mockUploadResponse = {
      file: {
        displayName: 'leitura.jpeg',
        uri: 'http://example.com/leitura.jpeg',
        mimeType: 'image/jpeg'
      }
    };

    (GoogleAIFileManager.prototype.uploadFile as jest.Mock).mockResolvedValue(mockUploadResponse);
    (GoogleGenerativeAI.prototype.getGenerativeModel as jest.Mock).mockReturnValue({
      generateContent: jest.fn().mockRejectedValue(new Error('Generation error'))
    });

    const base64Image = 'data:image/jpeg;base64,...';

    await expect(consultGemini(base64Image)).rejects.toThrow('Error consulting Gemini');
  });
});
