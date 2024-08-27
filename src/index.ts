import express from 'express';
import bodyparser from 'body-parser';
import Measurement from './models/measurement';
import { connectDB } from './db';
import { consultGemini } from './geminiService';

connectDB();

const app = express();
const port = 80;

app.use(bodyparser.json())

app.post('/upload', async (req, res) => {
  try{
    const { image, customer_code, measure_datetime, measure_type } = req.body;

    if(!image || !customer_code || !measure_datetime || !measure_type) {
        return res.status(400).send('No image provided!')
    }

    if(measure_type !== 'WATER' && measure_type !== 'GAS') {
      return res.status(400).send('Invalid measure_type')
    }
    const {measurement, id} = await consultGemini({image, customer_code, measure_datetime, measure_type})

    const existingMeasurement = await Measurement.findOne({
      customer_code,
      measure_datetime: {
        $gte: new Date(new Date(measure_datetime).getFullYear(), new Date(measure_datetime).getMonth(), 1),
        $lt: new Date(new Date(measure_datetime).getFullYear(), new Date(measure_datetime).getMonth() + 1, 1)
      },
      measure_type,
    });

    if (existingMeasurement) {
      return res.status(400).send('A reading already exists for this customer and month.')
    }

    const measurementRecord = new Measurement({
      image,
      customer_code,
      measure_datetime,
      measure_type,
      measurement_value: measurement,
      id
    });


    await measurementRecord.save();

    res.json({measurement: measurementRecord})
  } catch (error) {
    console.error('Error handling /upload request:', error);
    res.status(500).send('Internal Server Error')
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
