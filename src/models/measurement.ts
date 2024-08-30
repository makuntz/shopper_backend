import mongoose from "mongoose";


const measurementSchema = new mongoose.Schema({
  image: {
      type: String,
      required: true,
  },
  customer_code: {
      type: String,
      required: true,
  },
  measure_datetime: {
      type: Date,
      required: true,
  },
  measure_type: {
      type: String,
      enum: ['WATER', 'GAS'],
      required: true,
  },
  measurement_value: {
      type: Number,
      required: true,
  },
  
}, {
  timestamps: true,
});

const Measurement = mongoose.model('Measurement', measurementSchema);

export default Measurement;