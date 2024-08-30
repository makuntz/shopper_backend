import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { consultGemini } from '../geminiService';
import Measurement from '../models/measurement';
import { v4 as uuidv4 } from 'uuid';


jest.mock('../geminiService');
jest.mock('../models/measurement');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/upload', async (req, res) => {
    try {
        const { image, customer_code, measure_datetime, measure_type } = req.body;

        
        if (!image || !customer_code || !measure_datetime || !measure_type) {
            return res.status(400).json({
                error_code: 'INVALID_DATA',
                error_description: 'Invalid or missing required fields',
            });
        }

        if (!/^data:image\/[a-z]+;base64,/.test(image)) {
            return res.status(400).json({
                error_code: 'INVALID_IMAGE',
                error_description: 'Invalid image data format.',
            });
        }

        
        const startOfMonth = new Date(new Date(measure_datetime).setDate(1));
        const endOfMonth = new Date(new Date(startOfMonth).setMonth(startOfMonth.getMonth() + 1));

        const existingMeasurement = await Measurement.findOne({
            customer_code,
            measure_type,
            measure_datetime: {
                $gte: startOfMonth,
                $lt: endOfMonth,
            },
        });

        if (existingMeasurement) {
            return res.status(409).json({
                error_code: 'DOUBLE_REPORT',
                error_description: 'Leitura do mês já realizada',
            });
        }

        
        const result = await consultGemini(image);

        
        const measure_uuid = uuidv4();

        
        const newMeasurement = new Measurement({
            image: result.image_url,
            customer_code,
            measure_datetime,
            measure_type,
            measurement_value: result.measure_value,
        });

        await newMeasurement.save();

        
        res.status(200).json({
            image_url: result.image_url,
            measure_value: result.measure_value,
            measure_uuid,
        });
    } catch (error) {
        console.error('Error handling /upload request:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            error_description: 'Erro interno do servidor'
        });
    }
});

describe('POST /upload', () => {
    it('should successfully process the image and return measurement data', async () => {
        const mockResponse = {
            image_url: 'http://example.com/leitura.jpeg',
            measure_value: 42
        };

        (consultGemini as jest.Mock).mockResolvedValue(mockResponse);
        (Measurement.findOne as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .post('/upload')
            .send({
                image: 'data:image/jpeg;base64,...',
                customer_code: '12345',
                measure_datetime: '2024-08-28T12:00:00Z',
                measure_type: 'water'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('image_url', 'http://example.com/leitura.jpeg');
        expect(response.body).toHaveProperty('measure_value', 42);
        expect(response.body).toHaveProperty('measure_uuid');
    });

    it('should return 400 if any required field is missing', async () => {
        const response = await request(app)
            .post('/upload')
            .send({
                image: 'data:image/jpeg;base64,...',
                customer_code: '12345'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error_code', 'INVALID_DATA');
        expect(response.body).toHaveProperty('error_description', 'Invalid or missing required fields');
    });

    it('should return 400 if image format is invalid', async () => {
        const response = await request(app)
            .post('/upload')
            .send({
                image: 'invalid_image_format',
                customer_code: '12345',
                measure_datetime: '2024-08-28T12:00:00Z',
                measure_type: 'water'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error_code', 'INVALID_IMAGE');
        expect(response.body).toHaveProperty('error_description', 'Invalid image data format.');
    });

    it('should return 409 if a measurement for the month already exists', async () => {
        const existingMeasurement = {
            image: 'http://example.com/leitura.jpeg',
            customer_code: '12345',
            measure_datetime: '2024-08-28T12:00:00Z',
            measure_type: 'water',
            measurement_value: 42
        };

        (Measurement.findOne as jest.Mock).mockResolvedValue(existingMeasurement);

        const response = await request(app)
            .post('/upload')
            .send({
                image: 'data:image/jpeg;base64,...',
                customer_code: '12345',
                measure_datetime: '2024-08-28T12:00:00Z',
                measure_type: 'water'
            });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('error_code', 'DOUBLE_REPORT');
        expect(response.body).toHaveProperty('error_description', 'Leitura do mês já realizada');
    });

    it('should return 500 if there is an error consulting Gemini', async () => {
        (consultGemini as jest.Mock).mockRejectedValue(new Error('Error consulting Gemini'));
        (Measurement.findOne as jest.Mock).mockResolvedValue(null); 

        const response = await request(app)
            .post('/upload')
            .send({
                image: 'data:image/jpeg;base64,...',
                customer_code: '12345',
                measure_datetime: '2024-08-28T12:00:00Z',
                measure_type: 'water'
            });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error_code', 'SERVER_ERROR');
        expect(response.body).toHaveProperty('error_description', 'Erro interno do servidor');
    });
});
