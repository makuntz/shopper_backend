import express from 'express';
import bodyParser from 'body-parser';
import Measurement from './models/measurement';
import { connectDB } from './db';
import { consultGemini } from './geminiService';
import { v4 as uuidv4 } from 'uuid';

connectDB();

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/upload', async (req, res) => {
    try {
        
        const { image, customer_code, measure_datetime, measure_type } = req.body;

        
        if (!image || typeof image !== 'string' || !customer_code || !measure_datetime || !measure_type) {
            return res.status(400).json({
                error_code: 'INVALID_DATA',
                error_description: 'Invalid or missing required fields',
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
          measure_uuid: measure_uuid,
      });
     
     
    } catch (error) {
        console.error('Error handling /upload request:', error);
        res.status(500).json({
            error_code: 'INTERNAL_SERVER_ERROR',
            error_description: 'Internal Server Error'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
