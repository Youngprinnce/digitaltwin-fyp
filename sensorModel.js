const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  ph: {
    type: String,
    required: true,
  },
  temp: {
    type: String,
    required: true,
  },
  turbidity: {
    type: String,
    required: true,
  },
  ultrasonic: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Sensor', sensorSchema);
